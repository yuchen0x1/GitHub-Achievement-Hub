import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AchievementsClient } from './achievements-client';

export const metadata: Metadata = {
  title: '勋章图鉴',
  description:
    'GitHub 个人资料成就勋章图鉴：按状态、难度、分类与热度筛选，查看每枚勋章的获取条件、等级门槛与资料来源可信度。',
  alternates: { canonical: '/achievements' },
};

/**
 * 薄壳：筛选/分页状态全部由客户端从 URL query 读取。
 * 导出模式没有服务端渲染，页面不能依赖 `searchParams`。
 */
export default function AchievementsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-[var(--color-ink-muted)]">
          正在加载勋章图鉴…
        </div>
      }
    >
      <AchievementsClient />
    </Suspense>
  );
}
