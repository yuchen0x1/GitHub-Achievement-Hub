'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2, LogIn } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  /** 勋章 ID（不是 slug） */
  achievementId: string;
  /** 收藏后跳转的地址（用于未登录时引导登录） */
  redirectTo?: string;
  className?: string;
}

interface FavoriteRow {
  id: string;
  achievement: { id: string };
}

/** 读取双提交 CSRF Cookie（服务端写入，httpOnly=false） */
function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('gach_csrf='));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice('gach_csrf='.length));
  } catch {
    return null;
  }
}

/**
 * 收藏按钮。
 *
 * - 未登录：引导去 /login
 * - 已登录：POST /collection/favorites/:achievementId 收藏，
 *   DELETE /collection/favorites/:achievementId 取消收藏
 */
export function FavoriteButton({
  achievementId,
  redirectTo,
  className,
}: FavoriteButtonProps) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [favorited, setFavorited] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // 登录后读取收藏列表，判断当前勋章是否已收藏
  useEffect(() => {
    if (!hydrated || !user) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiFetch<FavoriteRow[]>('/collection/favorites', {
          token: accessToken,
          credentials: 'include',
          csrfToken: readCsrfCookie(),
        });
        if (cancelled) return;
        setFavorited(
          Array.isArray(rows) && rows.some((row) => row?.achievement?.id === achievementId),
        );
      } catch {
        /* 读取失败不阻塞页面，按未收藏处理 */
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, user, accessToken, achievementId]);

  const toggle = useCallback(async () => {
    if (!user || pending) return;
    setPending(true);
    setError(null);
    try {
      if (favorited) {
        await apiFetch(`/collection/favorites/${achievementId}`, {
          method: 'DELETE',
          token: accessToken,
          credentials: 'include',
          csrfToken: readCsrfCookie(),
        });
        setFavorited(false);
      } else {
        await apiFetch(`/collection/favorites/${achievementId}`, {
          method: 'POST',
          body: {},
          token: accessToken,
          credentials: 'include',
          csrfToken: readCsrfCookie(),
        });
        setFavorited(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请稍后重试');
    } finally {
      setPending(false);
    }
  }, [accessToken, achievementId, favorited, pending, user]);

  // 未登录 → 引导登录
  if (hydrated && !user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(redirectTo ?? `/achievements/${achievementId}`)}`}
        className={cn('btn btn-secondary w-full', className)}
      >
        <LogIn size={15} />
        登录后收藏
      </Link>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={!hydrated || pending}
        aria-pressed={favorited}
        className={cn(
          'btn w-full',
          favorited ? 'btn-primary' : 'btn-secondary',
        )}
      >
        {pending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Heart size={15} fill={favorited ? 'currentColor' : 'none'} />
        )}
        {favorited ? '已收藏' : '收藏这枚勋章'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
      {!checked && (
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">正在检查收藏状态…</p>
      )}
    </div>
  );
}
