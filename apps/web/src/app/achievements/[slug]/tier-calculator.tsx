'use client';

import { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { computeTierProgress } from '@gach/shared';
import type { Tier, TierProgress } from '@/lib/types';
import { CredibilityBadge } from '@/components/achievement/credibility-badge';
import { TierProgressBar } from '@/components/achievement/tier-progress';
import { Notice } from '@/components/common/layout';

interface TierCalculatorProps {
  tiers: Tier[];
  className?: string;
}

/**
 * 等级推算器。
 *
 * 输入当前累计数量，依据数据库中记录的公开门槛数值推算当前等级 / 下一等级 / 还差多少 / 百分比。
 *
 * 重要：这是「依据公开门槛的推算结果」，不代表 GitHub 官方的实时成就状态 ——
 * GitHub 官方并未公布分级门槛的准确数值，本站数值来自社区多源一致记录。
 */
export function TierCalculator({ tiers, className }: TierCalculatorProps) {
  const [raw, setRaw] = useState('0');

  const sorted = useMemo(
    () => [...tiers].sort((a, b) => a.threshold - b.threshold),
    [tiers],
  );

  const count = Number.parseInt(raw, 10);
  const currentCount = Number.isFinite(count) && count > 0 ? count : 0;

  const progress: TierProgress = useMemo(
    () =>
      computeTierProgress({
        tierThresholds: sorted.map((t) => ({
          level: t.level,
          threshold: t.threshold,
        })),
        currentCount,
      }),
    [sorted, currentCount],
  );

  if (sorted.length === 0) {
    return (
      <p className={className}>
        <span className="muted text-sm">该勋章没有等级阶梯，无需推算等级。</span>
      </p>
    );
  }

  const currentTier = sorted.find((t) => t.level === progress.currentLevel) ?? null;
  const nextTier = sorted.find((t) => t.level === progress.nextLevel) ?? null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[12rem]">
          <span className="mb-1.5 block text-xs font-medium text-[var(--color-ink-muted)]">
            你当前的累计数量
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="例如 16"
            className="field"
            aria-label="输入当前累计数量以推算等级"
          />
        </label>
        <div className="pb-1">
          <span className="mb-1.5 block text-xs font-medium text-[var(--color-ink-subtle)]">
            快速填入门槛值
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRaw(String(t.threshold))}
                className="chip transition-colors hover:text-[var(--color-accent)]"
                title={t.labelZh}
              >
                {t.threshold}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Calculator size={15} className="text-[var(--color-accent)]" />
          <span className="text-sm font-semibold">推算结果</span>
          <span className="chip">依据公开门槛推算</span>
        </div>

        <TierProgressBar progress={progress} />

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--color-ink-subtle)]">当前等级</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {currentTier ? currentTier.labelZh : '尚未达到任何等级门槛'}
              {currentTier && (
                <span className="ml-2">
                  <CredibilityBadge grade={currentTier.credibility} compact />
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-ink-subtle)]">下一等级</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {nextTier ? nextTier.labelZh : '已达最高等级'}
              {nextTier && (
                <span className="ml-2">
                  <CredibilityBadge grade={nextTier.credibility} compact />
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-ink-subtle)]">还差数量</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">
              {progress.remaining === null ? '—' : `${progress.remaining} 次`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-ink-subtle)]">当前区间进度</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">
              {progress.percent}%
            </dd>
          </div>
        </dl>

        {nextTier?.sourceNote && (
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>门槛来源说明：{nextTier.sourceNote}</span>
          </p>
        )}
      </div>

      <Notice tone="warning" className="mt-4">
        推算结果基于公开门槛数值推算，<strong>不代表 GitHub 官方实时成就状态</strong>。
        GitHub 官方至今未公布分级门槛的准确数值，本站门槛数值来自多个社区来源的一致记录，
        因此可信度等级仅为 C 级（多源一致）。请以你的资料页实际显示为准。
      </Notice>
    </div>
  );
}
