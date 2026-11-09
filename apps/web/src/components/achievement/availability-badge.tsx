import { CircleSlash, Clock, Flame, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import type { Availability } from '@/lib/types';
import { availabilityMeta } from '@/lib/tier';
import { cn } from '@/lib/utils';

const ICONS: Record<Availability, typeof Sparkles> = {
  AVAILABLE: Sparkles,
  TIERED: Layers,
  LIMITED: Clock,
  DISCONTINUED: CircleSlash,
  TESTING: Flame,
  INTERNAL: ShieldCheck,
};

interface AvailabilityBadgeProps {
  availability: Availability;
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}

/** 获取状态徽标：颜色 + 图标 + 中英文标签 */
export function AvailabilityBadge({
  availability,
  size = 'sm',
  className,
  showLabel = true,
}: AvailabilityBadgeProps) {
  const meta = availabilityMeta(availability);
  const Icon = ICONS[availability] ?? Sparkles;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 40%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
      }}
      title={meta.description}
    >
      <Icon size={size === 'sm' ? 11 : 13} strokeWidth={2.2} />
      {showLabel && <span>{meta.labelZh}</span>}
    </span>
  );
}
