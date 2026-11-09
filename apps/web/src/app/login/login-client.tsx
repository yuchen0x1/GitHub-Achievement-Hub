'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  User,
} from 'lucide-react';
import { ApiRequestError, apiFetch } from '@/lib/api';
import { resolveApiBase } from '@/lib/runtime-config';
import { useAuthStore } from '@/lib/auth-store';
import type { AuthUser } from '@/lib/types';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';

/** 只允许站内相对路径，防止开放重定向 */
function safeNext(raw: string | string[] | null | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return '/';
  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) return '/';
  if (/[\r\n\0]/.test(trimmed)) return '/';

  // 解码后再校验一次，避免 %5C / %2F 绕过
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return '/';
  }
  if (!decoded.startsWith('/')) return '/';
  if (decoded.startsWith('//')) return '/';
  if (decoded.includes('\\')) return '/';
  if (decoded.includes('://')) return '/';
  if (trimmed === '/login') return '/';
  return trimmed;
}

/**
 * 登录页入口（客户端）：从 URL query 读取 `next`，
 * 这样页面本身无需依赖服务端 `searchParams`，可静态导出。
 */
export function LoginClientPage() {
  const searchParams = useSearchParams();
  return <LoginClient next={safeNext(searchParams.get('next'))} />;
}

/** lucide-react 1.x 不再内置品牌图标，这里使用 GitHub 官方 mark 的路径 */
function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const FEATURES = [  {
    icon: Layers,
    title: '完整勋章图鉴',
    text: '收录全部已知 GitHub 个人成就，标注获取状态、难度与可信度。',
  },
  {
    icon: ShieldCheck,
    title: '可溯源的资料',
    text: '每条条件与门槛都标注来源等级，官方未明确的会如实说明。',
  },
  {
    icon: TrendingUp,
    title: '收藏与进度',
    text: '记录已获得、计划中与收藏的勋章，并追踪分级进度。',
  },
];

function describeAuthError(error: unknown, mode: Mode): string {
  if (error instanceof ApiRequestError) {
    const message = error.message ?? '';
    if (error.status === 401) {
      if (message.includes('停用')) return '该账号已被停用，请联系站点管理员。';
      if (message.toLowerCase().includes('csrf')) {
        return '安全校验失败（CSRF），请刷新页面后重试。';
      }
      return '邮箱或密码不正确，请检查后重试。';
    }
    if (error.status === 400) {
      if (message.includes('已注册') || message.toLowerCase().includes('exist')) {
        return '该邮箱已被注册，请直接登录或更换邮箱。';
      }
      if (message.includes('密码')) return '密码至少需要 8 位字符。';
      if (message.includes('邮箱')) return '请输入有效的邮箱地址。';
      return message || '提交的信息不合法，请检查后重试。';
    }
    if (error.status === 403) return '当前账号没有登录权限，请联系管理员。';
    if (error.status === 429) return '尝试次数过多，请稍后再试。';
    if (error.status && error.status >= 500) return '服务器暂时不可用，请稍后重试。';
    return message || '操作失败，请稍后重试。';
  }
  if (error instanceof TypeError) {
    return '网络错误：无法连接 API 服务，请确认后端已启动（http://localhost:4000）。';
  }
  if (error instanceof Error) return error.message;
  return mode === 'login' ? '登录失败，请稍后重试。' : '注册失败，请稍后重试。';
}

export function LoginClient({ next }: { next: string }) {
  const router = useRouter();
  const { user, login, register } = useAuthStore();
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);

  // 已登录状态校验：直接调用 GET /auth/me（Bearer），
  // 不依赖 auth-store.refresh（该请求不带 CSRF，Cookie 存在时会被服务端拒绝）。
  useEffect(() => {
    let cancelled = false;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    apiFetch<AuthUser>('/auth/me', { token, credentials: 'include' })
      .then((profile) => {
        if (cancelled) return;
        useAuthStore.getState().setUser(profile);
        setSessionUser(profile);
      })
      .catch(() => {
        /* 未登录或 token 失效，保持表单状态 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentUser = sessionUser ?? user;

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordTooShort = password.length > 0 && password.length < 8;

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('请输入有效的邮箱地址。');
      return;
    }
    if (!password) {
      setError('请输入密码。');
      return;
    }
    if (mode === 'register') {
      if (password.length < 8) {
        setError('密码至少需要 8 位字符。');
        return;
      }
      if (!displayName.trim()) {
        setError('请填写显示名（昵称）。');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
      } else {
        await register(trimmedEmail, password, displayName.trim());
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(describeAuthError(err, mode));
    } finally {
      setSubmitting(false);
    }
  }

  function startGithubLogin() {
    const redirectTarget = new URL(next, window.location.origin).toString();
    const authUrl = `${resolveApiBase()}/auth/github?redirect_uri=${encodeURIComponent(redirectTarget)}`;
    window.location.href = authUrl;
  }

  // 已登录提示（不自动跳转，避免打断用户）
  if (currentUser) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg items-center px-4 py-12">
        <div className="surface-raised w-full p-6 text-center">
          <span
            className="mx-auto grid h-12 w-12 place-items-center rounded-full"
            style={{
              color: 'var(--color-success)',
              backgroundColor: 'color-mix(in oklab, var(--color-success) 14%, transparent)',
            }}
          >
            <CheckCircle2 size={24} />
          </span>
          <h1 className="mt-4 text-lg font-bold">你已经登录</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            当前账号 {currentUser.email}（{currentUser.displayName}）。
            {next && next !== '/' ? ` 可以继续前往 ${next}。` : ''}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link href={next} className="btn btn-primary btn-sm">
              继续前往
              <ArrowRight size={14} />
            </Link>
            {(currentUser.role === 'ADMIN' || currentUser.role === 'EDITOR') && (
              <Link href="/admin" className="btn btn-secondary btn-sm">
                进入后台
              </Link>
            )}
            <Link href="/" className="btn btn-ghost btn-sm">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8 lg:py-14">
      {/* 左侧品牌区 */}
      <section className="relative hidden overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(circle at 20% 0%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent 55%), radial-gradient(circle at 90% 90%, color-mix(in oklab, var(--color-success) 10%, transparent), transparent 50%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-accent)] text-white shadow-[var(--shadow-card)]">
              <Award size={22} strokeWidth={2.3} />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight">GitHub Achievement Hub</p>
              <p className="text-[11px] text-[var(--color-ink-subtle)]">成就勋章百科</p>
            </div>
          </div>

          <h2 className="mt-10 max-w-md text-3xl font-bold leading-tight tracking-tight">
            Unlock Every
            <br />
            GitHub Achievement
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-ink-muted)]">
            从第一条 Pull Request 到 Gold 级徽章，这里把每个成就的触发条件、等级门槛与资料来源讲清楚。
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)]">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                      {feature.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative mt-10 text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
          本站与 GitHub 官方无隶属关系。成就机制可能随 GitHub 调整而变化，请以官方实际表现为准。
        </p>
      </section>

      {/* 右侧表单 */}
      <section className="flex items-center">
        <div className="surface-raised w-full p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)] text-white">
              <Award size={18} />
            </span>
            <div>
              <p className="text-sm font-bold">GitHub Achievement Hub</p>
              <p className="text-[11px] text-[var(--color-ink-subtle)]">成就勋章百科</p>
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight">
            {mode === 'login' ? '登录账号' : '创建账号'}
          </h1>
          <p className="mt-1.5 text-[13px] text-[var(--color-ink-muted)]">
            {mode === 'login'
              ? '同步你的收藏、进度与反馈记录。'
              : '注册后即可收藏勋章、记录进度并参与内容纠错。'}
          </p>

          <div
            className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-1"
            role="tablist"
            aria-label="登录或注册"
          >
            {(
              [
                ['login', '登录'],
                ['register', '注册'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => switchMode(value)}
                className={cn(
                  'rounded-md py-2 text-[13px] font-semibold transition-colors',
                  mode === value
                    ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-card)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]">
                邮箱
              </span>
              <span className="relative block">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
                  aria-hidden
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="field pl-9"
                  required
                />
              </span>
            </label>

            {mode === 'register' && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]">
                  显示名
                </span>
                <span className="relative block">
                  <User
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    autoComplete="nickname"
                    maxLength={60}
                    placeholder="展示在收藏与反馈中的昵称"
                    className="field pl-9"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]">
                密码
              </span>
              <span className="relative block">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
                  aria-hidden
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'register' ? '至少 8 位' : '输入密码'}
                  className="field pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-[var(--color-ink-subtle)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
              {mode === 'register' && (
                <span
                  className={cn(
                    'mt-1 block text-[11px]',
                    passwordTooShort
                      ? 'text-[var(--color-warning)]'
                      : 'text-[var(--color-ink-subtle)]',
                  )}
                >
                  密码至少 8 位字符。{passwordTooShort ? `当前 ${password.length} 位。` : ''}
                </span>
              )}
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface-raised)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--color-danger)]">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {mode === 'login' ? '登录' : '注册并登录'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-[11px] text-[var(--color-ink-subtle)]">或</span>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <button type="button" className="btn btn-secondary w-full" onClick={startGithubLogin}>
            <GithubMark />
            使用 GitHub 登录
          </button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
            需站点在服务端配置 GitHub OAuth App（GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET）。
            未配置时该入口会返回配置错误，不会伪造登录成功。
          </p>

          {next !== '/' && (
            <p className="mt-5 text-center text-[11px] text-[var(--color-ink-subtle)]">
              登录后将返回 <code className="font-mono">{next}</code>
            </p>
          )}

          <p className="mt-3 text-center text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="link">
              返回首页
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
