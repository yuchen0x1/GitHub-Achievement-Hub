import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container } from '@/components/common/layout';
import { GithubProfileResultClient } from './profile-client';

interface PageProps {
  params: Promise<{ username: string }>;
}

/**
 * 用户名无法在构建期枚举，导出一个哨兵页。
 * 真实用户名由客户端从 `?u=` 读取（见 profile-client.tsx）。
 */
export async function generateStaticParams(): Promise<{ username: string }[]> {
  return [{ username: '_' }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const handle = decodeURIComponent(username);

  if (handle === '_') {
    return {
      title: 'GitHub 成就查询结果',
      description:
        '查看任意公开 GitHub 账号通过官方公开 API 暴露的公开徽章，以及本站勋章库的逐条对照。',
      alternates: { canonical: '/github-profile' },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${handle} 的 GitHub 成就查询结果`,
    description: `查看 ${handle} 通过 GitHub 官方公开 API 暴露的公开徽章，以及本站勋章库的逐条对照。无法从 API 读取的勋章标注为「数据不可用」，不代表未获得。`,
    alternates: { canonical: `/github-profile/${encodeURIComponent(handle)}` },
    openGraph: {
      type: 'profile',
      title: `${handle} 的 GitHub 成就查询结果`,
      description:
        '基于 GitHub 官方公开 API 的成就对照，严格区分「已获得」「数据不可用」「已无法获取」。',
      url: `/github-profile/${encodeURIComponent(handle)}`,
    },
  };
}

export default function GithubProfileResultPage() {
  return (
    <Container size="lg" className="py-8 sm:py-10">
      <Suspense
        fallback={
          <p className="surface p-6 text-sm text-[var(--color-ink-muted)]">
            正在准备查询…
          </p>
        }
      >
        <GithubProfileResultClient />
      </Suspense>
    </Container>
  );
}
