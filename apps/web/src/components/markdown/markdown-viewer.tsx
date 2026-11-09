'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { slugify } from '@/lib/slug';
import { cn } from '@/lib/utils';

/** 把标题的纯文本提取出来（去掉 Markdown 内联标记） */
function toText(node: unknown): string {
  if (node == null || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(toText).join('');
  if (typeof node === 'object' && 'props' in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props;
    return toText(props?.children);
  }
  return '';
}

const components: Components = {
  h2({ children, ...props }) {
    const text = toText(children);
    return (
      <h2 id={slugify(text)} {...props}>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }) {
    const text = toText(children);
    return (
      <h3 id={slugify(text)} {...props}>
        {children}
      </h3>
    );
  },
  h4({ children, ...props }) {
    const text = toText(children);
    return (
      <h4 id={slugify(text)} {...props}>
        {children}
      </h4>
    );
  },
  a({ href, children, ...props }) {
    const external = typeof href === 'string' && /^https?:\/\//i.test(href);
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
  table({ children, ...props }) {
    return (
      <div className="my-5 overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table {...props}>{children}</table>
      </div>
    );
  },
  code({ className, children, ...props }) {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code {...props}>
        {children}
      </code>
    );
  },
};

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div className={cn('prose-gach', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
