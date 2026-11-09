'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Layers,
  ListChecks,
  Loader2,
  LogIn,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { TIER_META } from '@gach/shared';
import { apiFetch, apiFetchSafe, ApiRequestError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Achievement, Paginated, ProgressRecord } from '@/lib/types';
import { BadgeImage } from '@/components/achievement/badge-image';
import { TierBadge } from '@/components/achievement/tier-badge';
import { TierProgressBar } from '@/components/achievement/tier-progress';
import { EmptyState } from '@/components/common/empty-state';
import { Notice } from '@/components/common/layout';
import { cn, formatNumber, formatRelative } from '@/lib/utils';

interface ProgressSummary {
  tracked: number;
  maxed: number;
  overallPercent: number;
}

/* ------------------------------------------------------------------ */
/* CSRF                                                                */
/* ------------------------------------------------------------------ */

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('gach_csrf='));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice('gach_csrf='.length));
  } catch {
    return null;
  }
}

async function ensureCsrf(): Promise<string | null> {
  const existing = readCsrfCookie();
  if (existing) return existing;
  try {
    const res = await apiFetch<{ csrfToken?: string }>('/auth/csrf', {
      credentials: 'include',
    });
    return res?.csrfToken ?? readCsrfCookie();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* 主体                                                                */
/* ------------------------------------------------------------------ */

export function ProgressClient() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [needLogin, setNeedLogin] = useState(false);
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setPhase('loading');
      setErrorMessage('');
      setNeedLogin(false);
      try {
        const [list, sum] = await Promise.all([
          apiFetch<ProgressRecord[]>('/progress', {
            token: accessToken,
            credentials: 'include',
          }),
          apiFetchSafe<ProgressSummary>('/progress/summary', {
            token: accessToken,
            credentials: 'include',
          }),
        ]);
        const safeList = Array.isArray(list) ? list : [];
        setRecords(safeList);
        setSummary(
          sum ?? {
            tracked: safeList.length,
            maxed: safeList.filter((item) => item.computed.nextLevel === null).length,
            overallPercent: 0,
          },
        );
        setPhase('ready');
      } catch (err) {
        setErrorMessage(
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : '加载失败',
        );
        setNeedLogin(err instanceof ApiRequestError && err.status === 401);
        setPhase('error');
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      setPhase('loading');
      return;
    }
    void load();
  }, [hydrated, user, load]);

  const saveCount = useCallback(
    async (record: ProgressRecord, currentCount: number) => {
      await apiFetch(`/progress/${record.achievementId}`, {
        method: 'POST',
        token: accessToken,
        credentials: 'include',
        csrfToken: await ensureCsrf(),
        body: {
          currentCount,
          targetCount: record.targetCount ?? undefined,
          targetTier: record.targetTier ?? undefined,
          note: record.note ?? undefined,
        },
      });
      await load({ silent: true });
      setMessage(`已更新「${record.nameZh}」的当前数量`);
    },
    [accessToken, load],
  );

  const deleteRecord = useCallback(
    async (record: ProgressRecord) => {
      await apiFetch(`/progress/${record.achievementId}`, {
        method: 'DELETE',
        token: accessToken,
        credentials: 'include',
        csrfToken: await ensureCsrf(),
      });
      await load({ silent: true });
      setMessage(`已停止追踪「${record.nameZh}」`);
    },
    [accessToken, load],
  );

  const addProgress = useCallback(
    async (achievementId: string, currentCount: number) => {
      await apiFetch(`/progress/${achievementId}`, {
        method: 'POST',
        token: accessToken,
        credentials: 'include',
        csrfToken: await ensureCsrf(),
        body: { currentCount },
      });
      await load({ silent: true });
      setMessage('已加入进度追踪');
    },
    [accessToken, load],
  );

  /* ---------------------------- 本地统计 ---------------------------- */

  const reachedTiers = useMemo(
    () =>
      records.reduce(
        (total, record) =>
          total + record.tiers.filter((tier) => record.currentCount >= tier.threshold).length,
        0,
      ),
    [records],
  );

  const totalTiers = useMemo(
    () => records.reduce((total, record) => total + record.tiers.length, 0),
    [records],
  );

  const averagePercent = useMemo(() => {
    if (records.length === 0) return 0;
    const sum = records.reduce((total, record) => total + record.computed.percent, 0);
    return Math.round(sum / records.length);
  }, [records]);

  const disclaimers = useMemo(
    () => Array.from(new Set(records.map((record) => record.disclaimer).filter(Boolean))),
    [records],
  );

  /* ---------------------------- 状态分支 ---------------------------- */

  if (!hydrated) return <ProgressSkeleton />;

  if (!user) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="登录后追踪你的成就进度"
          description="进度追踪会按账号保存当前数量与目标等级，登录后才能读取和修改。"
          icon={<LogIn size={22} />}
          action={{ label: '登录 / 注册', href: '/login?next=%2Fprogress' }}
        />
        <div className="text-center">
          <Link
            href="/achievements/tiers"
            className="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            先看看全部等级阶梯 →
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'loading') return <ProgressSkeleton />;

  if (phase === 'error') {
    return (
      <div className="surface p-6 text-center sm:p-8">
        <AlertTriangle size={22} className="mx-auto text-[var(--color-warning)]" aria-hidden />
        <p className="mt-3 text-base font-semibold">进度加载失败</p>
        <p className="mx-auto mt-1.5 max-w-lg text-sm leading-relaxed text-[var(--color-ink-muted)]">
          {errorMessage || '接口暂时不可用，请稍后重试。'}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => void load()}>
            <RefreshCw size={15} />
            重新加载
          </button>
          {needLogin ? (
            <Link href="/login?next=%2Fprogress" className="btn btn-secondary">
              <LogIn size={15} />
              重新登录
            </Link>
          ) : (
            <Link href="/achievements" className="btn btn-secondary">
              浏览勋章图鉴
            </Link>
          )}
        </div>
      </div>
    );
  }

  const tracked = summary?.tracked ?? records.length;
  const maxed = summary?.maxed ?? 0;

  const statCards = [
    {
      label: '追踪中的勋章',
      value: formatNumber(tracked),
      icon: ListChecks,
      color: 'var(--color-accent)',
    },
    {
      label: '已达成等级',
      value: `${formatNumber(reachedTiers)} / ${formatNumber(totalTiers)}`,
      icon: Layers,
      color: 'var(--color-success)',
    },
    {
      label: '已满级勋章',
      value: formatNumber(maxed),
      icon: CheckCircle2,
      color: 'var(--color-success)',
    },
    {
      label: '平均完成度',
      value: `${averagePercent}%`,
      icon: TrendingUp,
      color: 'var(--color-warning)',
    },
  ];

  return (
    <div className="space-y-6">
      {(actionError || message) && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 text-[13px]">
          {actionError ? (
            <>
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
              <span role="alert">{actionError}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
              <span>{message}</span>
            </>
          )}
          <button
            type="button"
            className="ml-auto text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)]"
            onClick={() => {
              setActionError(null);
              setMessage(null);
            }}
            aria-label="关闭提示"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 免责说明：后端提供的 disclaimer，必须显眼 */}
      <Notice tone="warning">
        <span className="flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
          <span>
            <strong className="text-[var(--color-ink)]">推算而非官方。</strong>{' '}
            {disclaimers.length > 0
              ? disclaimers.join(' ')
              : '进度依据公开门槛推算，不代表 GitHub 官方实时成就状态。'}{' '}
            当前数量由你手动填写，本站不会自动读取 GitHub 的成就等级。
          </span>
        </span>
      </Notice>

      {/* 汇总 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="surface p-4">
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                <Icon size={13} style={{ color: item.color }} aria-hidden />
                {item.label}
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-[var(--color-ink)]">
                {item.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* 添加追踪 */}
      <AddTracker
        trackedIds={records.map((record) => record.achievementId)}
        onAdd={addProgress}
      />

      {/* 列表 */}
      {records.length === 0 ? (
        <EmptyState
          title="还没有追踪任何勋章"
          description="从上方选择一枚分级勋章，填入你当前的累计数量，即可看到等级进度与「还差多少次」。"
          icon={<Target size={22} />}
          action={{ label: '查看全部等级阶梯', href: '/achievements/tiers' }}
        />
      ) : (
        <ul className="space-y-4">
          {records.map((record) => (
            <li key={record.id}>
              <ProgressRow
                record={record}
                onSave={async (next) => {
                  setActionError(null);
                  await saveCount(record, next);
                }}
                onDelete={async () => {
                  setActionError(null);
                  await deleteRecord(record);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 添加追踪                                                            */
/* ------------------------------------------------------------------ */

function AddTracker({
  trackedIds,
  onAdd,
}: {
  trackedIds: string[];
  onAdd: (achievementId: string, currentCount: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<Achievement[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [count, setCount] = useState('0');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadCatalog();
  };

  async function loadCatalog() {
    if (catalog || catalogLoading) return;
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      // 说明：后端 `tiered=true` 参数未被转换成布尔值（会导致 500），
      // 这里使用等价且稳定的 `availability=tiered`（后端会映射为 isTiered=true）。
      const result = await apiFetch<Paginated<Achievement>>(
        '/achievements?availability=tiered&pageSize=100',
        { credentials: 'include' },
      );
      setCatalog(Array.isArray(result?.items) ? result.items : []);
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : '分级勋章列表加载失败');
    } finally {
      setCatalogLoading(false);
    }
  }

  const available = useMemo(
    () => (catalog ?? []).filter((item) => !trackedIds.includes(item.id)),
    [catalog, trackedIds],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return available.slice(0, 50);
    return available
      .filter(
        (item) =>
          item.nameZh.toLowerCase().includes(needle) ||
          item.nameEn.toLowerCase().includes(needle) ||
          item.slug.toLowerCase().includes(needle),
      )
      .slice(0, 50);
  }, [available, query]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError(null);

    if (!selectedId) {
      setError('请先选择一枚分级勋章');
      return;
    }
    const value = Number(count);
    if (!Number.isInteger(value) || value < 0) {
      setError('当前数量必须是非负整数');
      return;
    }

    setPending(true);
    try {
      await onAdd(selectedId, value);
      setSelectedId('');
      setCount('0');
      setQuery('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败，请稍后重试');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="surface p-4 sm:p-5" aria-labelledby="add-tracker">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={togglePanel}
        aria-expanded={open}
        aria-controls="add-tracker-panel"
      >
        <span>
          <span id="add-tracker" className="block text-base font-semibold">
            添加追踪
          </span>
          <span className="mt-0.5 block text-[13px] text-[var(--color-ink-muted)]">
            选择一枚分级勋章并填入当前累计数量
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="btn btn-secondary btn-sm">
            <Plus size={13} />
            {open ? '收起' : '添加'}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              'text-[var(--color-ink-subtle)] transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </span>
      </button>

      {open && (
        <form
          id="add-tracker-panel"
          onSubmit={submit}
          className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tracker-query"
                className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
              >
                搜索分级勋章
              </label>
              <input
                id="tracker-query"
                type="search"
                className="field"
                placeholder="输入勋章名称，如 Pull Shark"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="tracker-select"
                className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
              >
                勋章
              </label>
              <select
                id="tracker-select"
                className="field"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={catalogLoading}
              >
                <option value="">
                  {catalogLoading ? '正在加载…' : '请选择勋章'}
                </option>
                {filtered.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nameZh}（{item.nameEn}）
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-48">
              <label
                htmlFor="tracker-count"
                className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
              >
                当前数量
              </label>
              <input
                id="tracker-count"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className="field tabular-nums"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={pending || catalogLoading}>
              {pending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              开始追踪
            </button>
            <p className="text-[11px] leading-relaxed text-[var(--color-ink-subtle)] sm:flex-1">
              只列出站内标记为「分级型」且尚未追踪的勋章。数量按你自行填写，不会自动从 GitHub 读取。
            </p>
          </div>

          {catalogError && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {catalogError}
              <button
                type="button"
                className="ml-2 font-semibold underline"
                onClick={() => void loadCatalog()}
              >
                重试
              </button>
            </p>
          )}
          {catalog && available.length === 0 && (
            <p className="text-xs text-[var(--color-ink-muted)]">
              所有分级勋章都已在追踪列表中。可以回到勋章详情页查看完整等级门槛。
            </p>
          )}
          {catalog && available.length > 0 && filtered.length === 0 && (
            <p className="text-xs text-[var(--color-ink-muted)]">
              没有匹配「{query}」的分级勋章，换个关键词试试。
            </p>
          )}
          {error && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 单条进度                                                            */
/* ------------------------------------------------------------------ */

function ProgressRow({
  record,
  onSave,
  onDelete,
}: {
  record: ProgressRecord;
  onSave: (currentCount: number) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [value, setValue] = useState(String(record.currentCount));
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(String(record.currentCount));
  }, [record.currentCount]);

  const dirty = value !== String(record.currentCount);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const next = Number(value);
    if (!Number.isInteger(next) || next < 0) {
      setError('当前数量必须是非负整数');
      return;
    }
    setPending(true);
    try {
      await onSave(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请稍后重试');
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    if (typeof window !== 'undefined' && !window.confirm(`确定停止追踪「${record.nameZh}」吗？`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const nextMeta = record.computed.nextLevel ? TIER_META[record.computed.nextLevel] : null;

  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="badge-frame h-14 w-14 shrink-0">
          <BadgeImage src={record.imageUrl} alt={record.nameZh} size={44} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/achievements/${record.slug}`}
              className="text-[15px] font-bold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
            >
              {record.nameZh}
            </Link>
            <span className="truncate text-xs text-[var(--color-ink-subtle)]">
              {record.nameEn}
            </span>
            {record.category && <span className="chip">{record.category.nameZh}</span>}
            {record.computed.currentLevel ? (
              <TierBadge level={record.computed.currentLevel} />
            ) : (
              <span className="chip">未达标</span>
            )}
          </div>

          <div className="mt-3">
            <TierProgressBar progress={record.computed} />
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-muted)]">
            <span>
              当前数量{' '}
              <strong className="tabular-nums text-[var(--color-ink)]">
                {formatNumber(record.currentCount)}
              </strong>
            </span>
            {record.computed.remaining !== null && nextMeta ? (
              <span>
                还差{' '}
                <strong className="tabular-nums text-[var(--color-ink)]">
                  {formatNumber(record.computed.remaining)}
                </strong>{' '}
                次达到{' '}
                <strong style={{ color: nextMeta.color }}>{nextMeta.labelZh}</strong>
              </span>
            ) : (
              <span className="text-[var(--color-success)]">已达到最高等级</span>
            )}
            <span className="text-[var(--color-ink-subtle)]">
              更新于 {formatRelative(record.updatedAt)}
            </span>
          </p>

          {/* 等级阶梯（紧凑） */}
          {record.tiers.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {[...record.tiers]
                .sort((a, b) => a.threshold - b.threshold)
                .map((tier) => {
                  const reached = record.currentCount >= tier.threshold;
                  const meta = TIER_META[tier.level];
                  return (
                    <li
                      key={tier.id}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                      style={{
                        color: reached ? meta.color : 'var(--color-ink-subtle)',
                        borderColor: reached
                          ? `color-mix(in oklab, ${meta.color} 45%, transparent)`
                          : 'var(--color-border)',
                        backgroundColor: reached
                          ? `color-mix(in oklab, ${meta.color} 12%, transparent)`
                          : 'transparent',
                      }}
                      title={tier.credibility}
                    >
                      {meta.labelZh} · {formatNumber(tier.threshold)}
                      {reached && <CheckCircle2 size={10} strokeWidth={3} />}
                    </li>
                  );
                })}
            </ul>
          )}

          {record.note && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
              备注：{record.note}
            </p>
          )}

          {error && (
            <p className="mt-2 text-xs text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* 编辑区 */}
      <form
        onSubmit={submit}
        className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-3"
      >
        <div>
          <label
            htmlFor={`progress-count-${record.id}`}
            className="mb-1 block text-[11px] font-semibold text-[var(--color-ink-muted)]"
          >
            更新当前数量
          </label>
          <input
            id={`progress-count-${record.id}`}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            className="field h-9 w-32 tabular-nums"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-secondary btn-sm h-9"
          disabled={pending || !dirty}
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : null}
          保存
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm h-9 ml-auto text-[var(--color-danger)]"
          onClick={() => void remove()}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
          停止追踪
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 骨架屏                                                              */
/* ------------------------------------------------------------------ */

function ProgressSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">正在加载进度…</span>
      <div className="h-16 animate-pulse rounded-xl bg-[var(--color-surface-sunken)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface animate-pulse p-4">
            <div className="h-3 w-20 rounded bg-[var(--color-surface-sunken)]" />
            <div className="mt-2 h-7 w-14 rounded bg-[var(--color-surface-sunken)]" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="surface animate-pulse p-5">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-xl bg-[var(--color-surface-sunken)]" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-40 rounded bg-[var(--color-surface-sunken)]" />
              <div className="h-2 w-full rounded bg-[var(--color-surface-sunken)]" />
              <div className="h-3 w-2/3 rounded bg-[var(--color-surface-sunken)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
