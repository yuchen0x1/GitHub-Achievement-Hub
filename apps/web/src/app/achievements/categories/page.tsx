import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  Ban,
  CalendarClock,
  HelpCircle,
  Layers,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { apiFetchSafe } from '@/lib/api';
import type { Achievement, Category, Paginated } from '@/lib/types';
import { BadgeImage } from '@/components/achievement/badge-image';
import { EmptyState } from '@/components/common/empty-state';
import { Container, Notice, PageHeader } from '@/components/common/layout';
import { SectionHeading } from '@/components/common/section-heading';

export const metadata: Metadata = {
  title: '勋章分类',
  description:
    'GitHub 个人资料成就的 7 类体系：当前可获取、等级型、单等级、历史限定、已停止发放、测试中或状态不明、特殊身份与内部专属。',
  alternates: { canonical: '/achievements/categories' },
};

/** 只允许使用真实存在的 lucide 图标，避免运行时缺图 */
const CATEGORY_ICONS: Record<string, typeof Award> = {
  Sparkles,
  TrendingUp,
  Award,
  CalendarClock,
  Ban,
  HelpCircle,
  ShieldCheck,
};

const PREVIEW_LIMIT = 8;

function categoryHref(category: Category): string {
  if (category.filter?.availability) {
    return `/achievements?availability=${encodeURIComponent(category.filter.availability)}`;
  }
  return `/achievements?category=${encodeURIComponent(category.slug)}`;
}

export default async function AchievementCategoriesPage() {
  const categories = await apiFetchSafe<Category[]>('/achievements/categories', {
    revalidate: 600,
  });

  // 每个分类单独取该分类下的勋章；「当前可获取」是聚合视图，用 availability=available
  const lists = categories
    ? await Promise.all(
        categories.map((category) =>
          apiFetchSafe<Paginated<Achievement>>(
            category.slug === 'currently-obtainable'
              ? `/achievements?availability=available&pageSize=100&sort=popular`
              : `/achievements?category=${encodeURIComponent(category.slug)}&pageSize=100&sort=popular`,
            { revalidate: 60 },
          ),
        ),
      )
    : [];

  return (
    <Container size="lg" className="animate-fade-up space-y-8 py-8 sm:py-10">
      <PageHeader
        eyebrow="CATEGORY SYSTEM"
        title="勋章分类"
        description="本站按「获取方式」与「当前状态」把 GitHub 个人资料成就整理成分类体系。每个分类的勋章数量由 API 实时统计，不写死。"
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <Link href="/achievements" className="btn btn-ghost btn-sm">
          <LayoutGrid size={14} />
          返回图鉴
        </Link>
        <Link href="/achievements/tiers" className="btn btn-ghost btn-sm">
          <Layers size={14} />
          等级总览
        </Link>
        {categories && (
          <span className="ml-auto text-xs text-[var(--color-ink-subtle)]">
            共 {categories.length} 个分类
          </span>
        )}
      </div>

      <Notice tone="info">
        <strong>关于「当前可获取勋章」：</strong>
        它是一个<strong>跨分类的聚合视图</strong>——统计所有 availability 为
        AVAILABLE 或 TIERED 的勋章，而不是一个独立的勋章类别。因此它会与「等级型勋章」「单等级勋章」存在重叠，
        <strong>各分类数量不能简单相加</strong>。
      </Notice>

      {!categories && (
        <Notice tone="danger">
          分类数据暂时无法加载。请确认 API 服务已启动，或稍后重试。
        </Notice>
      )}

      {categories && categories.length === 0 && (
        <EmptyState
          title="暂无分类"
          description="数据库里还没有启用中的分类，请稍后再来看。"
          action={{ label: '返回图鉴', href: '/achievements' }}
        />
      )}

      {categories && categories.length > 0 && (
        <section aria-label="勋章分类体系" className="space-y-5">
          <SectionHeading
            eyebrow="CATEGORIES"
            title={`${categories.length} 类勋章体系`}
            description="点击分类查看筛选后的列表，也可以直接打开卡片内的勋章详情。"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category, index) => {
              const Icon = CATEGORY_ICONS[category.icon ?? ''] ?? Award;
              const accent = category.colorHex ?? 'var(--color-accent)';
              const isAggregated = category.slug === 'currently-obtainable';
              const list = lists[index];
              const items = list?.items ?? [];
              const shown = items.slice(0, PREVIEW_LIMIT);
              const href = categoryHref(category);

              return (
                <article
                  key={category.id}
                  className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-border-strong)]"
                >
                  <div
                    className="h-1 w-full"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${accent} 55%, transparent)`,
                    }}
                    aria-hidden
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start gap-3">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
                        style={{
                          color: accent,
                          borderColor: `color-mix(in oklab, ${accent} 35%, transparent)`,
                          backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)`,
                        }}
                        aria-hidden
                      >
                        <Icon size={20} strokeWidth={2.2} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-[15px] font-bold tracking-tight">
                            <Link
                              href={href}
                              className="underline-offset-4 hover:underline"
                            >
                              {category.nameZh}
                            </Link>
                          </h3>
                          {isAggregated && (
                            <span
                              className="chip"
                              style={{
                                color: accent,
                                borderColor: `color-mix(in oklab, ${accent} 40%, transparent)`,
                                backgroundColor: `color-mix(in oklab, ${accent} 10%, transparent)`,
                              }}
                            >
                              聚合视图
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-ink-subtle)]">
                          {category.nameEn}
                        </p>
                      </div>

                      <span
                        className="chip shrink-0 tabular-nums"
                        title="该分类下的勋章数量（API 实时统计）"
                      >
                        {category.achievementCount} 枚
                      </span>
                    </div>

                    <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                      {category.descriptionZh ??
                        category.descriptionEn ??
                        '暂无分类说明。'}
                    </p>

                    {isAggregated && (
                      <p className="mt-2 text-xs leading-relaxed text-[var(--color-warning)]">
                        与「等级型」「单等级」分类存在重叠，数量不可相加。
                      </p>
                    )}

                    <div className="mt-4 flex-1">
                      {list === null ? (
                        <p className="rounded-lg border border-dashed border-[var(--color-border-strong)] px-3 py-4 text-center text-xs text-[var(--color-ink-subtle)]">
                          该分类的勋章列表暂时无法加载。
                        </p>
                      ) : shown.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--color-border-strong)] px-3 py-4 text-center text-xs text-[var(--color-ink-subtle)]">
                          该分类下暂无可展示的勋章。
                        </p>
                      ) : (
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {shown.map((item) => (
                            <li key={item.id}>
                              <Link
                                href={`/achievements/${item.slug}`}
                                className="flex items-center gap-2 rounded-lg border border-transparent px-1.5 py-1.5 transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]"
                              >
                                <BadgeImage
                                  src={item.imageUrl}
                                  alt={item.nameZh}
                                  size={32}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-medium text-[var(--color-ink)]">
                                    {item.nameZh}
                                  </span>
                                  <span className="block truncate text-[11px] text-[var(--color-ink-subtle)]">
                                    {item.nameEn}
                                  </span>
                                </span>
                                {item.uncertain && (
                                  <span className="chip shrink-0 text-[10px] text-[var(--color-warning)]">
                                    待验证
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}

                      {items.length > PREVIEW_LIMIT && (
                        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
                          另有 {items.length - PREVIEW_LIMIT} 枚未展开
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                      <Link
                        href={href}
                        className="text-xs font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
                      >
                        查看该分类全部 {category.achievementCount} 枚 →
                      </Link>
                      <span className="text-[11px] text-[var(--color-ink-subtle)]">
                        {isAggregated ? 'availability=available' : `category=${category.slug}`}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </Container>
  );
}
