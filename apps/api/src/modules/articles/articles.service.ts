import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type ArticleCategory, type ContentStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { paginated } from '../../common/utils/paginate.util';
import { estimateReadingTime, extractToc, slugify } from '../../common/utils/text.util';

export interface ArticleListQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  q?: string;
  featured?: boolean;
  status?: ContentStatus;
}

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: ArticleListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 10));
    const where: Prisma.ArticleWhereInput = {};

    // 公开接口只返回已发布内容
    where.status = query.status ?? 'PUBLISHED';
    if (query.category && query.category !== 'all') {
      where.category = query.category as ArticleCategory;
    }
    if (query.featured) where.featured = true;
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { titleZh: { contains: q } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          title: true,
          titleZh: true,
          category: true,
          excerpt: true,
          coverImage: true,
          authorName: true,
          readingTime: true,
          tags: true,
          featured: true,
          publishedAt: true,
          updatedAt: true,
          views: true,
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return paginated(items, total, page, pageSize);
  }

  async findBySlug(slug: string, incrementView = true) {
    const cacheKey = `articles:detail:${slug}`;
    let article = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (!article) {
      const found = await this.prisma.article.findUnique({ where: { slug } });
      if (!found || found.status !== 'PUBLISHED') {
        throw new NotFoundException(`未找到攻略 "${slug}"`);
      }
      article = {
        ...found,
        toc: extractToc(found.contentMd),
      } as unknown as Record<string, unknown>;
      await this.cache.set(cacheKey, article, 600);
    }

    if (incrementView) {
      await this.prisma.article
        .update({
          where: { slug },
          data: { views: { increment: 1 } },
        })
        .catch(() => undefined);
    }
    return article;
  }

  async findRelated(slug: string, limit = 3) {
    const current = await this.prisma.article.findUnique({
      where: { slug },
      select: { category: true, tags: true },
    });
    if (!current) return [];
    return this.prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        slug: { not: slug },
        OR: [{ category: current.category }, { tags: { has: current.tags[0] } }],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        titleZh: true,
        excerpt: true,
        coverImage: true,
        readingTime: true,
        category: true,
      },
    });
  }

  async getCategories() {
    const grouped = await this.prisma.article.groupBy({
      by: ['category'],
      where: { status: 'PUBLISHED' },
      _count: { _all: true },
    });
    return grouped
      .map((g) => ({ category: g.category, count: g._count._all }))
      .sort((a, b) => b.count - a.count);
  }

  // -------------------------------------------------------------------------
  // 管理端
  // -------------------------------------------------------------------------

  async create(data: {
    title: string;
    titleZh: string;
    category: ArticleCategory;
    contentMd: string;
    excerpt?: string;
    coverImage?: string;
    tags?: string[];
    authorId?: string;
    authorName?: string;
    featured?: boolean;
    status?: ContentStatus;
  }) {
    const slug = slugify(data.title);
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`slug "${slug}" 已存在`);

    const created = await this.prisma.article.create({
      data: {
        slug,
        title: data.title,
        titleZh: data.titleZh,
        category: data.category,
        contentMd: data.contentMd,
        excerpt: data.excerpt ?? data.contentMd.slice(0, 140),
        coverImage: data.coverImage ?? null,
        tags: data.tags ?? [],
        authorId: data.authorId ?? null,
        authorName: data.authorName ?? 'GitHub Achievement Hub 编辑部',
        readingTime: estimateReadingTime(data.contentMd),
        featured: data.featured ?? false,
        status: data.status ?? 'DRAFT',
        publishedAt: (data.status ?? 'PUBLISHED') === 'PUBLISHED' ? new Date() : null,
      },
    });
    await this.invalidate();
    return created;
  }

  async update(id: string, data: Record<string, unknown>) {
    const payload: Prisma.ArticleUpdateInput = {
      ...(data.title !== undefined ? { title: String(data.title) } : {}),
      ...(data.titleZh !== undefined ? { titleZh: String(data.titleZh) } : {}),
      ...(data.category !== undefined
        ? { category: data.category as ArticleCategory }
        : {}),
      ...(data.contentMd !== undefined
        ? {
            contentMd: String(data.contentMd),
            readingTime: estimateReadingTime(String(data.contentMd)),
          }
        : {}),
      ...(data.excerpt !== undefined ? { excerpt: String(data.excerpt) } : {}),
      ...(data.coverImage !== undefined
        ? { coverImage: String(data.coverImage) }
        : {}),
      ...(data.tags !== undefined ? { tags: data.tags as string[] } : {}),
      ...(data.featured !== undefined ? { featured: Boolean(data.featured) } : {}),
      ...(data.status !== undefined
        ? {
            status: data.status as ContentStatus,
            ...(data.status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
          }
        : {}),
    };
    const updated = await this.prisma.article.update({
      where: { id },
      data: payload,
    });
    await this.invalidate();
    return updated;
  }

  async remove(id: string) {
    await this.prisma.article.delete({ where: { id } });
    await this.invalidate();
    return { message: '已删除' };
  }

  async invalidate() {
    await Promise.all([
      this.cache.delByPrefix('articles:'),
      this.cache.delByPrefix('site:stats'),
    ]);
  }
}
