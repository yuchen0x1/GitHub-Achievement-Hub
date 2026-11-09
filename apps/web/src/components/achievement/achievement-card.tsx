import { AlertTriangle, Check, Star } from 'lucide-react';
import Link from 'next/link';
import type { Achievement, TierLevel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { difficultyStars } from '@/lib/tier';
import { BadgeImage } from './badge-image';
import { AvailabilityBadge } from './availability-badge';
import { CredibilityBadge } from './credibility-badge';
import { TierBadge } from './tier-badge';

/**
 * 勋章卡片的六种状态：
 * normal / earned / not-earned / favorited / limited / to-be-verified
 */
export type AchievementCardState =
  | 'normal'
  | 'earned'
  | 'not-earned'
  | 'favorited'
  | 'limited'
  | 'to-be-verified';

interface AchievementCardProps {
  achievement: Achievement;
  state?: AchievementCardState;
  tierLevel?: TierLevel | null;
  /** 右上角标记（例如「已获得」「待验证」） */
  badge?: string;
  className?: string;
  /** 是否显示难度星级 */
  showDifficulty?: boolean;
}

const STATE_STYLES: Record<
  AchievementCardState,
  { ring: string; dim: boolean; overlay: string | null }
> = {
  normal: { ring: '', dim: false, overlay: null },
  earned: {
    ring: 'border-[var(--color-success)]/55 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-success)_28%,transparent)]',
    dim: false,
    overlay: null,
  },
  'not-earned': { ring: '', dim: true, overlay: null },
  favorited: {
    ring: 'border-[var(--color-accent)]/55',
    dim: false,
    overlay: null,
  },
  limited: { ring: 'border-[var(--color-warning)]/55', dim: false, overlay: null },
  'to-be-verified': { ring: 'border-[#a371f7]/55', dim: false, overlay: null },
};

export function AchievementCard({
  achievement,
  state = 'normal',
  tierLevel,
  badge,
  className,
  showDifficulty = true,
}: AchievementCardProps) {
  const style = STATE_STYLES[state];
  const href = `/achievements/${achievement.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-lift)]',
        style.ring,
        className,
      )}
    >
      {/* 状态角标 */}
      {state === 'earned' && (
        <span
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-white"
          style={{ backgroundColor: 'var(--color-success)' }}
          title="已获得"
        >
          <Check size={14} strokeWidth={3} />
        </span>
      )}
      {state === 'favorited' && (
        <span
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-white"
          style={{ backgroundColor: 'var(--color-accent)' }}
          title="已收藏"
        >
          <Star size={13} strokeWidth={2.6} fill="currentColor" />
        </span>
      )}
      {state === 'not-earned' && (
        <span
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-ink-subtle)]"
          title="未获得"
        >
          <span className="h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {state === 'to-be-verified' && (
        <span
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-white"
          style={{ backgroundColor: '#a371f7' }}
          title="资料待验证"
        >
          <AlertTriangle size={13} strokeWidth={2.6} />
        </span>
      )}

      {/* 徽章图 */}
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'badge-frame h-[72px] w-[72px] shrink-0 transition-opacity',
            style.dim && 'opacity-45 grayscale',
          )}
        >
          <BadgeImage src={achievement.imageUrl} alt={achievement.nameZh} size={56} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <AvailabilityBadge availability={achievement.availability} />
            {achievement.uncertain && (
              <CredibilityBadge grade="D" compact />
            )}
          </div>
          <h3 className="mt-1.5 truncate text-[15px] font-bold tracking-tight text-[var(--color-ink)]">
            {achievement.nameZh}
          </h3>
          <p className="truncate text-xs text-[var(--color-ink-subtle)]">
            {achievement.nameEn}
          </p>
        </div>
      </div>

      {/* 简介 */}
      <p
        className={cn(
          'mt-3 line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-[var(--color-ink-muted)]',
          style.dim && 'opacity-80',
        )}
      >
        {achievement.summaryZh}
      </p>

      {/* 底部信息 */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
        {tierLevel && <TierBadge level={tierLevel} />}
        {achievement.hasTiers && !tierLevel && (
          <span className="chip">等级型</span>
        )}
        {showDifficulty && (
          <span className="inline-flex items-center gap-0.5" title={`难度 ${achievement.difficulty}/5`}>
            {difficultyStars(achievement.difficulty).map((on, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  on
                    ? 'bg-[var(--color-warning)]'
                    : 'bg-[var(--color-border-strong)]',
                )}
              />
            ))}
          </span>
        )}
        {badge && <span className="chip ml-auto">{badge}</span>}
      </div>
    </Link>
  );
}

/** 骨架屏占位（加载态） */
export function AchievementCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex gap-3.5">
        <div className="h-[72px] w-[72px] shrink-0 rounded-xl bg-[var(--color-surface-sunken)]" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-16 rounded bg-[var(--color-surface-sunken)]" />
          <div className="h-4 w-32 rounded bg-[var(--color-surface-sunken)]" />
          <div className="h-3 w-20 rounded bg-[var(--color-surface-sunken)]" />
        </div>
      </div>
      <div className="mt-3 h-8 rounded bg-[var(--color-surface-sunken)]" />
    </div>
  );
}
