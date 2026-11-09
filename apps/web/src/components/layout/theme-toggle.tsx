'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)]',
          className,
        )}
        aria-hidden
      />
    );
  }

  const options: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'light', label: '浅色主题', icon: <Sun size={16} /> },
    { key: 'dark', label: '深色主题', icon: <Moon size={16} /> },
    { key: 'system', label: '跟随系统', icon: <Monitor size={16} /> },
  ];

  const current = theme === 'system' ? 'system' : (resolvedTheme ?? 'dark');

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-0.5',
        className,
      )}
      role="group"
      aria-label="主题切换"
    >
      {options.map((opt) => {
        const active = current === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTheme(opt.key)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              active
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
            )}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
