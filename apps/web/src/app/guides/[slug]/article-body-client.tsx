'use client';

import { useEffect, useRef } from 'react';
import { MarkdownViewer } from '@/components/markdown/markdown-viewer';
import { copyToClipboard } from '@/lib/utils';

interface ArticleBodyProps {
  content: string;
  className?: string;
}

/**
 * 正文渲染 + 代码块复制按钮。
 *
 * 共享的 MarkdownViewer 不提供复制能力，且不允许修改（由他人维护）。
 * 这里在客户端对渲染后的每个 <pre> 注入一个复制按钮，只操作 DOM，
 * 不改变 Markdown 原文与渲染结果。
 */
export function ArticleBody({ content, className }: ArticleBodyProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];
    const pres = Array.from(root.querySelectorAll('pre'));

    for (const pre of pres) {
      if (pre.querySelector('[data-copy-code]')) continue;

      pre.style.position = 'relative';
      // 给右上角按钮留出空间，避免遮挡第一行代码
      pre.style.paddingTop = '2.4rem';

      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.copyCode = 'true';
      button.textContent = '复制';
      button.setAttribute('aria-label', '复制代码到剪贴板');
      Object.assign(button.style, {
        position: 'absolute',
        top: '0.55rem',
        right: '0.55rem',
        zIndex: '1',
        height: '1.65rem',
        padding: '0 0.6rem',
        borderRadius: '0.4rem',
        border: '1px solid var(--color-border-strong)',
        backgroundColor: 'var(--color-surface-raised)',
        color: 'var(--color-ink-muted)',
        fontSize: '11px',
        fontFamily: 'inherit',
        lineHeight: '1',
        cursor: 'pointer',
        transition: 'color 0.15s ease, border-color 0.15s ease',
      });

      let timer: number | undefined;

      const handleClick = async () => {
        const code = pre.querySelector('code');
        const text = code?.textContent ?? pre.textContent ?? '';
        const ok = await copyToClipboard(text);
        button.textContent = ok ? '已复制' : '复制失败';
        button.style.color = ok ? 'var(--color-success)' : 'var(--color-danger)';
        button.style.borderColor = ok
          ? 'var(--color-success)'
          : 'var(--color-danger)';

        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          button.textContent = '复制';
          button.style.color = 'var(--color-ink-muted)';
          button.style.borderColor = 'var(--color-border-strong)';
        }, 1600);
      };

      button.addEventListener('click', handleClick);
      pre.appendChild(button);

      cleanups.push(() => {
        button.removeEventListener('click', handleClick);
        if (timer) window.clearTimeout(timer);
        button.remove();
        pre.style.position = '';
        pre.style.paddingTop = '';
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [content]);

  return (
    <div ref={rootRef} className={className}>
      <MarkdownViewer content={content} />
    </div>
  );
}
