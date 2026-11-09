import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container, PageHeader } from '@/components/common/layout';
import { SearchClient } from './search-client';

export const metadata: Metadata = {
  title: '站内搜索',
  description:
    '全站搜索：勋章名称（中英文）、获取条件、勋章简介、slug、攻略标题与摘要、常见问题（中英文）。',
  alternates: { canonical: '/search' },
};

/**
 * 薄壳：关键词 / 分区 / 分页全部由客户端从 URL query 读取并取数，
 * 页面本身不接收 `searchParams`，因此可静态导出。
 */
export default function SearchPage() {
  return (
    <Container size="lg" className="py-8 sm:py-10">
      <PageHeader
        eyebrow="Search"
        title="站内搜索"
        description="一个搜索框同时检索勋章、获取攻略与常见问题。中文与英文内容都可以搜。"
      >
        <Suspense
          fallback={
            <p className="text-sm text-[var(--color-ink-muted)]">
              正在准备搜索…
            </p>
          }
        >
          <SearchClient />
        </Suspense>
      </PageHeader>
    </Container>
  );
}
