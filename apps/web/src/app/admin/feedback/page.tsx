'use client';

import { useEffect, useState } from 'react';
import { Inbox, MessageSquare, Trash2 } from 'lucide-react';
import {
  adminFetch,
  describeError,
  formatDateTime,
} from '../_components/admin-api';
import {
  FEEDBACK_STATUS_META,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPE_LABELS,
  totalPagesOf,
  type AdminFeedbackItem,
  type FeedbackStatus,
  type RawPage,
} from '../_components/admin-types';
import {
  AdminPageHeader,
  Badge,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  InlineError,
  LoadingBlock,
  Modal,
  PaginationBar,
  SelectInput,
  TD,
  TH,
  TableWrap,
  Tabs,
  TextArea,
} from '../_components/admin-ui';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type Filter = 'ALL' | FeedbackStatus;

export default function AdminFeedbackPage() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RawPage<AdminFeedbackItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [active, setActive] = useState<AdminFeedbackItem | null>(null);
  const [draftStatus, setDraftStatus] = useState<FeedbackStatus>('PENDING');
  const [draftNote, setDraftNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<AdminFeedbackItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (filter !== 'ALL') query.set('status', filter);
      const res = await adminFetch<RawPage<AdminFeedbackItem>>(
        `/admin/feedback?${query.toString()}`,
      );
      setData(res);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  function openDetail(item: AdminFeedbackItem) {
    setActive(item);
    setDraftStatus(item.status);
    setDraftNote(item.adminNote ?? '');
    setDetailError(null);
    setMessage(null);
  }

  async function saveDetail() {
    if (!active || saving) return;
    setSaving(true);
    setDetailError(null);
    try {
      await adminFetch(`/admin/feedback/${active.id}`, {
        method: 'PATCH',
        body: { status: draftStatus, adminNote: draftNote.trim() || null },
      });
      setActive(null);
      setMessage('反馈状态与备注已保存。');
      await load();
    } catch (err) {
      setDetailError(describeError(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeItem() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await adminFetch(`/admin/feedback/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      setMessage('反馈已删除。');
      if (data && data.items.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        await load();
      }
    } catch (err) {
      setDeleteError(describeError(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  const items = data?.items ?? [];
  const totalPages = data ? totalPagesOf(data) : 1;

  return (
    <div className="animate-fade-up space-y-5">
      <AdminPageHeader
        eyebrow="FEEDBACK"
        title="反馈处理"
        description="查看用户提交的问题、建议与纠错，更新处理状态并留下内部备注。删除为硬删除，不可恢复。"
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            刷新
          </button>
        }
      />

      <Tabs<Filter>
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
        items={[
          { value: 'ALL', label: '全部' },
          ...FEEDBACK_STATUSES.map((status) => ({
            value: status as Filter,
            label: FEEDBACK_STATUS_META[status].label,
          })),
        ]}
      />

      {message && (
        <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs text-[var(--color-success)]">
          {message}
        </div>
      )}

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyBlock
          title="没有符合条件的反馈"
          description="切换筛选条件，或等待用户提交新的反馈。"
        />
      ) : (
        <>
          <TableWrap minWidth={860}>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <tr>
                <th className={TH}>提交时间</th>
                <th className={TH}>类型</th>
                <th className={TH}>主题</th>
                <th className={TH}>提交者</th>
                <th className={TH}>状态</th>
                <th className={TH}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const statusMeta = FEEDBACK_STATUS_META[item.status] ?? {
                  label: item.status,
                  tone: 'muted' as const,
                };
                return (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <td className={`${TD} whitespace-nowrap text-[11px] text-[var(--color-ink-subtle)]`}>
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className={TD}>
                      <span className="chip">
                        {FEEDBACK_TYPE_LABELS[item.type] ?? item.type}
                      </span>
                    </td>
                    <td className={`${TD} max-w-[280px]`}>
                      <button
                        type="button"
                        onClick={() => openDetail(item)}
                        className="text-left font-medium hover:text-[var(--color-accent)] hover:underline"
                      >
                        {item.subject}
                      </button>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--color-ink-subtle)]">
                        {item.content}
                      </p>
                    </td>
                    <td className={`${TD} whitespace-nowrap text-xs`}>
                      {item.user?.displayName ?? item.email ?? '匿名'}
                      {item.user?.email && (
                        <span className="block text-[10px] text-[var(--color-ink-subtle)]">
                          {item.user.email}
                        </span>
                      )}
                    </td>
                    <td className={TD}>
                      <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openDetail(item)}
                        >
                          <MessageSquare size={13} />
                          处理
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(item);
                          }}
                          aria-label="删除反馈"
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

          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={data?.total}
            onChange={setPage}
          />
        </>
      )}

      {/* 详情 / 处理 */}
      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? active.subject : '反馈详情'}
        description={
          active ? `${FEEDBACK_TYPE_LABELS[active.type] ?? active.type} · ${formatDateTime(active.createdAt)}` : undefined
        }
        width="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActive(null)}
              disabled={saving}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void saveDetail()}
              disabled={saving}
            >
              {saving ? '保存中…' : '保存处理结果'}
            </button>
          </>
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{active.content}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[var(--color-ink-subtle)]">提交者</dt>
                <dd className="mt-0.5 font-medium">
                  {active.user?.displayName ?? '匿名'}
                  {(active.user?.email ?? active.email) && (
                    <span className="block text-[11px] font-normal text-[var(--color-ink-muted)]">
                      {active.user?.email ?? active.email}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-ink-subtle)]">最后更新</dt>
                <dd className="mt-0.5 font-medium">{formatDateTime(active.updatedAt)}</dd>
              </div>
            </dl>

            <Field label="处理状态">
              <SelectInput
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.target.value as FeedbackStatus)}
              >
                {FEEDBACK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {FEEDBACK_STATUS_META[status].label} — {FEEDBACK_STATUS_META[status].description}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="内部备注" hint="仅后台可见，会随反馈一起保存。">
              <TextArea
                value={draftNote}
                onChange={(event) => setDraftNote(event.target.value)}
                rows={4}
                placeholder="记录核实结果、处理动作或驳回原因…"
              />
            </Field>

            <InlineError message={detailError} />

            <button
              type="button"
              className={cn('btn btn-ghost btn-sm text-[var(--color-danger)]')}
              onClick={() => {
                setDeleteError(null);
                setDeleting(active);
              }}
            >
              <Trash2 size={13} />
              删除这条反馈
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除反馈"
        description={
          <>
            你将永久删除反馈「{deleting?.subject}」。该操作会写入操作日志，但删除后无法恢复。
          </>
        }
        confirmLabel="永久删除"
        requireText="删除"
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void removeItem()}
      />

      <p className="flex items-center gap-2 text-[11px] text-[var(--color-ink-subtle)]">
        <Inbox size={13} />
        状态枚举：PENDING / REVIEWING / RESOLVED / REJECTED。
      </p>
    </div>
  );
}
