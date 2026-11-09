'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, LogIn, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { IS_EXPORT } from '@/lib/export-mode';
import { useAuthStore } from '@/lib/auth-store';

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

/** 允许粘贴 @name / 完整主页链接 / 带末尾斜杠的用户名 */
function normalizeUsername(raw: string): string {
  let value = raw.trim();
  value = value.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  value = value.replace(/[?#].*$/, '');
  value = value.replace(/^@+/, '');
  value = value.replace(/\/+$/, '');
  return value.split('/')[0] ?? '';
}

const EXAMPLES = ['octocat', 'torvalds', 'sindresorhus'];

/**
 * GitHub 用户名查询表单。
 *
 * 先调 `GET /github/validate` 做一次服务端校验（同时能确认用户是否真实存在），
 * 校验通过后再 `router.push` 到结果页，避免把错误用户名写进地址栏。
 */
export function GithubSearchForm() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      if (pending) return;

      const username = normalizeUsername(value);
      setError(null);

      if (!username) {
        setError('请输入 GitHub 用户名');
        return;
      }
      if (!USERNAME_RE.test(username)) {
        setError(
          '用户名格式不正确：只能包含字母、数字与单个连字符，且不能以连字符开头或结尾（最长 39 个字符）。',
        );
        return;
      }

      setPending(true);
      try {
        const result = await apiFetch<{ valid: boolean; login?: string }>(
          `/github/validate?username=${encodeURIComponent(username)}`,
          { token: accessToken, credentials: 'include' },
        );

        if (!result?.valid) {
          setError(
            `未找到 GitHub 用户「${username}」。可能原因：用户名拼写有误、账号不存在，或查询触发了 GitHub API 限流。`,
          );
          return;
        }

        const handle = result.login ?? username;
        // 导出模式没有服务端路由，只能跳到哨兵页并用 ?u= 携带用户名。
        // 注意 trailingSlash: true，目录式页面需保留末尾斜杠。
        const target = IS_EXPORT
          ? `/github-profile/_/?u=${encodeURIComponent(handle)}`
          : `/github-profile/${encodeURIComponent(handle)}`;
        router.push(target);
      } catch (err) {
        setError(
          err instanceof Error
            ? `校验失败：${err.message}。请稍后重试。`
            : '校验失败，请检查网络后重试。',
        );
      } finally {
        setPending(false);
      }
    },
    [accessToken, pending, router, value],
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label
          htmlFor="github-username"
          className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-muted)]"
        >
          GitHub 用户名
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
              aria-hidden
            />
            <input
              id="github-username"
              name="username"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="field pl-9"
              placeholder="例如 octocat，或粘贴 https://github.com/octocat"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'github-username-error' : undefined}
            />
          </div>
          <button type="submit" className="btn btn-primary shrink-0" disabled={pending}>
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {pending ? '校验中…' : '查询成就'}
          </button>
        </div>
      </div>

      {/* 示例用户名 */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-subtle)]">
        <span>试试：</span>
        {EXAMPLES.map((name) => (
          <button
            key={name}
            type="button"
            className="chip transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            onClick={() => {
              setValue(name);
              setError(null);
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {error && (
        <p
          id="github-username-error"
          role="alert"
          className="flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed"
          style={{
            borderColor:
              'color-mix(in oklab, var(--color-danger) 38%, transparent)',
            backgroundColor:
              'color-mix(in oklab, var(--color-danger) 9%, transparent)',
            color: 'var(--color-ink)',
          }}
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
          <span>{error}</span>
        </p>
      )}

      {/* 未登录提示：查询走服务端 GitHub Token，登录后更稳定 */}
      {hydrated && !user && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          <p className="flex items-center gap-1.5 font-medium text-[var(--color-ink)]">
            <LogIn size={14} />
            当前未登录
          </p>
          <p className="mt-1">
            查询由服务端使用站点配置的 GitHub Token 发起，未登录也可以试用。登录后可把查询结果直接记录进你的收藏馆与进度追踪，并避免触发匿名限流。
          </p>
          <Link
            href="/login?next=%2Fgithub-profile"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            去登录
          </Link>
        </div>
      )}
    </form>
  );
}
