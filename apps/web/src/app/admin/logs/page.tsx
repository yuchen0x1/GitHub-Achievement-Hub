'use client';

import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { adminFetch, describeError, formatDateTime, summariseJson } from '../_components/admin-api';
import {
  LOG_ACTION_META,
  LOG_ENTITY_LABELS,
  totalPagesOf,
  type AdminLogItem,
  type RawPage,
} from '../_components/admin-types';
import {
  AdminPageHeader,
  Badge,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PaginationBar,
  SelectInput,
  TD,
  TH,
  TableWrap,
  Toolbar,
} from '../_components/admin-ui';

const PAGE_SIZE = 20;

const ENTITY_FILTERS = [
  { value: 'all', label: '全部对象' },
  { value: 'achievement', label: '勋章' },
  { value: 'user', label: '用户' },
  { value: 'feedback', label: '反馈' },
  { value: 'announcement', label: '公告' },
];

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('all');
  const [data, setData] = useState<RawPage<AdminLogItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (entityType !== 'all') params.set('entityType', entityType);
      const res = await adminFetch<RawPage<AdminLogItem>>(`/admin/logs?${params.toString()}`);
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
  }, [page, entityType]);

  function toggle(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const items = data?.items ?? [];
  const totalPages = data ? totalPagesOf(data) : 1;

  return (
    <div className="animate-fade-up space-y-5">
      <AdminPageHeader
        eyebrow="AUDIT LOG"
        title="操作日志"
        description="管理端写操作的审计记录。只读，不可编辑或删除。"
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            刷新
          </button>
        }
      />

      <Toolbar>
        <div className="w-full sm:w-44">
          <SelectInput
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setPage(1);
            }}
            aria-label="按对象类型筛选"
          >
            {ENTITY_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </SelectInput>
        </div>
        <span className="text-[11px] text-[var(--color-ink-subtle)]">
          共 {data?.total ?? 0} 条记录
        </span>
      </Toolbar>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyBlock title="暂无操作日志" description="后台的写操作会自动记录在这里。" />
      ) : (
        <>
          <TableWrap minWidth={920}>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <tr>
                <th className={TH}>时间</th>
                <th className={TH}>操作人</th>
                <th className={TH}>动作</th>
                <th className={TH}>目标</th>
                <th className={TH}>详情</th>
                <th className={TH}> </th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => {
                const action = LOG_ACTION_META[log.action] ?? {
                  label: log.action,
                  tone: 'muted' as const,
                };
                const hasDetail = log.before != null || log.after != null;
                const open = expanded.has(log.id);
                return (
                  <Fragment key={log.id}>
                    <tr
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]"
                    >
                      <td className={`${TD} whitespace-nowrap text-[11px] text-[var(--color-ink-subtle)]`}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <span className="text-[13px]">{log.userName ?? '系统'}</span>
                        {log.userId && (
                          <span className="block font-mono text-[10px] text-[var(--color-ink-subtle)]">
                            {log.userId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className={TD}>
                        <Badge tone={action.tone}>{action.label}</Badge>
                      </td>
                      <td className={`${TD} whitespace-nowrap text-xs`}>
                        {LOG_ENTITY_LABELS[log.entityType] ?? log.entityType}
                        {log.entityId && (
                          <span className="ml-1.5 font-mono text-[10px] text-[var(--color-ink-subtle)]">
                            {log.entityId}
                          </span>
                        )}
                      </td>
                      <td className={`${TD} max-w-[340px]`}>
                        <span className="line-clamp-2 break-all font-mono text-[11px] text-[var(--color-ink-muted)]">
                          {summariseJson(log.after)}
                        </span>
                      </td>
                      <td className={TD}>
                        {hasDetail && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggle(log.id)}
                            aria-expanded={open}
                          >
                            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {open ? '收起' : '展开'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
                        <td colSpan={6} className="px-3 py-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
                                变更前
                              </p>
                              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 font-mono text-[11px] leading-relaxed">
                                {log.before == null ? '—' : JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
                                变更后
                              </p>
                              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 font-mono text-[11px] leading-relaxed">
                                {log.after == null ? '—' : JSON.stringify(log.after, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </TableWrap>

          <PaginationBar page={page} totalPages={totalPages} total={data?.total} onChange={setPage} />
        </>
      )}

      <p className="flex items-center gap-2 text-[11px] text-[var(--color-ink-subtle)]">
        <ScrollText size={13} />
        日志由后端在每次写操作后自动写入，前端仅展示，不提供修改入口。
      </p>
    </div>
  );
}
