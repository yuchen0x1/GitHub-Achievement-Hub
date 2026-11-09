'use client';

import { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { adminFetch, describeError, formatDateTime } from './admin-api';
import {
  HISTORY_FIELD_LABELS,
  HISTORY_TYPE_META,
  type AchievementHistoryItem,
} from './admin-types';
import { Badge, EmptyBlock, ErrorBlock, LoadingBlock } from './admin-ui';

export function AchievementHistoryPanel({ achievementId }: { achievementId: string }) {
  const [items, setItems] = useState<AchievementHistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<AchievementHistoryItem[]>(
        `/admin/achievements/${achievementId}/history`,
      );
      setItems(res);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievementId]);

  if (loading) return <LoadingBlock label="正在加载变更历史…" />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!items || items.length === 0) {
    return (
      <EmptyBlock
        title="还没有变更记录"
        description="创建或修改勋章后，后端会按字段记录旧值与新值。"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-subtle)]">
          <History size={13} />
          共 {items.length} 条字段级变更记录
        </p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()}>
          <RefreshCw size={13} />
          刷新
        </button>
      </div>

      <ol className="space-y-3">
        {items.map((item) => {
          const typeMeta = HISTORY_TYPE_META[item.changeType] ?? {
            label: item.changeType,
            tone: 'muted' as const,
          };
          const fieldLabel = HISTORY_FIELD_LABELS[item.field] ?? item.field;
          return (
            <li
              key={item.id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                <span className="text-[12px] font-semibold">{fieldLabel}</span>
                <span className="ml-auto text-[11px] text-[var(--color-ink-subtle)]">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                操作人：{item.changedBy?.displayName ?? '未知'}
                {item.changedBy?.email ? `（${item.changedBy.email}）` : ''}
                {item.note ? ` · 备注：${item.note}` : ''}
              </p>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <ValueBox label="旧值" value={item.oldValue} tone="danger" />
                <ValueBox label="新值" value={item.newValue} tone="success" />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ValueBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | null;
  tone: 'danger' | 'success';
}) {
  const color = tone === 'danger' ? 'var(--color-danger)' : 'var(--color-success)';
  return (
    <div
      className="rounded-md border p-2"
      style={{
        borderColor: `color-mix(in oklab, ${color} 28%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 6%, transparent)`,
      }}
    >
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
        {label}
      </p>
      <div className="max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
        {value === null || value === '' ? '（空）' : value}
      </div>
    </div>
  );
}
