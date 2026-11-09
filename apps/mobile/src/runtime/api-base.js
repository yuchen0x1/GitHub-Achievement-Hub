/**
 * API Base 注入（移动端运行期脚本）。
 *
 * 由 `scripts/sync-web.mjs` 在复制产物时把下方 BUILD_BASE 的占位符替换成
 * 构建时指定的地址（环境变量 `GACH_API_BASE`）；未指定则保留占位符，
 * 运行期回退到本机开发地址。
 *
 * 与桌面端一致：包装 `window.fetch`，把 `/api/v1/*` 的相对请求重写到远程 API，
 * 这样 Web 端即使不改 `apiBase()`，App 内也能正常取数。
 */
(function () {
  'use strict';

  var LS_KEY = 'gach.apiBase';
  // 下面这个字面量会被 scripts/sync-web.mjs 整体替换（只在文件中出现一次）
  var BUILD_BASE = '__GACH_DEFAULT_API_BASE__';
  var FALLBACK_BASE = 'http://localhost:4000/api/v1';

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

  // 占位符未被替换时（本地未配置），回退到内置开发地址
  var buildDefault = /^https?:\/\//i.test(BUILD_BASE) ? normalize(BUILD_BASE) : FALLBACK_BASE;

  var fromQuery = '';
  try {
    fromQuery = normalize(new URLSearchParams(window.location.search).get('api'));
  } catch (err) {
    /* noop */
  }

  window.__GACH_API_BASE__ = fromQuery || readStored() || buildDefault;

  window.__GACH_setApiBase = function (base) {
    var next = normalize(base) || buildDefault;
    window.__GACH_API_BASE__ = next;
    try {
      window.localStorage.setItem(LS_KEY, next);
    } catch (err) {
      /* noop */
    }
    try {
      window.dispatchEvent(new CustomEvent('gach:api-base', { detail: { base: next } }));
    } catch (err) {
      /* noop */
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
        /* noop */
      }
      return nativeFetch(input, init);
    };
  }
})();
