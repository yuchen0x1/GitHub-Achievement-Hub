import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string } | null;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-14 text-center',
        className,
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-ink-subtle)]">
        {icon ?? <SearchX size={22} />}
      </div>
      <p className="mt-4 text-base font-semibold">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--color-ink-muted)]">
          {description}
        </p>
      )}
      {action && (
        <Link href={action.href} className="btn btn-secondary btn-sm mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}
