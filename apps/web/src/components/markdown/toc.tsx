'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

interface TocProps {
  items: TocEntry[];
  className?: string;
}

/** 文章目录（带滚动高亮） */
export function Toc({ items, className }: TocProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (!items.length) return;
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-88px 0px -70% 0px', threshold: [0, 1] },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className={cn('text-sm', className)} aria-label="文章目录">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
        目录
      </p>
      <ul className="space-y-0.5 border-l border-[var(--color-border)]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={() => setActiveId(item.id)}
              className={cn(
                'block border-l-2 py-1.5 pr-2 leading-snug transition-colors',
                item.level === 3 && 'pl-6 text-[13px]',
                item.level >= 4 && 'pl-9 text-[13px]',
                item.level === 2 && 'pl-4',
                activeId === item.id
                  ? 'border-[var(--color-accent)] font-medium text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-ink-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
