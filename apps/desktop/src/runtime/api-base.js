/**
 * API Base 注入（桌面端运行期脚本）。
 *
 * 背景：Web 端 `apiBase()` 在浏览器侧固定返回 `/api/v1`（依赖 Next.js 同源
 * 代理）。静态导出后没有 Next 服务器，`/api/v1` 在本机不存在。
 *
 * 本脚本做两件事（**不需要修改 Web 代码**）：
 *   1. 暴露 `window.__GACH_API_BASE__`（Web 端后续可主动读取，见 README 待办）。
 *   2. 兜底：包装 `window.fetch`，把以 `/api/v1` 开头的相对请求重写到配置的
 *      远程 API 地址 —— 这样即使 Web 端暂时没适配，桌面端也能正常取数。
 *
 * 配置来源优先级：
 *   URL 查询参数 `?api=` > localStorage > Tauri 命令 `api_base_get` > 内置默认。
 */
(function () {
  'use strict';

  var LS_KEY = 'gach.apiBase';
  var DEFAULT_BASE = 'http://localhost:4000/api/v1';

  function normalize(base) {
    return String(base == null ? '' : base).trim().replace(/\/+$/, '');
  }

  function readStored() {
    try {
      return normalize(window.localStorage.getItem(LS_KEY));
    } catch (err) {
      return '';
    }
  }

  function persist(base) {
    try {
      window.localStorage.setItem(LS_KEY, base);
    } catch (err) {
      /* 隐私模式 / 配额不足时忽略 */
    }
  }

  var fromQuery = '';
  try {
    fromQuery = normalize(new URLSearchParams(window.location.search).get('api'));
  } catch (err) {
    /* location 不可用时忽略 */
  }

  /** 当前生效的 API base，供 Web 端读取 */
  window.__GACH_API_BASE__ = fromQuery || readStored() || DEFAULT_BASE;

  /** 运行期切换 API base（设置面板 / 调试用） */
  window.__GACH_setApiBase = function (base) {
    var next = normalize(base) || DEFAULT_BASE;
    window.__GACH_API_BASE__ = next;
    persist(next);
    try {
      window.dispatchEvent(
        new CustomEvent('gach:api-base', { detail: { base: next } }),
      );
    } catch (err) {
      /* 老 WebView 无 CustomEvent 构造器时忽略 */
    }
    return next;
  };

  var API_PREFIX = '/api/v1';

  function rewriteUrl(url) {
    var base = window.__GACH_API_BASE__;
    if (!base || typeof url !== 'string') return url;
    if (url === API_PREFIX || url.indexOf(API_PREFIX + '/') === 0) {
      return base + url.slice(API_PREFIX.length);
    }
    return url;
  }
  window.__GACH_rewriteApiUrl = rewriteUrl;

  // 包装 fetch：相对 /api/v1 请求改写为远程地址
  if (typeof window.fetch === 'function' && !window.__GACH_FETCH_PATCHED__) {
    window.__GACH_FETCH_PATCHED__ = true;
    var nativeFetch = window.fetch.bind(window);

    window.fetch = function (input, init) {
      try {
        if (typeof input === 'string') {
          input = rewriteUrl(input);
        } else if (input instanceof Request) {
          var next = rewriteUrl(input.url);
          if (next !== input.url) input = new Request(next, input);
        }
      } catch (err) {
        /* 重写失败则原样请求，交给离线层兜底 */
      }
      return nativeFetch(input, init);
    };
  }

  // 异步校正：从 Tauri 持久化配置读取
  function tauriInvoke() {
    var t = window.__TAURI__;
    if (t && t.core && typeof t.core.invoke === 'function') {
      return t.core.invoke.bind(t.core);
    }
    if (t && typeof t.invoke === 'function') return t.invoke.bind(t);
    return null;
  }

  var invoke = tauriInvoke();
  if (invoke) {
    invoke('api_base_get')
      .then(function (base) {
        var normalized = normalize(base);
        if (!normalized) return;
        window.__GACH_API_BASE__ = normalized;
        persist(normalized);
        try {
          window.dispatchEvent(
            new CustomEvent('gach:api-base', { detail: { base: normalized, source: 'tauri' } }),
          );
        } catch (err) {
          /* noop */
        }
      })
      .catch(function () {
        /* 非 Tauri 环境或命令不可用，保持初值 */
      });
  }

  /** 设置面板入口：写入 Tauri 配置 + localStorage */
  window.__GACH_configureApiBase = function (base) {
    var next = window.__GACH_setApiBase(base);
    var inv = tauriInvoke();
    if (inv) inv('api_base_set', { base: next }).catch(function () {});
    return next;
  };
})();
