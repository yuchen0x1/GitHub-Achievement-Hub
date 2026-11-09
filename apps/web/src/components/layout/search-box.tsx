'use client';

import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Suggestion {
  type: 'achievement';
  label: string;
  labelEn: string;
  slug: string;
  imageUrl: string | null;
}

export function SearchBox({
  className,
  autoFocus,
  placeholder = '搜索勋章、条件或教程…',
}: {
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 防抖搜索建议
  useEffect(() => {
    const keyword = q.trim();
    if (keyword.length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/search/suggest?q=${encodeURIComponent(keyword)}&limit=6`,
        );
        if (res.ok) {
          const data = (await res.json()) as Suggestion[];
          setSuggestions(data);
        }
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [q]);

  // 点击外部关闭
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // ⌘K / Ctrl+K 聚焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    router.push(href);
  };

  const submit = () => {
    const keyword = q.trim();
    if (!keyword) return;
    go(`/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        role="search"
      >
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
        />
        <input
          ref={inputRef}
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, -1));
            } else if (e.key === 'Enter' && active >= 0 && suggestions[active]) {
              e.preventDefault();
              go(`/achievements/${suggestions[active].slug}`);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label="搜索勋章"
          className="field pl-9 pr-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              inputRef.current?.focus();
            }}
            aria-label="清空搜索"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-ink-subtle)] transition-colors hover:text-[var(--color-ink)]"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {open && suggestions.length > 0 && (
        <ul className="surface absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden p-1 shadow-[var(--shadow-lift)]">
          {suggestions.map((s, i) => (
            <li key={s.slug}>
              <Link
                href={`/achievements/${s.slug}`}
                onClick={() => {
                  setOpen(false);
                  setQ('');
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
                  active === i
                    ? 'bg-[var(--color-surface-sunken)]'
                    : 'hover:bg-[var(--color-surface-sunken)]',
                )}
              >
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0 rounded"
                  />
                ) : (
                  <span className="h-6 w-6 shrink-0 rounded bg-[var(--color-surface-sunken)]" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {s.label}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-ink-subtle)]">
                    {s.labelEn}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t border-[var(--color-border)] pt-1">
            <button
              type="button"
              onClick={submit}
              className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunken)]"
            >
              查看「{q}」的全部结果 →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
