/**
 * API 客户端。
 *
 * - 服务端渲染时直连 API（避免多一次网络往返，也避免本地代理未启动导致失败）
 * - 浏览器端走 Next.js 的 /api/v1 代理（同源，无需处理 CORS）
 */

const DEFAULT_API_BASE = 'http://localhost:4000/api/v1';
const INTERNAL_BASE =
  process.env.NEXT_PHASE === 'phase-production-build'
    ? (process.env.API_BUILD_URL ?? process.env.API_INTERNAL_URL ?? DEFAULT_API_BASE)
    : (process.env.API_INTERNAL_URL ?? DEFAULT_API_BASE);
export const CLIENT_BASE = '/api/v1';

export interface ApiError extends Error {
  status?: number;
  body?: unknown;
}

export class ApiRequestError extends Error implements ApiError {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

type AuthRefreshHandler = () => Promise<string | null>;
let authRefreshHandler: AuthRefreshHandler | null = null;

export function registerAuthRefreshHandler(handler: AuthRefreshHandler): void {
  authRefreshHandler = handler;
}

function isServer() {
  return typeof window === 'undefined';
}

/** 读取浏览器中的 CSRF Cookie（双提交模式，Cookie 本身由后端设为可读） */
export function readCsrfCookie(): string | null {
  if (isServer()) return null;
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)gach_csrf=([^;]+)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** 确保拿到一个可用的 CSRF token：先读 Cookie，没有则向后端申请一次 */
export async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCsrfCookie();
  if (existing) return existing;
  try {
    const res = await fetch(`${CLIENT_BASE}/auth/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { csrfToken?: string };
    return data.csrfToken ?? readCsrfCookie();
  } catch {
    return null;
  }
}

export function apiBase(): string {
  return isServer() ? INTERNAL_BASE : CLIENT_BASE;
}

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
  csrfToken?: string | null;
  revalidate?: number;
  tag?: string;
  skipAuthRefresh?: boolean;
}

/**
 * 统一请求方法。
 * 失败时抛出 ApiRequestError，由调用方决定如何呈现。
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    body,
    token,
    csrfToken,
    revalidate,
    tag,
    skipAuthRefresh,
    headers,
    ...rest
  } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...((headers as Record<string, string>) ?? {}),
  };

  if (body !== undefined && typeof body !== 'string') {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  // 浏览器端的写请求自动附带 CSRF token（双提交 Cookie 模式）。
  // 放在这里统一处理，避免每个调用点各自实现而漏掉某个请求。
  const method = (rest.method ?? 'GET').toUpperCase();
  const isWrite = method !== 'GET' && method !== 'HEAD';
  const finalCsrf =
    csrfToken ?? (isWrite && !isServer() ? await ensureCsrfToken() : null);
  if (finalCsrf) finalHeaders['X-CSRF-Token'] = finalCsrf;

  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const serializedBody =
    body === undefined
      ? undefined
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  const request = (requestToken?: string | null) => {
    const requestHeaders = { ...finalHeaders };
    if (requestToken) requestHeaders.Authorization = `Bearer ${requestToken}`;
    else delete requestHeaders.Authorization;
    return fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: serializedBody,
      ...(revalidate !== undefined
        ? { next: { revalidate, ...(tag ? { tags: [tag] } : {}) } }
        : isServer()
          ? { cache: 'no-store' as const }
          : {}),
    });
  };

  let res = await request(token);
  if (res.status === 401 && token && !skipAuthRefresh && authRefreshHandler) {
    try {
      const refreshedToken = await authRefreshHandler();
      if (refreshedToken && refreshedToken !== token) {
        res = await request(refreshedToken);
      }
    } catch {
      // 保留原始 401，由调用方决定是否跳转登录。
    }
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (isJson &&
        payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        typeof (payload as { message?: unknown }).message === 'string' &&
        (payload as { message: string }).message) ||
      `请求失败 (HTTP ${res.status})`;
    throw new ApiRequestError(message, res.status, payload);
  }

  return payload as T;
}

/** 静默请求：失败时返回 null，不抛异常（用于非关键区块） */
export async function apiFetchSafe<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch {
    return null;
  }
}
