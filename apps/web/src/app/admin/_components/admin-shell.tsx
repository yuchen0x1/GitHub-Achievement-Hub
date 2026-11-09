'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  FolderTree,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  ScrollText,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { AuthUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { describeError, setAdminProfile, setAdminToken } from './admin-api';

const NAV = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { href: '/admin/achievements', label: '勋章管理', icon: Award },
  { href: '/admin/content', label: '分类与 FAQ', icon: FolderTree },
  { href: '/admin/feedback', label: '反馈处理', icon: MessageSquare },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/logs', label: '操作日志', icon: ScrollText },
];

type GuardState = 'checking' | 'anon' | 'forbidden' | 'ok';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GuardState>('checking');
  const [me, setMe] = useState<AuthUser | null>(null);
  const [guardError, setGuardError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 会话校验：直接调用 GET /auth/me（Bearer），
  // 不依赖 auth-store.hydrate 的 refresh（其请求不带 CSRF，会被服务端拒绝）。
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        if (!cancelled) setState('anon');
        return;
      }
      setAdminToken(token);
      try {
        const profile = await apiFetch<AuthUser>('/auth/me', {
          token,
          credentials: 'include',
        });
        if (cancelled) return;
        useAuthStore.getState().setUser(profile);
        setAdminProfile(profile);
        setMe(profile);
        if (profile.role === 'ADMIN' || profile.role === 'EDITOR') {
          setState('ok');
        } else {
          setState('forbidden');
        }
      } catch (error) {
        if (cancelled) return;
        setAdminToken(null);
        setAdminProfile(null);
        setGuardError(describeError(error));
        setState('anon');
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setAdminToken(null);
    setAdminProfile(null);
    try {
      await useAuthStore.getState().logout();
    } catch {
      /* 本地状态会被清空 */
    }
    router.push('/');
  }

  if (state === 'checking') {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-sm text-[var(--color-ink-muted)]">
        <Loader2 size={22} className="animate-spin text-[var(--color-accent)]" />
        正在校验后台访问权限…
      </div>
    );
  }

  if (state === 'anon' || state === 'forbidden') {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-lg items-center px-4 py-12">
        <div className="surface-raised w-full p-6 text-center">
          <span
            className="mx-auto grid h-12 w-12 place-items-center rounded-full"
            style={{
              color: 'var(--color-warning)',
              backgroundColor: 'color-mix(in oklab, var(--color-warning) 14%, transparent)',
            }}
          >
            <ShieldAlert size={22} />
          </span>
          <h1 className="mt-4 text-lg font-bold">
            {state === 'anon' ? '需要登录才能访问后台' : '当前账号没有后台权限'}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            {state === 'anon'
              ? '后台仅对管理员与编辑开放。请先使用有权限的账号登录。'
              : '后台仅对 ADMIN / EDITOR 角色开放。你可以返回首页，或切换到有权限的账号。'}
          </p>
          {state === 'forbidden' && me && (
            <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
              当前账号：{me.email}（{me.role}）
            </p>
          )}
          {guardError && state === 'anon' && (
            <p className="mt-2 text-xs text-[var(--color-danger)]">{guardError}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {state === 'anon' ? (
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="btn btn-primary btn-sm"
              >
                去登录
              </Link>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={handleLogout}>
                切换账号
              </button>
            )}
            <Link href="/" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} />
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = me?.displayName ?? '后台用户';
  const roleLabel = me?.role === 'ADMIN' ? '管理员' : '编辑';

  return (
    <div className="min-h-[calc(100dvh-4rem)]">
      {/* 桌面侧边栏 */}
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* 移动端抽屉 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(1, 4, 9, 0.62)' }}
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4">
              <span className="text-sm font-semibold">后台管理</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="btn btn-ghost btn-sm -mr-2"
                aria-label="关闭菜单"
              >
                <X size={16} />
              </button>
            </div>
            <SidebarContent pathname={pathname} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-16 z-20 flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="btn btn-ghost btn-sm -ml-2 lg:hidden"
            aria-label="打开菜单"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{currentTitle(pathname)}</p>
            <p className="hidden text-[11px] text-[var(--color-ink-subtle)] sm:block">
              GitHub Achievement Hub · 内容管理
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] py-1 pl-1 pr-3 sm:flex">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-surface-sunken)] text-[10px] font-bold">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-[11px] font-medium">
                {displayName}
                <span className="ml-1 text-[var(--color-ink-subtle)]">· {roleLabel}</span>
              </span>
            </div>
            <Link href="/" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">返回前台</span>
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <LogOut size={14} />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </div>
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="后台导航">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              style={
                active
                  ? {
                      backgroundColor:
                        'color-mix(in oklab, var(--color-accent) 14%, transparent)',
                    }
                  : undefined
              }
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                active
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]',
              )}
            >
              <Icon size={16} strokeWidth={2.1} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] p-3">
        <p className="rounded-lg bg-[var(--color-surface-raised)] px-3 py-2 text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
          所有写操作都会记录到操作日志；删除操作不可撤销，请谨慎处理。
        </p>
      </div>
    </>
  );
}

function currentTitle(pathname: string): string {
  const matched = [...NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)));
  return matched?.label ?? '后台管理';
}
