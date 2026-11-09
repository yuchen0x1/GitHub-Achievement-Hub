'use client';

import { useEffect, useState } from 'react';
import { Award, History, Pencil, Plus, Trash2 } from 'lucide-react';
import { AvailabilityBadge } from '@/components/achievement/availability-badge';
import { CredibilityBadge } from '@/components/achievement/credibility-badge';
import { formatDate } from '@/lib/utils';
import { adminFetch, describeError, useDebouncedValue } from '../_components/admin-api';
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_META,
  totalPagesOf,
  type AdminAchievementRow,
  type AdminCategoryRow,
  type ContentStatus,
  type RawPage,
} from '../_components/admin-types';
import {
  AdminPageHeader,
  Badge,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  Modal,
  PaginationBar,
  SearchInput,
  TD,
  TH,
  TableWrap,
  Tabs,
  Toolbar,
} from '../_components/admin-ui';
import { AchievementEditor } from '../_components/achievement-editor';
import { AchievementHistoryPanel } from '../_components/achievement-history';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | ContentStatus;

export default function AdminAchievementsPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<RawPage<AdminAchievementRow> | null>(null);
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorId, setEditorId] = useState<string | null>(null);

  const [historyTarget, setHistoryTarget] = useState<AdminAchievementRow | null>(null);
  const [deleting, setDeleting] = useState<AdminAchievementRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
      if (status !== 'all') params.set('status', status);
      const [res, cats] = await Promise.all([
        adminFetch<RawPage<AdminAchievementRow>>(`/admin/achievements?${params.toString()}`),
        adminFetch<AdminCategoryRow[]>('/content/categories').catch(
          () => [] as AdminCategoryRow[],
        ),
      ]);
      setData(res);
      setCategories(cats);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery, status]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status]);

  function openCreate() {
    setEditorId(null);
    setEditorOpen(true);
  }

  function openEdit(row: AdminAchievementRow) {
    setEditorId(row.id);
    setEditorOpen(true);
  }

  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await adminFetch(`/admin/achievements/${deleting.id}`, { method: 'DELETE' });
      setMessage(`已删除勋章「${deleting.nameZh}」。该操作为硬删除。`);
      setDeleting(null);
      if (data && data.items.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        await load();
      }
    } catch (err) {
      setDeleteError(describeError(err));
      // 后端先删除再写历史，若写历史失败会返回 500 但记录已被删除，
      // 这里主动刷新一次，避免列表停留在旧数据。
      await load();
    } finally {
      setDeleteBusy(false);
    }
  }

  const rows = data?.items ?? [];
  const totalPages = data ? totalPagesOf(data) : 1;

  return (
    <div className="animate-fade-up space-y-5">
      <AdminPageHeader
        eyebrow="ACHIEVEMENTS"
        title="勋章管理"
        description="维护勋章主表、等级、条件、教程与来源。所有写操作都会记录字段级变更历史。"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
              刷新
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus size={14} />
              新建勋章
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs<StatusFilter>
          value={status}
          onChange={setStatus}
          items={[
            { value: 'all', label: '全部' },
            ...CONTENT_STATUSES.map((value) => ({
              value: value as StatusFilter,
              label: CONTENT_STATUS_META[value].label,
            })),
          ]}
        />
        <Toolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="搜索中文名 / 英文名 / slug…"
          />
        </Toolbar>
      </div>

      {message && (
        <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs text-[var(--color-success)]">
          {message}
        </div>
      )}

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyBlock
          title="没有符合条件的勋章"
          description="调整搜索或状态筛选，或创建一枚新勋章。"
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus size={14} />
              新建勋章
            </button>
          }
        />
      ) : (
        <>
          <TableWrap minWidth={1060}>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <tr>
                <th className={TH}>中文名</th>
                <th className={TH}>英文名</th>
                <th className={TH}>Slug</th>
                <th className={TH}>获取状态</th>
                <th className={TH}>难度</th>
                <th className={TH}>可信度</th>
                <th className={TH}>更新时间</th>
                <th className={TH}>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const statusMeta = CONTENT_STATUS_META[row.status] ?? {
                  label: row.status,
                  tone: 'muted' as const,
                  description: '',
                };
                return (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <td className={TD}>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{row.nameZh}</span>
                        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                        {row.isTiered && <Badge tone="accent">分级</Badge>}
                      </div>
                      {row.category && (
                        <p className="mt-0.5 text-[11px] text-[var(--color-ink-subtle)]">
                          {row.category.nameZh}
                        </p>
                      )}
                    </td>
                    <td className={`${TD} max-w-[180px]`}>
                      <span className="line-clamp-1 text-xs">{row.nameEn}</span>
                    </td>
                    <td className={`${TD} font-mono text-[11px] text-[var(--color-ink-muted)]`}>
                      {row.slug}
                    </td>
                    <td className={TD}>
                      <AvailabilityBadge availability={row.availability} />
                    </td>
                    <td className={`${TD} whitespace-nowrap text-xs tabular-nums`}>
                      {row.difficulty} / 5
                    </td>
                    <td className={TD}>
                      <CredibilityBadge grade={row.credibility} compact />
                    </td>
                    <td className={`${TD} whitespace-nowrap text-[11px] text-[var(--color-ink-subtle)]`}>
                      {formatDate(row.updatedAt)}
                    </td>
                    <td className={TD}>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil size={13} />
                          编辑
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setHistoryTarget(row)}
                        >
                          <History size={13} />
                          历史
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(row);
                          }}
                          aria-label={`删除勋章 ${row.nameZh}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>

          <PaginationBar page={page} totalPages={totalPages} total={data?.total} onChange={setPage} />
        </>
      )}

      <AchievementEditor
        open={editorOpen}
        achievementId={editorId}
        categories={categories}
        onClose={() => setEditorOpen(false)}
        onSaved={() => void load()}
      />

      <Modal
        open={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        title={historyTarget ? `变更历史 · ${historyTarget.nameZh}` : '变更历史'}
        description="字段级旧值 → 新值、操作人与时间。历史由后端自动记录，前端不可编辑。"
        width="lg"
      >
        {historyTarget && <AchievementHistoryPanel achievementId={historyTarget.id} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除勋章"
        description={
          <>
            后端执行的是<strong>硬删除</strong>（<code className="font-mono text-[11px]">prisma.achievement.delete</code>）：
            勋章本身及其等级、获取条件、教程、资料来源与变更历史会一并删除，<strong>无法恢复</strong>。
            <span className="mt-2 block">
              如只是暂时下线，请改用「归档」状态而不是删除。
            </span>
          </>
        }
        confirmLabel="永久删除"
        requireText={deleting?.slug}
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />

      <p className="flex items-center gap-2 text-[11px] text-[var(--color-ink-subtle)]">
        <Award size={13} />
        共 {data?.total ?? 0} 枚勋章（含草稿、待审与归档）。
      </p>
    </div>
  );
}
