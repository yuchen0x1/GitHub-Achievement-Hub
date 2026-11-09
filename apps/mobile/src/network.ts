/**
 * 网络状态监听（移动端 / Capacitor）。
 *
 * 能力：
 *   - 优先使用 `@capacitor/network` 原生插件（能识别「已连 Wi-Fi 但无外网」这类
 *     浏览器 `navigator.onLine` 无法区分的情况）。
 *   - 原生插件不可用时回退到 `window` 的 `online` / `offline` 事件。
 *   - 统一派发 `gach:network` 自定义事件，detail = { connected, connectionType }。
 *   - 与离线缓存联动：断网时显示提示条，恢复时隐藏并派发 `gach:online`。
 *
 * 本文件同样以普通 `<script>` 形式注入，对外暴露 `window.__GACH_NETWORK__`。
 */
(function () {
  'use strict';

  interface NetworkStatus {
    connected: boolean;
    connectionType: string;
  }

  interface NetworkPluginListenerHandle {
    remove(): Promise<void>;
  }

  interface NetworkPlugin {
    getStatus(): Promise<NetworkStatus>;
    addListener(
      eventName: 'networkStatusChange',
      listener: (status: NetworkStatus) => void,
    ): Promise<NetworkPluginListenerHandle>;
  }

  type Listener = (status: NetworkStatus) => void;

  function getPlugin(): NetworkPlugin | null {
    var cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } }).Capacitor;
    var plugin = cap && cap.Plugins ? (cap.Plugins.Network as NetworkPlugin | undefined) : undefined;
    if (plugin && typeof plugin.addListener === 'function') return plugin;
    return null;
  }

  var plugin = getPlugin();
  var listeners: Listener[] = [];
  var started = false;
  var lastStatus: NetworkStatus = {
    connected: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    connectionType: 'unknown',
  };

  function bannerApi(): { show: (m?: string) => void; hide: () => void } | null {
    var api = (window as unknown as { __GACH_CACHE__?: Record<string, unknown> }).__GACH_CACHE__;
    if (api && typeof api.showOfflineBanner === 'function' && typeof api.hideOfflineBanner === 'function') {
      return api as unknown as { show: (m?: string) => void; hide: () => void };
    }
    return null;
  }

  function emit(status: NetworkStatus): void {
    lastStatus = status;
    listeners.forEach(function (fn) {
      try {
        fn(status);
      } catch (err) {
        /* 单个监听器异常不影响其他监听器 */
      }
    });
    try {
      window.dispatchEvent(new CustomEvent('gach:network', { detail: status }));
    } catch (err) {
      /* noop */
    }
    var banner = bannerApi();
    if (banner) {
      if (status.connected) banner.hide();
      else banner.show('网络已断开：正在展示本地缓存数据');
    }
    try {
      window.dispatchEvent(
        new CustomEvent(status.connected ? 'gach:online' : 'gach:offline-network'),
      );
    } catch (err) {
      /* noop */
    }
  }

  function current(): Promise<NetworkStatus> {
    if (plugin) {
      return plugin.getStatus().then(
        function (status) {
          return { connected: !!status.connected, connectionType: status.connectionType || 'unknown' };
        },
        function () {
          return lastStatus;
        },
      );
    }
    return Promise.resolve({
      connected: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
      connectionType: 'browser',
    });
  }

  function onChange(fn: Listener): () => void {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (item) {
        return item !== fn;
      });
    };
  }

  function start(): void {
    if (started) return;
    started = true;

    if (plugin) {
      plugin.addListener('networkStatusChange', function (status) {
        emit({ connected: !!status.connected, connectionType: status.connectionType || 'unknown' });
      }).catch(function () {
        /* 监听注册失败则只依赖浏览器事件 */
      });
      plugin.getStatus().then(
        function (status) {
          emit({ connected: !!status.connected, connectionType: status.connectionType || 'unknown' });
        },
        function () {
          /* noop */
        },
      );
    }

    window.addEventListener('online', function () {
      emit({ connected: true, connectionType: lastStatus.connectionType });
    });
    window.addEventListener('offline', function () {
      emit({ connected: false, connectionType: 'none' });
    });
  }

  var api = {
    isNative: plugin !== null,
    start: start,
    current: current,
    onChange: onChange,
    get status(): NetworkStatus {
      return lastStatus;
    },
  };

  (window as unknown as Record<string, unknown>).__GACH_NETWORK__ = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
