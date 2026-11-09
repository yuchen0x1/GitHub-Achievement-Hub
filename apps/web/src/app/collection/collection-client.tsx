'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  Download,
  Layers,
  ListChecks,
  Loader2,
  LogIn,
  Pencil,
  Percent,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Star,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { TIER_META } from '@gach/shared';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type {
  Achievement,
  AchievementDetail,
  Availability,
  Paginated,
  TierLevel,
  UserAchievementRecord,
} from '@/lib/types';
import { AchievementCard } from '@/components/achievement/achievement-card';
import { BadgeImage } from '@/components/achievement/badge-image';
import { EmptyState } from '@/components/common/empty-state';
import { formatDate, formatNumber, downloadText, cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

type TabKey = 'earned' | 'planned' | 'favorited';

interface WallEarnedItem {
  achievementId: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  imageUrl: string | null;
  tierLevel: TierLevel | null;
  acquiredAt: string | null;
  availability: Availability;
}

interface WallStats {
  earnedCount: number;
  favoriteCount: number;
  plannedCount: number;
  totalAchievements: number;
  obtainableAchievements: number;
  completionRate: number;
}

interface WallData {
  earned: WallEarnedItem[];
  favorites: string[];
  planned: string[];
  stats: WallStats;
}

interface FavoriteRow {
  id: string;
  note: string | null;
  createdAt: string;
  achievement: AchievementDetail;
}

interface CollectionUpdatePayload {
  status: 'EARNED' | 'PLANNED';
  tierLevel: TierLevel | null;
  acquiredAt: string | null;
  notes: string | null;
}

const TIER_OPTIONS: { value: TierLevel; label: string }[] = (
  ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'] as const
).map((level) => ({
  value: level,
  label: `${TIER_META[level].label} · ${TIER_META[level].labelZh}`,
}));

/* ------------------------------------------------------------------ */
/* CSRF（双提交 Cookie）                                                */
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

/** 写操作需要 CSRF：优先读 Cookie，没有则向 /auth/csrf 申请一次 */
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

export function CollectionClient() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [needLogin, setNeedLogin] = useState(false);
  const [records, setRecords] = useState<UserAchievementRecord[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [wall, setWall] = useState<WallData | null>(null);
  const [tab, setTab] = useState<TabKey>('earned');
  const [editing, setEditing] = useState<UserAchievementRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setPhase('loading');
      setErrorMessage('');
      setNeedLogin(false);
      try {
        const [recordList, favoriteList, wallData] = await Promise.all([
          apiFetch<UserAchievementRecord[]>('/collection/achievements', {
            token: accessToken,
            credentials: 'include',
          }),
          apiFetch<FavoriteRow[]>('/collection/favorites', {
            token: accessToken,
            credentials: 'include',
          }),
          apiFetch<WallData>('/collection/wall', {
            token: accessToken,
            credentials: 'include',
          }),
        ]);
        setRecords(Array.isArray(recordList) ? recordList : []);
        setFavorites(Array.isArray(favoriteList) ? favoriteList : []);
        setWall(wallData);
        setPhase('ready');
      } catch (err) {
        const text =
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : '加载失败';
        setErrorMessage(text);
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

  const earned = useMemo(
    () => records.filter((item) => item.status === 'EARNED'),
    [records],
  );
  const planned = useMemo(
    () => records.filter((item) => item.status === 'PLANNED'),
    [records],
  );

  const totalAchievements = wall?.stats.totalAchievements ?? 0;
  const completionRate =
    totalAchievements > 0
      ? Math.round((earned.length / totalAchievements) * 1000) / 10
      : 0;

  /* ---------------------------- 写操作 ---------------------------- */

  const removeRecord = useCallback(
    async (achievementId: string) => {
      if (busyId) return;
      setActionError(null);
      setBusyId(achievementId);
      try {
        await apiFetch(`/collection/achievements/${achievementId}`, {
          method: 'DELETE',
          token: accessToken,
          credentials: 'include',
          csrfToken: await ensureCsrf(),
        });
        await load({ silent: true });
        setMessage('已移除该记录');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : '移除失败，请稍后重试');
      } finally {
        setBusyId(null);
      }
    },
    [accessToken, busyId, load],
  );

  const removeFavorite = useCallback(
    async (achievementId: string) => {
      if (busyId) return;
      setActionError(null);
      setBusyId(achievementId);
      try {
        await apiFetch(`/collection/favorites/${achievementId}`, {
          method: 'DELETE',
          token: accessToken,
          credentials: 'include',
          csrfToken: await ensureCsrf(),
        });
        await load({ silent: true });
        setMessage('已取消收藏');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : '取消收藏失败');
      } finally {
        setBusyId(null);
      }
    },
    [accessToken, busyId, load],
  );

  const addToEarned = useCallback(
    async (achievementId: string) => {
      if (busyId) return;
      setActionError(null);
      setBusyId(achievementId);
      try {
        await apiFetch(`/collection/achievements/${achievementId}`, {
          method: 'POST',
          token: accessToken,
          credentials: 'include',
          csrfToken: await ensureCsrf(),
          body: { status: 'EARNED' },
        });
        await load({ silent: true });
        setTab('earned');
        setMessage('已加入「已获得」');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : '操作失败');
      } finally {
        setBusyId(null);
      }
    },
    [accessToken, busyId, load],
  );

  const saveRecord = useCallback(
    async (record: UserAchievementRecord, payload: CollectionUpdatePayload) => {
      await apiFetch(`/collection/achievements/${record.achievementId}`, {
        method: 'PATCH',
        token: accessToken,
        credentials: 'include',
        csrfToken: await ensureCsrf(),
        body: payload,
      });
      await load({ silent: true });
      setMessage('记录已更新');
    },
    [accessToken, load],
  );

  const handleAdded = useCallback(
    async (status: 'EARNED' | 'PLANNED') => {
      await load({ silent: true });
      setTab(status === 'EARNED' ? 'earned' : 'planned');
      setMessage(status === 'EARNED' ? '已记录为「已获得」' : '已加入「计划获取」');
    },
    [load],
  );

  const exportJson = useCallback(async () => {
    setActionError(null);
    setBusyId('__export__');
    try {
      const data = await apiFetch<unknown>('/collection/export', {
        token: accessToken,
        credentials: 'include',
      });
      const date = new Date().toISOString().slice(0, 10);
      downloadText(`collection-${date}.json`, JSON.stringify(data, null, 2));
      setMessage('JSON 已开始下载');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '导出失败，请稍后重试');
    } finally {
      setBusyId(null);
    }
  }, [accessToken]);

  const closeEditor = useCallback(() => setEditing(null), []);

  /* ---------------------------- 状态分支 ---------------------------- */

  if (!hydrated) return <CollectionSkeleton />;

  if (!user) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="登录后查看你的勋章收藏馆"
          description="收藏馆里的每一条记录都绑定在你的账号上。登录后即可记录已获得的勋章、维护计划清单、导出数据并打印勋章墙。"
          icon={<LogIn size={22} />}
          action={{ label: '登录 / 注册', href: '/login?next=%2Fcollection' }}
        />
        <div className="text-center">
          <Link
            href="/achievements"
            className="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            先去勋章图鉴逛逛 →
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'loading') return <CollectionSkeleton />;

  if (phase === 'error') {
    return (
      <div className="surface p-6 text-center sm:p-8">
        <AlertTriangle
          size={22}
          className="mx-auto text-[var(--color-warning)]"
          aria-hidden
        />
        <p className="mt-3 text-base font-semibold">收藏馆加载失败</p>
        <p className="mx-auto mt-1.5 max-w-lg text-sm leading-relaxed text-[var(--color-ink-muted)]">
          {errorMessage || '接口暂时不可用，请稍后重试。'}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => void load()}>
            <RefreshCw size={15} />
            重新加载
          </button>
          {needLogin ? (
            <Link href="/login?next=%2Fcollection" className="btn btn-secondary">
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

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'earned', label: '已获得', count: earned.length },
    { key: 'planned', label: '计划获取', count: planned.length },
    { key: 'favorited', label: '已收藏', count: favorites.length },
  ];

  const stats = [
    {
      label: '已获得',
      value: formatNumber(wall?.stats.earnedCount ?? earned.length),
      icon: Award,
      color: 'var(--color-success)',
    },
    {
      label: '计划获取',
      value: formatNumber(wall?.stats.plannedCount ?? planned.length),
      icon: Target,
      color: 'var(--color-accent)',
    },
    {
      label: '已收藏',
      value: formatNumber(wall?.stats.favoriteCount ?? favorites.length),
      icon: Star,
      color: 'var(--color-warning)',
    },
    {
      label: '本站收录',
      value: formatNumber(totalAchievements),
      icon: Layers,
      color: 'var(--color-ink-muted)',
    },
    {
      label: '完成率',
      value: `${completionRate}%`,
      icon: Percent,
      color: 'var(--color-accent)',
    },
  ];

  const isEmpty = earned.length + planned.length + favorites.length === 0;
  const activeCount =
    tab === 'earned' ? earned.length : tab === 'planned' ? planned.length : favorites.length;
  const emptyByTab: Record<TabKey, { title: string; description: string }> = {
    earned: {
      title: '还没有已获得的勋章',
      description:
        '在上方「添加勋章到收藏馆」里选择勋章并记录为「已获得」，或从「已收藏」把已经拿到的勋章标记为已获得。',
    },
    planned: {
      title: '还没有计划中的勋章',
      description:
        '把想解锁的勋章记录下来，配合「成就进度」页的等级进度一起使用。',
    },
    favorited: {
      title: '还没有收藏任何勋章',
      description: '勋章详情页右侧可以一键收藏，收藏后会出现在这里。',
    },
  };

  return (
    <div className="space-y-6">
      {/* 提示 */}
      {(actionError || message) && (
        <div className="no-print flex items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 text-[13px]">
          {actionError ? (
            <>
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-[var(--color-danger)]"
              />
              <span className="text-[var(--color-ink)]" role="alert">
                {actionError}
              </span>
            </>
          ) : (
            <>
              <Award size={14} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
              <span className="text-[var(--color-ink)]">{message}</span>
            </>
          )}
          <button
            type="button"
            className="ml-auto text-xs text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)]"
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

      {/* 统计 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((item) => {
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
      <p className="text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
        完成率 = 已获得 {earned.length} 枚 ÷ 本站收录 {totalAchievements} 枚 × 100%。
        {wall && wall.stats.obtainableAchievements > 0 && (
          <>
            {' '}
            若只计算当前可获取的 {wall.stats.obtainableAchievements} 枚，则为{' '}
            {wall.stats.completionRate}%。
          </>
        )}
      </p>

      {/* Tab */}
      <div className="no-print flex flex-wrap items-center gap-2" role="tablist">
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={cn('btn btn-sm', active ? 'btn-primary' : 'btn-secondary')}
            >
              {item.label}
              <span className="tabular-nums opacity-80">{item.count}</span>
            </button>
          );
        })}
      </div>

      {/* 添加勋章 */}
      <AddAchievementPanel onAdded={handleAdded} />

      {/* 列表 */}
      {isEmpty ? (
        <EmptyState
          title="收藏馆还是空的"
          description="先去勋章图鉴挑几枚感兴趣的勋章，在详情页收藏，或在上方直接记录你已经获得的勋章。"
          icon={<Award size={22} />}
          action={{ label: '去勋章图鉴', href: '/achievements' }}
        />
      ) : activeCount === 0 ? (
        <EmptyState
          title={emptyByTab[tab].title}
          description={emptyByTab[tab].description}
          icon={tab === 'planned' ? <ListChecks size={22} /> : tab === 'favorited' ? <Star size={22} /> : <Award size={22} />}
          action={{ label: '去勋章图鉴', href: '/achievements' }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tab === 'earned' &&
            earned.map((record) => (
              <CollectionItem
                key={record.id}
                achievementId={record.achievementId}
                achievement={record.achievement}
                state="earned"
                tierLevel={record.tierLevel}
                meta={
                  record.acquiredAt
                    ? `获得于 ${formatDate(record.acquiredAt)}`
                    : '已获得（未记录日期）'
                }
                notes={record.notes}
                busy={busyId === record.achievementId}
                onEdit={() => setEditing(record)}
                onDelete={() => void removeRecord(record.achievementId)}
              />
            ))}

          {tab === 'planned' &&
            planned.map((record) => (
              <CollectionItem
                key={record.id}
                achievementId={record.achievementId}
                achievement={record.achievement}
                state="normal"
                tierLevel={record.tierLevel}
                meta="计划获取"
                notes={record.notes}
                busy={busyId === record.achievementId}
                onEdit={() => setEditing(record)}
                onDelete={() => void removeRecord(record.achievementId)}
              />
            ))}

          {tab === 'favorited' &&
            favorites.map((row) => (
              <CollectionItem
                key={row.id}
                achievementId={row.achievement.id}
                achievement={row.achievement}
                state="favorited"
                tierLevel={null}
                meta={`收藏于 ${formatDate(row.createdAt)}`}
                notes={row.note}
                busy={busyId === row.achievement.id}
                onDelete={() => void removeFavorite(row.achievement.id)}
                deleteLabel="取消收藏"
                extraAction={{
                  label: '记为已获得',
                  onClick: () => void addToEarned(row.achievement.id),
                }}
              />
            ))}
        </div>
      )}

      {/* 勋章墙 */}
      <section className="surface p-5" aria-labelledby="badge-wall">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="badge-wall" className="text-base font-semibold">
              我的勋章墙
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              只展示状态为「已获得」的勋章，共 {earned.length} 枚。打印本页时会保留这一区块。
            </p>
          </div>
          <span className="chip tabular-nums">{earned.length} 枚</span>
        </div>

        {earned.length > 0 ? (
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {earned.map((record) => (
              <li key={record.id} className="text-center">
                <div className="badge-frame aspect-square w-full">
                  <BadgeImage
                    src={record.achievement.imageUrl}
                    alt={record.achievement.nameZh}
                    size={64}
                  />
                </div>
                <p className="mt-2 truncate text-xs font-medium text-[var(--color-ink)]">
                  {record.achievement.nameZh}
                </p>
                {record.tierLevel && (
                  <p
                    className="text-[11px] font-semibold"
                    style={{ color: TIER_META[record.tierLevel].color }}
                  >
                    {TIER_META[record.tierLevel].labelZh}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-[var(--color-border-strong)] px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
            勋章墙还是空的。获得并记录第一枚勋章后，它就会出现在这里。
          </p>
        )}
      </section>

      {/* 导出 */}
      <section className="surface p-5" aria-labelledby="export">
        <h2 id="export" className="text-base font-semibold">
          导出与打印
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          两个按钮都是真实可用的功能，行为如下：
        </p>
        <ul className="mt-2 space-y-1 text-[13px] text-[var(--color-ink-muted)]">
          <li>
            · <strong className="text-[var(--color-ink)]">导出 JSON</strong>：
            调用后端导出接口，下载 <code className="font-mono text-xs">collection-YYYY-MM-DD.json</code>
            （含已获得、收藏与进度数据）。
          </li>
          <li>
            · <strong className="text-[var(--color-ink)]">打印 / 导出 PDF</strong>：
            调用浏览器打印对话框，在目标打印机中选择「另存为 PDF」；标记为「不打印」的交互控件不会出现在输出中。
          </li>
        </ul>

        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void exportJson()}
            disabled={busyId === '__export__'}
          >
            {busyId === '__export__' ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            导出 JSON
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            打印 / 导出 PDF
          </button>
        </div>
      </section>

      {editing && (
        <EditDialog record={editing} onClose={closeEditor} onSave={saveRecord} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 添加勋章                                                            */
/* ------------------------------------------------------------------ */

function AddAchievementPanel({
  onAdded,
}: {
  onAdded: (status: 'EARNED' | 'PLANNED') => Promise<void>;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Achievement[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState<'EARNED' | 'PLANNED'>('PLANNED');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (keyword: string) => {
    setSearching(true);
    setError(null);
    try {
      const q = keyword.trim();
      const res = await apiFetch<Paginated<Achievement>>(
        `/achievements?pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ''}`,
        { credentials: 'include' },
      );
      const items = Array.isArray(res?.items) ? res.items : [];
      setResults(items);
      setSelectedId(items[0]?.id ?? '');
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败，请稍后重试');
    } finally {
      setSearching(false);
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) void search('');
  };

  const submit = async () => {
    if (adding) return;
    if (!selectedId) {
      setError('请先选择一枚勋章');
      return;
    }
    setError(null);
    setAdding(true);
    try {
      await apiFetch(`/collection/achievements/${selectedId}`, {
        method: 'POST',
        token: accessToken,
        credentials: 'include',
        csrfToken: await ensureCsrf(),
        body: { status },
      });
      await onAdded(status);
      setOpen(false);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败，请稍后重试');
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="no-print surface p-4 sm:p-5" aria-labelledby="add-achievement">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="add-achievement-panel"
      >
        <span>
          <span id="add-achievement" className="block text-sm font-semibold">
            添加勋章到收藏馆
          </span>
          <span className="mt-0.5 block text-[13px] text-[var(--color-ink-muted)]">
            搜索站内勋章，记录为「已获得」或「计划获取」
          </span>
        </span>
        <span className="btn btn-secondary btn-sm shrink-0">
          <Plus size={13} />
          {open ? '收起' : '添加'}
        </span>
      </button>

      {open && (
        <div
          id="add-achievement-panel"
          className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              className="field flex-1"
              placeholder="搜索勋章名称，留空则浏览热门勋章"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void search(query);
                }
              }}
              aria-label="搜索勋章"
            />
            <button
              type="button"
              className="btn btn-secondary shrink-0"
              onClick={() => void search(query)}
              disabled={searching}
            >
              {searching ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}
              搜索
            </button>
          </div>

          {loaded && !searching && results.length === 0 && (
            <p className="text-xs text-[var(--color-ink-muted)]">
              没有找到匹配的勋章，换个关键词，或先去
              <Link href="/achievements" className="mx-1 text-[var(--color-accent)] hover:underline">
                勋章图鉴
              </Link>
              浏览。
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="add-achievement-select"
                className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
              >
                勋章
              </label>
              <select
                id="add-achievement-select"
                className="field"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={searching || results.length === 0}
              >
                <option value="">
                  {searching ? '正在搜索…' : results.length === 0 ? '暂无结果' : '请选择勋章'}
                </option>
                {results.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nameZh}（{item.nameEn}）
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="add-achievement-status"
                className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
              >
                记录为
              </label>
              <select
                id="add-achievement-status"
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value === 'EARNED' ? 'EARNED' : 'PLANNED')}
              >
                <option value="PLANNED">计划获取</option>
                <option value="EARNED">已获得</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void submit()}
              disabled={adding || searching || results.length === 0}
            >
              {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              确认添加
            </button>
            <p className="text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
              若该勋章已有记录，会被更新为所选状态（不会重复创建）。
            </p>
          </div>

          {error && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 列表项                                                              */
/* ------------------------------------------------------------------ */

function CollectionItem({
  achievement,
  achievementId,
  state,
  tierLevel,
  meta,
  notes,
  busy,
  onEdit,
  onDelete,
  deleteLabel = '移除记录',
  extraAction,
}: {
  achievement: AchievementDetail;
  achievementId: string;
  state: 'earned' | 'normal' | 'favorited';
  tierLevel: TierLevel | null;
  meta: string;
  notes: string | null;
  busy: boolean;
  onEdit?: () => void;
  onDelete: () => void;
  deleteLabel?: string;
  extraAction?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col gap-2">
      <AchievementCard
        achievement={achievement}
        state={state}
        tierLevel={tierLevel}
        badge={state === 'normal' ? '计划中' : undefined}
      />
      <div className="px-1">
        <p className="text-[11px] text-[var(--color-ink-subtle)]">{meta}</p>
        {notes && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
            {notes}
          </p>
        )}
        <div className="no-print mt-2 flex flex-wrap items-center gap-2">
          {onEdit && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}>
              <Pencil size={12} />
              编辑
            </button>
          )}
          {extraAction && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={extraAction.onClick}
              disabled={busy}
            >
              <Award size={12} />
              {extraAction.label}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm text-[var(--color-danger)]"
            onClick={onDelete}
            disabled={busy}
            aria-label={`${deleteLabel}：${achievement.nameZh}（${achievementId}）`}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {deleteLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 编辑弹窗                                                            */
/* ------------------------------------------------------------------ */

function EditDialog({
  record,
  onClose,
  onSave,
}: {
  record: UserAchievementRecord;
  onClose: () => void;
  onSave: (record: UserAchievementRecord, payload: CollectionUpdatePayload) => Promise<void>;
}) {
  const [status, setStatus] = useState<'EARNED' | 'PLANNED'>(
    record.status === 'PLANNED' ? 'PLANNED' : 'EARNED',
  );
  const [tier, setTier] = useState<TierLevel | 'NONE'>(record.tierLevel ?? 'NONE');
  const [acquiredAt, setAcquiredAt] = useState(
    record.acquiredAt ? record.acquiredAt.slice(0, 10) : '',
  );
  const [notes, setNotes] = useState(record.notes ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await onSave(record, {
        status,
        tierLevel: tier === 'NONE' ? null : tier,
        acquiredAt: acquiredAt ? new Date(`${acquiredAt}T00:00:00Z`).toISOString() : null,
        notes: notes.trim() ? notes.trim() : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请稍后重试');
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[rgba(1,4,9,0.62)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
        className="surface-raised w-full max-w-lg p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="edit-dialog-title" className="text-base font-semibold">
              编辑勋章记录
            </h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {record.achievement.nameZh} · {record.achievement.nameEn}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-status"
                className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
              >
                状态
              </label>
              <select
                id="edit-status"
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value === 'PLANNED' ? 'PLANNED' : 'EARNED')}
              >
                <option value="EARNED">已获得</option>
                <option value="PLANNED">计划获取</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-tier"
                className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
              >
                等级
              </label>
              <select
                id="edit-tier"
                className="field"
                value={tier}
                onChange={(e) => setTier(e.target.value as TierLevel | 'NONE')}
              >
                <option value="NONE">未标注</option>
                {TIER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-date"
              className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
            >
              获得日期
            </label>
            <input
              id="edit-date"
              type="date"
              className="field"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-[var(--color-ink-subtle)]">
              只在状态为「已获得」时使用；留空表示不记录具体日期。
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-notes"
              className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
            >
              备注
            </label>
            <textarea
              id="edit-notes"
              className="field h-24 resize-y py-2"
              placeholder="例如：2024 年用 PR 合并解锁，仓库地址…"
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="mt-1 text-right text-[11px] text-[var(--color-ink-subtle)]">
              {notes.length}/500
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-3 text-[12px] leading-relaxed text-[var(--color-ink-muted)]">
            <p className="font-semibold text-[var(--color-ink)]">下一个目标</p>
            <p className="mt-1">
              本记录接口只保存状态、等级、获得日期与备注，没有「下一个目标」字段。
              目标数量与目标等级请到
              <Link href="/progress" className="mx-1 text-[var(--color-accent)] hover:underline">
                成就进度
              </Link>
              页维护（按当前数量推算下一等级）。
            </p>
          </div>

          {error && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] pt-4">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending && <Loader2 size={15} className="animate-spin" />}
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 骨架屏                                                              */
/* ------------------------------------------------------------------ */

function CollectionSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">正在加载收藏馆…</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="surface animate-pulse p-4">
            <div className="h-3 w-16 rounded bg-[var(--color-surface-sunken)]" />
            <div className="mt-2 h-7 w-12 rounded bg-[var(--color-surface-sunken)]" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface animate-pulse p-4">
            <div className="flex gap-3.5">
              <div className="h-[72px] w-[72px] rounded-xl bg-[var(--color-surface-sunken)]" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-16 rounded bg-[var(--color-surface-sunken)]" />
                <div className="h-4 w-32 rounded bg-[var(--color-surface-sunken)]" />
              </div>
            </div>
            <div className="mt-3 h-10 rounded bg-[var(--color-surface-sunken)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
