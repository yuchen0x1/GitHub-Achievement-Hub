import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AuthHydrator } from '@/components/layout/auth-hydrator';
import { DesktopUpdater } from '@/components/layout/desktop-updater';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'GitHub Achievement Hub — 解锁每一枚 GitHub 成就勋章',
    template: '%s | GitHub Achievement Hub',
  },
  description:
    'GitHub 个人资料成就勋章百科：收录全部已知勋章的获取条件、等级门槛、解锁难度与完整操作步骤，' +
    '每一条资料都标注来源与可信度等级。',
  keywords: [
    'GitHub 成就',
    'GitHub 勋章',
    'GitHub Achievements',
    'Pull Shark',
    'YOLO',
    'Quickdraw',
    'Starstruck',
    'Galaxy Brain',
    'Pair Extraordinaire',
    'GitHub 徽章',
    'GitHub 成就攻略',
  ],
  authors: [{ name: 'GitHub Achievement Hub 编辑部' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'GitHub Achievement Hub',
    title: 'GitHub Achievement Hub — 解锁每一枚 GitHub 成就勋章',
    description:
      '收录全部已知 GitHub 个人成就勋章的获取条件、等级门槛与完整获取攻略，资料来源可溯源。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GitHub Achievement Hub',
    description: 'GitHub 个人成就勋章百科与获取指南',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthHydrator />
          <div className="flex min-h-dvh flex-col">
            <a
              href="#main-content"
              className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-[var(--color-surface)] px-4 py-2 font-medium text-[var(--color-ink)] shadow-[var(--shadow-lift)] focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent)]"
            >
              跳到主要内容
            </a>
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <DesktopUpdater />
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
