/**
 * 数据初始化脚本。
 *
 * 用法：
 *   npm run seed              # 使用 DATABASE_URL 连接
 *   （开发环境下 API 启动时若数据库为空，也会自动调用本脚本）
 *
 * 特性：幂等。重复执行不会产生重复数据；会更新已有条目的内容字段。
 */
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import { ACHIEVEMENTS, type AchievementSeed } from './data/achievements';
import { CATEGORIES } from './data/categories';
import { FAQS } from './data/faq';
import { ARTICLES } from './data/articles';
import { estimateReadingTime } from '../common/utils/text.util';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:55432/postgres';

export interface SeedResult {
  achievements: number;
  tiers: number;
  requirements: number;
  guides: number;
  sources: number;
  categories: number;
  articles: number;
  faqs: number;
  announcements: number;
  adminCreated: boolean;
}

/**
 * 写入种子数据。
 * @param prisma 已连接的 Prisma 客户端
 * @param options.onlyIfEmpty 仅在数据库为空时写入（开发环境自动灌入使用）
 */
export async function seedDatabase(
  prisma: PrismaClient,
  options: { onlyIfEmpty?: boolean } = {},
): Promise<SeedResult> {
  const result: SeedResult = {
    achievements: 0,
    tiers: 0,
    requirements: 0,
    guides: 0,
    sources: 0,
    categories: 0,
    articles: 0,
    faqs: 0,
    announcements: 0,
    adminCreated: false,
  };

  if (options.onlyIfEmpty) {
    const existing = await prisma.achievement.count();
    if (existing > 0) return result;
  }

  // ---------------------------------------------------------------- 分类
  const categoryIdBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        nameEn: c.nameEn,
        nameZh: c.nameZh,
        descriptionEn: c.descriptionEn,
        descriptionZh: c.descriptionZh,
        icon: c.icon,
        colorHex: c.colorHex,
        sortOrder: c.sortOrder,
      },
      update: {
        nameEn: c.nameEn,
        nameZh: c.nameZh,
        descriptionEn: c.descriptionEn,
        descriptionZh: c.descriptionZh,
        icon: c.icon,
        colorHex: c.colorHex,
        sortOrder: c.sortOrder,
      },
    });
    categoryIdBySlug.set(c.slug, record.id);
    result.categories += 1;
  }

  // ---------------------------------------------------------------- 勋章
  for (const a of ACHIEVEMENTS) {
    await upsertAchievement(prisma, a, categoryIdBySlug, result);
  }

  // ---------------------------------------------------------------- 攻略
  for (const art of ARTICLES) {
    const slug = art.slug;
    const data = {
      title: art.title,
      titleZh: art.titleZh,
      category: art.category,
      excerpt: art.excerpt,
      contentMd: art.contentMd,
      coverImage: art.coverImage,
      tags: art.tags,
      readingTime: estimateReadingTime(art.contentMd),
      featured: art.featured,
      sortOrder: art.sortOrder,
    };
    await prisma.article.upsert({
      where: { slug },
      create: {
        ...data,
        slug,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorName: 'GitHub Achievement Hub 编辑部',
      },
      update: { ...data, status: 'PUBLISHED', publishedAt: new Date() },
    });
    result.articles += 1;
  }

  // ---------------------------------------------------------------- FAQ
  for (const f of FAQS) {
    await prisma.faq.upsert({
      where: { slug: f.slug },
      create: {
        slug: f.slug,
        question: f.question,
        questionZh: f.questionZh,
        answer: f.answer,
        answerZh: f.answerZh,
        category: f.category,
        sortOrder: f.sortOrder,
      },
      update: {
        question: f.question,
        questionZh: f.questionZh,
        answer: f.answer,
        answerZh: f.answerZh,
        category: f.category,
        sortOrder: f.sortOrder,
      },
    });
    result.faqs += 1;
  }

  // ---------------------------------------------------------------- 公告
  const announcementCount = await prisma.announcement.count();
  if (announcementCount === 0) {
    await prisma.announcement.create({
      data: {
        title: '本站已收录 11 枚 GitHub 个人成就',
        content:
          '我们逐一核实了 GitHub 官方文档、官方公告与社区实测数据，' +
          '并对每一条等级门槛标注了可信度等级。' +
          '重要说明：GitHub 官方目前并未公开各成就的等级门槛表，' +
          '因此本站记录的门槛均来自社区一致实测，会在页面上明确标注。',
        level: 'INFO',
      },
    });
    result.announcements += 1;
  }

  // ---------------------------------------------------------------- 管理员
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@gach.local').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@12345';
  const adminName = process.env.ADMIN_NAME ?? '站点管理员';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        displayName: adminName,
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    result.adminCreated = true;
  }

  return result;
}

async function upsertAchievement(
  prisma: PrismaClient,
  a: AchievementSeed,
  categoryIdBySlug: Map<string, string>,
  result: SeedResult,
): Promise<void> {
  const base = {
    nameEn: a.nameEn,
    nameZh: a.nameZh,
    summaryEn: a.summaryEn,
    summaryZh: a.summaryZh,
    descriptionEn: a.descriptionEn,
    descriptionZh: a.descriptionZh,
    backgroundEn: a.backgroundEn,
    backgroundZh: a.backgroundZh,
    conditionEn: a.conditionEn,
    conditionZh: a.conditionZh,
    imageUrl: a.imageUrl,
    imageHdUrl: a.imageHdUrl,
    difficulty: a.difficulty,
    availability: a.availability,
    isTiered: a.isTiered,
    hasTiers: a.tiers.length > 0,
    credibility: a.credibility,
    uncertain: a.uncertain,
    uncertaintyNote: a.uncertaintyNote ?? null,
    popularity: a.popularity,
    status: 'PUBLISHED' as const,
    verifiedAt: new Date(a.verifiedAt),
    publishedAt: new Date(),
  };

  const achievement = await prisma.achievement.upsert({
    where: { slug: a.slug },
    create: {
      ...base,
      slug: a.slug,
      categoryId: categoryIdBySlug.get(a.categorySlug) ?? null,
    },
    update: {
      ...base,
      categoryId: categoryIdBySlug.get(a.categorySlug) ?? null,
    },
  });
  result.achievements += 1;

  // 等级
  for (const t of a.tiers) {
    await prisma.achievementTier.upsert({
      where: {
        achievementId_level: { achievementId: achievement.id, level: t.level },
      },
      create: {
        achievementId: achievement.id,
        level: t.level,
        threshold: t.threshold,
        labelEn: t.labelEn,
        labelZh: t.labelZh,
        descriptionEn: t.descriptionEn,
        descriptionZh: t.descriptionZh,
        credibility: t.credibility,
        sourceNote: t.sourceNote,
        sortOrder: ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'].indexOf(t.level),
      },
      update: {
        threshold: t.threshold,
        labelEn: t.labelEn,
        labelZh: t.labelZh,
        descriptionEn: t.descriptionEn,
        descriptionZh: t.descriptionZh,
        credibility: t.credibility,
        sourceNote: t.sourceNote,
        sortOrder: ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'].indexOf(t.level),
      },
    });
    result.tiers += 1;
  }

  // 获取条件
  await prisma.achievementRequirement.deleteMany({
    where: { achievementId: achievement.id },
  });
  for (const [index, r] of a.requirements.entries()) {
    await prisma.achievementRequirement.create({
      data: {
        achievementId: achievement.id,
        title: r.title,
        titleZh: r.titleZh,
        content: r.content,
        contentZh: r.contentZh,
        steps: r.steps,
        codeExample: r.codeExample ?? null,
        order: index,
      },
    });
    result.requirements += 1;
  }

  // 获取教程
  await prisma.achievementGuide.deleteMany({
    where: { achievementId: achievement.id },
  });
  for (const [index, g] of a.guides.entries()) {
    await prisma.achievementGuide.create({
      data: {
        achievementId: achievement.id,
        title: g.title,
        titleZh: g.titleZh,
        content: g.content,
        contentZh: g.contentZh,
        readingTime: g.readingTime,
        order: index,
      },
    });
    result.guides += 1;
  }

  // 资料来源
  await prisma.achievementSource.deleteMany({
    where: { achievementId: achievement.id },
  });
  for (const s of a.sources) {
    await prisma.achievementSource.create({
      data: {
        achievementId: achievement.id,
        title: s.title,
        url: s.url,
        sourceType: s.sourceType,
        credibility: s.credibility,
        status: s.status,
        verifiedAt: new Date(s.verifiedAt),
        note: s.note ?? null,
        isDisputed: s.isDisputed ?? false,
      },
    });
    result.sources += 1;
  }

  // 多语言（英文 / 中文）
  await prisma.achievementTranslation.upsert({
    where: {
      achievementId_locale: { achievementId: achievement.id, locale: 'zh-CN' },
    },
    create: {
      achievementId: achievement.id,
      locale: 'zh-CN',
      name: a.nameZh,
      summary: a.summaryZh,
      description: a.descriptionZh,
      background: a.backgroundZh,
      conditionText: a.conditionZh,
    },
    update: {
      name: a.nameZh,
      summary: a.summaryZh,
      description: a.descriptionZh,
      background: a.backgroundZh,
      conditionText: a.conditionZh,
    },
  });

  // 变更历史
  const historyExists = await prisma.achievementHistory.count({
    where: { achievementId: achievement.id, changeType: 'CREATE' },
  });
  if (historyExists === 0) {
    await prisma.achievementHistory.create({
      data: {
        achievementId: achievement.id,
        field: 'achievement',
        oldValue: null,
        newValue: a.slug,
        changeType: 'CREATE',
        note: '初始资料导入',
      },
    });
  }
}

// ---------------------------------------------------------------------------
// CLI 入口
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    const result = await seedDatabase(prisma);
    // eslint-disable-next-line no-console
    console.log('✅ 种子数据写入完成：');
    // eslint-disable-next-line no-console
    console.table(result);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('❌ 种子数据写入失败：', err);
    process.exit(1);
  });
}
