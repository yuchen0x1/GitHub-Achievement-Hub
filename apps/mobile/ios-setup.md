# iOS 构建指南

> **当前状态**
>
> - `apps/mobile/ios/` **已由官方 Capacitor CLI 生成**（`npx cap add ios`，exit 0）。
>   这不是手工伪造的工程，是 CLI 从 `@capacitor/ios` 模板materialize 出来的标准工程。
> - 工程使用 **Swift Package Manager（SPM）**，不是 CocoaPods（Capacitor 8 默认）。
> - 本机为 Windows，**无法执行 `xcodebuild` / 打开 Xcode**，因此「编译、签名、真机运行、
>   上架」必须在 macOS 上完成。本文件即该步骤的完整说明。

---

## 0. 工程现状（已生成）

```
apps/mobile/ios/
├── App/
│   ├── App.xcodeproj/            # Xcode 工程（SPM 版，无需 .xcworkspace）
│   ├── App/
│   │   ├── AppDelegate.swift
│   │   ├── SceneDelegate.swift
│   │   ├── Info.plist
│   │   ├── Assets.xcassets/
│   │   ├── Base.lproj/
│   │   ├── public/               # ← www 同步过来，含 __gach/*.js
│   │   ├── capacitor.config.json
│   │   └── config.xml
│   └── CapApp-SPM/
│       └── Package.swift         # 5 个 Capacitor 插件的 SPM 依赖
├── capacitor-cordova-ios-plugins/
└── debug.xcconfig
```

关键配置（生成时已写入，可用 `grep` 复核）：

| 项 | 值 |
| --- | --- |
| Bundle Identifier | `com.gach.hub` |
| Deployment Target | iOS 15.0 |
| Swift Tools | 5.9（需 Xcode 15+） |
| 依赖方式 | SPM（`capacitor-swift-pm` 8.6.0 + 5 个本地插件包） |

> ⚠️ `CapApp-SPM/Package.swift` 里的插件路径是
> `../../../../../node_modules/@capacitor/xxx`，即**依赖仓库根的 `node_modules`**。
> 因此不要在 `ios/` 内部单独装依赖，且换机器时必须先在仓库根执行 `npm install`。

---

## 1. macOS 前置条件

| 依赖 | 要求 | 检查 |
| --- | --- | --- |
| macOS | 13 Ventura+ | `sw_vers` |
| Xcode | **15.0+**（SPM 需要 swift-tools 5.9） | `xcodebuild -version` |
| Node.js | ≥ 20.11 | `node -v` |
| CocoaPods | **不需要**（SPM 方案） | — |

首次配置：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -runFirstLaunch
```

---

## 2. 准备 Web 产物

```bash
# 仓库根目录
npm install

export NEXT_OUTPUT=export
npm run build -w @gach/web          # 产物：apps/web/out

# 复制到 www 并注入离线脚本；同时指定真机可访问的 HTTPS API
GACH_API_BASE="https://api.your-domain.com/api/v1" \
  node apps/mobile/scripts/sync-web.mjs --no-build
```

> Web 端 `output: 'export'` 目前还有 4 处未修复（见 `apps/desktop/README.md` 第 3 节）。
> 修复前可临时用 `--allow-shell` 生成壳页来验证原生工程能否编译。

---

## 3. 同步到 iOS 工程

```bash
cd apps/mobile
npx cap sync ios
```

输出应包含：

```
√ Copying web assets from www to ios/App/App/public
√ Updating iOS plugins
[info] Found 5 Capacitor plugins for ios: ...
[info] Writing Package.swift
√ sync finished
```

每次改完 Web 都要重新执行 `sync-web.mjs` + `cap sync ios`。

---

## 4. 在 Xcode 中打开

```bash
cd apps/mobile
npx cap open ios
# 等价于 open ios/App/App.xcodeproj
```

> **SPM 工程打开 `.xcodeproj` 即可**（不像 CocoaPods 需要 `.xcworkspace`）。

首次打开时 Xcode 会自动解析 SPM 依赖。若解析卡住：

```bash
# Xcode → File → Packages → Reset Package Caches
# 或命令行：
xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App
```

`capacitor-swift-pm` 从 GitHub 拉取，需要网络可达 `github.com`。

---

## 5. 签名与运行

1. 左侧选 `App` → `TARGETS: App` → **Signing & Capabilities**
2. 勾选 `Automatically manage signing`
3. `Team` 选择你的 Apple ID（免费账号可跑真机，证书 7 天有效）
4. `Bundle Identifier`：默认 `com.gach.hub`。若与你的账号冲突（已被占用），改成
   `com.<yourname>.gach`。**改完请记得同步修改** `capacitor.config.ts` 的 `appId`，
   否则 `Preferences` 的分组与深链行为会不一致。
5. 选择真机 / 模拟器 → `Cmd + R`

命令行构建（CI）：

```bash
cd apps/mobile/ios/App
xcodebuild -project App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive \
  DEVELOPMENT_TEAM=<你的TeamID> \
  CODE_SIGN_STYLE=Automatic \
  archive
```

模拟器运行（不需要签名）：

```bash
xcodebuild -project App.xcodeproj -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 15' build
```

---

## 6. 归档与上架

1. Xcode → `Product` → `Archive`
2. Organizer → `Distribute App` → `App Store Connect` → `Upload`
3. App Store Connect 中补齐截图、隐私声明（需声明「网络访问」「本地存储」用途）

### 6.1 ATS：API 必须 HTTPS

iOS 默认禁止明文 HTTP。推荐直接给 API 配 HTTPS。若必须用 http，**只对特定域名**开口子：

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>api.your-domain.com</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
  </dict>
</dict>
```

**不要**全局设置 `NSAllowsArbitraryLoads`，容易被审核拒绝。

### 6.2 CORS

App 内页面 origin 为 `capacitor://localhost`（iOS）与 `https://localhost`（Android）。
后端 `apps/api` 的 CORS 需要放行这两个 Origin，否则请求会被浏览器层拦截。

---

## 7. 离线能力在 iOS 上的落点

| 能力 | iOS 实现 |
| --- | --- |
| `Preferences` | `NSUserDefaults`（key 前缀 `gach:`，分组 `GachCache`） |
| `Network` | `NWPathMonitor`，可区分「连了 Wi-Fi 但无外网」 |
| `StatusBar` | `#0d1117` 背景 + `style: 'DARK'`（深色背景浅色图标） |
| `Keyboard` | `resize: 'native'`，WebView 尺寸随键盘变化 |

断网时：

1. `network.ts` 派发 `gach:network` → 顶部提示条出现；
2. `offline-cache.ts` 的 fetch 拦截在请求失败时回读缓存并合成 `Response`；
3. 恢复联网后提示条自动隐藏。

---

## 8. 常见错误

| 报错 | 原因 | 处理 |
| --- | --- | --- |
| `Package.resolved ... capacitor-swift-pm` 拉取失败 | GitHub 不可达 / 代理问题 | 配置 Git 代理，或 Xcode 里 Reset Package Caches 重试 |
| `Signing for "App" requires a development team` | 未选 Team | Signing & Capabilities 选 Team |
| `The operation couldn't be completed. (NSURLErrorDomain error -1004)` | API 地址不可达 | 检查 `GACH_API_BASE` 与 ATS 配置 |
| 白屏、无报错 | `public/` 未更新 | 重跑 `sync-web.mjs` + `npx cap sync ios` |
| `Multiple commands produce ... Info.plist` | 重复添加资源 | 检查 Build Phases → Copy Bundle Resources |
| 所有请求 404 | API base 未生效 | App 内点顶部提示条的「设置 API」 |

---

## 9. 需要在 macOS 上执行的命令清单（TL;DR）

```bash
# 1. 仓库根
npm install

# 2. Web 静态导出
export NEXT_OUTPUT=export && npm run build -w @gach/web

# 3. 注入 + 同步
GACH_API_BASE="https://api.your-domain.com/api/v1" \
  node apps/mobile/scripts/sync-web.mjs --no-build
cd apps/mobile && npx cap sync ios

# 4. 打开 Xcode（首次会解析 SPM 依赖）
npx cap open ios

# 5. Xcode 内：选 Team → 选真机 → Cmd+R
```
