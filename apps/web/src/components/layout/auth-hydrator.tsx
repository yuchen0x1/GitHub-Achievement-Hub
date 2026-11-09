'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import type { AuthUser } from '@/lib/types';

function decodeTokenPayload(raw: string): {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
} | null {
  try {
    const bytes = Uint8Array.from(atob(raw), (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as {
      accessToken?: unknown;
      refreshToken?: unknown;
      user?: AuthUser;
    };
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string' ||
      !parsed.user ||
      typeof parsed.user !== 'object'
    ) {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      user: parsed.user,
    };
  } catch {
    return null;
  }
}

async function consumeOAuthCallback(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.location.hash) return false;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const encoded = params.get('token');
  if (!encoded) return false;

  const payload = decodeTokenPayload(encoded);
  window.history.replaceState(
    null,
    document.title,
    `${window.location.pathname}${window.location.search}`,
  );
  if (!payload) return false;

  useAuthStore.getState().loginWithTokens(
    payload.accessToken,
    payload.refreshToken,
    payload.user,
  );
  try {
    // OAuth 回调来自 API 域；通过当前站点再 refresh 一次，建立同源 Cookie。
    await useAuthStore.getState().refresh();
  } catch {
    // access token 仍可用于当前会话，后续请求会继续按需刷新。
  }
  return true;
}

/** 客户端启动时恢复登录状态，并消费 OAuth 回调 token */
export function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    let cancelled = false;
    void consumeOAuthCallback().then((consumed) => {
      if (!cancelled && !consumed) void hydrate();
    });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);
  return null;
}
