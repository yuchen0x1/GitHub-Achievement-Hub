'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { AuthUser } from '@/lib/types';

/**
 * 后台请求封装。
 *
 * - 自动附带当前 access token（Bearer）
 * - 写操作自动携带 X-CSRF-Token：优先读 gach_csrf Cookie，缺失时先 GET /auth/csrf
 * - 不依赖 auth-store 的 refresh 流程（其请求未携带 CSRF，服务端会拒绝），
 *   由 AdminShell 通过 GET /auth/me 校验会话，并把 token 缓存到此处。
 */

let adminToken: string | null = null;
let adminProfile: AuthUser | null = null;

export function setAdminToken(token: string | null): void {
  adminToken = token;
}

export function setAdminProfile(user: AuthUser | null): void {
  adminProfile = user;
}

export function currentAdminProfile(): AuthUser | null {
  return adminProfile ?? useAuthStore.getState().user;
}

export function currentAdminToken(): string | null {
  return adminToken ?? useAuthStore.getState().accessToken;
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? '') : null;
}

export async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCookie('gach_csrf');
  if (existing) return existing;
  try {
    const res = await apiFetch<{ csrfToken?: string }>('/auth/csrf', {
      credentials: 'include',
    });
    return res.csrfToken ?? readCookie('gach_csrf');
  } catch {
    return null;
  }
}

export interface AdminRequestInit {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function adminFetch<T>(path: string, init: AdminRequestInit = {}): Promise<T> {
  const method = init.method ?? 'GET';
  const csrfToken = method === 'GET' ? null : await ensureCsrfToken();
  return apiFetch<T>(path, {
    method,
    body: init.body,
    token: currentAdminToken(),
    csrfToken,
    credentials: 'include',
  });
}

/** 把异常翻译成可操作的中文提示 */
export function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return '登录状态已失效，请重新登录后再试。';
    }
    if (error.status === 403) {
      return '当前账号没有执行该操作的权限（需要管理员或编辑角色）。';
    }
    if (error.status === 404) {
      return '目标记录不存在，可能已被其他管理员删除，请刷新后重试。';
    }
    if (error.status === 429) {
      return '请求过于频繁，请稍后再试。';
    }
    if (error.status && error.status >= 500) {
      return `服务器错误（HTTP ${error.status}），请稍后重试。`;
    }
    return error.message || '请求失败，请稍后重试。';
  }
  if (error instanceof TypeError) {
    return '网络错误：无法连接 API 服务，请确认后端已启动（http://localhost:4000）。';
  }
  if (error instanceof Error) return error.message;
  return '未知错误，请稍后重试。';
}

/** 防抖值 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function formatDateTime(input: string | null | undefined): string {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** 从任意 JSON 值生成可读摘要 */
export function summariseJson(value: unknown): string {
  if (value === null || value === undefined) return '—';
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (!text) return '—';
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  } catch {
    return '—';
  }
}
