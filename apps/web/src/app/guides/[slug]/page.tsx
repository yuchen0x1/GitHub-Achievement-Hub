import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Clock,
  Eye,
  ListTree,
  ShieldAlert,
  Tag,
  User,
} from 'lucide-react';
import { apiFetch, apiFetchSafe, ApiRequestError } from '@/lib/api';
import type { ArticleDetail, ArticleSummary, Paginated } from '@/lib/types';
import { articleCategoryMeta } from '@/lib/article-meta';
import { formatDate, formatNumber } from '@/lib/utils';
import { ArticleCard } from '@/components/article/article-card';
import { Container, Notice } from '@/components/common/layout';
import { Toc } from '@/components/markdown/toc';
import { ArticleBody } from './article-body-client';
import { IS_EXPORT } from '@/lib/export-mode';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const REVALIDATE = 300;

/**
 * 不显式声明 `dynamicParams`（默认 true）：
 * - SSR 模式保持现有行为，未知 slug 仍可按需渲染；
 * - 导出模式只产出 generateStaticParams 枚举到的页面，未知 slug 自然 404。
 */

/**
 * 构建期枚举全部攻略 slug。
 * SSR 模式下 API 暂时不可达时返回空数组；静态导出则必须拿到真实内容，
 * 否则继续构建会生成空的动态路由集合并掩盖数据源故障。
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const result = await (IS_EXPORT || process.env.NEXT_OUTPUT === 'export'
      ? apiFetch<Paginated<ArticleSummary>>(
          '/articles?pageSize=100',
          { revalidate: REVALIDATE },
        )
      : apiFetchSafe<Paginated<ArticleSummary>>(
      '/articles?pageSize=100',
      { revalidate: REVALIDATE },
        ));
    if (!result && (IS_EXPORT || process.env.NEXT_OUTPUT === 'export')) {
      throw new Error('静态导出 API 未返回攻略数据。');
    }
    return (result?.items ?? [])
      .map((item) => item?.slug)
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => ({ slug }));
  } catch (error) {
    if (IS_EXPORT || process.env.NEXT_OUTPUT === 'export') {
      throw new Error(
        '静态导出需要可达的内容 API（/articles）。请先启动 API，或设置 API_BUILD_URL/API_INTERNAL_URL 指向已初始化的实例。',
        { cause: error },
      );
    }
    return [];
  }
}

/** 只有 404 才算「攻略不存在」；服务故障要继续抛出，不能伪装成 404 */
async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  try {
    return await apiFetch<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`, {
      revalidate: REVALIDATE,
    });
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

/** 从 Markdown 中提取纯文本，用于 meta description */
function plainText(md: string, max = 160): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await apiFetchSafe<ArticleDetail>(
    `/articles/${encodeURIComponent(slug)}`,
    { revalidate: REVALIDATE },
  );

  if (!article) {
    return {
      title: '未找到这篇攻略',
      description: '站内没有收录这个 slug 对应的攻略。',
      robots: { index: false, follow: true },
    };
  }

  const description = (
    article.excerpt?.trim() || plainText(article.contentMd) || article.title
  ).slice(0, 200);
  const categoryLabel = articleCategoryMeta(article.category).label;

  return {
    title: `${article.titleZh} — ${categoryLabel}攻略`,
    description,
    alternates: { canonical: `/guides/${article.slug}` },
    openGraph: {
      type: 'article',
      title: `${article.titleZh}（${article.title}）`,
      description,
      url: `/guides/${article.slug}`,
      siteName: 'GitHub Achievement Hub',
      locale: 'zh_CN',
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      tags: article.tags.length > 0 ? article.tags : undefined,
      images: article.coverImage
        ? [{ url: article.coverImage, alt: article.titleZh }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.titleZh}（${article.title}）`,
      description,
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) notFound();

  const meta = articleCategoryMeta(article.category);
  const related = article.related ?? [];
  const toc = article.toc ?? [];

  const categoryChipStyle = {
    color: meta.color,
    borderColor: `color-mix(in oklab, ${meta.color} 42%, transparent)`,
    backgroundColor: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
  };

  return (
    <Container size="lg" className="py-8 sm:py-10">
      {/* 面包屑 */}
      <nav
        className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]"
        aria-label="面包屑"
      >
        <Link href="/" className="transition-colors hover:text-[var(--color-accent)]">
          首页
        </Link>
        <ChevronRight size={12} aria-hidden />
        <Link
          href="/guides"
          className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-accent)]"
        >
          <ArrowLeft size={12} />
          获取攻略
        </Link>
        <ChevronRight size={12} aria-hidden />
        <span className="max-w-[46ch] truncate text-[var(--color-ink-muted)]">
          {article.titleZh}
        </span>
      </nav>

      {/* 标题区 */}
      <header className="surface relative overflow-hidden p-5 sm:p-7">
        <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/guides?category=${encodeURIComponent(article.category)}`}>
              <span className="chip" style={categoryChipStyle}>
                {meta.label}
              </span>
            </Link>
            {article.featured && (
              <span className="chip border-[var(--color-warning)]/40 text-[var(--color-warning)]">
                编辑部推荐
              </span>
            )}
          </div>

          <h1 className="mt-3 max-w-4xl text-2xl font-bold leading-tight tracking-tight sm:text-[2rem]">
            {article.titleZh}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)] sm:text-base">
            {article.title}
          </p>
          {article.excerpt && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
              {article.excerpt}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <User size={13} />
              {article.authorName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} />约 {article.readingTime} 分钟
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={13} />
              更新于 {formatDate(article.updatedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={13} />
              浏览 {formatNumber(article.views)}
            </span>
          </div>
        </div>
      </header>

      {/* 三栏：TOC / 正文 / 元信息 */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[200px_minmax(0,1fr)_300px] xl:gap-7">
        {/* 左侧目录（xl 及以上常驻） */}
        <aside className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-1">
            <Toc items={toc} />
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <Link
                href="/guides"
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                ← 返回攻略列表
              </Link>
            </div>
          </div>
        </aside>

        {/* 正文 */}
        <article className="min-w-0">
          {/* 窄屏目录 */}
          {toc.length > 0 && (
            <details className="surface mb-5 p-4 xl:hidden">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <ListTree size={15} />
                本文目录
                <span className="ml-auto text-xs font-normal text-[var(--color-ink-subtle)]">
                  {toc.length} 节
                </span>
              </summary>
              <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                <Toc items={toc} />
              </div>
            </details>
          )}

          <ArticleBody content={article.contentMd} />

          <div className="mt-10 border-t border-[var(--color-border)] pt-4">
            <Notice tone="info">
              本文内容按原始 Markdown 原样呈现，未做改写。若发现条件、截图或链接已过时，欢迎通过
              <Link href="/faq#feedback" className="mx-1 font-semibold underline underline-offset-2">
                反馈入口
              </Link>
              告诉我们，编辑会核对官方来源后更新。
            </Notice>
          </div>
        </article>

        {/* 右侧元信息 */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="surface p-4">
            <p className="text-sm font-semibold">文章信息</p>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-[var(--color-ink-subtle)]">作者</dt>
                <dd className="text-right font-medium">{article.authorName}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-[var(--color-ink-subtle)]">分类</dt>
                <dd className="text-right">
                  <span className="chip" style={categoryChipStyle}>
                    {meta.label}
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-[var(--color-ink-subtle)]">阅读时长</dt>
                <dd className="tabular-nums">约 {article.readingTime} 分钟</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-[var(--color-ink-subtle)]">更新时间</dt>
                <dd className="tabular-nums">{formatDate(article.updatedAt)}</dd>
              </div>
              {article.publishedAt && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[var(--color-ink-subtle)]">发布时间</dt>
                  <dd className="tabular-nums">{formatDate(article.publishedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {article.tags.length > 0 && (
            <div className="surface p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Tag size={14} />
                标签
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                    <span className="chip transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-sm font-semibold">相关攻略</p>
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} compact />
              ))}
            </div>
          )}

          <div className="surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <ShieldAlert size={14} />
              阅读提示
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
              成就规则由 GitHub 单方面维护，可能随时调整。文中涉及的等级门槛若官方未公布，均按社区实测标注可信度，请以 GitHub
              官方文档与你自己账号的实际表现为准。
            </p>
            <Link
              href="/about"
              className="mt-2.5 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              了解本站可信度分级 →
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}
