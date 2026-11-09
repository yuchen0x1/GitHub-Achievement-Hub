/** 前端使用的 API 数据类型（与后端 Prisma 模型对应） */

export type Availability =
  | 'AVAILABLE'
  | 'TIERED'
  | 'LIMITED'
  | 'DISCONTINUED'
  | 'TESTING'
  | 'INTERNAL';

export type TierLevel = 'DEFAULT' | 'BRONZE' | 'SILVER' | 'GOLD';
export type Credibility = 'A' | 'B' | 'C' | 'D';
export type SourceType =
  | 'OFFICIAL_DOC'
  | 'CHANGELOG'
  | 'OFFICIAL_DISCUSSION'
  | 'COMMUNITY'
  | 'COLLECTIVE_EVIDENCE';

export interface Achievement {
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
  credibility: Credibility;
  uncertain: boolean;
  uncertaintyNote: string | null;
  popularity: number;
  viewCount: number;
  status: string;
  verifiedAt: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string | null;
  descriptionZh: string | null;
  icon: string | null;
  colorHex: string | null;
  sortOrder: number;
  achievementCount: number;
  filter?: { availability?: string; category?: string };
}

export interface Tier {
  id: string;
  level: TierLevel;
  threshold: number;
  labelEn: string;
  labelZh: string;
  descriptionEn: string | null;
  descriptionZh: string | null;
  credibility: Credibility;
  sourceNote: string | null;
}

export interface Requirement {
  id: string;
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  steps: string[] | null;
  codeExample: string | null;
  order: number;
}

export interface Guide {
  id: string;
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  coverImage: string | null;
  readingTime: number;
  order: number;
}

export interface Source {
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

export interface AchievementDetail extends Achievement {
  category: Category | null;
  tiers: Tier[];
  requirements: Requirement[];
  guides: Guide[];
  sources: Source[];
  translations: {
    id: string;
    locale: string;
    name: string;
    summary: string;
    description: string;
    background: string | null;
    conditionText: string;
  }[];
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  titleZh: string;
  category: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  readingTime: number;
  tags: string[];
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string;
  views: number;
}

export interface ArticleDetail extends ArticleSummary {
  contentMd: string;
  toc: { id: string; text: string; level: number }[];
  related: ArticleSummary[];
}

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

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FaqItem {
  id: string;
  slug: string;
  question: string;
  questionZh: string;
  answer: string;
  answerZh: string;
  category: string;
  sortOrder: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  locale?: string | null;
  githubLogin?: string | null;
}

export interface TierProgress {
  currentLevel: TierLevel | null;
  nextLevel: TierLevel | null;
  remaining: number | null;
  percent: number;
  currentThreshold: number | null;
  nextThreshold: number | null;
}

export interface UserAchievementRecord {
  id: string;
  achievementId: string;
  status: 'EARNED' | 'PLANNED' | 'FAVORITED';
  tierLevel: TierLevel | null;
  acquiredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  achievement: AchievementDetail;
}

export interface ProgressRecord {
  id: string;
  achievementId: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  imageUrl: string | null;
  category: Category | null;
  currentCount: number;
  targetCount: number | null;
  targetTier: TierLevel | null;
  note: string | null;
  updatedAt: string;
  tiers: Tier[];
  computed: TierProgress;
  disclaimer: string;
}

export interface GithubProfile {
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
  achievements: {
    login: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
  }[];
  apiLimitations: string[];
  achievementsOverview: {
    slug: string;
    nameEn: string;
    nameZh: string;
    imageUrl: string | null;
    availability: Availability;
    isTiered: boolean;
    status: 'EARNED' | 'UNKNOWN' | 'NOT_AVAILABLE';
    reason?: string;
  }[];
  sourceNote: string;
  fetchedAt: string;
}
