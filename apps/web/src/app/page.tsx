import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { apiFetchSafe } from '@/lib/api';
import type {
  Achievement,
  ArticleSummary,
  Category,
  SiteStats,
} from '@/lib/types';
import { Container } from '@/components/common/layout';
import { SectionHeading } from '@/components/common/section-heading';
import { AchievementCard } from '@/components/achievement/achievement-card';
import { BadgeImage } from '@/components/achievement/badge-image';
import { ArticleCard } from '@/components/article/article-card';
import { formatDate, formatNumber } from '@/lib/utils';
import { ARTICLE_CATEGORY_META } from '@/lib/article-meta';

/** 首页数据全部来自后端真实聚合，禁止写死任何统计数字 */
export const revalidate = 120;

interface HomeData {
  stats: SiteStats | null;
  featured: Achievement[];
  categories: Category[];
  articles: ArticleSummary[];
}

async function loadHomeData(): Promise<HomeData> {
  const [stats, featured, categories, articles] = await Promise.all([
    apiFetchSafe<SiteStats>('/achievements/stats', { revalidate: 120 }),
    apiFetchSafe<Achievement[]>('/achievements/featured?limit=6', { revalidate: 120 }),
    apiFetchSafe<Category[]>('/achievements/categories', { revalidate: 120 }),
    apiFetchSafe<{ items: ArticleSummary[] }>('/articles?pageSize=3&sort=featured', {
      revalidate: 120,
    }),
  ]);

  return {
    stats,
    featured: featured ?? [],
    categories: categories ?? [],
    articles: articles?.items ?? [],
  };
}

export default async function HomePage() {
  const { stats, featured, categories, articles } = await loadHomeData();

  return (
    <>
      <Hero stats={stats} featured={featured} />
      <StatsBar stats={stats} />
      <FeaturedAchievements items={featured} />
      <BeginnerGuide />
      <CategoryStrip categories={categories} />
      {articles.length > 0 && <LatestGuides articles={articles} />}
      <ClosingCta />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero({
  stats,
  featured,
}: {
  stats: SiteStats | null;
  featured: Achievement[];
}) {
  const showcase = featured.slice(0, 3);

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      {/* 背景：网格 + 双色光晕 */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="grid-texture absolute inset-0 opacity-60" />
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--color-accent) 26%, transparent), transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-32 right-0 h-[360px] w-[360px] rounded-full blur-[100px]"
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklab, #a371f7 20%, transparent), transparent 70%)',
          }}
        />
      </div>

      <Container className="relative py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          {/* 文案区 */}
          <div className="animate-fade-up">
            <span className="chip border-[var(--color-accent)]/35 bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Sparkles size={12} />
              GitHub 个人成就勋章百科
            </span>

            <h1 className="mt-5 text-[clamp(2rem,5.4vw,3.75rem)] font-extrabold leading-[1.06] tracking-[-0.035em]">
              Unlock Every
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(100deg, var(--color-accent), #a371f7 55%, #e3b341)',
                }}
              >
                GitHub Achievement
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-ink-muted)] sm:text-[17px]">
              系统收录 GitHub 个人资料页上的每一枚成就勋章：获取条件、等级门槛、解锁难度与完整操作步骤。
              每一条资料都标注来源与可信度等级，区分「官方明确说明」与「社区实测」——
              不编造，也不夸大。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/achievements" className="btn btn-primary">
                浏览勋章图鉴
                <ArrowRight size={16} />
              </Link>
              <Link href="/github-profile" className="btn btn-secondary">
                <Search size={16} />
                查询 GitHub 账号
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-ink-subtle)]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[var(--color-success)]" />
                资料可溯源
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[var(--color-success)]" />
                不收录刷量手段
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={13} className="text-[var(--color-accent)]" />
                {stats ? `${formatNumber(stats.articleCount)} 篇系统攻略` : '系统化攻略'}
              </span>
            </div>
          </div>

          {/* 徽章展示区 */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto h-[380px] w-full max-w-[420px]">
              {showcase.length > 0 ? (
                <>
                  {showcase.map((item, i) => {
                    const layouts = [
                      'left-1/2 top-8 -translate-x-1/2',
                      'left-2 top-44',
                      'right-2 top-44',
                    ];
                    const sizes = [140, 108, 108];
                    return (
                      <Link
                        key={item.slug}
                        href={`/achievements/${item.slug}`}
                        className={`group absolute ${layouts[i]} transition-transform duration-300 hover:-translate-y-1`}
                        style={{ animationDelay: `${i * 90}ms` }}
                      >
                        <span
                          className="badge-frame grid place-items-center p-4"
                          style={{
                            width: sizes[i],
                            height: sizes[i],
                            borderRadius: '1.5rem',
                          }}
                        >
                          <BadgeImage
                            src={item.imageUrl}
                            alt={item.nameZh}
                            size={sizes[i] - 40}
                          />
                        </span>
                        <span className="mt-2 block text-center text-xs font-medium text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)]">
                          {item.nameZh}
                        </span>
                      </Link>
                    );
                  })}

                  {/* 中心的说明卡 */}
                  <div className="absolute bottom-2 left-1/2 w-[300px] -translate-x-1/2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-3 text-center backdrop-blur">
                    <p className="text-[13px] font-medium">
                      每一枚勋章都有独立的
                      <span className="text-[var(--color-accent)]"> 获取教程</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-ink-subtle)]">
                      条件 · 步骤 · 等级 · 来源 · 可信度
                    </p>
                  </div>
                </>
              ) : (
                <div className="grid h-full place-items-center rounded-2xl border border-dashed border-[var(--color-border-strong)]">
                  <p className="text-sm text-[var(--color-ink-subtle)]">勋章数据加载中…</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 统计条 —— 每个数字都来自 /achievements/stats 真实聚合                 */
/* ------------------------------------------------------------------ */

function StatsBar({ stats }: { stats: SiteStats | null }) {
  const items = stats
    ? [
        {
          key: 'total',
          label: '收录勋章',
          value: stats.totalAchievements,
          icon: Award,
          color: 'var(--color-accent)',
          href: '/achievements',
        },
        {
          key: 'obtainable',
          label: '当前可获取',
          value: stats.obtainableAchievements,
          icon: Sparkles,
          color: 'var(--color-success)',
          href: '/achievements?availability=available',
        },
        {
          key: 'tiered',
          label: '等级型勋章',
          value: stats.tieredAchievements,
          icon: TrendingUp,
          color: '#58a6ff',
          href: '/achievements/tiers',
        },
        {
          key: 'limited',
          label: '历史限定',
          value: stats.limitedAchievements,
          icon: BarChart3,
          color: 'var(--color-warning)',
          href: '/achievements?availability=limited',
        },
        {
          key: 'articles',
          label: '知识库攻略',
          value: stats.articleCount,
          icon: BookOpen,
          color: '#a371f7',
          href: '/guides',
        },
        {
          key: 'categories',
          label: '勋章分类',
          value: stats.categoryCount,
          icon: Compass,
          color: '#db61a2',
          href: '/achievements/categories',
        },
      ]
    : [];

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-canvas-alt)]">
      <Container className="py-8">
        {stats ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)]"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-ink-subtle)]">
                      <Icon size={12} style={{ color: item.color }} />
                      {item.label}
                    </span>
                    <span className="mt-1 block text-2xl font-bold tabular-nums tracking-tight">
                      {formatNumber(item.value)}
                    </span>
                  </Link>
                );
              })}
            </div>

            <p className="mt-4 text-center text-[11px] text-[var(--color-ink-subtle)]">
              以上数字由站点数据库实时聚合
              {stats.lastVerifiedAt && ` · 资料最近校验于 ${formatDate(stats.lastVerifiedAt)}`}
              {stats.lastUpdatedAt && ` · 内容最近更新于 ${formatDate(stats.lastUpdatedAt)}`}
            </p>
          </>
        ) : (
          <p className="py-4 text-center text-sm text-[var(--color-ink-subtle)]">
            统计数据暂时不可用，请稍后刷新。
          </p>
        )}
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 热门勋章                                                            */
/* ------------------------------------------------------------------ */

function FeaturedAchievements({ items }: { items: Achievement[] }) {
  return (
    <section className="py-14 sm:py-18">
      <Container>
        <SectionHeading
          eyebrow="MOST SOUGHT AFTER"
          title="最受关注的六枚勋章"
          description="按站内热度排序，覆盖合并 Pull Request、代码审查、Issue 处理、仓库 Star、Discussions 问答与协作提交六种典型贡献路径。"
          action={{ label: '查看全部勋章', href: '/achievements' }}
        />

        {items.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <AchievementCard
                key={item.id}
                achievement={item}
                state={item.availability === 'LIMITED' ? 'limited' : 'normal'}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] py-14 text-center">
            <p className="text-sm text-[var(--color-ink-subtle)]">
              勋章数据暂时不可用，请稍后刷新或前往
              <Link href="/achievements" className="link ml-1">
                勋章图鉴
              </Link>
              。
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 新手入门                                                            */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    step: '01',
    title: '先搞清楚勋章是什么',
    body:
      'GitHub 成就是个人资料页上的一排小徽章，由你在平台上的真实行为自动点亮——合并了 Pull Request、关闭了 Issue、回答被采纳等等。它不是一个可以「申请」的头衔，也没有后台开关。',
    points: ['展示在个人主页侧栏', '达到条件后自动发放', '部分勋章有 Bronze / Silver / Gold 分级'],
  },
  {
    step: '02',
    title: '选一条适合自己的路径',
    body:
      '不需要样样都做。如果你刚起步，Pull Shark 和 Quickdraw 是最现实的起点；如果你在维护自己的项目，Starstruck 与 Galaxy Brain 更贴合；如果你已经在团队协作，Pair Extraordinaire 几乎顺手可得。',
    points: ['新手优先：Pull Shark / Quickdraw', '维护者优先：Starstruck / Galaxy Brain', '团队协作：Pair Extraordinaire'],
  },
  {
    step: '03',
    title: '看清门槛，再决定投入',
    body:
      'Gold 级往往需要成百上千次操作。本站把每一级的门槛数值都标了出来，同时标注可信度——GitHub 官方并未公布分级门槛，这些数字来自社区实测与多源一致，属于 C 级资料。',
    points: ['每级门槛一目了然', '可信度 A/B/C/D 分级标注', '不确定的信息明确标为「待验证」'],
  },
];

function BeginnerGuide() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-canvas-alt)] py-14 sm:py-18">
      <Container>
        <SectionHeading
          eyebrow="START HERE"
          title="第一次接触 GitHub 成就？从这里开始"
          description="三步建立完整认知：它是什么、你该走哪条路、每一级到底要投入多少。"
          action={{ label: '阅读新手攻略', href: '/guides/github-getting-started' }}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="surface flex flex-col rounded-[var(--radius-card)] p-5"
            >
              <span className="text-[11px] font-bold tracking-[0.18em] text-[var(--color-accent)]">
                STEP {item.step}
              </span>
              <h3 className="mt-2 text-base font-bold tracking-tight">{item.title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                {item.body}
              </p>
              <ul className="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-3">
                {item.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-1.5 text-[12px] text-[var(--color-ink-muted)]"
                  >
                    <CheckCircle2
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--color-success)]"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link href="/achievements?sort=easiest" className="btn btn-secondary btn-sm">
            按难度从低到高查看
            <ArrowRight size={14} />
          </Link>
          <Link href="/faq" className="btn btn-ghost btn-sm">
            常见问题解答
          </Link>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 分类                                                                */
/* ------------------------------------------------------------------ */

const CATEGORY_ACCENT: Record<string, string> = {
  'currently-obtainable': 'var(--color-success)',
  tiered: '#58a6ff',
  'single-level': '#a371f7',
  limited: 'var(--color-warning)',
  discontinued: 'var(--color-ink-subtle)',
  experimental: '#db61a2',
  special: '#e3b341',
};

function CategoryStrip({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <section className="py-14 sm:py-18">
      <Container>
        <SectionHeading
          eyebrow="BROWSE BY STATUS"
          title="按获取状态分类浏览"
          description="同样是「勋章」，能不能拿到、怎么拿到差别很大。先按状态定位，再进详情页看具体条件。"
          action={{ label: '分类总览', href: '/achievements/categories' }}
        />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => {
            const accent = cat.colorHex ?? CATEGORY_ACCENT[cat.slug] ?? 'var(--color-accent)';
            const href =
              cat.slug === 'currently-obtainable'
                ? '/achievements?availability=available'
                : `/achievements?category=${cat.slug}`;
            return (
              <Link
                key={cat.id}
                href={href}
                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`,
                      color: accent,
                    }}
                  >
                    <Compass size={15} />
                  </span>
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: accent }}
                  >
                    {cat.achievementCount}
                  </span>
                </div>
                <p className="mt-2.5 text-sm font-semibold group-hover:text-[var(--color-accent)]">
                  {cat.nameZh}
                </p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--color-ink-muted)]">
                  {cat.descriptionZh}
                </p>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 最新攻略                                                            */
/* ------------------------------------------------------------------ */

function LatestGuides({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-canvas-alt)] py-14 sm:py-18">
      <Container>
        <SectionHeading
          eyebrow="KNOWLEDGE BASE"
          title="最新的系统攻略"
          description="从注册账号到第一次被合并的 Pull Request，12 个主题覆盖成就获取的完整知识链。"
          action={{ label: '进入知识库', href: '/guides' }}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {Object.entries(ARTICLE_CATEGORY_META)
            .slice(0, 6)
            .map(([key, meta]) => (
              <Link
                key={key}
                href={`/guides?category=${key}`}
                className="chip hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]"
                style={{ color: meta.color }}
              >
                {meta.label}
              </Link>
            ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 底部 CTA                                                            */
/* ------------------------------------------------------------------ */

function ClosingCta() {
  return (
    <section className="py-16 sm:py-20">
      <Container size="md">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center sm:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden
            style={{
              background:
                'radial-gradient(ellipse 70% 120% at 50% 0%, color-mix(in oklab, var(--color-accent) 16%, transparent), transparent 70%)',
            }}
          />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              把你的勋章墙，变成一张清晰的路线图
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
              收藏想拿的勋章、记录当前进度、推算还差多少次。所有数据同步在你的账号下，
              随时可以导出。
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className="btn btn-primary">
                免费创建账号
                <ArrowRight size={16} />
              </Link>
              <Link href="/achievements/tiers" className="btn btn-secondary">
                先看等级门槛
              </Link>
            </div>
            <p className="mt-5 text-[11px] text-[var(--color-ink-subtle)]">
              本站为非官方社区项目，与 GitHub, Inc. 无隶属关系
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
