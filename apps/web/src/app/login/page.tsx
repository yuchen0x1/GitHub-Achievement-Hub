import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginClientPage } from './login-client';

export const metadata: Metadata = {
  title: '登录 / 注册',
  description:
    '登录 GitHub Achievement Hub，管理你的成就收藏与进度，或注册一个新账号。',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
};

/**
 * 薄壳：`next` 参数由客户端从 URL query 读取，页面不再接收 `searchParams`。
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-12 text-sm text-[var(--color-ink-muted)]">
          正在加载登录页面…
        </div>
      }
    >
      <LoginClientPage />
    </Suspense>
  );
}
