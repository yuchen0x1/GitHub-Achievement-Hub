import type {
  Availability,
  Category,
  Credibility,
  SourceType,
  Tier,
} from '@/lib/types';

/** 后台列表接口统一返回结构（后端未返回 totalPages） */
export interface RawPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export function totalPagesOf(page: RawPage<unknown>): number {
  if (page.totalPages && page.totalPages > 0) return page.totalPages;
  return Math.max(1, Math.ceil(page.total / Math.max(1, page.pageSize)));
}

// ---------------------------------------------------------------------------
// 勋章
// ---------------------------------------------------------------------------

export const CONTENT_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_META: Record<
  ContentStatus,
  { label: string; tone: Tone; description: string }
> = {
  DRAFT: { label: '草稿', tone: 'muted', description: '仅后台可见，前台不可访问。' },
  IN_REVIEW: {
    label: '待审核',
    tone: 'warning',
    description: '内容整理完毕，等待复核来源与门槛。',
  },
  PUBLISHED: {
    label: '已发布',
    tone: 'success',
    description: '前台勋章图鉴可见。',
  },
  ARCHIVED: {
    label: '已归档',
    tone: 'danger',
    description: '不在一览中展示，但数据保留。',
  },
};

/** 发布状态流转：草稿 → 待审 → 已发布 → 归档 */
export const STATUS_FLOW: ContentStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'PUBLISHED',
  'ARCHIVED',
];

export function nextStatus(status: ContentStatus): ContentStatus | null {
  const index = STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1] ?? null;
}

export const AVAILABILITY_OPTIONS: Availability[] = [
  'AVAILABLE',
  'TIERED',
  'LIMITED',
  'DISCONTINUED',
  'TESTING',
  'INTERNAL',
];

export const CREDIBILITY_OPTIONS: Credibility[] = ['A', 'B', 'C', 'D'];

/** 管理端列表行：后端 include 了 category 与 tiers */
export interface AdminAchievementRow {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  availability: Availability;
  difficulty: number;
  credibility: Credibility;
  isTiered: boolean;
  status: ContentStatus;
  updatedAt: string;
  category: Category | null;
  tiers: Tier[];
}

export interface AchievementHistoryItem {
  id: string;
  achievementId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH' | 'ARCHIVE' | 'ROLLBACK';
  note: string | null;
  changedById: string | null;
  createdAt: string;
  changedBy: { displayName: string; email: string } | null;
}

/** 后台详情：比公开类型多出 categoryId 等标量字段 */
export interface AdminAchievementDetail {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  summaryEn: string;
  summaryZh: string;
  descriptionEn: string;
  descriptionZh: string;
  backgroundEn: string | null;
  backgroundZh: string | null;
  conditionEn: string;
  conditionZh: string;
  imageUrl: string | null;
  imageHdUrl: string | null;
  difficulty: number;
  availability: Availability;
  isTiered: boolean;
  hasTiers: boolean;
  categoryId: string | null;
  credibility: Credibility;
  uncertain: boolean;
  uncertaintyNote: string | null;
  popularity: number;
  status: ContentStatus;
  verifiedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category | null;
  tiers: Tier[];
  requirements: AdminRequirement[];
  guides: AdminGuide[];
  sources: AdminSource[];
}

export interface AdminRequirement {
  id: string;
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  steps: string[] | null;
  codeExample: string | null;
  order: number;
}

export interface AdminGuide {
  id: string;
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  coverImage: string | null;
  readingTime: number;
  order: number;
}

export interface AdminSource {
  id: string;
  title: string;
  url: string;
  sourceType: SourceType;
  credibility: Credibility;
  status: string;
  verifiedAt: string;
  note: string | null;
  isDisputed: boolean;
}

export const SOURCE_TYPE_META: Record<SourceType, string> = {
  OFFICIAL_DOC: '官方文档',
  CHANGELOG: '变更日志',
  OFFICIAL_DISCUSSION: '官方讨论',
  COMMUNITY: '社区来源',
  COLLECTIVE_EVIDENCE: '集体证据',
};

export const SOURCE_STATUS_OPTIONS = ['ACTIVE', 'DISPUTED', 'OUTDATED', 'ARCHIVED'] as const;

export const HISTORY_FIELD_LABELS: Record<string, string> = {
  achievement: '整条记录',
  slug: 'Slug',
  nameEn: '英文名',
  nameZh: '中文名',
  summaryEn: '英文简介',
  summaryZh: '中文简介',
  descriptionEn: '英文描述',
  descriptionZh: '中文描述',
  backgroundEn: '英文背景',
  backgroundZh: '中文背景',
  conditionEn: '英文获取条件',
  conditionZh: '中文获取条件',
  imageUrl: '勋章图片',
  imageHdUrl: '高清图片',
  difficulty: '难度',
  availability: '获取状态',
  isTiered: '是否分级',
  hasTiers: '是否有等级',
  categoryId: '分类',
  credibility: '可信度',
  uncertain: '是否存疑',
  uncertaintyNote: '存疑说明',
  popularity: '热度',
  status: '发布状态',
};

export const HISTORY_TYPE_META: Record<
  AchievementHistoryItem['changeType'],
  { label: string; tone: Tone }
> = {
  CREATE: { label: '创建', tone: 'success' },
  UPDATE: { label: '更新', tone: 'accent' },
  DELETE: { label: '删除', tone: 'danger' },
  PUBLISH: { label: '发布', tone: 'success' },
  UNPUBLISH: { label: '撤回', tone: 'warning' },
  ARCHIVE: { label: '归档', tone: 'warning' },
  ROLLBACK: { label: '回滚', tone: 'warning' },
};

// ---------------------------------------------------------------------------
// 仪表盘 / 日志
// ---------------------------------------------------------------------------

export interface DashboardData {
  totalAchievements: number;
  publishedAchievements: number;
  draftAchievements: number;
  totalArticles: number;
  totalUsers: number;
  pendingFeedback: number;
  totalSources: number;
  disputedSources: number;
  byCredibility: { grade: Credibility; count: number }[];
  byAvailability: { availability: Availability; count: number }[];
}

export interface AdminLogItem {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const LOG_ACTION_META: Record<string, { label: string; tone: Tone }> = {
  CREATE: { label: '新建', tone: 'success' },
  UPDATE: { label: '更新', tone: 'accent' },
  DELETE: { label: '删除', tone: 'danger' },
  PUBLISH: { label: '发布', tone: 'success' },
  ARCHIVE: { label: '归档', tone: 'warning' },
};

export const LOG_ENTITY_LABELS: Record<string, string> = {
  achievement: '勋章',
  user: '用户',
  feedback: '反馈',
  announcement: '公告',
  category: '分类',
  faq: 'FAQ',
  article: '攻略',
};

// ---------------------------------------------------------------------------
// 公告 / 反馈 / 用户 / 内容
// ---------------------------------------------------------------------------

export type AnnouncementLevel = 'INFO' | 'WARNING' | 'IMPORTANT';

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  level: AnnouncementLevel;
  isActive: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ANNOUNCEMENT_LEVEL_META: Record<
  AnnouncementLevel,
  { label: string; tone: Tone }
> = {
  INFO: { label: '通知', tone: 'accent' },
  WARNING: { label: '警告', tone: 'warning' },
  IMPORTANT: { label: '重要', tone: 'danger' },
};

export const FEEDBACK_STATUSES = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_STATUS_META: Record<
  FeedbackStatus,
  { label: string; tone: Tone; description: string }
> = {
  PENDING: { label: '待处理', tone: 'warning', description: '尚未有人认领。' },
  REVIEWING: { label: '处理中', tone: 'accent', description: '正在核实或修复。' },
  RESOLVED: { label: '已解决', tone: 'success', description: '已处理完毕。' },
  REJECTED: { label: '已驳回', tone: 'danger', description: '不采纳或无法复现。' },
};

export const FEEDBACK_TYPES = ['BUG', 'SUGGESTION', 'CORRECTION', 'QUESTION', 'OTHER'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  BUG: '问题反馈',
  SUGGESTION: '功能建议',
  CORRECTION: '内容纠错',
  QUESTION: '咨询提问',
  OTHER: '其他',
};

export interface AdminFeedbackItem {
  id: string;
  userId: string | null;
  type: FeedbackType;
  subject: string;
  content: string;
  email: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  handledById: string | null;
  createdAt: string;
  updatedAt: string;
  user: { displayName: string; email: string } | null;
}

export type UserRole = 'USER' | 'EDITOR' | 'ADMIN';

export const ROLE_META: Record<UserRole, { label: string; tone: Tone }> = {
  USER: { label: '普通用户', tone: 'muted' },
  EDITOR: { label: '编辑', tone: 'accent' },
  ADMIN: { label: '管理员', tone: 'success' },
};

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { userAchievements: number; favorites: number };
}

export interface AdminCategoryRow {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string | null;
  descriptionZh: string | null;
  icon: string | null;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { achievements: number };
}

// ---------------------------------------------------------------------------
// 通用
// ---------------------------------------------------------------------------

export type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'muted';

export const TONE_VAR: Record<Tone, string> = {
  accent: '--color-accent',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  muted: '--color-ink-subtle',
};
