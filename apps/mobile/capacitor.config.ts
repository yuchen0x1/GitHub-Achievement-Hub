import type { CapacitorConfig } from '@capacitor/cli';

/**
 * GitHub Achievement Hub — 移动端外壳配置。
 *
 * 说明：
 *   webDir 指向 `www`，而不是直接指向 `../web/out`。
 *   原因：`scripts/sync-web.mjs` 需要把 Web 静态导出产物复制过来，并注入
 *   `api-base.js` / `offline-cache.js` / `network.js`。直接指向 out 目录会导致
 *   注入污染 Web 仓库，且 `cap sync` 无法识别非标准目录。
 */
const config: CapacitorConfig = {
  appId: 'com.gach.hub',
  appName: 'GitHub Achievement Hub',
  webDir: 'www',

  // 使用 https scheme，避免 Android WebView 在 http 下的混合内容限制，
  // 同时让 localStorage / IndexedDB 落在稳定的 origin 上。
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
  },

  plugins: {
    // 深色顶栏，与 Web 端 #0d1117 主题一致
    StatusBar: {
      backgroundColor: '#0d1117',
      style: 'DARK',
      overlaysWebView: false,
    },
    // 键盘弹出时由原生调整 WebView 尺寸，避免输入框被遮挡
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
      style: 'DARK',
    },
    Preferences: {
      // 使用应用私有分组，避免与其他 plugin 的 key 冲突
      group: 'GachCache',
    },
  },

  android: {
    allowMixedContent: false,
    backgroundColor: '#0d1117',
  },

  ios: {
    contentInset: 'always',
    backgroundColor: '#0d1117',
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
