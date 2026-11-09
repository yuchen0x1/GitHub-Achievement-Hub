import { TIER_META } from '@gach/shared';
import type { TierLevel, TierProgress } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TierProgressBarProps {
  progress: TierProgress;
  className?: string;
  /** 是否显示文字说明 */
  showLabels?: boolean;
}

/**
 * 等级进度条。
 * 进度是基于公开门槛数值推算的结果，不代表 GitHub 官方实时状态，
 * 因此在页面上必须配合"推算"字样使用。
 */
export function TierProgressBar({
  progress,
  className,
  showLabels = true,
}: TierProgressBarProps) {
  const { currentLevel, nextLevel, remaining, percent } = progress;
  const currentMeta = currentLevel ? TIER_META[currentLevel] : null;
  const nextMeta = nextLevel ? TIER_META[nextLevel] : null;

  return (
    <div className={cn('w-full', className)}>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="等级进度（依据公开门槛推算）"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${Math.max(2, Math.min(100, percent))}%`,
            background: currentMeta
              ? `linear-gradient(90deg, color-mix(in oklab, ${currentMeta.color} 55%, transparent), ${currentMeta.color})`
              : 'var(--color-accent)',
          }}
        />
      </div>

      {showLabels && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-[var(--color-ink-muted)]">
            当前等级{' '}
            <strong
              className="font-semibold"
              style={{ color: currentMeta?.color ?? 'var(--color-ink-subtle)' }}
            >
              {currentMeta ? currentMeta.labelZh : '未达标'}
            </strong>
          </span>
          <span className="text-[var(--color-ink-subtle)]">·</span>
          <span className="text-[var(--color-ink-muted)]">
            下一级{' '}
            <strong
              className="font-semibold"
              style={{ color: nextMeta?.color ?? 'var(--color-ink-subtle)' }}
            >
              {nextMeta ? nextMeta.labelZh : '已满级'}
            </strong>
          </span>
          <span className="text-[var(--color-ink-subtle)]">·</span>
          <span className="text-[var(--color-ink-muted)]">
            还差{' '}
            <strong className="font-semibold text-[var(--color-ink)]">
              {remaining === null ? '—' : remaining}
            </strong>
          </span>
          <span className="text-[var(--color-ink-subtle)]">·</span>
          <span className="tabular-nums text-[var(--color-ink-muted)]">{percent}%</span>
        </div>
      )}
    </div>
  );
}

interface TierLadderProps {
  tiers: { id: string; level: TierLevel; threshold: number; labelZh: string; descriptionZh: string | null; credibility: string }[];
  currentCount?: number | null;
  className?: string;
}

/** 等级阶梯表格：直观展示每一级的门槛数量 */
export function TierLadder({ tiers, currentCount, className }: TierLadderProps) {
  if (!tiers || tiers.length === 0) {
    return (
      <p className={cn('text-sm text-[var(--color-ink-muted)]', className)}>
        该勋章没有等级阶梯。
      </p>
    );
  }

  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);

  return (
    <ol className={cn('space-y-2', className)}>
      {sorted.map((tier) => {
        const meta = TIER_META[tier.level];
        const reached =
          currentCount != null && currentCount >= tier.threshold;
        return (
          <li
            key={tier.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2.5"
            style={
              reached
                ? {
                    borderColor: `color-mix(in oklab, ${meta.color} 45%, transparent)`,
                    backgroundColor: `color-mix(in oklab, ${meta.color} 8%, transparent)`,
                  }
                : undefined
            }
          >
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{
                backgroundColor: `color-mix(in oklab, ${meta.color} 18%, transparent)`,
                color: meta.color,
              }}
            >
              {meta.order}
            </span>
            <span className="text-sm font-semibold" style={{ color: meta.color }}>
              {tier.labelZh}
            </span>
            <span className="text-sm text-[var(--color-ink-muted)]">
              需要 <strong className="tabular-nums text-[var(--color-ink)]">{tier.threshold}</strong> 次
            </span>
            {reached && (
              <span className="chip border-[var(--color-success)]/40 text-[var(--color-success)]">
                已达标
              </span>
            )}
            {tier.descriptionZh && (
              <span className="w-full text-xs leading-relaxed text-[var(--color-ink-subtle)] sm:w-auto sm:flex-1">
                {tier.descriptionZh}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
