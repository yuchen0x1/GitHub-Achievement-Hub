'use client';

import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** 图片尺寸（像素），用于占位与滤镜 */
  size?: number;
}

/**
 * 勋章图片。
 * GitHub 官方徽章图片托管在 github.githubassets.com，
 * 远程图片可能加载失败或被网络策略拦截，因此必须有优雅降级。
 */
export function BadgeImage({ src, alt, className, size = 96 }: BadgeImageProps) {
  const containerClass = cn('relative grid place-items-center', className);

  if (!src) {
    return (
      <span
        className={cn(
          containerClass,
          'rounded-full border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)]',
        )}
        style={{ width: size, height: size }}
        role="img"
        aria-label={alt}
      >
        <Award size={size * 0.42} className="text-[var(--color-ink-subtle)]" />
      </span>
    );
  }

  return (
    <span className={cn(containerClass, 'overflow-hidden')} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={size}
        height={size}
        className="h-full w-full object-contain transition-transform duration-300"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = 'none';
          const parent = el.parentElement;
          if (parent && !parent.querySelector('[data-fallback]')) {
            const fallback = document.createElement('span');
            fallback.setAttribute('data-fallback', 'true');
            fallback.className =
              'absolute inset-0 grid place-items-center rounded-full border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)]';
            fallback.innerHTML =
              '<svg viewBox="0 0 24 24" width="40%" height="40%" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-ink-subtle)"><circle cx="12" cy="8" r="6"/><path d="M8.2 13.9 7 22l5-3 5 3-1.2-8.1"/></svg>';
            parent.appendChild(fallback);
          }
        }}
      />
    </span>
  );
}
