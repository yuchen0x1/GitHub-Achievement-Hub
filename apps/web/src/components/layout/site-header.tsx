'use client';

import { Award, LayoutDashboard, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { SearchBox } from './search-box';

const NAV = [
  { href: '/', label: '首页' },
  { href: '/achievements', label: '勋章图鉴' },
  { href: '/guides', label: '获取攻略' },
  { href: '/achievements/tiers', label: '勋章等级' },
  { href: '/github-profile', label: '成就查询' },
  { href: '/faq', label: '常见问题' },
  { href: '/about', label: '关于本站' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="返回首页">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-accent)] text-white shadow-[var(--shadow-card)]">
            <Award size={19} strokeWidth={2.4} />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[15px] font-bold tracking-tight">
              GitHub Achievement
            </span>
            <span className="block text-[11px] font-medium text-[var(--color-ink-subtle)]">
              成就勋章百科
            </span>
          </span>
        </Link>

        {/* 主导航 */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="主导航">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink)]'
                  : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]',
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchBox className="hidden w-64 xl:block" />

          <ThemeToggle className="hidden sm:flex" />

          {/* 登录区 */}
          {hydrated && user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/collection"
                className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)] sm:flex"
              >
                <Award size={15} />
                收藏馆
              </Link>
              {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)] md:flex"
                >
                  <LayoutDashboard size={15} />
                  后台
                </Link>
              )}
              <div className="group relative">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg p-1 transition-colors hover:bg-[var(--color-surface-raised)]"
                  aria-label="账号菜单"
                >
                  <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-[var(--color-surface-sunken)] text-xs font-bold">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (user.displayName || user.email).slice(0, 1).toUpperCase()
                    )}
                  </span>
                </button>
                <div className="invisible absolute right-0 top-full z-50 w-48 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="surface overflow-hidden p-1 shadow-[var(--shadow-lift)]">
                    <div className="px-2.5 py-2">
                      <p className="truncate text-sm font-semibold">
                        {user.displayName}
                      </p>
                      <p className="truncate text-xs text-[var(--color-ink-subtle)]">
                        {user.email}
                      </p>
                    </div>
                    <div className="my-1 h-px bg-[var(--color-border)]" />
                    <Link
                      href="/collection"
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
                    >
                      <Award size={14} /> 我的收藏馆
                    </Link>
                    <Link
                      href="/progress"
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
                    >
                      <LayoutDashboard size={14} /> 我的成就进度
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        router.push('/');
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
                    >
                      <LogOut size={14} /> 退出登录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn btn-secondary btn-sm">
              <LogIn size={14} />
              <span className="hidden sm:inline">登录</span>
            </Link>
          )}

          {/* 移动端菜单按钮 */}
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] lg:hidden"
          >
            <span className="relative block h-3.5 w-4">
              <span
                className={cn(
                  'absolute left-0 h-0.5 w-4 rounded bg-current transition-all',
                  mobileOpen ? 'top-1.5 rotate-45' : 'top-0',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 top-1.5 h-0.5 w-4 rounded bg-current transition-all',
                  mobileOpen ? 'opacity-0' : 'opacity-100',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 h-0.5 w-4 rounded bg-current transition-all',
                  mobileOpen ? 'top-1.5 -rotate-45' : 'top-3',
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* 移动端面板 */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="animate-fade border-t border-[var(--color-border)] lg:hidden"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setMobileOpen(false);
              mobileMenuButtonRef.current?.focus();
            }
          }}
        >
          <div className="space-y-3 px-4 py-4 sm:px-6">
            <SearchBox className="w-full" />
            <nav className="grid grid-cols-2 gap-1" aria-label="移动端导航">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)]',
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/collection"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)]"
              >
                我的收藏馆
              </Link>
              <Link
                href="/progress"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)]"
              >
                我的进度
              </Link>
            </nav>
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
              <span className="text-xs text-[var(--color-ink-subtle)]">主题</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
