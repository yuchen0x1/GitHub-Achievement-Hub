import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  type Achievement,
  type Availability,
  type ContentStatus,
  type Credibility,
  type PrismaClient,
  type TierLevel,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { paginated } from '../../common/utils/paginate.util';
import { slugify } from '../../common/utils/text.util';
import type { Paginated } from '@gach/shared';

const DETAIL_INCLUDE = {
  category: true,
  tiers: { orderBy: { sortOrder: 'asc' as const } },
  requirements: { orderBy: { order: 'asc' as const } },
  guides: { orderBy: { order: 'asc' as const } },
  sources: { orderBy: { verifiedAt: 'desc' as const } },
  translations: true,
} satisfies Prisma.AchievementInclude;

export type AchievementDetail = Prisma.AchievementGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

export interface AchievementListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  availability?: string;
  difficulty?: string;
  category?: string;
  tiered?: boolean;
  sort?: 'latest' | 'easiest' | 'hardest' | 'name' | 'popular';
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {}

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  async findAll(query: AchievementListQuery): Promise<Paginated<Achievement>> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 12));
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.achievement.findMany({
        where,
        orderBy: this.buildOrderBy(query.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.achievement.count({ where }),
    ]);

    return paginated(items, total, page, pageSize);
  }

  /** 首页热门勋章 */
  async findFeatured(limit = 6): Promise<Achievement[]> {
    const cacheKey = `achievements:featured:${limit}`;
    const cached = await this.cache.get<Achievement[]>(cacheKey);
    if (cached) return cached;

    const items = await this.prisma.achievement.findMany({
      where: { status: 'PUBLISHED', popularity: { gt: 0 } },
      orderBy: [{ popularity: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
    await this.cache.set(cacheKey, items, 600);
    return items;
  }

  async findBySlug(slug: string, includeUnpublished = false): Promise<AchievementDetail> {
    const cacheKey = `achievements:detail:${slug}:${includeUnpublished ? 'admin' : 'public'}`;
    const cached = await this.cache.get<AchievementDetail>(cacheKey);
    if (cached) return cached;

    const achievement = await this.prisma.achievement.findUnique({
      where: { slug },
      include: DETAIL_INCLUDE,
    });
    if (!achievement) {
      throw new NotFoundException(`未找到勋章 "${slug}"`);
    }
    if (!includeUnpublished && achievement.status !== 'PUBLISHED') {
      throw new NotFoundException(`勋章 "${slug}" 尚未发布`);
    }
    await this.cache.set(cacheKey, achievement, 300);
    return achievement;
  }

  async findAllSlugs(): Promise<string[]> {
    const rows = await this.prisma.achievement.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  }

  async findCategories() {
    const cacheKey = 'achievements:categories';
    const cached = await this.cache.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // 「当前可获取」是一个跨分类的聚合视图：所有 availability 为 AVAILABLE / TIERED 的勋章
    const obtainableCount = await this.prisma.achievement.count({
      where: { status: 'PUBLISHED', availability: { in: ['AVAILABLE', 'TIERED'] } },
    });

    const result = categories.map((c) => {
      const isAggregated = c.slug === 'currently-obtainable';
      return {
        id: c.id,
        slug: c.slug,
        nameEn: c.nameEn,
        nameZh: c.nameZh,
        descriptionEn: c.descriptionEn,
        descriptionZh: c.descriptionZh,
        icon: c.icon,
        colorHex: c.colorHex,
        sortOrder: c.sortOrder,
        achievementCount: isAggregated
          ? obtainableCount
          : this.prisma.achievement.count({
              where: { status: 'PUBLISHED', category: { slug: c.slug } },
            }),
        /** 前端筛选提示：该分类对应的查询条件 */
        filter: isAggregated ? { availability: 'available' } : { category: c.slug },
      };
    });

    // 上面的 count 是 Promise，需要解析后再返回
    const resolved = await Promise.all(
      result.map(async (c) => ({
        ...c,
        achievementCount: await c.achievementCount,
      })),
    );

    await this.cache.set(cacheKey, resolved, 600);
    return resolved;
  }

  /** 全部等级阶梯总览 */
  async findTierOverview() {
    const cacheKey = 'achievements:tiers';
    const cached = await this.cache.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const achievements = await this.prisma.achievement.findMany({
      where: { status: 'PUBLISHED', isTiered: true },
      orderBy: { popularity: 'desc' },
      include: { tiers: { orderBy: { sortOrder: 'asc' } } },
    });

    const result = achievements.map((a) => ({
      slug: a.slug,
      nameEn: a.nameEn,
      nameZh: a.nameZh,
      imageUrl: a.imageUrl,
      availability: a.availability,
      difficulty: a.difficulty,
      tiers: a.tiers.map((t) => ({
        id: t.id,
        level: t.level,
        threshold: t.threshold,
        labelEn: t.labelEn,
        labelZh: t.labelZh,
        descriptionEn: t.descriptionEn,
        descriptionZh: t.descriptionZh,
        credibility: t.credibility,
        sourceNote: t.sourceNote,
      })),
    }));
    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  /** 站点统计 —— 全部来自真实数据库聚合 */
  async getStats() {
    const cacheKey = 'site:stats';
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const [
      totalAchievements,
      obtainableAchievements,
      limitedAchievements,
      tieredAchievements,
      discontinuedAchievements,
      articleCount,
      categoryCount,
      lastUpdated,
      lastVerified,
    ] = await Promise.all([
      this.prisma.achievement.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.achievement.count({
        where: { status: 'PUBLISHED', availability: { in: ['AVAILABLE', 'TIERED'] } },
      }),
      this.prisma.achievement.count({
        where: { status: 'PUBLISHED', availability: 'LIMITED' },
      }),
      this.prisma.achievement.count({
        where: { status: 'PUBLISHED', isTiered: true },
      }),
      this.prisma.achievement.count({
        where: { status: 'PUBLISHED', availability: 'DISCONTINUED' },
      }),
      this.prisma.article.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.achievement.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.achievement.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { verifiedAt: 'desc' },
        select: { verifiedAt: true },
      }),
    ]);

    const stats = {
      totalAchievements,
      obtainableAchievements,
      limitedAchievements,
      tieredAchievements,
      discontinuedAchievements,
      articleCount,
      categoryCount,
      lastUpdatedAt: lastUpdated?.updatedAt ?? null,
      lastVerifiedAt: lastVerified?.verifiedAt ?? null,
    };
    await this.cache.set(cacheKey, stats, 120);
    return stats;
  }

  // -------------------------------------------------------------------------
  // 管理端写入
  // -------------------------------------------------------------------------

  async create(data: Prisma.AchievementCreateInput, adminId: string) {
    const slug = data.slug || slugify(data.nameEn);
    const existing = await this.prisma.achievement.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`slug "${slug}" 已存在`);
    }
    const created = await this.prisma.achievement.create({
      data: {
        ...data,
        slug,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
      include: DETAIL_INCLUDE,
    });
    await this.recordHistory(
      created.id,
      'CREATE',
      'achievement',
      null,
      created.slug,
      adminId,
    );
    await this.invalidate();
    return created;
  }

  async update(
    id: string,
    data: Prisma.AchievementUpdateInput,
    adminId: string,
    note?: string,
  ): Promise<AchievementDetail> {
    const before = await this.prisma.achievement.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('勋章不存在');

    const updated = await this.prisma.achievement.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === 'PUBLISHED' && !before.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
      include: DETAIL_INCLUDE,
    });

    // 记录被修改的字段，形成可回溯的变更历史
    const changedFields = Object.keys(data).filter(
      (k) => !['status', 'publishedAt'].includes(k),
    );
    for (const field of changedFields) {
      const oldValue = (before as Record<string, unknown>)[field];
      const newValue = (updated as Record<string, unknown>)[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        await this.recordHistory(
          id,
          'UPDATE',
          field,
          typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue ?? null),
          typeof newValue === 'string' ? newValue : JSON.stringify(newValue ?? null),
          adminId,
          note,
        );
      }
    }

    await this.invalidate();
    return updated;
  }

  async remove(id: string, adminId: string): Promise<void> {
    const achievement = await this.prisma.achievement.findUnique({ where: { id } });
    if (!achievement) throw new NotFoundException('勋章不存在');
    await this.prisma.achievement.delete({ where: { id } });
    await this.recordHistory(
      id,
      'DELETE',
      'achievement',
      achievement.slug,
      null,
      adminId,
    );
    await this.invalidate();
  }

  async getHistory(achievementId: string) {
    return this.prisma.achievementHistory.findMany({
      where: { achievementId },
      orderBy: { createdAt: 'desc' },
      include: { changedBy: { select: { displayName: true, email: true } } },
    });
  }

  private async recordHistory(
    achievementId: string,
    changeType: 'CREATE' | 'UPDATE' | 'DELETE',
    field: string,
    oldValue: string | null,
    newValue: string | null,
    adminId: string,
    note?: string,
  ): Promise<void> {
    await this.prisma.achievementHistory.create({
      data: {
        achievementId,
        changeType,
        field,
        oldValue,
        newValue,
        changedById: adminId,
        note: note ?? null,
      },
    });
  }

  /** 内容变更后清空相关缓存 */
  async invalidate(): Promise<void> {
    await Promise.all([
      this.cache.delByPrefix('achievements:'),
      this.cache.delByPrefix('site:stats'),
      this.cache.delByPrefix('search:'),
    ]);
  }

  // -------------------------------------------------------------------------

  private buildWhere(query: AchievementListQuery): Prisma.AchievementWhereInput {
    const where: Prisma.AchievementWhereInput = { status: 'PUBLISHED' };

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { nameEn: { contains: q, mode: 'insensitive' } },
        { nameZh: { contains: q } },
        { slug: { contains: q, mode: 'insensitive' } },
        { summaryEn: { contains: q, mode: 'insensitive' } },
        { summaryZh: { contains: q } },
        { conditionEn: { contains: q, mode: 'insensitive' } },
        { conditionZh: { contains: q } },
      ];
    }

    if (query.availability && query.availability !== 'all') {
      if (query.availability === 'available') {
        // 「可以获取」= 普通可获取 + 分级可获取
        where.availability = { in: ['AVAILABLE', 'TIERED'] };
      } else if (query.availability === 'limited') {
        where.availability = 'LIMITED';
      } else if (query.availability === 'discontinued') {
        where.availability = 'DISCONTINUED';
      } else if (query.availability === 'tiered') {
        where.isTiered = true;
      } else if (query.availability === 'single') {
        where.isTiered = false;
      } else if (query.availability === 'testing') {
        // 测试中 / 状态不明
        where.availability = 'TESTING';
      } else if (query.availability === 'internal') {
        // 内部专属 / 计划授予
        where.availability = 'INTERNAL';
      } else if (query.availability === 'unobtainable') {
        // 已无法获取（限定 + 已停止发放 + 测试中状态不明）
        where.availability = { in: ['LIMITED', 'DISCONTINUED', 'TESTING'] };
      } else if (
        // 直接传枚举值也支持，便于后台与外部调用
        ['AVAILABLE', 'TIERED', 'LIMITED', 'DISCONTINUED', 'TESTING', 'INTERNAL'].includes(
          query.availability,
        )
      ) {
        where.availability = query.availability as Availability;
      }
    }

    if (query.difficulty) {
      const d = Number(query.difficulty);
      if (!Number.isNaN(d) && d >= 1 && d <= 5) {
        where.difficulty = d;
      }
    }

    if (query.tiered !== undefined && query.tiered !== null) {
      // HTTP query 传来的永远是字符串，必须显式解释，
      // 否则 Prisma 会收到 'true'/'false' 字符串并抛出校验错误。
      const raw = query.tiered as unknown;
      if (raw === true || raw === 'true' || raw === '1') {
        where.isTiered = true;
      } else if (raw === false || raw === 'false' || raw === '0') {
        where.isTiered = false;
      }
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    return where;
  }

  private buildOrderBy(
    sort: AchievementListQuery['sort'],
  ): Prisma.AchievementOrderByWithRelationInput[] {
    switch (sort) {
      case 'easiest':
        return [{ difficulty: 'asc' }, { popularity: 'desc' }];
      case 'hardest':
        return [{ difficulty: 'desc' }, { popularity: 'desc' }];
      case 'name':
        return [{ nameEn: 'asc' }];
      case 'popular':
        return [{ popularity: 'desc' }, { viewCount: 'desc' }];
      case 'latest':
      default:
        return [{ updatedAt: 'desc' }];
    }
  }
}
