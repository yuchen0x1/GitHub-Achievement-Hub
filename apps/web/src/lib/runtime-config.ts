/**
 * 运行期配置。
 *
 * 静态导出（Tauri / Capacitor）后没有 Next.js 服务器，浏览器端的
 * `/api/v1` 不再能命中同源代理。桌面端 / 移动端外壳会在页面加载前：
 *   1. 注入 `globalThis.__GACH_API_BASE__`（真实 API 地址）；
 *   2. 包装 `window.fetch`，把 `/api/v1/*` 重写到该地址。
 * 见 `apps/desktop/src/runtime/api-base.js`。
 *
 * 本模块提供统一的解析入口：需要自己拼接 URL 的调用方优先使用
 * `resolveApiBase()`；继续使用 `apiFetch` 的调用方则由外壳的 fetch
 * 拦截完成重写，两者最终指向同一个可配置的 API base。
 */

declare global {
  // eslint-disable-next-line no-var
  var __GACH_API_BASE__: string | undefined;
}

/** 未注入时的默认值：SSR 模式下由 Next.js 同源代理处理 */
export const DEFAULT_API_BASE = '/api/v1';

/**
 * 解析当前应使用的 API base：
 * 优先读取外壳注入的 `__GACH_API_BASE__`，否则回退 `/api/v1`。
 */
export function resolveApiBase(): string {
  const injected =
    typeof globalThis !== 'undefined' ? globalThis.__GACH_API_BASE__ : undefined;
  if (typeof injected === 'string' && injected.trim().length > 0) {
    return injected.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE;
}
