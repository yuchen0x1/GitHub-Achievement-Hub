'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 便于在浏览器控制台 / 日志平台定位问题
    console.error('[gach] 页面渲染出错：', error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-xl items-center px-4 py-12">
      <div className="surface-raised w-full p-6 text-center sm:p-8">
        <span
          className="mx-auto grid h-14 w-14 place-items-center rounded-full"
          style={{
            color: 'var(--color-danger)',
            backgroundColor: 'color-mix(in oklab, var(--color-danger) 14%, transparent)',
          }}
        >
          <AlertTriangle size={26} />
        </span>

        <h1 className="mt-5 text-xl font-bold tracking-tight">页面出了点问题</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          这一页在渲染时发生了未预期的错误。你可以重试，或先返回首页；如果问题持续出现，欢迎通过反馈告知我们。
        </p>

        {isDev && (
          <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              开发环境错误信息
            </p>
            <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[var(--color-danger)]">
              {error.message || '未知错误'}
              {error.digest ? `\n\ndigest: ${error.digest}` : ''}
            </pre>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => reset()}>
            <RotateCcw size={14} />
            重试
          </button>
          <Link href="/" className="btn btn-secondary btn-sm">
            <Home size={14} />
            返回首页
          </Link>
          <Link href="/faq" className="btn btn-ghost btn-sm">
            查看常见问题
          </Link>
        </div>
      </div>
    </div>
  );
}
