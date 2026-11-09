import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GuidesClient } from './guides-client';

export const metadata: Metadata = {
  title: '获取攻略',
  description:
    '按入门、Git 基础、仓库、Issues、Pull Requests、Actions、开源贡献、Sponsors、成就技巧等主题整理的 GitHub 成就系统知识库，附学习路径与可信度说明。',
  alternates: { canonical: '/guides' },
};

/**
 * 薄壳：分类 / 分页状态由客户端从 URL query 读取，页面不再依赖 `searchParams`。
 */
export default function GuidesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-[var(--color-ink-muted)]">
          正在加载攻略…
        </div>
      }
    >
      <GuidesClient />
    </Suspense>
  );
}
