'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** 构造某一页的 URL */
  buildHref: (page: number) => string;
  className?: string;
}

export function Pagination({ page, totalPages, buildHref, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}
      aria-label="分页导航"
    >
      <PageLink
        href={buildHref(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label="上一页"
      >
        <ChevronLeft size={16} />
      </PageLink>

      {pages.map((p, i) =>
        p === '…' ? (
          <span
            key={`gap-${i}`}
            className="px-1.5 text-sm text-[var(--color-ink-subtle)]"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-sm font-medium transition-colors',
              p === page
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]',
            )}
          >
            {p}
          </Link>
        ),
      )}

      <PageLink
        href={buildHref(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        aria-label="下一页"
      >
        <ChevronRight size={16} />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...rest
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'>) {
  const className = cn(
    'grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] transition-colors',
    disabled
      ? 'pointer-events-none opacity-40'
      : 'hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]',
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

function pageWindow(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);

  if (start > 2) out.push('…');
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);

  return out;
}
