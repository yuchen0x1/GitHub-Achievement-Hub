'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, Layers, Loader2 } from 'lucide-react';
import { apiFetch, apiFetchSafe } from '@/lib/api';
import type { Achievement, Category, Paginated } from '@/lib/types';
import { AchievementCard } from '@/components/achievement/achievement-card';
import { EmptyState } from '@/components/common/empty-state';
import { Container, Notice, PageHeader } from '@/components/common/layout';
import { AchievementFilters } from './filters-client';
import { PaginationBar } from './pagination-client';

const PAGE_SIZE = 12;

const AVAILABILITY_VALUES = new Set([
  'available',
  'tiered',
  'limited',
  'discontinued',
]);

const SORT_VALUES = new Set(['latest', 'easiest', 'hardest', 'name', 'popular']);

interface ParsedQuery {
  q: string;
  availability: string;
  difficulty: string;
  category: string;
  sort: string;
  page: number;
  apiQuery: string;
  activeQuery: Record<string, string>;
  hasFilters: boolean;
}

function toPage(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseQuery(search: string): ParsedQuery {
  const sp = new URLSearchParams(search);

  const q = (sp.get('q') ?? '').trim().slice(0, 80);
  const rawAvailability = sp.get('availability') ?? '';
  const availability = AVAILABILITY_VALUES.has(rawAvailability)
    ? rawAvailability
    : '';
  const rawDifficulty = Number.parseInt(sp.get('difficulty') ?? '', 10);
  const difficulty =
    Number.isInteger(rawDifficulty) && rawDifficulty >= 1 && rawDifficulty <= 5
      ? String(rawDifficulty)
      : '';
  const rawCategory = sp.get('category') ?? '';
  const category = /^[a-z0-9-]+$/.test(rawCategory) ? rawCategory : '';
  const rawSort = sp.get('sort') ?? '';
  const sort = SORT_VALUES.has(rawSort) ? rawSort : 'latest';
  const page = toPage(sp.get('page') ?? '');

  const apiQuery = new URLSearchParams();
  if (q) apiQuery.set('q', q);
  if (availability) apiQuery.set('availability', availability);
  if (difficulty) apiQuery.set('difficulty', difficulty);
  if (category) apiQuery.set('category', category);
  if (sort !== 'latest') apiQuery.set('sort', sort);
  apiQuery.set('page', String(page));
  apiQuery.set('pageSize', String(PAGE_SIZE));

  const activeQuery: Record<string, string> = {};
  if (q) activeQuery.q = q;
  if (availability) activeQuery.availability = availability;
  if (difficulty) activeQuery.difficulty = difficulty;
  if (category) activeQuery.category = category;
  if (sort !== 'latest') activeQuery.sort = sort;

  const hasFilters = Boolean(
    q || availability || difficulty || category || sort !== 'latest',
  );

  return {
    q,
    availability,
    difficulty,
    category,
    sort,
    page,
    apiQuery: apiQuery.toString(),
    activeQuery,
    hasFilters,
  };
}

type Status = 'loading' | 'ready' | 'error';

export function AchievementsClient() {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const parsed = useMemo(() => parseQuery(search), [search]);

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [result, setResult] = useState<Paginated<Achievement> | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  // 分类选项只依赖后端，加载一次即可
  useEffect(() => {
    let cancelled = false;
    apiFetchSafe<Category[]>('/achievements/categories').then((data) => {
      if (!cancelled) setCategories(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 列表随 URL query 变化重新取数
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const data = await apiFetch<Paginated<Achievement>>(
          `/achievements?${parsed.apiQuery}`,
        );
        if (cancelled) return;
        setResult(data);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setResult(null);
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parsed.apiQuery]);

  const selectableCategories = (categories ?? [])
    .filter((item) => item.slug !== 'currently-obtainable')
    .map((item) => ({
      slug: item.slug,
      nameZh: item.nameZh,
      achievementCount: item.achievementCount,
    }));

  const { q, availability, difficulty, category, sort, page, activeQuery } =
    parsed;

  return (
    <Container size="lg" className="animate-fade-up space-y-6 py-8 sm:py-10">
      <PageHeader
        eyebrow="ACHIEVEMENT ENCYCLOPEDIA"
        title="勋章图鉴"
        description="收录 GitHub 个人资料成就勋章：当前状态、获取条件、等级门槛与社区来源。每条资料都标注来源与可信度，官方未公布的内容会明确说明，不把推测写成规定。"
      />

      <AchievementFilters
        q={q}
        availability={availability}
        difficulty={difficulty}
        category={category}
        sort={sort}
        categories={selectableCategories}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-ink-muted)]">
          {result ? (
            <>
              当前命中{' '}
              <strong className="tabular-nums text-[var(--color-ink)]">
                {result.total}
              </strong>{' '}
              枚
            </>
          ) : status === 'loading' ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" />
              正在加载勋章…
            </span>
          ) : (
            '命中数量暂不可用'
          )}
          {parsed.hasFilters && (
            <span className="ml-2 text-xs text-[var(--color-ink-subtle)]">
              已应用筛选
            </span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <Link href="/achievements/categories" className="btn btn-ghost btn-sm">
            <LayoutGrid size={14} />
            按分类浏览
          </Link>
          <Link href="/achievements/tiers" className="btn btn-ghost btn-sm">
            <Layers size={14} />
            等级总览
          </Link>
        </div>
      </div>

      {status === 'error' && (
        <Notice tone="danger">
          勋章数据暂时无法加载。请确认 API 服务（
          <code className="font-mono text-xs">localhost:4000</code>
          ）已启动，或稍后重试。页面不会用占位数字代替真实统计。
        </Notice>
      )}

      {status !== 'error' && !result && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="surface h-40 animate-pulse bg-[var(--color-surface-sunken)]"
            />
          ))}
        </div>
      )}

      {result && result.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((item) => (
            <AchievementCard
              key={item.id}
              achievement={item}
              state={
                item.uncertain
                  ? 'to-be-verified'
                  : item.availability === 'LIMITED'
                    ? 'limited'
                    : 'normal'
              }
            />
          ))}
        </div>
      )}

      {result && result.items.length === 0 && result.total === 0 && (
        <EmptyState
          title="没有符合条件的勋章"
          description={
            q
              ? `关键词「${q}」没有匹配结果。可以换个说法，或清除状态、难度、分类等筛选条件后重试。`
              : '当前筛选组合下没有勋章。清除筛选后可浏览全部收录内容。'
          }
          action={{ label: '清空筛选', href: '/achievements' }}
        />
      )}

      {result && result.items.length === 0 && result.total > 0 && (
        <Notice tone="warning">
          第 {page} 页没有内容（该筛选下共 {result.total} 枚）。
          <Link
            href={buildFirstPageHref(activeQuery)}
            className="ml-1 font-semibold underline underline-offset-2"
          >
            回到第 1 页
          </Link>
        </Notice>
      )}

      {result && result.totalPages > 1 && (
        <PaginationBar
          page={page}
          totalPages={result.totalPages}
          query={activeQuery}
        />
      )}
    </Container>
  );
}

/** 越界页码时回到第一页，同时保留筛选条件 */
function buildFirstPageHref(query: Record<string, string>): string {
  const params = new URLSearchParams(query);
  const search = params.toString();
  return search ? `/achievements?${search}` : '/achievements';
}
