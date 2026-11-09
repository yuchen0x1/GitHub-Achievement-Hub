import { TIER_META } from '@gach/shared';
import type { TierLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  level: TierLevel;
  className?: string;
  size?: 'sm' | 'md';
  /** 显示中文名还是英文名 */
  lang?: 'zh' | 'en';
}

/** 等级徽标：Default / Bronze / Silver / Gold */
export function TierBadge({ level, className, size = 'sm', lang = 'zh' }: TierBadgeProps) {
  const meta = TIER_META[level];
  if (!meta) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 45%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      {lang === 'zh' ? meta.labelZh : meta.label}
    </span>
  );
}
