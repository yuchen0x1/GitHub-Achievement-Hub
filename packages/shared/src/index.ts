/**
 * GitHub Achievement Hub — 共享类型与常量
 * 该包被 API 与 Web 端共同引用，保证三端数据结构一致。
 */

/** 勋章获取状态 */
export const ACHIEVEMENT_AVAILABILITY = {
  /** 当前可正常获取 */
  AVAILABLE: 'AVAILABLE',
  /** 分级勋章（Default → Bronze → Silver → Gold） */
  TIERED: 'TIERED',
  /** 限定获取（活动窗口 / 特殊条件） */
  LIMITED: 'LIMITED',
  /** 已停止发放 */
  DISCONTINUED: 'DISCONTINUED',
  /** 测试中 / 状态不明确 */
  TESTING: 'TESTING',
  /** 内部或专属身份勋章 */
  INTERNAL: 'INTERNAL',
} as const;

export type AchievementAvailability =
  (typeof ACHIEVEMENT_AVAILABILITY)[keyof typeof ACHIEVEMENT_AVAILABILITY];

/** 勋章等级 */
export const TIER_LEVEL = {
  DEFAULT: 'DEFAULT',
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
} as const;

export type TierLevel = (typeof TIER_LEVEL)[keyof typeof TIER_LEVEL];

export const TIER_LEVEL_ORDER: TierLevel[] = ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'];

/** 等级展示元数据（颜色 / 命名） */
export const TIER_META: Record<
  TierLevel,
  { label: string; labelZh: string; color: string; accent: string; order: number }
> = {
  DEFAULT: {
    label: 'Default',
    labelZh: '默认',
    color: '#8b949e',
    accent: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    order: 0,
  },
  BRONZE: {
    label: 'Bronze',
    labelZh: '铜章',
    color: '#d08c50',
    accent: 'bg-amber-700/20 text-amber-500 border-amber-600/40',
    order: 1,
  },
  SILVER: {
    label: 'Silver',
    labelZh: '银章',
    color: '#c0c6d1',
    accent: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
    order: 2,
  },
  GOLD: {
    label: 'Gold',
    labelZh: '金章',
    color: '#e3b341',
    accent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    order: 3,
  },
};

/** 资料可信度分级 */
export const CREDIBILITY_GRADES = {
  /** GitHub 官方明确说明 */
  A: 'A',
  /** 有可复现证据的社区实测 */
  B: 'B',
  /** 多个可靠社区来源一致 */
  C: 'C',
  /** 尚未验证的推测 */
  D: 'D',
} as const;

export type CredibilityGrade = (typeof CREDIBILITY_GRADES)[keyof typeof CREDIBILITY_GRADES];

export const CREDIBILITY_META: Record<
  CredibilityGrade,
  { label: string; labelZh: string; description: string; color: string }
> = {
  A: {
    label: 'Grade A',
    labelZh: 'A级 · 官方确认',
    description: 'GitHub 官方文档或官方公告中明确说明',
    color: '#3fb950',
  },
  B: {
    label: 'Grade B',
    labelZh: 'B级 · 可复现实测',
    description: '有可复现步骤与证据的社区实测结果',
    color: '#58a6ff',
  },
  C: {
    label: 'Grade C',
    labelZh: 'C级 · 多源一致',
    description: '多个可靠社区来源结论一致，但官方未明确公布',
    color: '#d29922',
  },
  D: {
    label: 'Grade D',
    labelZh: 'D级 · 待验证推测',
    description: '尚未验证的信息，仅供参考，请勿作为唯一依据',
    color: '#8b949e',
  },
};

/** 来源类型 */
export const SOURCE_TYPES = {
  OFFICIAL_DOC: 'OFFICIAL_DOC',
  CHANGELOG: 'CHANGELOG',
  OFFICIAL_DISCUSSION: 'OFFICIAL_DISCUSSION',
  COMMUNITY: 'COMMUNITY',
  COLLECTIVE_EVIDENCE: 'COLLECTIVE_EVIDENCE',
} as const;

export type SourceType = (typeof SOURCE_TYPES)[keyof typeof SOURCE_TYPES];

/** 内容发布状态 */
export const CONTENT_STATUS = {
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

/** 用户角色 */
export const USER_ROLES = {
  USER: 'USER',
  EDITOR: 'EDITOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** 用户勋章状态 */
export const USER_ACHIEVEMENT_STATUS = {
  /** 已获得 */
  EARNED: 'EARNED',
  /** 计划获取 */
  PLANNED: 'PLANNED',
  /** 已收藏 */
  FAVORITED: 'FAVORITED',
} as const;

export type UserAchievementStatus =
  (typeof USER_ACHIEVEMENT_STATUS)[keyof typeof USER_ACHIEVEMENT_STATUS];

/** GitHub 官方 API 是否提供该数据的标记 */
export type ApiSupport = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'UNKNOWN';

/** 通用分页响应 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 统一 API 响应包装 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** 站点统计（全部来自真实数据库聚合） */
export interface SiteStats {
  totalAchievements: number;
  obtainableAchievements: number;
  limitedAchievements: number;
  tieredAchievements: number;
  discontinuedAchievements: number;
  articleCount: number;
  categoryCount: number;
  lastUpdatedAt: string | null;
  lastVerifiedAt: string | null;
}

/** 难度分档 */
export const DIFFICULTY_META = [
  { value: 1, label: '入门', labelEn: 'Starter', color: '#3fb950' },
  { value: 2, label: '简单', labelEn: 'Easy', color: '#58a6ff' },
  { value: 3, label: '中等', labelEn: 'Medium', color: '#d29922' },
  { value: 4, label: '困难', labelEn: 'Hard', color: '#f85149' },
  { value: 5, label: '极难', labelEn: 'Very Hard', color: '#da3633' },
] as const;

export function difficultyMeta(value: number) {
  return DIFFICULTY_META.find((d) => d.value === value) ?? DIFFICULTY_META[2];
}

/** 单个勋章在进度计算中的输入 */
export interface ProgressInput {
  tierThresholds: { level: TierLevel; threshold: number }[];
  currentCount: number;
}

/**
 * 计算等级进度。
 * 明确区分：这里计算的是"依据公开门槛"推算的结果，
 * 不代表 GitHub 官方的实时成就状态。
 */
export function computeTierProgress(input: ProgressInput) {
  const thresholds = [...input.tierThresholds].sort((a, b) => a.threshold - b.threshold);
  if (thresholds.length === 0) {
    return {
      currentLevel: null,
      nextLevel: null,
      remaining: null,
      percent: 0,
      currentThreshold: null,
      nextThreshold: null,
    };
  }

  let current: (typeof thresholds)[number] | null = null;
  for (const t of thresholds) {
    if (input.currentCount >= t.threshold) current = t;
  }

  const next = thresholds.find((t) => input.currentCount < t.threshold) ?? null;

  let percent = 100;
  if (next) {
    const prevThreshold = current?.threshold ?? 0;
    const span = next.threshold - prevThreshold;
    percent =
      span <= 0
        ? 100
        : Math.max(
            0,
            Math.min(100, Math.round(((input.currentCount - prevThreshold) / span) * 100)),
          );
  }

  return {
    currentLevel: current?.level ?? null,
    nextLevel: next?.level ?? null,
    remaining: next ? next.threshold - input.currentCount : null,
    percent,
    currentThreshold: current?.threshold ?? null,
    nextThreshold: next?.threshold ?? null,
  };
}

/** GitHub 用户资料查询结果（仅公开可访问信息） */
export interface GithubProfileResult {
  login: string;
  id: number;
  avatarUrl: string;
  profileUrl: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string | null;
  /** GitHub API 可公开读取的成就（仅部分公开徽章），其余为不可用 */
  achievements: {
    login: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
  }[];
  /** GitHub 官方 API 未提供完整成就数据 */
  apiLimitations: string[];
  fetchedAt: string;
}
