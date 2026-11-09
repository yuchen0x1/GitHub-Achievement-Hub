import { HelpCircle } from 'lucide-react';
import { CREDIBILITY_META } from '@gach/shared';
import type { Credibility } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CredibilityBadgeProps {
  grade: Credibility;
  className?: string;
  compact?: boolean;
}

/**
 * 资料可信度分级徽标。
 * 站点内所有"条件 / 门槛"都必须展示可信度，让读者知道这是官方说法还是社区实测。
 */
export function CredibilityBadge({ grade, className, compact }: CredibilityBadgeProps) {
  const meta = CREDIBILITY_META[grade] ?? CREDIBILITY_META.D;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        className,
      )}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 40%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
      }}
      title={`${meta.labelZh} —— ${meta.description}`}
    >
      <HelpCircle size={11} strokeWidth={2.2} />
      {compact ? meta.label : meta.labelZh}
    </span>
  );
}
