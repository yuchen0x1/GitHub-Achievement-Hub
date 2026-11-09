import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarClock,
  Eye,
  Flame,
  Layers,
  ShieldAlert,
  Star,
  TrendingUp,
} from 'lucide-react';
import { apiFetch, apiFetchSafe, ApiRequestError } from '@/lib/api';
import type { Achievement, AchievementDetail, Paginated } from '@/lib/types';
import { availabilityMeta, difficultyInfo, difficultyStars } from '@/lib/tier';
import { formatDate, formatNumber } from '@/lib/utils';
import { AchievementCard } from '@/components/achievement/achievement-card';
import { AvailabilityBadge } from '@/components/achievement/availability-badge';
import { BadgeImage } from '@/components/achievement/badge-image';
import { CredibilityBadge } from '@/components/achievement/credibility-badge';
import { TierBadge } from '@/components/achievement/tier-badge';
import { Container, Notice } from '@/components/common/layout';
import { DetailContent } from './detail-content';
import { FavoriteButton } from './favorite-button';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 不显式声明 `dynamicParams`（默认 true）：
 * - SSR 模式保持现有行为，未知 slug 仍可按需渲染；
 * - 导出模式只产出 generateStaticParams 枚举到的页面，未知 slug 自然 404。
 */
const REVALIDATE = 300;

/**
 * 构建期枚举全部勋章 slug。
 * API 不可达时返回空数组，构建不会因为后端未启动而失败。
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const result = await apiFetchSafe<Paginated<Achievement>>(
      '/achievements?pageSize=100',
      { revalidate: REVALIDATE },
    );
    return (result?.items ?? [])
      .map((item) => item?.slug)
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

/**
 * 拉取勋章详情。
 * 只有 404 才视为「该 slug 不存在」；服务不可用等异常向上抛出，
 * 避免把临时故障误报成「勋章不存在」。
 */
async function fetchDetail(slug: string): Promise<AchievementDetail | null> {
  try {
    return await apiFetch<AchievementDetail>(
      `/achievements/${encodeURIComponent(slug)}`,
      { revalidate: REVALIDATE },
    );
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await apiFetchSafe<AchievementDetail>(
    `/achievements/${encodeURIComponent(slug)}`,
    { revalidate: REVALIDATE },
  );

  if (!detail) {
    return {
      title: '未找到该勋章',
      description: '站内没有收录这个 slug 对应的勋章。',
      robots: { index: false, follow: true },
    };
  }

  const description =
    detail.summaryZh?.trim() ||
    detail.summaryEn?.trim() ||
    'GitHub 个人资料成就勋章的获取条件、等级门槛与完整操作步骤。';

  return {
    title: `${detail.nameZh}（${detail.nameEn}）— 获取条件与等级门槛`,
    description: description.slice(0, 200),
    alternates: { canonical: `/achievements/${detail.slug}` },
    openGraph: {
      type: 'article',
      title: `${detail.nameZh}（${detail.nameEn}）`,
      description: description.slice(0, 200),
      url: `/achievements/${detail.slug}`,
      images: detail.imageHdUrl || detail.imageUrl
        ? [
            {
              url: detail.imageHdUrl || detail.imageUrl || '',
              alt: detail.nameZh,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${detail.nameZh}（${detail.nameEn}）`,
      description: description.slice(0, 200),
    },
  };
}

export default async function AchievementDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const detail = await fetchDetail(slug);

  if (!detail) notFound();

  const relatedRaw = detail.category
    ? await apiFetchSafe<Paginated<Achievement>>(
        `/achievements?category=${encodeURIComponent(detail.category.slug)}&pageSize=7`,
        { revalidate: REVALIDATE },
      )
    : null;

  const related = (relatedRaw?.items ?? [])
    .filter((item) => item.slug !== detail.slug)
    .slice(0, 4);

  const meta = availabilityMeta(detail.availability);
  const stars = difficultyStars(detail.difficulty);
  const diff = difficultyInfo(detail.difficulty);
  const tiers = [...detail.tiers].sort((a, b) => a.threshold - b.threshold);
  const hasTiers = detail.hasTiers || detail.isTiered || tiers.length > 0;
  const unverified = detail.uncertain || detail.credibility === 'D';

  return (
    <Container size="lg" className="py-8 sm:py-10">
      {/* 面包屑 */}
      <nav className="mb-5 flex items-center gap-2 text-xs text-[var(--color-ink-subtle)]">
        <Link href="/achievements" className="inline-flex items-center gap-1 hover:text-[var(--color-accent)]">
          <ArrowLeft size={13} />
          勋章图鉴
        </Link>
        {detail.category && (
          <>
            <span>/</span>
            <Link
              href={`/achievements?category=${encodeURIComponent(detail.category.slug)}`}
              className="hover:text-[var(--color-accent)]"
            >
              {detail.category.nameZh}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="truncate text-[var(--color-ink-muted)]">{detail.nameZh}</span>
      </nav>

      {/* Hero */}
      <header className="surface relative overflow-hidden p-5 sm:p-7">
        <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="badge-frame h-28 w-28 shrink-0 sm:h-32 sm:w-32">
            <BadgeImage
              src={detail.imageHdUrl || detail.imageUrl}
              alt={detail.nameZh}
              size={112}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <AvailabilityBadge availability={detail.availability} size="md" />
              <CredibilityBadge grade={detail.credibility} />
              {detail.category && <span className="chip">{detail.category.nameZh}</span>}
              {hasTiers && <span className="chip">等级型</span>}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {detail.nameZh}
            </h1>
            <p className="mt-1 text-base text-[var(--color-ink-muted)]">{detail.nameEn}</p>
            {detail.summaryZh && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
                {detail.summaryZh}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-ink-muted)]">
              <span className="inline-flex items-center gap-1.5" title={`难度 ${detail.difficulty}/5`}>
                <Star size={13} className="text-[var(--color-warning)]" />
                难度
                <span className="inline-flex items-center gap-0.5">
                  {stars.map((on, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: on
                          ? 'var(--color-warning)'
                          : 'var(--color-border-strong)',
                      }}
                    />
                  ))}
                </span>
                <span className="muted">{diff.label}</span>
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Flame size={13} />
                热门度 {formatNumber(detail.popularity)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Eye size={13} />
                浏览 {formatNumber(detail.viewCount)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={13} />
                最后验证 {formatDate(detail.verifiedAt)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 未验证提示 */}
      {unverified && (
        <Notice tone="warning" className="mt-5">
          <span className="flex items-start gap-2">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" />
            <span>
              <strong>本枚勋章的资料尚未验证，仅供参考。</strong>
              {detail.uncertaintyNote ? ` ${detail.uncertaintyNote}` : ''}
              {' '}页面中的条件与门槛请务必回到原始来源交叉核对，不要仅凭本页做决策。
            </span>
          </span>
        </Notice>
      )}

      {/* 主体：左主内容 + 右侧信息栏 */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 主内容 */}
        <div className="min-w-0">
          <DetailContent detail={detail} />
        </div>

        {/* 侧边信息栏 */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          {/* 收藏 */}
          <div className="surface p-4">
            <p className="text-sm font-semibold">收藏这枚勋章</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
              收藏后可在我的收藏馆统一管理解锁计划。
            </p>
            <div className="mt-3">
              <FavoriteButton
                achievementId={detail.id}
                redirectTo={`/achievements/${detail.slug}`}
              />
            </div>
          </div>

          {/* 解锁条件速览 */}
          <div className="surface p-4">
            <p className="text-sm font-semibold">解锁条件速览</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              {detail.conditionZh || '暂无官方说明'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="chip">{meta.labelZh}</span>
              <CredibilityBadge grade={detail.credibility} compact />
            </div>
            <a
              href="#condition"
              className="mt-3 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              查看完整条件 ↓
            </a>
          </div>

          {/* 等级阶梯速览 */}
          <div className="surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Layers size={14} />
              等级阶梯速览
            </p>
            {hasTiers && tiers.length > 0 ? (
              <>
                <ul className="mt-3 space-y-2">
                  {tiers.map((tier) => (
                    <li
                      key={tier.id}
                      className="flex items-center justify-between gap-2 text-[13px]"
                    >
                      <TierBadge level={tier.level} />
                      <span className="tabular-nums text-[var(--color-ink-muted)]">
                        {tier.threshold} 次
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
                  门槛数值为公开资料推算值，非 GitHub 官方公布。
                </p>
                <Link
                  href="/achievements/tiers"
                  className="mt-2 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline"
                >
                  查看全部等级阶梯 →
                </Link>
              </>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                该勋章没有等级阶梯。
              </p>
            )}
          </div>

          {/* 相关分类 */}
          <div className="surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <TrendingUp size={14} />
              相关分类
            </p>
            {detail.category ? (
              <>
                <p className="mt-2 text-sm font-medium">{detail.category.nameZh}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
                  {detail.category.descriptionZh || '暂无分类说明'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/achievements?category=${encodeURIComponent(detail.category.slug)}`}
                    className="btn btn-secondary btn-sm"
                  >
                    同分类勋章
                  </Link>
                  <Link href="/achievements/categories" className="btn btn-ghost btn-sm">
                    全部分类
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
                这枚勋章暂时没有归入任何分类。
              </p>
            )}
          </div>

          {/* 相关勋章 */}
          {related.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-sm font-semibold">同分类的其他勋章</p>
              {related.map((item) => (
                <AchievementCard key={item.id} achievement={item} />
              ))}
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}
