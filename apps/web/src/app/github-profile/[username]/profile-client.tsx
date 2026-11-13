'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BookMarked,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  CircleSlash,
  ExternalLink,
  Link2,
  LogIn,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { ApiRequestError, apiFetch } from '@/lib/api';
import { IS_EXPORT } from '@/lib/export-mode';
import { useAuthStore } from '@/lib/auth-store';
import type { GithubProfile } from '@/lib/types';
import { BadgeImage } from '@/components/achievement/badge-image';
import { Notice } from '@/components/common/layout';
import { formatDate, formatNumber, formatRelative } from '@/lib/utils';

function decodeParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** 结果页自身地址：导出模式走哨兵页 + ?u=，SSR 模式保持原路径 */
function profileHref(username: string): string {
  return IS_EXPORT
    ? `/github-profile/_/?u=${encodeURIComponent(username)}`
    : `/github-profile/${encodeURIComponent(username)}`;
}

/**
 * 结果页入口。
 *
 * SSR 模式：用户名来自路径 `/github-profile/<username>`（行为不变）。
 * 导出模式：路径固定为哨兵 `/github-profile/_/`，真实用户名来自 `?u=`，
 * 因为静态导出无法为任意用户名预生成页面。
 */
export function GithubProfileResultClient() {
  const params = useParams<{ username?: string | string[] }>();
  const searchParams = useSearchParams();

  const pathUsername = decodeParam(params?.username);
  const queryUsername = (
    searchParams.get('u') ??
    searchParams.get('username') ??
    ''
  ).trim();

  const username = IS_EXPORT
    ? queryUsername ||
      (pathUsername && pathUsername !== '_' ? pathUsername : '')
    : pathUsername;

  if (!username) {
    return <UsernamePrompt />;
  }

  return (
    <>
      <nav className="mb-5 flex items-center gap-2 text-xs text-[var(--color-ink-subtle)]">
        <Link
          href="/github-profile"
          className="inline-flex items-center gap-1 hover:text-[var(--color-accent)]"
        >
          <ArrowLeft size={13} />
          GitHub 成就查询
        </Link>
        <span>/</span>
        <span className="truncate text-[var(--color-ink-muted)]">{username}</span>
      </nav>

      <GithubProfileView username={username} />
    </>
  );
}

function UsernamePrompt() {
  return (
    <div className="surface mx-auto max-w-xl p-8 text-center">
      <span
        className="mx-auto grid h-12 w-12 place-items-center rounded-full"
        style={{
          backgroundColor:
            'color-mix(in oklab, var(--color-accent) 12%, transparent)',
          color: 'var(--color-accent)',
        }}
        aria-hidden
      >
        <Search size={22} />
      </span>
      <h1 className="mt-4 text-lg font-bold text-[var(--color-ink)]">
        请输入用户名查询
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        当前为静态导出页面，结果页需要从查询表单进入并携带 GitHub 用户名。
      </p>
      <Link href="/github-profile" className="btn btn-primary mt-5">
        <Search size={15} />
        前往查询表单
      </Link>
    </div>
  );
}

type LoadState =
  | 'loading'
  | 'ready'
  | 'unauthorized'
  | 'notfound'
  | 'ratelimited'
  | 'network';

type OverviewStatus = GithubProfile['achievementsOverview'][number]['status'];
type FilterValue = OverviewStatus | 'ALL';

const STATUS_META: Record<
  OverviewStatus,
  { label: string; color: string; icon: typeof CheckCircle2; description: string }
> = {
  EARNED: {
    label: '已获得',
    color: 'var(--color-success)',
    icon: CheckCircle2,
    description: 'GitHub 公开 API 明确返回了该徽章',
  },
  UNKNOWN: {
    label: '数据不可用',
    color: 'var(--color-ink-subtle)',
    icon: CircleHelp,
    description: 'API 未公开该用户的成就数据，无法确认是否已获得（不代表未获得）',
  },
  NOT_AVAILABLE: {
    label: '已无法获取',
    color: 'color-mix(in oklab, var(--color-accent) 45%, var(--color-ink-subtle))',
    icon: CircleSlash,
    description: '该勋章已停止发放或仅限内部获取',
  },
};

function statusMeta(status: OverviewStatus) {
  return STATUS_META[status] ?? STATUS_META.UNKNOWN;
}

function normalizeBlogUrl(blog: string | null): string | null {
  if (!blog) return null;
  const trimmed = blog.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** 错误分类：把后端的 404 / 429 / 网络失败拆成可操作的三种出口 */
function classifyError(err: unknown): { state: LoadState; message: string } {
  if (err instanceof ApiRequestError) {
    const message = err.message;
    if (err.status === 401) {
      return { state: 'unauthorized', message: '登录状态已失效，请重新登录后查询。' };
    }
    if (err.status === 429 || /限流|频率|rate\s*limit/i.test(message)) {
      return { state: 'ratelimited', message };
    }
    if (err.status === 404) {
      return { state: 'notfound', message };
    }
    return { state: 'network', message };
  }
  return {
    state: 'network',
    message: err instanceof Error ? err.message : '网络异常，未能连接到 API。',
  };
}

interface GithubProfileViewProps {
  username: string;
}

export function GithubProfileView({ username }: GithubProfileViewProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [profile, setProfile] = useState<GithubProfile | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [filter, setFilter] = useState<FilterValue>('ALL');

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const controller = new AbortController();

    setState('loading');
    setErrorMessage('');
    setRetryAt(0);
    setRetrySeconds(0);

    (async () => {
      try {
        const data = await apiFetch<GithubProfile>(
          `/github/profile/${encodeURIComponent(username)}`,
          { token: accessToken, credentials: 'include', signal: controller.signal },
        );
        if (cancelled) return;
        setProfile(data);
        setFilter('ALL');
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        const { state: nextState, message } = classifyError(err);
        if (err instanceof ApiRequestError && err.status === 429) {
          const seconds = (err.body as { retryAfterSeconds?: number } | null)?.retryAfterSeconds;
          const wait = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
            ? Math.ceil(seconds) : 60;
          setRetryAt(Date.now() + wait * 1000);
          setRetrySeconds(wait);
        }
        setErrorMessage(message);
        setState(nextState);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [username, accessToken, hydrated, attempt]);

  useEffect(() => {
    if (!retryAt) return;
    const tick = () => setRetrySeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);

  const retry = useCallback(() => {
    if (Date.now() >= retryAt) setAttempt((n) => n + 1);
  }, [retryAt]);

  const overview = profile?.achievementsOverview ?? [];

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = {
      ALL: overview.length,
      EARNED: 0,
      UNKNOWN: 0,
      NOT_AVAILABLE: 0,
    };
    for (const row of overview) base[row.status] += 1;
    return base;
  }, [overview]);

  const visibleRows = useMemo(
    () => (filter === 'ALL' ? overview : overview.filter((row) => row.status === filter)),
    [filter, overview],
  );

  if (!hydrated || state === 'loading') {
    return <LoadingSkeleton />;
  }

  if (state !== 'ready' || !profile) {
    return (
      <ErrorPanel
        state={state}
        message={errorMessage}
        username={username}
        onRetry={retry}
        retrySeconds={retrySeconds}
        loggedIn={Boolean(user)}
      />
    );
  }

  const blogHref = normalizeBlogUrl(profile.blog);
  const initials = (profile.name || profile.login).slice(0, 1).toUpperCase();

  return (
    <div className="space-y-6">
      {!user && (
        <Notice tone="info">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <LogIn size={14} className="shrink-0" />
            <span>
              你当前未登录。查询仅使用公开资料，结果不会保存到你的账号。
            </span>
            <Link
              href={`/login?next=${encodeURIComponent(profileHref(username))}`}
              className="font-semibold text-[var(--color-accent)] hover:underline"
            >
              登录后可记录到收藏馆
            </Link>
          </span>
        </Notice>
      )}

      {/* 基本信息 */}
      <header className="surface relative overflow-hidden p-5 sm:p-7">
        <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] text-2xl font-bold text-[var(--color-ink-subtle)]">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={`${profile.login} 的头像`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                {profile.name || profile.login}
              </h1>
              <span className="chip font-mono">@{profile.login}</span>
            </div>

            {profile.bio && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
                {profile.bio}
              </p>
            )}

            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
              <MetaItem
                icon={<Building2 size={13} />}
                label="公司"
                value={profile.company}
              />
              <MetaItem icon={<MapPin size={13} />} label="位置" value={profile.location} />
              <MetaItem
                icon={<Link2 size={13} />}
                label="博客"
                value={profile.blog}
                href={blogHref}
              />
              <MetaItem
                icon={<BookMarked size={13} />}
                label="公开仓库"
                value={formatNumber(profile.publicRepos)}
              />
              <MetaItem
                icon={<Users size={13} />}
                label="关注者 / 关注中"
                value={`${formatNumber(profile.followers)} / ${formatNumber(profile.following)}`}
              />
              <MetaItem
                icon={<CalendarClock size={13} />}
                label="注册时间"
                value={formatDate(profile.createdAt)}
              />
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={profile.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={13} />
                打开 GitHub 主页
              </a>
              <button type="button" onClick={retry} className="btn btn-ghost btn-sm">
                <RefreshCw size={13} />
                重新查询
              </button>
              <span className="text-[11px] text-[var(--color-ink-subtle)]">
                数据抓取于 {formatDate(profile.fetchedAt)}（{formatRelative(profile.fetchedAt)}）
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* 公开徽章 */}
          <section className="surface p-5" aria-labelledby="public-badges">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id="public-badges" className="text-base font-semibold">
                  API 公开的徽章
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                  GitHub REST API 在 <code className="font-mono text-xs">achievements</code>{' '}
                  字段中返回的徽章，是本次查询中唯一「可确认」的部分。
                </p>
              </div>
              <span className="chip tabular-nums">{profile.achievements.length} 枚</span>
            </div>

            {profile.achievements.length > 0 ? (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {profile.achievements.map((badge, index) => (
                  <li
                    key={`${badge.slug}-${index}`}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 text-center"
                  >
                    <div className="badge-frame mx-auto h-16 w-16">
                      <BadgeImage src={badge.imageUrl} alt={badge.name} size={48} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[var(--color-ink)]">
                      {badge.name}
                    </p>
                    {badge.description && (
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
                        {badge.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 py-6 text-center">
                <CircleHelp
                  size={20}
                  className="mx-auto text-[var(--color-ink-subtle)]"
                  aria-hidden
                />
                <p className="mt-2 text-sm font-semibold">API 未返回任何公开徽章</p>
                <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                  这只说明 GitHub 没有通过公开接口暴露该账号的徽章，
                  <strong className="text-[var(--color-ink)]">不代表该账号没有任何成就</strong>
                  。可对照下表逐条查看本站收录的勋章状态。
                </p>
              </div>
            )}
          </section>

          {/* 成就对照表 */}
          <section className="surface p-5" aria-labelledby="overview">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="overview" className="text-base font-semibold">
                  成就对照表
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                  本站收录的 {overview.length} 枚勋章逐个对照。「数据不可用」只表示 API
                  未公开，不代表未获得。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    ['ALL', '全部'],
                    ['EARNED', '已获得'],
                    ['UNKNOWN', '数据不可用'],
                    ['NOT_AVAILABLE', '已无法获取'],
                  ] as const
                ).map(([key, label]) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      aria-pressed={active}
                      className={
                        active
                          ? 'btn btn-primary btn-sm'
                          : 'btn btn-secondary btn-sm'
                      }
                    >
                      {label}
                      <span className="tabular-nums opacity-80">{counts[key]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {visibleRows.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-[var(--color-border-strong)] px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
                当前筛选下没有勋章。切换上方筛选条件查看其他状态。
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {visibleRows.map((row) => {
                  const meta = statusMeta(row.status);
                  const Icon = meta.icon;
                  return (
                    <li
                      key={row.slug}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3"
                      style={{ borderLeft: `3px solid ${meta.color}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="badge-frame h-11 w-11 shrink-0">
                          <BadgeImage src={row.imageUrl} alt={row.nameZh} size={34} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">
                              {row.nameZh}
                            </p>
                            <span className="truncate text-xs text-[var(--color-ink-subtle)]">
                              {row.nameEn}
                            </span>
                            {row.isTiered && <span className="chip">等级型</span>}
                          </div>

                          {row.status === 'UNKNOWN' && row.reason && (
                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
                              {row.reason}
                            </p>
                          )}
                          {row.status === 'NOT_AVAILABLE' && (
                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
                              {row.reason ?? meta.description}
                            </p>
                          )}
                          {row.status === 'EARNED' && (
                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
                              该徽章出现在 GitHub API 返回的公开徽章列表中。
                            </p>
                          )}
                        </div>

                        <Link
                          href={`/achievements/${row.slug}`}
                          className="hidden shrink-0 text-xs font-medium text-[var(--color-accent)] hover:underline sm:block"
                        >
                          详情
                        </Link>

                        <span
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            color: meta.color,
                            borderColor: `color-mix(in oklab, ${meta.color} 45%, transparent)`,
                            backgroundColor: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
                          }}
                          title={meta.description}
                        >
                          <Icon size={12} strokeWidth={2.4} />
                          {meta.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* 侧栏：数据限制 */}
        <aside className="space-y-4">
          <div className="surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <ShieldAlert size={14} className="text-[var(--color-warning)]" />
              为什么大量显示「数据不可用」？
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              GitHub 只在用户资料接口返回部分公开徽章，没有提供完整的成就清单，
              也没有开放等级数据。本站宁可显示「不可用」，也不会把未知结果说成「未获得」。
            </p>
          </div>

          <div className="surface p-4">
            <p className="text-sm font-semibold">API 限制说明</p>
            {profile.apiLimitations.length > 0 ? (
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                {profile.apiLimitations.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle
                      size={12}
                      className="mt-1 shrink-0 text-[var(--color-warning)]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                本次接口未返回额外的限制说明，但完整的成就与等级数据依然不对第三方开放。
              </p>
            )}
          </div>

          <div className="surface p-4">
            <p className="text-sm font-semibold">数据来源</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              {profile.sourceNote}
            </p>
            <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-ink-subtle)]">
              抓取时间：{formatDate(profile.fetchedAt)}（{formatRelative(profile.fetchedAt)}）
            </p>
          </div>

          <Link href="/collection" className="btn btn-secondary w-full">
            记录我自己的勋章
          </Link>
        </aside>
      </div>
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  href?: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[var(--color-ink-subtle)]" aria-hidden>
        {icon}
      </span>
      <dt className="shrink-0 text-[var(--color-ink-subtle)]">{label}</dt>
      <dd className="min-w-0 truncate text-[var(--color-ink)]">
        {value ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-[var(--color-ink-subtle)]">—</span>
        )}
      </dd>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">正在向 GitHub 查询…</span>
      <div className="surface animate-pulse p-6">
        <div className="flex gap-5">
          <div className="h-20 w-20 rounded-full bg-[var(--color-surface-sunken)]" />
          <div className="flex-1 space-y-3 py-2">
            <div className="h-6 w-48 rounded bg-[var(--color-surface-sunken)]" />
            <div className="h-4 w-72 rounded bg-[var(--color-surface-sunken)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--color-surface-sunken)]" />
          </div>
        </div>
      </div>
      <div className="surface animate-pulse p-6">
        <div className="h-5 w-40 rounded bg-[var(--color-surface-sunken)]" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-[var(--color-surface-sunken)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const ERROR_COPY: Record<
  Exclude<LoadState, 'loading' | 'ready'>,
  { title: string; hint: string; tone: 'warning' | 'danger' | 'info' }
> = {
  notfound: {
    title: '未找到这个 GitHub 用户',
    hint: '请检查用户名拼写；账号也可能已改名、被删除、被停用，或限制了公开访问。限流和网络故障会单独提示，不会判断为用户不存在。',
    tone: 'warning',
  },
  ratelimited: {
    title: 'GitHub API 请求频率受限',
    hint: '服务端没有拿到任何数据，因此本页不会给出结论性内容。请在倒计时结束后重试；登录本站不会提高服务端的 GitHub API 配额。',
    tone: 'warning',
  },
  unauthorized: {
    title: '登录状态已失效',
    hint: '请重新登录后再查询。你的 token 只会在请求头中使用，不会被写进页面或地址栏。',
    tone: 'info',
  },
  network: {
    title: '查询失败',
    hint: '可能是 API 服务未启动或网络中断。确认服务可用后点击「重试」即可，无需刷新页面。',
    tone: 'danger',
  },
};

function ErrorPanel({
  state,
  message,
  username,
  onRetry,
  retrySeconds,
  loggedIn,
}: {
  state: LoadState;
  message: string;
  username: string;
  onRetry: () => void;
  retrySeconds: number;
  loggedIn: boolean;
}) {
  const key = state === 'loading' || state === 'ready' ? 'network' : state;
  const copy = ERROR_COPY[key];
  const retryable = key !== 'unauthorized';

  return (
    <div className="surface p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span
          className="grid h-12 w-12 place-items-center rounded-full"
          style={{
            backgroundColor:
              'color-mix(in oklab, var(--color-warning) 14%, transparent)',
            color: 'var(--color-warning)',
          }}
          aria-hidden
        >
          {key === 'network' ? <AlertTriangle size={22} /> : <CircleHelp size={22} />}
        </span>
        <h2 className="mt-4 text-lg font-bold text-[var(--color-ink)]">{copy.title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
          {copy.hint}
        </p>
        {message && (
          <p className="mt-3 max-w-xl rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
            接口返回：{message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {retryable && (
            <button type="button" onClick={onRetry} disabled={retrySeconds > 0} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw size={15} />
              {retrySeconds > 0 ? `${retrySeconds} 秒后可重试` : '重试查询'}
            </button>
          )}
          {key === 'unauthorized' || !loggedIn ? (
            <Link
              href={`/login?next=${encodeURIComponent(profileHref(username))}`}
              className="btn btn-secondary"
            >
              <LogIn size={15} />
              去登录
            </Link>
          ) : (
            <Link href="/github-profile" className="btn btn-secondary">
              换个用户名
            </Link>
          )}
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            <ExternalLink size={14} />
            直接去 GitHub 看看
          </a>
        </div>

        <p className="mt-4 text-[11px] text-[var(--color-ink-subtle)]">
          {key === 'ratelimited'
            ? '提示：等待期间可以对照「勋章图鉴」了解各枚勋章的获取条件。'
            : '如果重复失败，请稍后重试或联系站点管理员。'}
        </p>
        <Link
          href="/achievements"
          className="mt-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
        >
          浏览勋章图鉴 →
        </Link>
      </div>
    </div>
  );
}
