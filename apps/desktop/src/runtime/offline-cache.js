/**
 * 离线缓存层（桌面端运行期脚本）。
 *
 * 三层能力：
 *   1. 存储适配：优先走 Rust 命令 `cache_write` / `cache_read`（落盘到
 *      `%APPDATA%\com.gach.hub\achievement-cache.json`）；在没有 Tauri 环境
 *      （例如直接用浏览器打开 dist）时回退到 localStorage。
 *   2. 透明缓存：包装 `window.fetch`，把 `/api/v1` 的 GET 响应体顺带写入缓存，
 *      默认 TTL 7 天。
 *   3. 离线降级：请求失败（网络错误 / HTTP 5xx / 404）时回读缓存并合成
 *      Response 返回给 Web 端，同时弹出顶部离线提示条。
 *
 * 注意：本文件必须在 `api-base.js` 之后加载。
 */
(function () {
  'use strict';

  var DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天
  var MEM_PREFIX = 'gach.cache.';

  function tauriInvoke() {
    var t = window.__TAURI__;
    if (t && t.core && typeof t.core.invoke === 'function') return t.core.invoke.bind(t.core);
    if (t && typeof t.invoke === 'function') return t.invoke.bind(t);
    return null;
  }

  var invoke = tauriInvoke();
  var isTauri = !!invoke;

  /* -------------------------------------------------------- 存储适配 */

  function memGet(key) {
    try {
      var raw = window.localStorage.getItem(MEM_PREFIX + key);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (entry && entry.ttl_ms > 0 && Date.now() - entry.cached_at > entry.ttl_ms) {
        window.localStorage.removeItem(MEM_PREFIX + key);
        return null;
      }
      return entry;
    } catch (err) {
      return null;
    }
  }

  function memSet(key, value, ttlMs) {
    try {
      window.localStorage.setItem(
        MEM_PREFIX + key,
        JSON.stringify({ key: key, value: value, cached_at: Date.now(), ttl_ms: ttlMs }),
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  var cache = {
    isTauri: isTauri,

    /** 写入一条缓存，返回写入后的记录 */
    set: function (key, value, ttlMs) {
      var ttl = typeof ttlMs === 'number' ? ttlMs : DEFAULT_TTL_MS;
      if (invoke) {
        return invoke('cache_write', { key: key, value: value, ttlMs: ttl }).catch(function () {
          memSet(key, value, ttl);
          return { key: key, value: value, cached_at: Date.now(), ttl_ms: ttl };
        });
      }
      memSet(key, value, ttl);
      return Promise.resolve({ key: key, value: value, cached_at: Date.now(), ttl_ms: ttl });
    },

    /** 读取一条缓存；不存在或过期返回 null */
    get: function (key) {
      if (invoke) {
        return invoke('cache_read', { key: key })
          .then(function (entry) {
            return entry || memGet(key);
          })
          .catch(function () {
            return memGet(key);
          });
      }
      return Promise.resolve(memGet(key));
    },

    remove: function (key) {
      try {
        window.localStorage.removeItem(MEM_PREFIX + key);
      } catch (err) {
        /* noop */
      }
      if (invoke) return invoke('cache_remove', { key: key }).catch(function () {});
      return Promise.resolve(false);
    },

    clear: function () {
      try {
        Object.keys(window.localStorage)
          .filter(function (k) {
            return k.indexOf(MEM_PREFIX) === 0;
          })
          .forEach(function (k) {
            window.localStorage.removeItem(k);
          });
      } catch (err) {
        /* noop */
      }
      if (invoke) return invoke('cache_clear').catch(function () {});
      return Promise.resolve();
    },

    list: function () {
      if (invoke) return invoke('cache_list').catch(function () { return []; });
      return Promise.resolve([]);
    },
  };

  window.__GACH_CACHE__ = cache;

  /* ------------------------------------------------------ 离线提示条 */

  var bannerEl = null;
  var bannerText = null;

  function ensureBanner() {
    if (bannerEl || !document.body) return bannerEl;
    bannerEl = document.createElement('div');
    bannerEl.id = 'gach-offline-banner';
    bannerEl.setAttribute('role', 'status');
    bannerEl.style.cssText = [
      'position:fixed',
      'left:0',
      'right:0',
      'top:0',
      'z-index:2147483000',
      'display:none',
      'align-items:center',
      'gap:12px',
      'padding:8px 16px',
      'font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
      'color:#f0b72f',
      'background:rgba(35,26,4,0.96)',
      'border-bottom:1px solid rgba(240,183,47,0.45)',
      'box-shadow:0 2px 12px rgba(0,0,0,0.4)',
    ].join(';');

    bannerText = document.createElement('span');
    bannerText.style.flex = '1';

    var reloadBtn = document.createElement('button');
    reloadBtn.type = 'button';
    reloadBtn.textContent = '重试连接';
    reloadBtn.style.cssText =
      'all:unset;cursor:pointer;padding:2px 10px;border:1px solid rgba(240,183,47,.5);border-radius:6px;color:#f0b72f;font-size:12px';
    reloadBtn.addEventListener('click', function () {
      window.location.reload();
    });

    var configBtn = document.createElement('button');
    configBtn.type = 'button';
    configBtn.textContent = '设置 API 地址';
    configBtn.style.cssText = reloadBtn.style.cssText;
    configBtn.addEventListener('click', function () {
      var current = window.__GACH_API_BASE__ || '';
      var next = window.prompt('请输入 API 地址（例如 https://api.example.com/api/v1）', current);
      if (next == null) return;
      if (typeof window.__GACH_configureApiBase === 'function') {
        window.__GACH_configureApiBase(next);
        window.location.reload();
      }
    });

    bannerEl.appendChild(bannerText);
    bannerEl.appendChild(reloadBtn);
    bannerEl.appendChild(configBtn);
    document.body.appendChild(bannerEl);
    return bannerEl;
  }

  function showBanner(message) {
    var el = ensureBanner();
    if (!el) return;
    bannerText.textContent = message;
    el.style.display = 'flex';
    document.documentElement.style.setProperty('scroll-padding-top', '44px');
  }

  function hideBanner() {
    if (bannerEl) bannerEl.style.display = 'none';
  }

  window.__GACH_OFFLINE__ = {
    show: showBanner,
    hide: hideBanner,
    get visible() {
      return !!bannerEl && bannerEl.style.display !== 'none';
    },
  };

  /* -------------------------------------------------- fetch 透明缓存 */

  function cacheKeyOf(url) {
    try {
      var u = new URL(url, window.location.href);
      if (u.pathname.indexOf('/api/v1/') !== 0) return null;
      return 'api:' + u.pathname + (u.search || '');
    } catch (err) {
      return null;
    }
  }

  function fmtTime(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch (err) {
      return '未知时间';
    }
  }

  async function serveFromCache(key) {
    var entry = await cache.get(key);
    if (!entry) return null;
    showBanner('离线模式：正在展示本地缓存数据（缓存于 ' + fmtTime(entry.cached_at) + '）');
    try {
      window.dispatchEvent(
        new CustomEvent('gach:offline', { detail: { key: key, cachedAt: entry.cached_at } }),
      );
    } catch (err) {
      /* noop */
    }
    return new Response(JSON.stringify(entry.value), {
      status: 200,
      statusText: 'OK (cache)',
      headers: {
        'Content-Type': 'application/json',
        'X-GACH-Cache': 'hit',
        'X-GACH-Cached-At': String(entry.cached_at),
      },
    });
  }

  if (typeof window.fetch === 'function' && !window.__GACH_CACHE_PATCHED__) {
    window.__GACH_CACHE_PATCHED__ = true;
    var innerFetch = window.fetch.bind(window);

    window.fetch = async function (input, init) {
      var method = ((init && init.method) || (input instanceof Request && input.method) || 'GET').toUpperCase();
      var rawUrl =
        typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      var key = method === 'GET' ? cacheKeyOf(rawUrl) : null;

      var res;
      try {
        res = await innerFetch(input, init);
      } catch (networkError) {
        if (key) {
          var cached = await serveFromCache(key);
          if (cached) return cached;
        }
        throw networkError;
      }

      if (!key) return res;

      // 服务端异常 / 静态导出下无代理导致的 404 → 走缓存
      if (!res.ok && (res.status >= 500 || res.status === 404)) {
        var fallback = await serveFromCache(key);
        if (fallback) return fallback;
        return res;
      }

      if (res.ok) {
        hideBanner();
        try {
          var copy = res.clone();
          var body = await copy.json();
          await cache.set(key, body, DEFAULT_TTL_MS);
        } catch (err) {
          /* 非 JSON 或读取失败：跳过缓存 */
        }
      }
      return res;
    };
  }
})();
