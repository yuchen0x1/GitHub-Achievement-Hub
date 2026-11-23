import type { TierLevel } from '@gach/shared';

/**
 * GitHub 个人主页公开 HTML 中的成就徽章解析。
 *
 * 背景：
 * GitHub REST API 的 `GET /users/:login` 并不返回 Profile Achievements，
 * 但公开个人主页（以及 `?tab=achievements`）会把用户已获得的徽章以
 * `<img data-hovercard-type="achievement">` 的形式直接渲染在 HTML 里，
 * 并附带等级标签（`achievement-tier-label--bronze|silver|gold`）。
 *
 * 因此这里用「解析公开 HTML」而不是「调用官方 API」来获得真实数据。
 * 解析逻辑必须保持纯函数，方便单测覆盖真实的 GitHub 标记结构：
 *   - 同一徽章在桌面侧栏与移动折叠区块会重复出现，必须去重；
 *   - 未分级的徽章没有 tier 标签，也不代表 Default 级；
 *   - 标记结构变化时宁可返回空结果 + 明确失败原因，也不能编造勋章。
 */

export interface ScrapedAchievement {
  /** GitHub 的成就 slug，例如 pull-shark */
  slug: string;
  /** GitHub 展示的英文名称，例如 Pull Shark */
  name: string;
  /** 徽章图片地址（github.githubassets.com） */
  imageUrl: string;
  /** 解析到的等级；未分级徽章为 null */
  tier: TierLevel | null;
}

export interface ScrapeResult {
  achievements: ScrapedAchievement[];
  /** 是否成功识别出成就区块（用于区分「没有成就」与「页面结构变了」） */
  layoutDetected: boolean;
  /** 面向用户/日志的失败或降级原因 */
  reason?: 'layout-changed' | 'rate-limited' | 'not-found' | 'blocked' | 'unparseable';
}

const TIER_ALIASES: Record<string, TierLevel> = {
  default: 'DEFAULT',
  bronze: 'BRONZE',
  silver: 'SILVER',
  gold: 'GOLD',
};

/**
 * 两种真实存在的标记结构：
 * 1. 个人主页侧栏：`<a href="/u?achievement=slug&tab=achievements">` 包裹徽章 <img>
 * 2. 成就页卡片：`<details data-achievement-slug="slug">` 包裹徽章 <img>
 */
const BADGE_ANCHOR =
  /<a\b[^>]*href="[^"]*\?achievement=(?<slug>[a-z0-9-]+)[^"]*"[^>]*>(?<inner>[\s\S]{0,1200}?)<\/a>/gi;
const BADGE_DETAILS =
  /<details\b[^>]*data-achievement-slug="(?<slug>[a-z0-9-]+)"[^>]*>(?<inner>[\s\S]{0,1600}?)<\/details>/gi;
const BADGE_IMG = /<img\b[^>]*>/i;
const IMG_SRC = /\bsrc="(?<src>[^"]+)"/i;
const IMG_ALT = /\balt="(?<alt>[^"]*)"/i;
const HOVER_SLUG = /achievements\/(?<slug>[a-z0-9-]+)\/detail/i;
const TIER_LABEL = /achievement-tier-label--(?<tier>default|bronze|silver|gold)\b/i;

/** 页面里出现成就区块的标志（即使该用户一枚徽章都没有） */
const ACHIEVEMENTS_TAB_MARKER = /(?:\?tab=achievements(?:&(?:amp;)?achievement=[a-z0-9-]+)?|data-hovercard-type="achievement")/i;
const NOT_FOUND_MARKER = /Page not found\s*·\s*GitHub/i;
const RATE_LIMIT_MARKER = /(?:rate limit|too many requests|You have exceeded)/i;

function normalizeText(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeDecodeURI(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** 只信任 GitHub 官方资产域名的图片，避免把任意 URL 透传给前端 */
function isTrustedImage(raw: string): boolean {
  try {
    const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    return url.protocol === 'https:' && /(^|\.)githubassets\.com$/.test(url.hostname);
  } catch {
    return false;
  }
}

/**
 * 解析 GitHub 公开 HTML 中的成就徽章。
 *
 * 该函数不抛异常：解析失败以 `reason` 表达，调用方据此决定降级策略。
 */
export function parseAchievementsFromProfileHtml(html: string): ScrapeResult {
  if (typeof html !== 'string' || html.length === 0) {
    return { achievements: [], layoutDetected: false, reason: 'unparseable' };
  }

  if (NOT_FOUND_MARKER.test(html)) {
    return { achievements: [], layoutDetected: false, reason: 'not-found' };
  }

  const bySlug = new Map<string, ScrapedAchievement>();
  let sawBadgeMarkup = false;

  const consumeBadge = (slugRaw: string, inner: string, requireHovercard: boolean): void => {
    const imgMatch = inner.match(BADGE_IMG);
    if (!imgMatch) return;
    if (requireHovercard && !/data-hovercard-type="achievement"/i.test(imgMatch[0])) return;
    sawBadgeMarkup = true;

    const src = imgMatch[0].match(IMG_SRC)?.groups?.src;
    if (!src || !isTrustedImage(src)) return;

    const hoverSlug = imgMatch[0].match(HOVER_SLUG)?.groups?.slug;
    const slug = (hoverSlug ?? slugRaw).toLowerCase();

    const alt = imgMatch[0].match(IMG_ALT)?.groups?.alt ?? '';
    const rawName = normalizeText(alt).replace(/^Achievement:\s*/i, '');
    const name = rawName || slug;

    const tierMatch = inner.match(TIER_LABEL)?.groups?.tier;
    const tier = tierMatch ? (TIER_ALIASES[tierMatch.toLowerCase()] ?? null) : null;

    const existing = bySlug.get(slug);
    if (!existing) {
      bySlug.set(slug, {
        slug,
        name,
        imageUrl: safeDecodeURI(src),
        tier,
      });
      return;
    }
    // 重复出现时保留等级信息更完整的一份（侧栏与卡片可能重复渲染同一徽章）
    if (!existing.tier && tier) existing.tier = tier;
    if (existing.name === existing.slug && name) existing.name = name;
  };

  for (const match of html.matchAll(BADGE_ANCHOR)) {
    const groups = match.groups;
    if (groups?.slug && groups.inner) {
      consumeBadge(groups.slug, groups.inner, true);
    }
  }

  for (const match of html.matchAll(BADGE_DETAILS)) {
    const groups = match.groups;
    if (groups?.slug && groups.inner) {
      consumeBadge(groups.slug, groups.inner, false);
    }
  }

  const layoutDetected = sawBadgeMarkup || ACHIEVEMENTS_TAB_MARKER.test(html);
  if (!layoutDetected) {
    if (RATE_LIMIT_MARKER.test(html)) {
      return { achievements: [], layoutDetected: false, reason: 'rate-limited' };
    }
    return { achievements: [], layoutDetected: false, reason: 'layout-changed' };
  }

  return { achievements: [...bySlug.values()], layoutDetected };
}

/** 把英文徽章名归一化，用于和本站助章的 nameEn 对照 */
export function normalizeAchievementName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
