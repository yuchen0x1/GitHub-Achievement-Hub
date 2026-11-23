import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  GithubApiService,
  GithubRateLimitError,
  GithubUserNotFoundError,
} from './github-api.service';
import {
  normalizeAchievementName,
  parseAchievementsFromProfileHtml,
} from './achievement-scraper';
import type { GithubProfileResult } from '@gach/shared';

@Injectable()
export class GithubProfileService {
  private readonly logger = new Logger(GithubProfileService.name);
  private readonly inFlight = new Map<string, ReturnType<GithubProfileService['loadProfile']>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly api: GithubApiService,
    private readonly cache: CacheService,
  ) {}

  /**
   * 查询 GitHub 用户公开资料。
   *
   * 关键原则：
   * - GitHub 官方 API 并不提供 Profile Achievements 的完整数据，
   *   因此结果中明确区分「已确认获得」「数据不可用」「本站收录但状态未知」
   * - 绝不把"查不到"当成"未获得"
   */
  async getProfile(login: string): Promise<
    GithubProfileResult & {
      achievementsOverview: {
        slug: string;
        nameEn: string;
        nameZh: string;
        imageUrl: string | null;
        availability: string;
        isTiered: boolean;
        status: 'EARNED' | 'UNKNOWN' | 'NOT_AVAILABLE';
        reason?: string;
      }[];
      sourceNote: string;
    }
  > {
    const normalized = (typeof login === 'string' ? login : '').trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(normalized)) {
      throw new BadRequestException('GitHub 用户名格式不正确');
    }

    const cacheKey = `github:profile:v3:${normalized.toLowerCase()}`;
    const cached = await this.cache.get<
      Awaited<ReturnType<GithubProfileService['loadProfile']>>
    >(cacheKey);
    if (cached) return cached;

    const pending = this.inFlight.get(cacheKey);
    if (pending) return pending;
    const request = this.loadProfile(normalized, cacheKey);
    this.inFlight.set(cacheKey, request);
    try { return await request; } finally { this.inFlight.delete(cacheKey); }
  }

  private async loadProfile(normalized: string, cacheKey: string) {
    let profile;
    let apiBadges: Awaited<ReturnType<GithubApiService['fetchPublicBadges']>>;
    let profileHtml: Awaited<ReturnType<GithubApiService['fetchProfileHtml']>> = null;

    try {
      [profile, apiBadges, profileHtml] = await Promise.all([
        this.api.fetchUser(normalized),
        this.api.fetchPublicBadges(normalized),
        // 保留对旧测试替身 / 第三方实现的兼容：没有 HTML 抓取能力时按旧逻辑降级。
        typeof this.api.fetchProfileHtml === 'function'
          ? this.api.fetchProfileHtml(normalized)
          : Promise.resolve(null),
      ]);
    } catch (err) {
      if (err instanceof GithubUserNotFoundError) {
        throw new NotFoundException(
          `GitHub 用户 "${normalized}" 不存在，或其资料不可公开访问`,
        );
      }
      throw err;
    }

    // 与本站勋章库对照
    const catalog = await this.prisma.achievement.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        nameEn: true,
        nameZh: true,
        imageUrl: true,
        availability: true,
        isTiered: true,
      },
      orderBy: { popularity: 'desc' },
    });

    const scraped = profileHtml ? parseAchievementsFromProfileHtml(profileHtml.html) : null;
    if (profileHtml && scraped && !scraped.layoutDetected) {
      // 公开主页结构/可见性变化会让抓取静默降级，必须留下可排查的日志。
      this.logger.warn(
        `未能从 GitHub 公开主页解析成就标记（login=${profile.login}, reason=${scraped.reason ?? 'unknown'}）`,
      );
    }
    const badges = scraped?.layoutDetected
      ? scraped.achievements.map((badge) => ({
          login: profile.login,
          slug: badge.slug,
          name: badge.name,
          description: null,
          imageUrl: badge.imageUrl,
          tier: badge.tier,
        }))
      : apiBadges.badges.map((badge) => ({ ...badge, login: profile.login }));

    const earnedSlugs = new Set(badges.map((badge) => badge.slug.toLowerCase()));
    const earnedNames = new Set(badges.map((badge) => normalizeAchievementName(badge.name)));
    const canConfirmEarned = Boolean(scraped?.layoutDetected || apiBadges.badges.length > 0);
    const unknownReason = scraped?.layoutDetected
      ? 'GitHub 公开主页没有展示这枚勋章，无法确认是否已获得（不代表未获得）'
      : '本次未能读取 GitHub 公开主页的成就标记，无法确认是否已获得（不代表未获得）';

    const achievementsOverview = catalog.map((a) => {
      const normalizedName = normalizeAchievementName(a.nameEn);
      const matched = earnedSlugs.has(a.slug.toLowerCase()) || earnedNames.has(normalizedName);
      if (matched && canConfirmEarned) {
        return {
          slug: a.slug,
          nameEn: a.nameEn,
          nameZh: a.nameZh,
          imageUrl: a.imageUrl,
          availability: a.availability,
          isTiered: a.isTiered,
          tier: badges.find((badge) => badge.slug.toLowerCase() === a.slug.toLowerCase())?.tier ?? null,
          status: 'EARNED' as const,
        };
      }
      if (a.availability === 'DISCONTINUED' || a.availability === 'INTERNAL') {
        return {
          slug: a.slug,
          nameEn: a.nameEn,
          nameZh: a.nameZh,
          imageUrl: a.imageUrl,
          availability: a.availability,
          isTiered: a.isTiered,
          tier: null,
          status: 'NOT_AVAILABLE' as const,
          reason: '该勋章已停止发放或仅限内部获取',
        };
      }
      return {
        slug: a.slug,
        nameEn: a.nameEn,
        nameZh: a.nameZh,
        imageUrl: a.imageUrl,
        availability: a.availability,
        isTiered: a.isTiered,
        tier: null,
        status: 'UNKNOWN' as const,
        reason: unknownReason,
      };
    });

    const limitations = [...apiBadges.limitations];
    if (scraped?.layoutDetected) {
      limitations.splice(
        0,
        limitations.length,
        'GitHub REST API 不提供完整成就列表；本站补充读取公开个人主页 HTML 的徽章标记。',
        '公开主页只展示 GitHub 当前允许公开的徽章，等级标签可能随页面结构变化。',
      );
    } else if (profileHtml && scraped?.reason) {
      limitations.push(
        '本次未能可靠解析 GitHub 公开主页的成就标记，已降级为数据不可用；请直接打开 GitHub 主页核对。',
      );
    }

    const result = {
      login: profile.login,
      id: profile.id,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      name: profile.name,
      bio: profile.bio,
      company: profile.company,
      location: profile.location,
      blog: profile.blog,
      publicRepos: profile.public_repos,
      publicGists: profile.public_gists,
      followers: profile.followers,
      following: profile.following,
      createdAt: profile.created_at,
      achievements: badges,
      apiLimitations: limitations,
      achievementsOverview,
      sourceNote: scraped?.layoutDetected
        ? '已读取 GitHub 公开个人主页中的成就徽章标记（?tab=achievements），并与本站勋章目录对照。' +
          '这是公开页面数据而非官方 REST API 字段；GitHub 页面结构变化或未登录可见性变化时，结果会降级为「数据不可用」。'
        : 'GitHub REST API 不提供完整 Profile Achievements 列表，本次也未能读取公开个人主页标记。' +
          '空列表不代表用户未获得任何勋章；请打开 GitHub 个人主页核对。',
      fetchedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  /** 查询并记录同步日志（用户绑定自己的 GitHub 账号时使用） */
  async syncForUser(userId: string, login: string) {
    const started = Date.now();
    let status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' = 'SUCCESS';
    let message = '';
    let itemsFound = 0;

    try {
      const result = await this.getProfile(login);
      itemsFound = result.achievements.length;
      await this.prisma.githubAccount.updateMany({
        where: { userId },
        data: { lastSyncedAt: new Date() },
      });
    } catch (err) {
      status = err instanceof GithubRateLimitError ? 'RATE_LIMITED' : 'FAILED';
      message = (err as Error).message;
    }

    await this.prisma.githubSyncLog.create({
      data: {
        userId,
        status,
        itemsFound,
        message,
        durationMs: Date.now() - started,
      },
    });

    return { status, itemsFound, message };
  }
}
