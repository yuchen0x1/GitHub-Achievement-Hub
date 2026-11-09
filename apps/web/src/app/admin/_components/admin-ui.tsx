'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_VAR, type Tone } from './admin-types';

// ---------------------------------------------------------------------------
// 页面结构
// ---------------------------------------------------------------------------

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('surface-raised overflow-hidden', className)}>
      {(title || description || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'accent',
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone?: Tone;
}) {
  const color = `var(${TONE_VAR[tone]})`;
  return (
    <div className="surface-raised relative overflow-hidden p-4">
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: `color-mix(in oklab, ${color} 65%, transparent)` }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        </div>
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
          style={{
            color,
            backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
          }}
        >
          {icon}
        </span>
      </div>
      {hint && (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">{hint}</p>
      )}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
  );
}

// ---------------------------------------------------------------------------
// 表单
// ---------------------------------------------------------------------------

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)]">
        {label}
        {required && <span className="text-[var(--color-danger)]">*</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
          {hint}
        </span>
      )}
    </label>
  );
}

export function TextInput({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn('field', className)} />;
}

export function TextArea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cn('field h-auto min-h-20 py-2 leading-relaxed', className)} />;
}

export function SelectInput({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select {...rest} className={cn('field appearance-none pr-8', className)}>
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
        aria-hidden
      />
    </span>
  );
}

export function CheckboxRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--color-border)] p-2.5 transition-colors hover:bg-[var(--color-surface-raised)]">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
      />
      <span className="min-w-0">
        <span className="block text-xs font-semibold">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜索…',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <span className={cn('relative block w-full sm:w-64', className)}>
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field pl-9"
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// 徽标 / 标签页
// ---------------------------------------------------------------------------

export function Badge({
  tone = 'muted',
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const color = `var(${TONE_VAR[tone]})`;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium',
        className,
      )}
      style={{
        color,
        borderColor: `color-mix(in oklab, ${color} 38%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-1',
        className,
      )}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
            value === item.value
              ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-card)]'
              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="rounded-full bg-[var(--color-surface-raised)] px-1.5 text-[10px] tabular-nums text-[var(--color-ink-subtle)]">
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 弹层
// ---------------------------------------------------------------------------

const OVERLAY = { backgroundColor: 'rgba(1, 4, 9, 0.62)' };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0" style={OVERLAY} onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'surface-raised relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-b-none sm:rounded-[var(--radius-card)]',
          widths[width],
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm -mr-2 shrink-0"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0" style={OVERLAY} onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="surface-raised absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-[var(--color-border)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            {subtitle && (
              <p className="mt-1 truncate text-xs text-[var(--color-ink-subtle)]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm -mr-2 shrink-0"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认删除',
  tone = 'danger',
  requireText,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'warning' | 'accent';
  requireText?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const ready = !requireText || typed.trim() === requireText;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={
              tone === 'danger'
                ? { backgroundColor: 'var(--color-danger)' }
                : tone === 'warning'
                  ? { backgroundColor: 'var(--color-warning)', color: '#fff' }
                  : undefined
            }
            onClick={onConfirm}
            disabled={!ready || busy}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
          <div className="text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            {description}
          </div>
        </div>
        {requireText && (
          <Field
            label={`请输入 ${requireText} 以确认`}
            hint="此操作不可撤销，请确认对象无误。"
            required
          >
            <TextInput
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoFocus
              placeholder={requireText}
            />
          </Field>
        )}
        {error && (
          <p className="text-xs leading-relaxed text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// 表格 / 状态
// ---------------------------------------------------------------------------

export const TH =
  'whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]';
export const TD = 'px-3 py-3 align-top text-[13px]';

export function TableWrap({
  children,
  className,
  minWidth = 720,
}: {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]',
        className,
      )}
    >
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function PaginationBar({
  page,
  totalPages,
  onChange,
  total,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total?: number;
  className?: string;
}) {
  if (totalPages <= 1 && total === undefined) return null;
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <p className="text-[11px] text-[var(--color-ink-subtle)]">
        {total !== undefined ? `共 ${total} 条 · ` : ''}
        第 {page} / {Math.max(1, totalPages)} 页
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="上一页"
        >
          <ChevronLeft size={14} />
          上一页
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="下一页"
        >
          下一页
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function LoadingBlock({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--color-ink-muted)]">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-surface-raised)] p-4">
      <div className="flex items-start gap-2.5 text-[13px] leading-relaxed">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--color-danger)]">数据加载失败</p>
          <p className="mt-1 text-[var(--color-ink-muted)]">{message}</p>
          {onRetry && (
            <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={onRetry}>
              <RefreshCw size={13} />
              重试
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyBlock({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-ink-subtle)]">
        <Inbox size={20} />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-xs leading-relaxed text-[var(--color-ink-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--color-danger)]">
      {message}
    </p>
  );
}
