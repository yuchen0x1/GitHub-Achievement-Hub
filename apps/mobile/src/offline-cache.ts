/**
 * 离线缓存层（移动端 / Capacitor）。
 *
 * 设计要点：
 *   - 存储后端优先使用 `@capacitor/preferences`（原生 SharedPreferences /
 *     NSUserDefaults），在浏览器环境（或原生插件不可用）时自动回退到
 *     `localStorage`，因此同一份脚本既能跑在 App 里，也能在 `npx cap serve`
 *     之外的普通浏览器中调试。
 *   - 本文件**刻意不写 import/export**：它会被 `tsc` 编译成一个普通
 *     `<script>`（非 ESM），由 `scripts/sync-web.mjs` 注入到每个 HTML。
 *     对外暴露 `window.__GACH_CACHE__`。
 *   - 缓存记录带 `ttlMs`，读取时惰性判断过期并顺手清理。
 *
 * 与 Web 端的契约：
 *   Web 端只要检测 `window.__GACH_CACHE__` 存在，即可在 API 失败时读取缓存；
 *   即使 Web 端不改，`installFetchCache()` 也已在 fetch 层做了透明兜底。
 */
(function () {
  'use strict';

  var PREFIX = 'gach:';
  var DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

  interface CacheEntry {
    key: string;
    value: unknown;
    cachedAt: number;
    ttlMs: number;
  }

  interface PreferencesLike {
    get(options: { key: string }): Promise<{ value: string | null }>;
    set(options: { key: string; value: string }): Promise<void>;
    remove(options: { key: string }): Promise<void>;
    keys(): Promise<{ keys: string[] }>;
    clear(): Promise<void>;
  }

  function getPreferences(): PreferencesLike | null {
    var cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } }).Capacitor;
    var plugin = cap && cap.Plugins ? (cap.Plugins.Preferences as PreferencesLike | undefined) : undefined;
    if (plugin && typeof plugin.get === 'function' && typeof plugin.set === 'function') {
      return plugin;
    }
    return null;
  }

  var nativePrefs = getPreferences();
  var isNative = nativePrefs !== null;

  /* --------------------------------------------------- 底层读写适配 */

  function lsKey(key: string): string {
    return PREFIX + key;
  }

  function readLocal(key: string): string | null {
    try {
      return window.localStorage.getItem(lsKey(key));
    } catch (err) {
      return null;
    }
  }

  function writeLocal(key: string, value: string): void {
    try {
      window.localStorage.setItem(lsKey(key), value);
    } catch (err) {
      /* 配额或隐私模式，忽略 */
    }
  }

  function removeLocal(key: string): void {
    try {
      window.localStorage.removeItem(lsKey(key));
    } catch (err) {
      /* noop */
    }
  }

  function readRaw(key: string): Promise<string | null> {
    if (nativePrefs) {
      return nativePrefs
        .get({ key: lsKey(key) })
        .then(function (res) {
          return res.value;
        })
        .catch(function () {
          return readLocal(key);
        });
    }
    return Promise.resolve(readLocal(key));
  }

  function writeRaw(key: string, value: string): Promise<void> {
    if (nativePrefs) {
      return nativePrefs.set({ key: lsKey(key), value: value }).catch(function () {
        writeLocal(key, value);
      });
    }
    writeLocal(key, value);
    return Promise.resolve();
  }

  /* ------------------------------------------------------ 记录 CRUD */

  function isExpired(entry: CacheEntry, now: number): boolean {
    if (!entry || typeof entry.cachedAt !== 'number') return true;
    if (!entry.ttlMs || entry.ttlMs <= 0) return false;
    return now - entry.cachedAt > entry.ttlMs;
  }

  function parseEntry(raw: string | null): CacheEntry | null {
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw) as CacheEntry;
      if (!parsed || typeof parsed !== 'object') return null;
      if (isExpired(parsed, Date.now())) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function set(key: string, value: unknown, ttlMs?: number): Promise<CacheEntry> {
    var entry: CacheEntry = {
      key: key,
      value: value,
      cachedAt: Date.now(),
      ttlMs: typeof ttlMs === 'number' ? ttlMs : DEFAULT_TTL_MS,
    };
    return writeRaw(key, JSON.stringify(entry)).then(function () {
      return entry;
    });
  }

  function getEntry(key: string): Promise<CacheEntry | null> {
    return readRaw(key).then(function (raw) {
      return parseEntry(raw);
    });
  }

  function get<T = unknown>(key: string): Promise<T | null> {
    return getEntry(key).then(function (entry) {
      return entry ? (entry.value as T) : null;
    });
  }

  function remove(key: string): Promise<void> {
    if (nativePrefs) {
      return nativePrefs.remove({ key: lsKey(key) }).catch(function () {
        removeLocal(key);
      });
    }
    removeLocal(key);
    return Promise.resolve();
  }

  function clear(): Promise<void> {
    if (nativePrefs) {
      return nativePrefs
        .keys()
        .then(function (res) {
          var jobs = res.keys
            .filter(function (k) {
              return k.indexOf(PREFIX) === 0;
            })
            .map(function (k) {
              return nativePrefs!.remove({ key: k }).catch(function () {});
            });
          return Promise.all(jobs).then(function () {
            return undefined;
          });
        })
        .catch(function () {
          return undefined;
        });
    }
    try {
      Object.keys(window.localStorage)
        .filter(function (k) {
          return k.indexOf(PREFIX) === 0;
        })
        .forEach(function (k) {
          window.localStorage.removeItem(k);
        });
    } catch (err) {
      /* noop */
    }
    return Promise.resolve();
  }

  function list(): Promise<CacheEntry[]> {
    if (nativePrefs) {
      return nativePrefs
        .keys()
        .then(function (res) {
          var targets = res.keys.filter(function (k) {
            return k.indexOf(PREFIX) === 0;
          });
          return Promise.all(
            targets.map(function (k) {
              return nativePrefs!.get({ key: k }).then(function (r) {
                return parseEntry(r.value);
              });
            }),
          ).then(function (entries) {
            return entries.filter(function (e): e is CacheEntry {
              return e !== null;
            });
          });
        })
        .catch(function () {
          return [] as CacheEntry[];
        });
    }
    return Promise.resolve([] as CacheEntry[]);
  }

  /* ------------------------------------------------- 离线提示条（UI） */

  var banner: HTMLElement | null = null;
  var bannerLabel: HTMLElement | null = null;

  function ensureBanner(): HTMLElement | null {
    if (banner) return banner;
    if (!document.body) return null;
    var el = document.createElement('div');
    el.id = 'gach-offline-banner';
    el.setAttribute('role', 'status');
    el.style.cssText = [
      'position:fixed',
      'left:0',
      'right:0',
      'top:0',
      'z-index:2147483000',
      'display:none',
      'align-items:center',
      'gap:10px',
      'padding:calc(8px + env(safe-area-inset-top)) 14px 8px',
      'font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      'color:#f0b72f',
      'background:rgba(35,26,4,0.97)',
      'border-bottom:1px solid rgba(240,183,47,0.45)',
    ].join(';');
    var text = document.createElement('span');
    text.style.flex = '1';
    bannerLabel = text;

    var retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = '重试';
    retry.style.cssText =
      'all:unset;cursor:pointer;padding:2px 10px;border:1px solid rgba(240,183,47,.5);border-radius:6px;font-size:12px';
    retry.addEventListener('click', function () {
      window.location.reload();
    });

    var config = document.createElement('button');
    config.type = 'button';
    config.textContent = '设置 API';
    config.style.cssText = retry.style.cssText;
    config.addEventListener('click', function () {
      var setter = (window as unknown as { __GACH_setApiBase?: (base: string) => string })
        .__GACH_setApiBase;
      if (!setter) return;
      var current = (window as unknown as { __GACH_API_BASE__?: string }).__GACH_API_BASE__ || '';
      var next = window.prompt('请输入 API 地址（例如 https://api.example.com/api/v1）', current);
      if (next == null) return;
      setter(next);
      window.location.reload();
    });

    el.appendChild(text);
    el.appendChild(config);
    el.appendChild(retry);
    document.body.appendChild(el);
    banner = el;
    return el;
  }

  function showOfflineBanner(message?: string): void {
    var el = ensureBanner();
    if (!el) return;
    if (bannerLabel) {
      bannerLabel.textContent = message || '离线模式：正在展示本地缓存数据';
    }
    el.style.display = 'flex';
  }

  function hideOfflineBanner(): void {
    if (banner) banner.style.display = 'none';
  }

  /* ------------------------------------------------ fetch 透明缓存 */

  var fetchInstalled = false;

  function cacheKeyOf(url: string): string | null {
    try {
      var base = window.location.href;
      var u = new URL(url, base);
      if (u.pathname.indexOf('/api/v1/') !== 0) return null;
      return 'api:' + u.pathname + (u.search || '');
    } catch (err) {
      return null;
    }
  }

  function serveCached(key: string): Promise<Response | null> {
    return getEntry(key).then(function (entry) {
      if (!entry) return null;
      showOfflineBanner(
        '离线模式：数据缓存于 ' + new Date(entry.cachedAt).toLocaleString(),
      );
      try {
        window.dispatchEvent(
          new CustomEvent('gach:offline', {
            detail: { key: key, cachedAt: entry.cachedAt },
          }),
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
          'X-GACH-Cached-At': String(entry.cachedAt),
        },
      });
    });
  }

  /**
   * 安装 fetch 拦截：GET /api/v1/* 成功即写缓存；失败（网络错误 / 5xx / 404）
   * 则回读缓存。可重复调用，只会生效一次。
   */
  function installFetchCache(): void {
    if (fetchInstalled) return;
    if (typeof window.fetch !== 'function') return;
    fetchInstalled = true;

    var innerFetch = window.fetch.bind(window);

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      var method = (
        (init && init.method) ||
        (typeof input === 'object' && input !== null && 'method' in input
          ? (input as Request).method
          : 'GET')
      ).toUpperCase();
      var rawUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      var key = method === 'GET' ? cacheKeyOf(rawUrl) : null;

      return innerFetch(input, init).then(
        function (res) {
          if (!key) return res;
          if (!res.ok && (res.status >= 500 || res.status === 404)) {
            return serveCached(key).then(function (cached) {
              return cached || res;
            });
          }
          if (res.ok) {
            hideOfflineBanner();
            try {
              res
                .clone()
                .json()
                .then(function (body) {
                  return set(key as string, body, DEFAULT_TTL_MS);
                })
                .catch(function () {
                  /* 非 JSON 响应不缓存 */
                });
            } catch (err) {
              /* noop */
            }
          }
          return res;
        },
        function (networkError: unknown) {
          if (!key) return Promise.reject(networkError);
          return serveCached(key).then(function (cached) {
            if (cached) return cached;
            return Promise.reject(networkError);
          });
        },
      );
    };
  }

  /* --------------------------------------------------------- 导出 */

  var api = {
    version: 1,
    isNative: isNative,
    backend: isNative ? 'capacitor-preferences' : 'localstorage',
    defaultTtlMs: DEFAULT_TTL_MS,
    get: get,
    getEntry: getEntry,
    set: set,
    remove: remove,
    clear: clear,
    list: list,
    installFetchCache: installFetchCache,
    showOfflineBanner: showOfflineBanner,
    hideOfflineBanner: hideOfflineBanner,
  };

  (window as unknown as Record<string, unknown>).__GACH_CACHE__ = api;
})();
