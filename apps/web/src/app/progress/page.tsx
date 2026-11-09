import type { Metadata } from 'next';
import { Container, PageHeader } from '@/components/common/layout';
import { ProgressClient } from './progress-client';

export const metadata: Metadata = {
  title: '成就进度',
  description:
    '追踪分级勋章的当前数量，按公开门槛推算下一等级。所有进度均为手动记录与门槛推算，不代表 GitHub 官方实时成就状态。',
  alternates: { canonical: '/progress' },
};

export default function ProgressPage() {
  return (
    <Container size="md" className="py-8 sm:py-10">
      <PageHeader
        eyebrow="我的"
        title="成就进度"
        description="记录 Pull Shark、Starstruck 等分级勋章的累计数量，自动推算当前等级与「还差多少次」。数据由你手动维护，结果按公开门槛推算。"
      />

      <div className="mt-6">
        <ProgressClient />
      </div>
    </Container>
  );
}
