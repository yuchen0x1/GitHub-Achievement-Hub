'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, X } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface AchievementFiltersProps {
  q: string;
  /** available | tiered | limited | discontinued | '' */
  availability: string;
  difficulty: string;
  category: string;
  sort: string;
  /** 已排除「当前可获取」聚合项的可选分类 */
  categories: { slug: string; nameZh: string; achievementCount: number }[];
}

const STATUS_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'available', label: '当前可获取' },
  { key: 'tiered', label: '等级型' },
  { key: 'limited', label: '限定' },
  { key: 'discontinued', label: '已停止' },
  { key: 'unclear', label: '状态不明' },
] as const;

type StatusKey = (typeof STATUS_OPTIONS)[number]['key'];

const SORT_OPTIONS = [
  { value: 'latest', label: '最新收录' },
  { value: 'easiest', label: '最容易' },
  { value: 'hardest', label: '最难' },
  { value: 'name', label: '名称 A → Z' },
  { value: 'popular', label: '最热门' },
];

const ACTIVE_STYLE: CSSProperties = {
  color: 'var(--color-accent)',
  borderColor: 'color-mix(in oklab, var(--color-accent) 45%, transparent)',
  backgroundColor: 'color-mix(in oklab, var(--color-accent) 12%, transparent)',
};

/**
 * 勋章图鉴筛选栏。
 * 所有筛选值都以 URL query 为唯一数据源：
 * 用户操作 → router.push（滚动位置不变）→ 服务端按新 query 重新取数。
 */
export function AchievementFilters({
  q,
  availability,
  difficulty,
  category,
  sort,
  categories,
}: AchievementFiltersProps) {
  const router = useRouter();
  const [input, setInput] = useState(q);
  const [isPending, startTransition] = useTransition();

  // 服务端 query 变化（含浏览器前进/后退）时同步输入框
  useEffect(() => {
    setInput(q);
  }, [q]);

  const pushWith = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (availability) params.set('availability', availability);
      if (difficulty) params.set('difficulty', difficulty);
      if (category) params.set('category', category);
      if (sort && sort !== 'latest') params.set('sort', sort);

      for (const [key, value] of Object.entries(overrides)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      }
      // 任何筛选变化都回到第 1 页
      params.delete('page');

      const search = params.toString();
      startTransition(() => {
        router.push(search ? `/achievements?${search}` : '/achievements', {
          scroll: false,
        });
      });
    },
    [q, availability, difficulty, category, sort, router, startTransition],
  );

  // 输入即搜（防抖 400ms），避免每敲一个字符就发一次请求
  useEffect(() => {
    const next = input.trim();
    if (next === q) return;
    const timer = window.setTimeout(() => {
      pushWith({ q: next || null });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [input, q, pushWith]);

  const unclearActive = category === 'experimental';
  const activeStatus: StatusKey = unclearActive
    ? 'unclear'
    : ((availability || 'all') as StatusKey);

  const selectStatus = (key: StatusKey) => {
    if (key === 'all') {
      pushWith({
        availability: null,
        ...(unclearActive ? { category: null } : {}),
      });
      return;
    }
    if (key === 'unclear') {
      // 后端 availability 过滤器不支持 TESTING，
      // 「测试中 / 状态不明」在数据中归入 experimental 分类。
      pushWith({ availability: null, category: 'experimental' });
      return;
    }
    pushWith({
      availability: key,
      ...(unclearActive ? { category: null } : {}),
    });
  };

  return (
    <section
      className="surface-raised space-y-4 p-4 sm:p-5"
      aria-label="筛选与排序"
    >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const next = input.trim();
          pushWith({ q: next || null });
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
          />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="搜索勋章中文名、英文名或获取条件…"
            aria-label="搜索勋章"
            className="field pl-9 pr-9"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                pushWith({ q: null });
              }}
              aria-label="清空关键词"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-ink-subtle)] transition-colors hover:text-[var(--color-ink)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            <Search size={14} />
            搜索
          </button>
          {isPending && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
              <Loader2 size={13} className="animate-spin" />
              更新中
            </span>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-[var(--color-ink-subtle)]">
          状态
        </span>
        {STATUS_OPTIONS.map((option) => {
          const active = activeStatus === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => selectStatus(option.key)}
              aria-pressed={active}
              title={
                option.key === 'unclear'
                  ? '当前状态无法确认的勋章，数据上归入「测试中或状态不明」分类'
                  : undefined
              }
              className={cn(
                'chip transition-colors',
                active
                  ? 'font-semibold'
                  : 'hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]',
              )}
              style={active ? ACTIVE_STYLE : undefined}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-[var(--color-ink-subtle)]">
            难度
          </span>
          {[1, 2, 3, 4, 5].map((value) => {
            const active = difficulty === String(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  pushWith({ difficulty: active ? null : String(value) })
                }
                aria-pressed={active}
                title={`难度 ${value} / 5`}
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-md border text-xs font-semibold tabular-nums transition-colors',
                  active
                    ? 'border-transparent'
                    : 'border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]',
                )}
                style={active ? ACTIVE_STYLE : undefined}
              >
                {value}
              </button>
            );
          })}
          {difficulty && (
            <button
              type="button"
              onClick={() => pushWith({ difficulty: null })}
              className="ml-1 text-xs text-[var(--color-ink-subtle)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
            >
              清除
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-subtle)]">
            分类
            <select
              value={category}
              onChange={(event) =>
                pushWith({ category: event.target.value || null })
              }
              className="field w-auto min-w-[9rem]"
            >
              <option value="">全部分类</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.nameZh}（{item.achievementCount}）
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-subtle)]">
            排序
            <select
              value={sort || 'latest'}
              onChange={(event) =>
                pushWith({
                  sort:
                    event.target.value === 'latest'
                      ? null
                      : event.target.value,
                })
              }
              className="field w-auto min-w-[8rem]"
            >
              {SORT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
