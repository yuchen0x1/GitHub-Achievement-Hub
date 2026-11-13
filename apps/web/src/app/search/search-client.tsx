'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  HelpCircle,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Achievement, ArticleSummary, FaqItem, Paginated } from '@/lib/types';
import { AchievementCard } from '@/components/achievement/achievement-card';
import { ArticleCard } from '@/components/article/article-card';
import { EmptyState } from '@/components/common/empty-state';
import { Pagination } from '@/components/common/pagination';
import { cn } from '@/lib/utils';

export type SearchType = 'all' | 'achievement' | 'article' | 'faq';

const PAGE_SIZE = 12;
const VALID_TYPES: SearchType[] = ['all', 'achievement', 'article', 'faq'];

function toPage(value: string | null): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** 常见问题接口不支持关键字过滤，这里做一次中英文匹配 */
function matchFaq(items: FaqItem[], q: string): FaqItem[] {
  const needle = q.toLowerCase();
  return items.filter((item) =>
    [item.question, item.questionZh, item.answer, item.answerZh, item.category].some(
      (field) => field?.toLowerCase().includes(needle),
    ),
  );
}

const TYPE_TABS: { key: SearchType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'achievement', label: '勋章' },
  { key: 'article', label: '攻略' },
  { key: 'faq', label: '常见问题' },
];

/** 站内可检索的范围（真实来自后端的查询字段） */
const SEARCH_SCOPES = [
  { label: '勋章', detail: '中文名 / 英文名 / slug / 中文简介 / 英文简介 / 中文条件 / 英文条件' },
  { label: '攻略文章', detail: '中文标题 / 英文标题 / 摘要 / 标签' },
  { label: '常见问题', detail: '中文问题 / 英文问题 / 中文答案 / 英文答案 / 分类' },
];

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const params = useMemo(() => {
    const sp = new URLSearchParams(search);
    const q = (sp.get('q') ?? '').trim();
    const rawType = sp.get('type') ?? '';
    const type: SearchType = VALID_TYPES.includes(rawType as SearchType)
      ? (rawType as SearchType)
      : 'all';
    return {
      q,
      type,
      page: toPage(sp.get('page')),
      articlePage: toPage(sp.get('articlePage')),
    };
  }, [search]);

  const { q, type, page, articlePage } = params;

  const [input, setInput] = useState(q);
  const [achievements, setAchievements] = useState<Paginated<Achievement> | null>(
    null,
  );
  const [articles, setArticles] = useState<Paginated<ArticleSummary> | null>(
    null,
  );
  const [faqAll, setFaqAll] = useState<FaqItem[] | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataErrors, setDataErrors] = useState({
    achievements: false,
    articles: false,
    faq: false,
  });
  const [isPending, startTransition] = useTransition();
  const [navLoading, setNavLoading] = useState(false);

  // URL 中的关键词变化时同步输入框（含浏览器前进/后退）
  useEffect(() => {
    setInput(q);
  }, [q]);

  // 关键词 / 分页变化时客户端取数
  useEffect(() => {
    if (!q) {
      setAchievements(null);
      setArticles(null);
      setFaqAll(null);
      setDataLoading(false);
      setDataErrors({ achievements: false, articles: false, faq: false });
      return;
    }

    let cancelled = false;
    setDataLoading(true);
    setDataErrors({ achievements: false, articles: false, faq: false });

    (async () => {
      const [ach, art, faq] = await Promise.allSettled([
        apiFetch<Paginated<Achievement>>(
          `/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${PAGE_SIZE}`,
        ),
        apiFetch<Paginated<ArticleSummary>>(
          `/articles?q=${encodeURIComponent(q)}&page=${articlePage}&pageSize=${PAGE_SIZE}`,
        ),
        apiFetch<FaqItem[]>('/faq'),
      ]);
      if (cancelled) return;
      setAchievements(ach.status === 'fulfilled' ? ach.value : null);
      setArticles(art.status === 'fulfilled' ? art.value : null);
      setFaqAll(faq.status === 'fulfilled' ? faq.value : null);
      setDataErrors({
        achievements: ach.status === 'rejected',
        articles: art.status === 'rejected',
        faq: faq.status === 'rejected',
      });
      setDataLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [q, page, articlePage]);

  const faq = useMemo(
    () => (faqAll ? matchFaq(faqAll, q) : []),
    [faqAll, q],
  );

  // 导航完成后收起加载态
  useEffect(() => {
    setNavLoading(false);
  }, [q, type, page, articlePage]);

  const loading = isPending || navLoading || dataLoading;

  const achTotal = achievements?.total ?? 0;
  const artTotal = articles?.total ?? 0;
  const faqTotal = faq.length;

  const showAchievements = type === 'all' || type === 'achievement';
  const showArticles = type === 'all' || type === 'article';
  const showFaq = type === 'all' || type === 'faq';
  const hasVisibleErrors =
    (showAchievements && dataErrors.achievements) ||
    (showArticles && dataErrors.articles) ||
    (showFaq && dataErrors.faq);

  /** 只统计当前分区可见的结果数 */
  const total =
    (showAchievements ? achTotal : 0) +
    (showArticles ? artTotal : 0) +
    (showFaq ? faqTotal : 0);

  const submit = useCallback(
    (keyword: string) => {
      const value = keyword.trim();
      if (!value) {
        router.push('/search');
        return;
      }
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(value)}`);
      });
    },
    [router],
  );

  const buildAchHref = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set('q', q);
      if (type !== 'all') params.set('type', type);
      params.set('page', String(p));
      return `/search?${params.toString()}`;
    },
    [q, type],
  );

  const buildArtHref = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set('q', q);
      if (type !== 'all') params.set('type', type);
      params.set('articlePage', String(p));
      return `/search?${params.toString()}`;
    },
    [q, type],
  );

  const tabHref = useCallback(
    (key: SearchType) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (key !== 'all') params.set('type', key);
      const qs = params.toString();
      return qs ? `/search?${qs}` : '/search';
    },
    [q],
  );

  /** 分页链接由共享组件渲染，这里用事件代理在跳转期间显示加载态 */
  const onNavClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    const target = new URL(href, window.location.origin);
    const current = `${window.location.pathname}${window.location.search}`;
    if (`${target.pathname}${target.search}` !== current) setNavLoading(true);
  }, []);

  const scopes = SEARCH_SCOPES;

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex flex-col gap-2.5 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
          />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="搜索勋章名、条件、攻略标题…"
            aria-label="搜索勋章名、条件、攻略标题"
            className="field pl-9 pr-9"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                submit('');
              }}
              aria-label="清空搜索"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-ink-subtle)] transition-colors hover:text-[var(--color-ink)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          搜索
        </button>
      </form>

      {/* 检索范围说明 */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          可检索范围
        </p>
        <ul className="mt-2.5 grid gap-2 sm:grid-cols-3">
          {scopes.map((scope) => (
            <li key={scope.label}>
              <p className="text-[13px] font-medium">{scope.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
                {scope.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* 类型切换 */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="tablist"
        aria-label="结果分区"
      >
        {TYPE_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tabHref(tab.key)}
            role="tab"
            aria-selected={type === tab.key}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors',
              type === tab.key
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]',
            )}
          >
            {tab.label}
          </Link>
        ))}

        {q && (
          <p className="ml-auto text-xs text-[var(--color-ink-muted)]">
            关键词「<span className="font-semibold text-[var(--color-ink)]">{q}</span>」
            {loading ? ' · 加载中…' : ` · 共 ${total} 条结果`}
          </p>
        )}
      </div>

      {/* 加载遮罩 */}
      {loading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--color-accent)]" />
        </div>
      )}

      {hasVisibleErrors && (
        <p className="rounded-xl border border-[var(--color-danger)] bg-[var(--color-surface-raised)] px-4 py-3 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          部分搜索分区暂时不可用；其余结果仍会正常显示。请确认 API 服务（
          <code className="font-mono text-xs">localhost:4000</code>
          ）已启动，或稍后重试。
        </p>
      )}

      {/* 未输入关键词 */}
      {!q && (
        <EmptyState
          title="输入关键词开始搜索"
          description="可以搜勋章的中英文名称、获取条件、slug，也可以搜攻略文章标题、摘要与常见问题。"
        />
      )}

      {/* 搜索结果 */}
      {q && !hasVisibleErrors && type === 'all' && total === 0 && !loading && (
        <EmptyState
          title={`没有找到与「${q}」匹配的内容`}
          description="换个关键词试试，或者浏览全部分类。站内不会展示未经核实的内容，因此收录范围有限。"
          action={{ label: '清空搜索', href: '/search' }}
        />
      )}

      {q && !dataErrors.achievements && showAchievements && (
        <section aria-labelledby="search-achievements">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2
              id="search-achievements"
              className="flex items-center gap-2 text-lg font-bold tracking-tight"
            >
              <Sparkles size={16} className="text-[var(--color-accent)]" />
              勋章结果
              <span className="text-sm font-normal text-[var(--color-ink-muted)]">
                （{achTotal}）
              </span>
            </h2>
          </div>

          {achTotal === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border-strong)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
              没有匹配的勋章。
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {(achievements?.items ?? []).map((item) => (
                  <AchievementCard key={item.id} achievement={item} />
                ))}
              </div>
              <div className="mt-6" onClick={onNavClick}>
                <Pagination
                  page={page}
                  totalPages={achievements?.totalPages ?? 1}
                  buildHref={buildAchHref}
                />
              </div>
            </>
          )}
        </section>
      )}

      {q && !dataErrors.articles && showArticles && (
        <section aria-labelledby="search-articles" className="pt-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2
              id="search-articles"
              className="flex items-center gap-2 text-lg font-bold tracking-tight"
            >
              <BookOpen size={16} className="text-[var(--color-accent)]" />
              攻略文章结果
              <span className="text-sm font-normal text-[var(--color-ink-muted)]">
                （{artTotal}）
              </span>
            </h2>
            <Link
              href="/guides"
              className="text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              浏览全部攻略 →
            </Link>
          </div>

          {artTotal === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border-strong)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
              没有匹配的攻略文章。
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(articles?.items ?? []).map((item) => (
                  <ArticleCard key={item.id} article={item} />
                ))}
              </div>
              <div className="mt-6" onClick={onNavClick}>
                <Pagination
                  page={articlePage}
                  totalPages={articles?.totalPages ?? 1}
                  buildHref={buildArtHref}
                />
              </div>
            </>
          )}
        </section>
      )}

      {q && !dataErrors.faq && showFaq && (
        <section aria-labelledby="search-faq" className="pt-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2
              id="search-faq"
              className="flex items-center gap-2 text-lg font-bold tracking-tight"
            >
              <HelpCircle size={16} className="text-[var(--color-accent)]" />
              常见问题结果
              <span className="text-sm font-normal text-[var(--color-ink-muted)]">
                （{faqTotal}）
              </span>
            </h2>
            <Link
              href="/faq"
              className="text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              浏览全部常见问题 →
            </Link>
          </div>

          {faqTotal === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border-strong)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
              没有匹配的常见问题。
            </p>
          ) : (
            <ul className="space-y-2.5">
              {faq.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <p className="text-sm font-semibold">{item.questionZh}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-subtle)]">
                    {item.question}
                  </p>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                    {item.answerZh}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
