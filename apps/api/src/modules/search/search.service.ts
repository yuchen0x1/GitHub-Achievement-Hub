import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';

export interface SearchHit {
  type: 'achievement' | 'article';
  slug: string;
  title: string;
  titleZh: string;
  excerpt: string;
  imageUrl?: string | null;
  meta?: Record<string, unknown>;
  score: number;
}

/**
 * 全站统一搜索。
 * 覆盖：英文名 / 中文名 / 获取条件 / 教程标题 / 关键词 / 等级 / 状态。
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async search(q: string, limit = 20) {
    const keyword = q.trim();
    if (!keyword) {
      return { query: keyword, achievements: [], articles: [], total: 0 };
    }

    const cacheKey = `search:${keyword.toLowerCase()}:${limit}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const [achievements, articles] = await Promise.all([
      this.prisma.achievement.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { nameEn: { contains: keyword, mode: 'insensitive' } },
            { nameZh: { contains: keyword } },
            { slug: { contains: keyword, mode: 'insensitive' } },
            { summaryEn: { contains: keyword, mode: 'insensitive' } },
            { summaryZh: { contains: keyword } },
            { conditionEn: { contains: keyword, mode: 'insensitive' } },
            { conditionZh: { contains: keyword } },
            { descriptionZh: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: [{ popularity: 'desc' }, { updatedAt: 'desc' }],
        select: {
          slug: true,
          nameEn: true,
          nameZh: true,
          summaryZh: true,
          summaryEn: true,
          imageUrl: true,
          availability: true,
          difficulty: true,
          isTiered: true,
        },
      }),
      this.prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { titleZh: { contains: keyword } },
            { excerpt: { contains: keyword, mode: 'insensitive' } },
            { contentMd: { contains: keyword, mode: 'insensitive' } },
            { tags: { has: keyword } },
          ],
        },
        take: limit,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
        select: {
          slug: true,
          title: true,
          titleZh: true,
          excerpt: true,
          coverImage: true,
          category: true,
          readingTime: true,
        },
      }),
    ]);

    const result = {
      query: keyword,
      achievements,
      articles,
      total: achievements.length + articles.length,
    };
    await this.cache.set(cacheKey, result, 180);
    return result;
  }

  /** 搜索建议（输入联想） */
  async suggest(q: string, limit = 8) {
    const keyword = q.trim();
    if (!keyword) return [];

    const rows = await this.prisma.achievement.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { nameEn: { contains: keyword, mode: 'insensitive' } },
          { nameZh: { contains: keyword } },
          { slug: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { popularity: 'desc' },
      select: { slug: true, nameEn: true, nameZh: true, imageUrl: true },
    });

    return rows.map((r) => ({
      type: 'achievement' as const,
      label: r.nameZh,
      labelEn: r.nameEn,
      slug: r.slug,
      imageUrl: r.imageUrl,
    }));
  }

  /** 全站搜索（含分类维度），供 /search 页面使用 */
  async searchFull(query: {
    q?: string;
    availability?: string;
    difficulty?: string;
    category?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) {
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
      if (query.availability === 'available')
        where.availability = { in: ['AVAILABLE', 'TIERED'] };
      else if (query.availability === 'limited') where.availability = 'LIMITED';
      else if (query.availability === 'discontinued')
        where.availability = 'DISCONTINUED';
      else if (query.availability === 'tiered') where.isTiered = true;
      else if (query.availability === 'single') where.isTiered = false;
    }
    if (query.difficulty) {
      const d = Number(query.difficulty);
      if (!Number.isNaN(d)) where.difficulty = d;
    }
    if (query.category) where.category = { slug: query.category };

    const orderBy: Prisma.AchievementOrderByWithRelationInput[] =
      query.sort === 'easiest'
        ? [{ difficulty: 'asc' }]
        : query.sort === 'hardest'
          ? [{ difficulty: 'desc' }]
          : query.sort === 'name'
            ? [{ nameEn: 'asc' }]
            : query.sort === 'popular'
              ? [{ popularity: 'desc' }]
              : [{ updatedAt: 'desc' }];

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 12));

    const [items, total] = await this.prisma.$transaction([
      this.prisma.achievement.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true, tiers: { orderBy: { sortOrder: 'asc' } } },
      }),
      this.prisma.achievement.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
