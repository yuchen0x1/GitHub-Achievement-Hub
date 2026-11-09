# @gach/mobile — 移动端（Capacitor）

GitHub Achievement Hub 的 Android / iOS 外壳。页面来自 `apps/web` 的静态导出，
本目录只负责「搬运 + 注入 + 原生能力」。

- 应用 ID：`com.gach.hub`
- 应用名：GitHub Achievement Hub
- Web 目录：`apps/mobile/www`（由 `scripts/sync-web.mjs` 生成）
- 插件：Preferences / Network / StatusBar / Keyboard / App

---

## 1. 目录结构

```
apps/mobile/
├── package.json
├── capacitor.config.ts          # appId / webDir / androidScheme / 插件配置
├── tsconfig.json                # 编译 src/*.ts → dist（普通脚本，非 ESM）
├── tsconfig.config.json         # 对 capacitor.config.ts 做类型检查
├── src/
│   ├── offline-cache.ts         # 缓存层（Preferences + localStorage 回退）
│   ├── network.ts               # 网络状态监听 + gach:network 事件
│   └── runtime/api-base.js      # API 地址注入 + fetch 重写（含占位符）
├── scripts/
│   ├── sync-web.mjs             # 复制 out → www 并注入脚本
│   └── build-android.mjs        # 跨平台 gradlew 调用
├── ios-setup.md                 # macOS 上的 iOS 构建步骤
├── www/                         # 生成物（gitignore）
├── android/                     # 生成物（cap add android）
└── ios/                         # 生成物（仅 macOS 可生成）
```

---

## 2. 依赖安装

**必须在仓库根目录执行**（npm workspaces）：

```bash
npm install
```

依赖版本均取自 npmmirror 的最新版（`npm view <pkg> version --registry=https://registry.npmmirror.com`）：

| 包 | 版本 |
| --- | --- |
| `@capacitor/core` | 8.6.0 |
| `@capacitor/cli` | 8.6.0 |
| `@capacitor/android` | 8.6.0 |
| `@capacitor/ios` | 8.6.0 |
| `@capacitor/preferences` | 8.0.1 |
| `@capacitor/network` | 8.0.1 |
| `@capacitor/status-bar` | 8.0.4 |
| `@capacitor/keyboard` | 8.0.6 |
| `@capacitor/app` | 8.1.2 |

---

## 3. 同步 Web 产物

```bash
cd apps/mobile

# out 已存在
node scripts/sync-web.mjs --no-build

# out 不存在 → 内部会执行 NEXT_OUTPUT=export next build
node scripts/sync-web.mjs

# 指定真机可访问的 API 地址（写入 api-base.js 的默认值）
GACH_API_BASE=https://api.your-domain.com/api/v1 \
  node scripts/sync-web.mjs --no-build
```

脚本做四件事：

1. 把 `apps/web/out` 全量复制到 `apps/mobile/www`；
2. `tsc -p tsconfig.json` 编译 `src/*.ts` → `dist/`，把 `offline-cache.js` / `network.js`
   复制到 `www/__gach/`；
3. 用环境变量替换 `api-base.js` 的 `__GACH_DEFAULT_API_BASE__` 占位符；
4. 在每个 HTML 的 `</head>` 前注入：

```html
<script src="/__gach/api-base.js"></script>
<script src="/__gach/offline-cache.js"></script>
<script src="/__gach/boot.js"></script>
<script src="/__gach/network.js"></script>
```

> **为什么 `webDir` 是 `www` 而不是 `../web/out`？**
> 因为注入会往 HTML 里写 `<script>`，直接改 `apps/web/out` 会污染 Web 仓库产物；
> 且 `cap sync` 需要一个稳定的、可清理的目录。`www` 每次同步都全量重建。

### ⚠️ 当前 Web 端静态产物同步未完成

Next.js 当前可以生成 53 个静态页面，但 `@gach/web` 的 `export:static` 脚本会继续调用缺失的
`apps/web/scripts/export-static.mjs`，因此完整的 Web 产物同步仍未通过验证。

在真实 Web 产物可用前，可以使用降级开关验证原生工具链：

```bash
node scripts/sync-web.mjs --allow-shell --no-build
```

此时 `www/index.html` 是内置壳页，**不是真实界面**。

---

## 4. Android

### 4.1 环境要求

| 项 | 要求 | 本机实测 |
| --- | --- | --- |
| JDK | 17+（推荐 21） | Temurin 21.0.12 ✅ |
| Android SDK | Platform 34+ | `D:\DevTools\AndroidSdk`（34/35/36 已装）✅ |
| 环境变量 | `ANDROID_HOME` 或 `ANDROID_SDK_ROOT` | 已设置 ✅ |
| Gradle | 由 wrapper 自动下载（8.14.3） | ✅ |

### 4.2 添加平台

```bash
cd apps/mobile
npx cap add android
```

### 4.3 同步

```bash
node scripts/sync-web.mjs --no-build
npx cap sync android
```

### 4.4 构建 Debug APK

```bash
npm run build:android -w @gach/mobile
# 等价于 cd android && gradlew.bat assembleDebug（Windows）
#       或 cd android && ./gradlew assembleDebug（macOS/Linux）
```

产物：

```
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

安装到真机：

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.5 构建 Release APK / AAB

首先生成 keystore（**不要提交到仓库**）：

```bash
keytool -genkeypair -v \
  -keystore gach-release.keystore \
  -alias gach \
  -keyalg RSA -keysize 2048 -validity 10000
```

`android/keystore.properties`（加入 `.gitignore`）：

```properties
storeFile=../../gach-release.keystore
storePassword=***
keyAlias=gach
keyPassword=***
```

`android/app/build.gradle` 中配置 `signingConfigs.release`，然后：

```bash
cd android
gradlew.bat assembleRelease     # APK
gradlew.bat bundleRelease       # AAB（上架 Google Play 用）
```

产物：`android/app/build/outputs/apk/release/app-release.apk`
或 `android/app/build/outputs/bundle/release/app-release.aab`。

**本仓库未包含任何 keystore，也没有做过签名。**

### 4.6 在 Android Studio 中调试

```bash
npx cap open android
```

修改 Web 代码后记得重新 `sync-web` + `cap sync android`，否则 App 里还是旧资源。

---

## 5. iOS

Windows 上无法生成 Xcode 工程，**未提交伪造的 `.xcodeproj`**。
完整步骤见 [`ios-setup.md`](./ios-setup.md)，核心命令：

```bash
npx cap add ios
npx cap sync ios
cd ios/App && pod install
npx cap open ios
```

---

## 6. 离线缓存机制

### 6.1 存储后端

`src/offline-cache.ts` 优先使用 `@capacitor/preferences`：

| 平台 | 实际落点 |
| --- | --- |
| Android | `SharedPreferences`（文件 `GachCache`） |
| iOS | `NSUserDefaults` |
| 浏览器 | `localStorage`（自动回退，便于调试） |

key 统一前缀 `gach:`，与 `capacitor.config.ts` 的 `plugins.Preferences.group = 'GachCache'` 配合。

### 6.2 数据结构

```ts
interface CacheEntry {
  key: string;
  value: unknown;
  cachedAt: number; // Date.now()
  ttlMs: number;    // 默认 7 天，<=0 表示永不过期
}
```

读取时惰性判断过期；过期视为未命中（不主动删除，下一轮写入会覆盖）。

### 6.3 API

```js
await window.__GACH_CACHE__.set('achievement:123', data, 24 * 3600 * 1000);
const data = await window.__GACH_CACHE__.get('achievement:123');   // 过期返回 null
await window.__GACH_CACHE__.remove('achievement:123');
await window.__GACH_CACHE__.clear();
const all = await window.__GACH_CACHE__.list();
window.__GACH_CACHE__.installFetchCache();   // 安装 fetch 透明缓存（boot.js 已自动调用）
```

### 6.4 透明缓存 + 离线降级

`boot.js` 在 DOMContentLoaded 后调用 `installFetchCache()`：

1. GET `/api/v1/*` 且响应 `ok` → `res.clone().json()` 写入缓存；
2. 网络错误 / HTTP 5xx / 404 → 读缓存并合成 `Response`（带
   `X-GACH-Cache: hit` 头）返回给页面；
3. 同时派发 `gach:offline` 事件并在顶部显示提示条（含「设置 API」「重试」按钮）。

### 6.5 网络状态

`src/network.ts`：

- 原生：`@capacitor/network` 的 `networkStatusChange`（能区分「连着 Wi-Fi 但无外网」）；
- 回退：`window` 的 `online` / `offline` 事件；
- 统一派发 `gach:network`，detail `{ connected, connectionType }`。

```js
window.__GACH_NETWORK__.onChange(({ connected }) => console.log(connected));
const status = await window.__GACH_NETWORK__.current();
```

---

## 7. API 地址

App 内页面 origin 是 `https://localhost`（Android，`androidScheme: 'https'`）或
`capacitor://localhost`（iOS）。Web 端 `apiBase()` 返回的 `/api/v1` 是相对路径，
因此需要重写到远程 API。

`api-base.js` 的处理方式与桌面端一致：

- 设置 `window.__GACH_API_BASE__`；
- 包装 `fetch` 重写 `/api/v1/*`；
- 优先级：`?api=` > localStorage > 构建时 `GACH_API_BASE` > `http://localhost:4000/api/v1`。

**后端 CORS 必须放行**：

```ts
origin: ['capacitor://localhost', 'https://localhost', 'http://localhost']
```

**Android 明文 HTTP**：`capacitor.config.ts` 设置了 `allowMixedContent: false`，
若后端是 `http://`，需要改成 `true` 并在 `res/xml/network_security_config.xml` 放行域名。
**iOS 明文 HTTP** 请见 `ios-setup.md` 第 6.1 节。

---

## 8. 已知限制

1. **Web 静态导出未通过** → 当前 `www` 只能来自壳页（`--allow-shell`）。
2. **iOS 未生成工程**：Windows 无 Xcode，需在 macOS 执行 `npx cap add ios`。
3. **未签名**：没有 release keystore，也没有 iOS 证书 / Provisioning Profile。
4. **Android WebView 版本依赖**：Capacitor 8 需要 Android 6.0+ / WebView 60+。
5. **状态栏深色**：`StatusBar.style = 'DARK'` 表示「深色背景」的浅色图标，
   与 Web 端 `#0d1117` 一致；若切换浅色主题需同步改成 `'LIGHT'`。
6. **键盘**：`Keyboard.resize = 'native'` 在 Android 上要求
   `android:windowSoftInputMode="adjustResize"`（Capacitor 模板已默认设置）。
7. **注入脚本不走打包器**：`offline-cache.js` / `network.js` 是全局脚本，
   不能直接用 `import`。如需打包，请自行接 Vite/Nx。

---

## 9. 构建验证记录

见下方「附录 A：真实构建输出」。

---

# 附录 A：真实构建输出

> 记录时间：2026-11-09，环境：Windows 11 Pro x64 / JDK 21.0.12 / Android SDK `D:\DevTools\AndroidSdk`。

## A.1 版本探测（npmmirror）

```
$ npm view @capacitor/core   version --registry=https://registry.npmmirror.com → 8.6.0
$ npm view @capacitor/cli    version ...                                        → 8.6.0
$ npm view @capacitor/android version ...                                       → 8.6.0
$ npm view @capacitor/ios    version ...                                        → 8.6.0
$ npm view @capacitor/preferences version ...                                   → 8.0.1
$ npm view @capacitor/network version ...                                       → 8.0.1
$ npm view @capacitor/status-bar version ...                                    → 8.0.4
$ npm view @capacitor/keyboard version ...                                      → 8.0.6
$ npm view @capacitor/app    version ...                                        → 8.1.2
```

写入 `package.json` 的版本与上述完全一致。

## A.2 依赖安装

```
$ cd <repo-root> && npm install
up to date in 55s
NPM_INSTALL_EXIT=0
```

（在**仓库根目录**执行，符合 workspaces 约定。）

## A.3 TypeScript 编译与类型检查

```
$ npx tsc -p tsconfig.json
（无输出）
TSC_EXIT=0

$ npx tsc -p tsconfig.config.json
（无输出）
EXIT=0
```

产物：

```
dist/network.js          4,326 bytes
dist/offline-cache.js   13,120 bytes
```

两者均**不含 `export` 语句**（全局脚本，可直接 `<script>` 引入）——已用 `grep -c "export "` 验证为 0。

## A.4 Web 同步与脚本注入

```
$ node scripts/sync-web.mjs --allow-shell --no-build
[sync-web] 未找到 ...\apps\web\out/index.html（已指定 --no-build）
[sync-web] ⚠ 降级使用内置壳页（GACH_ALLOW_SHELL_FALLBACK=1）
[sync-web] 生成壳页 ...\apps\mobile\www\index.html
[sync-web] 编译 src/*.ts → dist/
[sync-web] 注入 offline-cache.js
[sync-web] 注入 network.js
[sync-web] 注入 api-base.js（API_BASE=未配置，运行时回退本地默认）
[sync-web] 注入 boot.js
[sync-web] HTML 注入完成：1 个已注入，0 个跳过（共 1 个）
[sync-web] 完成。webDir = ...\apps\mobile\www
```

`www/__gach/` 最终内容：

```
api-base.js     2,710 bytes
boot.js           401 bytes
network.js      4,326 bytes
offline-cache.js 13,120 bytes
```

> 降级原因：Web 端 `output: 'export'` 未通过（4 处缺失声明），详见 `apps/desktop/README.md` 第 3 节。
> 这**不是伪造**——壳页会明确标注自己是壳页。

## A.5 Android 平台添加

```
$ npx cap add android
√ Adding native android project in android in 644.90ms
√ Copying web assets from www to android\app\src\main\assets\public
√ Creating capacitor.config.json in android\app\src\main\assets
[info] Found 5 Capacitor plugins for android:
       @capacitor/app@8.1.2
       @capacitor/keyboard@8.0.6
       @capacitor/network@8.0.1
       @capacitor/preferences@8.0.1
       @capacitor/status-bar@8.0.4
[success] android platform added!
CAP_ADD_EXIT=0
```

## A.6 Android Debug APK

```
$ node scripts/build-android.mjs
> Task :app:mergeExtDexDebug
> Task :app:packageDebug
> Task :app:createDebugApkListingFileRedirect
> Task :app:assembleDebug

BUILD SUCCESSFUL in 1m 50s
243 actionable tasks: 243 executed
[build-android] ✓ 构建成功
GRADLE_EXIT=0
```

产物：

```
android/app/build/outputs/apk/debug/app-debug.apk   4,152,271 bytes (3.96 MiB)
```

APK 内容抽查（`unzip -l`）确认注入脚本已进入包内：

```
assets/public/__gach/api-base.js         2,710
assets/public/__gach/boot.js               401
assets/public/__gach/network.js          4,326
assets/public/__gach/offline-cache.js   13,120
assets/public/index.html                 2,729
AndroidManifest.xml                      6,132
```

## A.7 Android 同步

```
$ npx cap sync android
√ Copying web assets from www to android\app\src\main\assets\public in 514.94ms
[info] Found 5 Capacitor plugins for android: ...
[info] Sync finished in 2.394s
CAP_SYNC_EXIT=0
```

## A.8 iOS 平台（与预期不符，如实记录）

**任务假设**「`npx cap add ios` 在 Windows 上必然失败」——实测**成功**：

```
$ npx cap add ios
√ Creating capacitor.config.json in ios\App\App
√ copy ios in 94.85ms
[info] All Capacitor plugins have a Package.swift file and will be included in Package.swift
[info] Writing Package.swift
[info] Found 5 Capacitor plugins for ios: ...
√ update ios in 250.20ms
[success] ios platform added!
CAP_ADD_IOS_EXIT=0
```

原因：Capacitor 8 的 iOS 模板改用 **SwiftPM**，`cap add` 只做文件物化，不调用 Xcode。
生成物是标准工程（非伪造）：

```
ios/App/App.xcodeproj/project.pbxproj       PRODUCT_BUNDLE_IDENTIFIER = com.gach.hub
                                            IPHONEOS_DEPLOYMENT_TARGET = 15.0
ios/App/CapApp-SPM/Package.swift            swift-tools-version 5.9
ios/App/App/{AppDelegate,SceneDelegate}.swift
ios/App/App/Info.plist
ios/App/App/public/__gach/*.js              ← 已同步
```

**仍然无法完成的部分**：`xcodebuild` 编译、签名、归档 —— 需要 macOS + Xcode 15+。
本机未执行，也**未声称成功**。macOS 上的步骤见 `ios-setup.md`。

## A.9 未验证项（明确列出）

| 项 | 状态 | 原因 |
| --- | --- | --- |
| iOS 编译 / 归档 / 上架 | ❌ 未执行 | 需要 macOS + Xcode |
| Android Release APK 签名 | ❌ 未执行 | 无 keystore，且不应提交密钥 |
| 真机安装运行 | ❌ 未执行 | 无连接设备 |
| 与真实 API 联调 | ❌ 未执行 | `apps/api` 未启动（不在本次范围） |
| Web 真实页面渲染 | ❌ 未验证 | Web 静态导出未通过 |
