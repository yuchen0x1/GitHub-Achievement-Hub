import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { apiFetchSafe } from '@/lib/api';
import type { FaqItem } from '@/lib/types';
import { Container, Notice, PageHeader } from '@/components/common/layout';
import { FaqClient } from './faq-client';

export const metadata: Metadata = {
  title: '常见问题',
  description:
    'GitHub 成就与本站的常见问题：勋章何时出现、等级门槛是否官方公布、资料可信度如何分级、反馈与纠错渠道等。',
  alternates: { canonical: '/faq' },
};

export default async function FaqPage() {
  const faq = await apiFetchSafe<FaqItem[]>('/faq', { revalidate: 600 });
  const items = faq ?? [];

  return (
    <Container size="md" className="animate-fade-up space-y-8 py-8 sm:py-10">
      <PageHeader
        eyebrow="FREQUENTLY ASKED QUESTIONS"
        title="常见问题"
        description="围绕成就机制、可信度、数据来源与本站边界的常见疑问。答案优先引用 GitHub 官方文档；官方未明确说明的部分，会明确标注为社区观察或实测结论，不把推测写成规定。"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-ink-muted)]">
          {faq && (
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle size={13} />
              共 {items.length} 条问题
            </span>
          )}
          <Link href="#feedback" className="font-medium text-[var(--color-accent)] hover:underline">
            没找到答案？直接反馈 →
          </Link>
          <Link href="/about" className="text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)]">
            关于本站
          </Link>
        </div>
      </PageHeader>

      {!faq && (
        <Notice tone="danger">
          常见问题数据暂时无法加载。请确认 API 服务（
          <code className="font-mono text-xs">localhost:4000</code>
          ）已启动，或稍后重试。下方仍可查看本站说明并提交反馈。
        </Notice>
      )}

      <FaqClient items={items} />
    </Container>
  );
}
