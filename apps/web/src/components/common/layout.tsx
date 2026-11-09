import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const SIZES = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  full: 'max-w-none',
};

/** 统一页面容器：控制最大宽度并提供左右安全边距 */
export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        SIZES[size],
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 页面标题区块 */
export function PageHeader({
  title,
  description,
  eyebrow,
  children,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-[var(--color-border)] pb-8', className)}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
      )}
      <h1 className="section-title">{title}</h1>
      {description && (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-muted)] sm:text-base">
          {description}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/** 提示条 */
export function Notice({
  children,
  tone = 'info',
  className,
}: {
  children: React.ReactNode;
  tone?: 'info' | 'warning' | 'danger' | 'success';
  className?: string;
}) {
  const tones = {
    info: 'var(--color-accent)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    success: 'var(--color-success)',
  };
  const color = tones[tone];

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-[13px] leading-relaxed',
        className,
      )}
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 8%, transparent)`,
        color: 'var(--color-ink)',
      }}
    >
      {children}
    </div>
  );
}
