'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiFetch, apiFetchSafe } from '@/lib/api';
import type { ArticleSummary, Paginated } from '@/lib/types';
import {
  ARTICLE_CATEGORY_META,
  ARTICLE_CATEGORY_ORDER,
  articleCategoryMeta,
} from '@/lib/article-meta';
import { ArticleCard } from '@/components/article/article-card';
import { EmptyState } from '@/components/common/empty-state';
import { Container, Notice, PageHeader } from '@/components/common/layout';
import { SectionHeading } from '@/components/common/section-heading';
import { formatDate } from '@/lib/utils';
import { GuidesPagination } from './pagination-client';

const PAGE_SIZE = 12;

const CATEGORY_VALUES = new Set(ARTICLE_CATEGORY_ORDER);

interface ArticleCategoryStat {
  category: string;
  count: number;
}

interface ParsedQuery {
  category: string;
  page: number;
  listQuery: string;
}

function toPage(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseQuery(search: string): ParsedQuery {
  const sp = new URLSearchParams(search);
  const rawCategory = sp.get('category') ?? '';
  const category = CATEGORY_VALUES.has(rawCategory) ? rawCategory : '';
  const page = toPage(sp.get('page') ?? '');

  const listQuery = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  if (category) listQuery.set('category', category);

  return { category, page, listQuery: listQuery.toString() };
}

/** 分类筛选链接：切换分类时回到第 1 页 */
function guidesHref(category?: string, page?: number): string {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (page && page > 1) params.set('page', String(page));
  const search = params.toString();
  return search ? `/guides?${search}` : '/guides';
}

type ListStatus = 'loading' | 'ready' | 'error';

export function GuidesClient() {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const parsed = useMemo(() => parseQuery(search), [search]);
  const { category, page } = parsed;

  const [paged, setPaged] = useState<Paginated<ArticleSummary> | null>(null);
  const [allResult, setAllResult] = useState<Paginated<ArticleSummary> | null>(
    null,
  );
  const [categoryStats, setCategoryStats] = useState<
    ArticleCategoryStat[] | null
  >(null);
  const [listStatus, setListStatus] = useState<ListStatus>('loading');

  // 全量文章 + 分类统计只依赖数据本身，加载一次
  useEffect(() => {
    let cancelled = false;
    apiFetchSafe<Paginated<ArticleSummary>>('/articles?pageSize=50').then(
      (data) => {
        if (!cancelled) setAllResult(data);
      },
    );
    apiFetchSafe<ArticleCategoryStat[]>('/articles/categories').then((data) => {
      if (!cancelled) setCategoryStats(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 列表随分类 / 页码重新取数
  useEffect(() => {
    let cancelled = false;
    setListStatus('loading');
    (async () => {
      try {
        const data = await apiFetch<Paginated<ArticleSummary>>(
          `/articles?${parsed.listQuery}`,
        );
        if (cancelled) return;
        setPaged(data);
        setListStatus('ready');
      } catch {
        if (cancelled) return;
        setPaged(null);
        setListStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parsed.listQuery]);

  const allArticles = allResult?.items ?? [];
  const countByCategory = new Map(
    (categoryStats ?? []).map((item) => [item.category, item.count]),
  );

  const featured =
    !category && page === 1
      ? (allArticles.find((item) => item.featured) ?? null)
      : null;

  const visibleArticles = (paged?.items ?? []).filter(
    (item) => item.slug !== featured?.slug,
  );

  const pathSteps = ARTICLE_CATEGORY_ORDER.map((key) => {
    const meta = articleCategoryMeta(key);
    const article = allArticles.find((item) => item.category === key) ?? null;
    return { key, meta, article };
  }).filter((step) => step.article !== null);

  const totalReadingTime = allArticles.reduce(
    (sum, item) => sum + item.readingTime,
    0,
  );

  const activeMeta = category ? articleCategoryMeta(category) : null;
  const hasAnyData = Boolean(paged || allResult);
  const initialLoading = listStatus === 'loading' && !paged;

  return (
    <Container size="lg" className="animate-fade-up space-y-8 py-8 sm:py-10">
      <PageHeader
        eyebrow="KNOWLEDGE BASE"
        title="获取攻略"
        description={
          allArticles.length > 0
            ? `按 ${allArticles.length} 个主题整理的系统知识库：从注册账号、第一次提交，到 PR、Actions、开源贡献，再到勋章等级规划与异常排查。每一篇都给出可执行步骤与官方来源，不承诺"快速刷取"，只描述真实、可持续的做法。`
            : '按主题整理的系统知识库：从注册账号、第一次提交，到 PR、Actions、开源贡献，再到勋章等级规划与异常排查。每一篇都给出可执行步骤与官方来源。'
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <Link href="/faq" className="btn btn-ghost btn-sm">
            <Compass size={14} />
            常见问题
          </Link>
          <Link href="/achievements" className="btn btn-ghost btn-sm">
            <Sparkles size={14} />
            勋章图鉴
          </Link>
          {allArticles.length > 0 && (
            <span className="ml-1 inline-flex items-center gap-1.5 text-[var(--color-ink-subtle)]">
              <BookOpen size={13} />
              共 {allArticles.length} 篇主题
              <span aria-hidden>·</span>
              <Clock size={13} />
              全部读完约 {totalReadingTime} 分钟
            </span>
          )}
        </div>
      </PageHeader>

      {listStatus === 'error' && !allResult && (
        <Notice tone="danger">
          攻略数据暂时无法加载。请确认 API 服务（
          <code className="font-mono text-xs">localhost:4000</code>
          ）已启动，或稍后重试。页面不会用占位内容代替真实知识库。
        </Notice>
      )}

      {initialLoading && (
        <div className="space-y-4" aria-busy="true">
          <div className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
            <Loader2 size={14} className="animate-spin" />
            正在加载攻略…
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="surface h-40 animate-pulse bg-[var(--color-surface-sunken)]"
              />
            ))}
          </div>
        </div>
      )}

      {hasAnyData && (
        <>
          {/* 分类筛选 */}
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="按主题筛选"
          >
            <Link
              href={guidesHref()}
              aria-current={category ? undefined : 'page'}
              className="chip"
              style={
                category
                  ? undefined
                  : {
                      color: 'var(--color-accent)',
                      borderColor:
                        'color-mix(in oklab, var(--color-accent) 45%, transparent)',
                      backgroundColor:
                        'color-mix(in oklab, var(--color-accent) 14%, transparent)',
                    }
              }
            >
              全部主题
              {allArticles.length > 0 && (
                <span className="tabular-nums opacity-70">
                  {allArticles.length}
                </span>
              )}
            </Link>

            {ARTICLE_CATEGORY_ORDER.map((key) => {
              const meta = ARTICLE_CATEGORY_META[key];
              const active = category === key;
              const count = countByCategory.get(key);
              return (
                <Link
                  key={key}
                  href={guidesHref(key)}
                  aria-current={active ? 'page' : undefined}
                  className="chip transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]"
                  style={
                    active
                      ? {
                          color: meta.color,
                          borderColor: `color-mix(in oklab, ${meta.color} 50%, transparent)`,
                          backgroundColor: `color-mix(in oklab, ${meta.color} 16%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden
                  />
                  {meta.label}
                  {count !== undefined && (
                    <span className="tabular-nums opacity-70">{count}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* 特写攻略 */}
          {featured && (
            <Link
              href={`/guides/${featured.slug}`}
              className="surface group relative block overflow-hidden p-5 transition-colors hover:border-[var(--color-border-strong)] sm:p-7"
            >
              <div
                className="grid-texture pointer-events-none absolute inset-0"
                aria-hidden
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip border-[var(--color-warning)]/40 text-[var(--color-warning)]">
                    <Sparkles size={12} />
                    编辑部推荐
                  </span>
                  <span
                    className="chip"
                    style={{
                      color: articleCategoryMeta(featured.category).color,
                      borderColor: `color-mix(in oklab, ${articleCategoryMeta(featured.category).color} 40%, transparent)`,
                      backgroundColor: `color-mix(in oklab, ${articleCategoryMeta(featured.category).color} 12%, transparent)`,
                    }}
                  >
                    {articleCategoryMeta(featured.category).label}
                  </span>
                </div>

                <h2 className="mt-3 max-w-3xl text-xl font-bold leading-snug tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)] sm:text-2xl">
                  {featured.titleZh}
                </h2>
                <p className="mt-1 truncate text-sm text-[var(--color-ink-subtle)]">
                  {featured.title}
                </p>
                {featured.excerpt && (
                  <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
                    {featured.excerpt}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-ink-subtle)]">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />约 {featured.readingTime} 分钟
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={12} />
                    {featured.authorName}
                  </span>
                  <span>更新于 {formatDate(featured.updatedAt)}</span>
                  <span className="ml-auto inline-flex items-center gap-1 font-semibold text-[var(--color-accent)]">
                    开始阅读
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* 列表 + 学习路径 */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0 space-y-5">
              <SectionHeading
                title={activeMeta ? activeMeta.label : '全部攻略'}
                description={
                  activeMeta
                    ? activeMeta.description
                    : '按主题排序浏览全部知识库文章；也可以从右侧学习路径按推荐顺序阅读。'
                }
                eyebrow={activeMeta ? activeMeta.labelEn.toUpperCase() : 'ALL TOPICS'}
              />

              {visibleArticles.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}

              {visibleArticles.length === 0 &&
                (!paged || paged.items.length === 0) && (
                  <EmptyState
                    title={
                      activeMeta
                        ? '这个主题下的攻略还在整理'
                        : '暂时没有可展示的攻略'
                    }
                    description={
                      activeMeta
                        ? '该分类当前没有已发布的文章，你可以先切换到其他主题，或回到全部主题浏览。'
                        : '知识库内容暂时不可用，请稍后重试。'
                    }
                    action={{ label: '查看全部主题', href: '/guides' }}
                  />
                )}

              {paged && paged.totalPages > 1 && (
                <GuidesPagination
                  page={page}
                  totalPages={paged.totalPages}
                  category={category || undefined}
                />
              )}

              {paged && paged.items.length === 0 && paged.total > 0 && (
                <Notice tone="warning">
                  第 {page} 页没有内容（当前筛选共 {paged.total} 篇）。
                  <Link
                    href={guidesHref(category || undefined)}
                    className="ml-1 font-semibold underline underline-offset-2"
                  >
                    回到第 1 页
                  </Link>
                </Notice>
              )}
            </section>

            {/* 学习路径 */}
            <aside className="h-fit lg:sticky lg:top-24">
              <div className="surface p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  LEARNING PATH
                </p>
                <h2 className="mt-1.5 text-lg font-bold tracking-tight">
                  学习路径
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                  按主题依赖关系排列，建议从上到下顺序阅读：先建立基础，再进入协作流程，最后做成就规划与排查。
                </p>

                {pathSteps.length > 0 ? (
                  <ol className="mt-4">
                    {pathSteps.map((step, index) => {
                      const isLast = index === pathSteps.length - 1;
                      const article = step.article;
                      const label = step.meta.label;

                      const content = (
                        <>
                          <span className="block text-[13px] font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                            {label}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--color-ink-subtle)]">
                            {article ? article.titleZh : '内容整理中'}
                          </span>
                        </>
                      );

                      return (
                        <li key={step.key} className="relative pl-9">
                          {!isLast && (
                            <span
                              className="absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-px bg-[var(--color-border)]"
                              aria-hidden
                            />
                          )}
                          <span
                            className="absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-full border text-[11px] font-semibold tabular-nums"
                            style={{
                              color: step.meta.color,
                              borderColor: `color-mix(in oklab, ${step.meta.color} 45%, transparent)`,
                              backgroundColor: `color-mix(in oklab, ${step.meta.color} 12%, transparent)`,
                            }}
                            aria-hidden
                          >
                            {index + 1}
                          </span>
                          {article ? (
                            <Link
                              href={`/guides/${article.slug}`}
                              className="group block pb-4"
                            >
                              {content}
                            </Link>
                          ) : (
                            <div className="pb-4">{content}</div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
                    学习路径暂时不可用，请稍后刷新。
                  </p>
                )}

                <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                  <Link
                    href="/faq"
                    className="text-xs font-medium text-[var(--color-accent)] hover:underline"
                  >
                    读之前先看常见问题 →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </Container>
  );
}
