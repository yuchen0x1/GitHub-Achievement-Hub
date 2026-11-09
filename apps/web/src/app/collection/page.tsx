import type { Metadata } from 'next';
import { Container, PageHeader } from '@/components/common/layout';
import { CollectionClient } from './collection-client';

export const metadata: Metadata = {
  title: '勋章收藏馆',
  description:
    '管理你记录过的 GitHub 成就勋章：已获得、计划获取与收藏，支持编辑获得日期与等级、查看勋章墙、导出 JSON 与打印为 PDF。',
  alternates: { canonical: '/collection' },
};

export default function CollectionPage() {
  return (
    <Container size="lg" className="py-8 sm:py-10">
      <PageHeader
        eyebrow="我的"
        title="勋章收藏馆"
        description="把你在 GitHub 上真正拿到的勋章记录下来，规划下一枚想解锁的成就。所有条目都由你手动维护，与 GitHub 官方数据相互独立。"
      />

      <div className="mt-6">
        <CollectionClient />
      </div>
    </Container>
  );
}
