import type { Metadata } from 'next';
import Link from 'next/link';
import { Layers, LayoutGrid, Table2, TriangleAlert } from 'lucide-react';
import { apiFetchSafe } from '@/lib/api';
import type { Achievement, Credibility, Tier, TierLevel } from '@/lib/types';
import { tierMeta } from '@/lib/tier';
import { AvailabilityBadge } from '@/components/achievement/availability-badge';
import { BadgeImage } from '@/components/achievement/badge-image';
import { CredibilityBadge } from '@/components/achievement/credibility-badge';
import { TierLadder } from '@/components/achievement/tier-progress';
import { EmptyState } from '@/components/common/empty-state';
import { Container, Notice, PageHeader } from '@/components/common/layout';
import { SectionHeading } from '@/components/common/section-heading';

export const metadata: Metadata = {
  title: '勋章等级总览',
  description:
    'Default / Bronze / Silver / Gold 等级阶梯总览：逐枚查看等级型勋章的门槛数量，以及每条门槛的资料来源可信度。',
  alternates: { canonical: '/achievements/tiers' },
};

const LEVELS: TierLevel[] = ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'];

const LEVEL_EXPLAIN: Record<TierLevel, string> = {
  DEFAULT: '达成该勋章的基础条件即可点亮。',
  BRONZE: '第一级进阶，需要比默认等级更大的累计数量。',
  SILVER: '中间等级，通常需要数倍于铜章的数量。',
  GOLD: '最高等级，门槛远高于其他等级，往往依赖长期、持续的积累。',
};

/**
 * /achievements/tiers 返回的是列表项的精简结构（没有 id / 分类等字段）。
 * 用 Pick 复用共享类型，避免重复定义勋章接口。
 */
type TierOverviewItem = Pick<
  Achievement,
  'slug' | 'nameEn' | 'nameZh' | 'imageUrl' | 'availability' | 'difficulty'
> & { tiers: Tier[] };

type TierOverviewPayload = TierOverviewItem[] | { items: TierOverviewItem[] };

function sortedTiers(tiers: Tier[]): Tier[] {
  return [...tiers].sort((a, b) => a.threshold - b.threshold);
}

function uniqueGrades(tiers: Tier[]): Credibility[] {
  const order: Credibility[] = ['A', 'B', 'C', 'D'];
  const present = new Set(tiers.map((tier) => tier.credibility));
  return order.filter((grade) => present.has(grade));
}

/** 等级主题色在浅色模式下可能偏淡，与正文色混合后保证两套主题都可读 */
function tierTextColor(color: string): string {
  return `color-mix(in oklab, ${color} 62%, var(--color-ink))`;
}

export default async function AchievementTiersPage() {
  const payload = await apiFetchSafe<TierOverviewPayload>('/achievements/tiers', {
    revalidate: 300,
  });
  // 接口既可能直接返回数组，也可能包一层 { items }，两种都兼容
  const items = payload
    ? Array.isArray(payload)
      ? payload
      : (payload.items ?? null)
    : null;

  const gradeCounts = new Map<Credibility, number>();
  for (const item of items ?? []) {
    for (const tier of item.tiers) {
      gradeCounts.set(tier.credibility, (gradeCounts.get(tier.credibility) ?? 0) + 1);
    }
  }

  return (
    <Container size="lg" className="animate-fade-up space-y-8 py-8 sm:py-10">
      <PageHeader
        eyebrow="TIER SYSTEM"
        title="勋章等级总览"
        description="等级型成就随累计数量依次点亮 Default → Bronze → Silver → Gold。本站汇总每枚等级型勋章的门槛，并逐条标注资料可信度。"
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <Link href="/achievements" className="btn btn-ghost btn-sm">
          <LayoutGrid size={14} />
          返回图鉴
        </Link>
        <Link href="/achievements/categories" className="btn btn-ghost btn-sm">
          <Layers size={14} />
          勋章分类
        </Link>
        {items && (
          <span className="ml-auto text-xs text-[var(--color-ink-subtle)]">
            共 {items.length} 枚等级型勋章
          </span>
        )}
      </div>

      <Notice tone="warning">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[var(--color-ink)]">
          <TriangleAlert size={15} className="text-[var(--color-warning)]" />
          门槛数值不是 GitHub 官方公布的数据
        </p>
        <p className="mt-1.5">
          GitHub 官方文档目前只说明成就有等级（Default / Bronze / Silver /
          Gold），<strong>未公布各级的具体门槛数值</strong>。本页数字来自社区实测与多来源交叉印证，属于 Grade
          C（多源一致）数据，不是官方规定。每个等级旁都标注了该条门槛的可信度
          <CredibilityBadge grade="C" compact className="mx-1 align-middle" />
          ，请勿将其作为唯一依据，也不要表述为「GitHub 官方规定」。
        </p>
      </Notice>

      <section aria-label="四个等级的含义" className="space-y-4">
        <SectionHeading
          eyebrow="LEVELS"
          title="Default → Bronze → Silver → Gold"
          description="同一枚勋章在同一时间只会显示当前达到的最高等级；等级不会掉级。"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((level) => {
            const meta = tierMeta(level);
            return (
              <div
                key={level}
                className="rounded-[var(--radius-card)] border p-4"
                style={{
                  borderColor: `color-mix(in oklab, ${meta.color} 35%, var(--color-border))`,
                  backgroundColor: `color-mix(in oklab, ${meta.color} 6%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold"
                    style={{
                      color: tierTextColor(meta.color),
                      backgroundColor: `color-mix(in oklab, ${meta.color} 16%, transparent)`,
                    }}
                    aria-hidden
                  >
                    {meta.order + 1}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: tierTextColor(meta.color) }}
                  >
                    {meta.labelZh}
                  </span>
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                  {LEVEL_EXPLAIN[level]}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {items === null && (
        <Notice tone="danger">
          等级数据暂时无法加载。请确认 API 服务已启动，或稍后重试。
        </Notice>
      )}

      {items && items.length === 0 && (
        <EmptyState
          title="暂无等级型勋章"
          description="数据库中还没有公开的等级型勋章资料。"
          action={{ label: '返回图鉴', href: '/achievements' }}
        />
      )}

      {items && items.length > 0 && (
        <section aria-label="逐枚等级阶梯" className="space-y-4">
          <SectionHeading
            eyebrow="LADDERS"
            title="逐枚阶梯"
            description="按热度排序。每条门槛右侧标注该数值的资料可信度；D 级会明确标记为「资料待验证」。"
          />

          {gradeCounts.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-subtle)]">
              <span>门槛条目可信度分布：</span>
              {(['A', 'B', 'C', 'D'] as Credibility[]).map((grade) =>
                gradeCounts.has(grade) ? (
                  <span key={grade} className="inline-flex items-center gap-1">
                    <CredibilityBadge grade={grade} compact />
                    <span className="tabular-nums">× {gradeCounts.get(grade)}</span>
                  </span>
                ) : null,
              )}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((item) => {
              const tiers = sortedTiers(item.tiers);
              const hasUnverified = tiers.some((tier) => tier.credibility === 'D');

              return (
                <article
                  key={item.slug}
                  className="surface-raised overflow-hidden"
                >
                  <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] p-4">
                    <BadgeImage
                      src={item.imageUrl}
                      alt={item.nameZh}
                      size={44}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold tracking-tight">
                        <Link
                          href={`/achievements/${item.slug}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {item.nameZh}
                        </Link>
                      </h3>
                      <p className="truncate text-xs text-[var(--color-ink-subtle)]">
                        {item.nameEn}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AvailabilityBadge availability={item.availability} />
                      {hasUnverified && (
                        <span className="chip text-[var(--color-warning)]">
                          资料待验证
                        </span>
                      )}
                    </div>
                  </header>

                  <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <TierLadder tiers={tiers} />

                    <div className="flex flex-wrap items-start gap-x-3 gap-y-2 lg:w-[10.5rem] lg:flex-col lg:gap-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                        门槛可信度
                      </span>
                      {tiers.map((tier) => {
                        const meta = tierMeta(tier.level);
                        return (
                          <span
                            key={tier.id}
                            className="inline-flex items-center gap-1.5"
                          >
                            <span
                              className="text-[11px] font-medium"
                              style={{ color: tierTextColor(meta.color) }}
                            >
                              {tier.labelZh}
                            </span>
                            <CredibilityBadge grade={tier.credibility} compact />
                          </span>
                        );
                      })}
                      <Link
                        href={`/achievements/${item.slug}`}
                        className="text-[11px] font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline lg:mt-1"
                      >
                        查看获取步骤 →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {items && items.length > 0 && (
        <section aria-label="门槛汇总表" className="space-y-4">
          <SectionHeading
            eyebrow="SUMMARY"
            title="门槛汇总表"
            description="移动端可左右滑动查看。数值单位随勋章类型不同（如合并 PR 数、回答数等），详情页会写明口径。"
          />

          <Notice tone="info">
            表格中的「可信度」按等级汇总；同一枚勋章不同等级可能来自不同强度的证据。
          </Notice>

          <div
            className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]"
            role="region"
            aria-label="等级门槛汇总表（可横向滚动）"
            tabIndex={0}
          >
            <table className="w-full min-w-[780px] border-collapse text-sm">
              <caption className="sr-only">
                全部等级型勋章在 Default、Bronze、Silver、Gold 四级下的门槛数量与可信度
              </caption>
              <thead>
                <tr className="bg-[var(--color-surface-raised)] text-left">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-[var(--color-surface-raised)] px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-muted)]"
                  >
                    勋章
                  </th>
                  {LEVELS.map((level) => {
                    const meta = tierMeta(level);
                    return (
                      <th
                        key={level}
                        scope="col"
                        className="px-4 py-2.5 text-xs font-semibold"
                        style={{ color: tierTextColor(meta.color) }}
                      >
                        {meta.labelZh}
                        <span className="ml-1 font-normal text-[var(--color-ink-subtle)]">
                          {meta.label}
                        </span>
                      </th>
                    );
                  })}
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-muted)]"
                  >
                    可信度
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const tiers = sortedTiers(item.tiers);
                  const byLevel = new Map(
                    tiers.map((tier) => [tier.level, tier] as const),
                  );
                  const grades = uniqueGrades(tiers);

                  return (
                    <tr
                      key={item.slug}
                      className="border-t border-[var(--color-border)] align-top"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-[var(--color-surface)] px-4 py-2.5 text-left font-medium"
                      >
                        <Link
                          href={`/achievements/${item.slug}`}
                          className="text-[13px] font-semibold underline-offset-4 hover:underline"
                        >
                          {item.nameZh}
                        </Link>
                        <span className="block text-[11px] font-normal text-[var(--color-ink-subtle)]">
                          {item.nameEn}
                        </span>
                      </th>

                      {LEVELS.map((level) => {
                        const tier = byLevel.get(level);
                        return (
                          <td
                            key={level}
                            className="px-4 py-2.5 tabular-nums text-[var(--color-ink-muted)]"
                            title={
                              tier
                                ? tier.descriptionZh ?? tier.sourceNote ?? undefined
                                : '该勋章没有这一等级'
                            }
                          >
                            {tier ? (
                              <span className="text-[var(--color-ink)]">
                                {tier.threshold}
                              </span>
                            ) : (
                              <span className="text-[var(--color-ink-subtle)]">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-4 py-2.5">
                        <span className="flex flex-wrap items-center gap-1.5">
                          {grades.length === 0 ? (
                            <span className="text-xs text-[var(--color-ink-subtle)]">
                              —
                            </span>
                          ) : (
                            grades.map((grade) => (
                              <CredibilityBadge key={grade} grade={grade} compact />
                            ))
                          )}
                          {grades.includes('D') && (
                            <span className="chip text-[10px] text-[var(--color-warning)]">
                              资料待验证
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
            <Table2 size={13} />
            表格中的数字均来自 API 返回的门槛数据，未做人工补全；缺失等级显示为「—」。
          </p>
        </section>
      )}
    </Container>
  );
}
