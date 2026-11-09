import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string } | null;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn(align === 'center' && 'sm:text-center')}>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {eyebrow}
          </p>
        )}
        <h2 className="section-title">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="btn btn-secondary btn-sm shrink-0 self-start sm:self-auto"
        >
          {action.label}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
