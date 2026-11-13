# @gach/desktop — 桌面端（Tauri v2）

GitHub Achievement Hub 的 Windows 桌面外壳。承载 Web 端静态导出产物，
并提供本地缓存、离线降级与可配置 API 地址。

- 应用标识：`com.gach.hub`
- 产物：`nsis` 安装包（`.exe`）+ `msi` 安装包
- 窗口：1280×860，最小 960×640

---

## 1. 目录结构

```
apps/desktop/
├── package.json                     # 脚本入口（tauri dev / build / prepare:dist）
├── scripts/
│   ├── gen-icons.mjs                # 零依赖生成 PNG + ICO（含 16/32/48/256）
│   └── prepare-dist.mjs             # 复制 apps/web/out → dist 并注入运行期脚本
├── src/
│   ├── runtime/
│   │   ├── api-base.js              # window.__GACH_API_BASE__ + fetch 重写
│   │   └── offline-cache.js         # 缓存读写 + 离线降级 + 顶部提示条
│   └── shell/index.html             # 本地壳页（Web 导出未就绪时的降级页）
├── src-tauri/
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   ├── icons/                       # icon.png / icon.ico / 32x32 / 128x128 ...
│   └── src/
│       ├── main.rs
│       ├── lib.rs                   # 插件注册 + 8 个命令
│       └── cache.rs                 # 本地缓存文件读写（原子替换）
└── dist/                            # 生成物（frontendDist），已 gitignore
```

---

## 2. 开发运行

```bash
# 仓库根目录
npm install

# 启动 Tauri 开发窗口（会自动启动 Web 开发服务器）
npm run tauri:dev -w @gach/desktop
```

> `tauri dev` 使用 `tauri.conf.json` 的 `devUrl`（`http://localhost:3000`），并通过
> `beforeDevCommand` 自动执行根目录的 `npm run dev:web`。API 服务仍需另一个终端运行
> `npm run dev:api`，或直接在根目录执行 `npm run dev` 同时启动 API 与 Web。

---

## 3. 前端产物准备（关键）

Web 端 `next.config.ts` 在 `NEXT_OUTPUT=export` 时切换到 `output: 'export'`，
产物落在 `apps/web/out`。桌面端需要把它复制到 `apps/desktop/dist` **并注入运行期脚本**
（`api-base.js` / `offline-cache.js`），因此 `frontendDist` 指向 `../dist` 而不是
直接指向 `../../web/out`——避免污染 Web 仓库。

```bash
# 一步到位（内部会先执行 NEXT_OUTPUT=export next build）
node apps/desktop/scripts/prepare-dist.mjs

# 已有 out 时可跳过构建
node apps/desktop/scripts/prepare-dist.mjs --no-build

# 生产构建时如需固定 API 地址
GACH_API_BASE=https://api.your-domain.com/api/v1 node apps/desktop/scripts/prepare-dist.mjs
```

### 静态导出状态

当前静态导出已通过验证：

```bash
NEXT_OUTPUT=export npm run build -w @gach/web
```

构建生成 52 个静态页面，包含首页、成就列表与详情、攻略、登录、收藏、进度、搜索、后台页面以及
`sitemap.xml` / `robots.txt`。动态筛选、分页和用户态数据在静态壳中由客户端请求 API 完成。

导出模式下 Next.js 会提示 `rewrites`、`headers` 不会自动应用；这是预期行为。桌面端和移动端
通过注入的运行期脚本把 `/api/v1/*` 请求重写到可配置的远程 API，因此不依赖 Next.js 服务端代理。

如需验证完整跨端产物：

```bash
node apps/desktop/scripts/prepare-dist.mjs --no-build
node apps/mobile/scripts/sync-web.mjs --no-build
```

只有在确实需要验证原生工具链、而 Web 导出不可用时，才使用本地壳页降级：

```bash
node apps/desktop/scripts/prepare-dist.mjs --allow-shell
# 或 GACH_ALLOW_SHELL_FALLBACK=1 npx tauri build --bundles nsis
```

降级产物会**明确显示「本地壳页」**，不会伪装成完整应用。

---

## 4. 构建安装包

```bash
cd apps/desktop

# 仅编译（不打包），用于快速验证 Rust 侧
npx tauri build --no-bundle

# 只出 NSIS 安装包
npx tauri build --bundles nsis

# 只出 MSI（需要 WiX，Tauri 会自动下载）
npx tauri build --bundles msi

# 两个都出（tauri.conf.json 默认 targets）
npx tauri build
```

产物路径：

```
src-tauri/target/release/bundle/nsis/GitHub Achievement Hub_1.0.0_x64-setup.exe
src-tauri/target/release/bundle/msi/GitHub Achievement Hub_1.0.0_x64_en-US.msi
```

**首次构建会很慢**（Tauri 首次要下载并编译 ~400 个 crate，10–20 分钟）。后续增量编译快很多。

### 构建前检查

```bash
cd apps/desktop
npm run lint       # node --check 全部脚本
npm run check      # cargo check
npm run icons      # 重新生成图标
```

---

## 5. 图标

`scripts/gen-icons.mjs` 是**零依赖**实现：

- 手写 PNG chunk + CRC32，`zlib.deflateSync` 压缩 IDAT；
- ICO 使用 Windows 经典 `BITMAPINFOHEADER` + 自底向上 BGRA + AND 掩码（不用 PNG 内嵌条目，
  避免 `rc.exe` 兼容性问题）；
- 4× 超采样后盒式降采样做抗锯齿。

```bash
node scripts/gen-icons.mjs
# ✓ icon.png 512x512
# ✓ 128x128@2x.png 256x256
# ✓ 128x128.png 128x128
# ✓ 32x32.png 32x32
# ✓ icon.ico 16/32/48/256
```

---

## 6. 离线缓存与 API 地址

### 6.1 为什么需要注入 API 地址

Web 端 `src/lib/api.ts` 的 `apiBase()` 在浏览器环境固定返回 `/api/v1`，依赖 Next.js
的 `rewrites` 同源代理。**静态导出后没有 Next 服务器**，`/api/v1` 在本机不存在。

桌面端的处理（**不需要改 Web 代码**）：

1. `api-base.js` 设置 `window.__GACH_API_BASE__`；
2. 包装 `window.fetch`，把 `/api/v1/*` 的相对请求重写到配置的远程地址；
3. 启动时通过 Tauri 命令 `api_base_get` 读取持久化配置并校正。

配置优先级：`?api=` 查询参数 > localStorage > `config.json` > 环境变量 `GACH_API_BASE`
> 编译期 `GACH_API_BASE` > 内置默认 `http://localhost:4000/api/v1`。

运行期修改（壳页 / 离线提示条上的「设置 API 地址」按钮）：

```js
window.__GACH_configureApiBase('https://api.example.com/api/v1');
```

配置文件位置：`%APPDATA%\com.gach.hub\config.json`。

### 6.2 缓存实现

| 层 | 位置 | 说明 |
| --- | --- | --- |
| Rust 命令 | `cache_write` / `cache_read` / `cache_list` / `cache_remove` / `cache_clear` | 落盘 `%APPDATA%\com.gach.hub\achievement-cache.json`，写临时文件后 rename，避免半截文件 |
| 前端拦截 | `offline-cache.js` | GET `/api/v1/*` 成功即写缓存（默认 TTL 7 天） |
| 离线降级 | 同上 | 网络错误 / HTTP 5xx / 404 时回读缓存并合成 `Response` 返回，页面顶部弹出提示条 |

缓存记录结构：

```json
{
  "key": "api:/achievements?page=1",
  "value": { "...": "原始响应 JSON" },
  "cached_at": 1762560000000,
  "ttl_ms": 604800000
}
```

### 6.3 需要在 Web 端配合的待办

1. `apiBase()` 优先读取 `window.__GACH_API_BASE__`：

```ts
export function apiBase(): string {
  if (isServer()) return INTERNAL_BASE;
  const injected = (globalThis as any).__GACH_API_BASE__;
  if (typeof injected === 'string' && injected) return injected;
  return CLIENT_BASE;
}
```

2. 页面可监听 `window.addEventListener('gach:offline', ...)` 展示更友好的离线态；
3. 可选：直接调用 `window.__GACH_CACHE__.get(key)` 做「优先读缓存再刷新」策略。

即使不改，fetch 拦截也能保证桌面端可用。

---

## 7. 代码签名

Tauri 不生成证书，需自备代码签名证书（OV/EV）。

**方式 A：使用 `tauri.conf.json`（不推荐，会把证书信息写进仓库）**

**方式 B：环境变量（推荐，CI 使用）**

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw .\updater.key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your-password"
```

Windows Authenticode 签名（`signtool`）：

```powershell
signtool sign /f cert.pfx /p <password> /tr http://timestamp.digicert.com /td sha256 /fd sha256 `
  "src-tauri\target\release\bundle\nsis\GitHub Achievement Hub_1.0.0_x64-setup.exe"
```

或在 `tauri.conf.json` 中配置：

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "A1B2C3...",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

**没有证书时**：安装包仍可生成，但 Windows SmartScreen 会提示「未知发布者」。
本仓库**未包含任何签名证书或 keystore**。

---

## 8. 自动更新（GitHub Releases + Tauri 签名更新）

桌面端已经接入 Tauri v2 updater。客户端只访问 HTTPS 的 GitHub Releases
`latest.json`，Tauri 在安装前验证更新签名；Web 页面中的“桌面端更新”区域提供启动后每日检查、手动检查、更新日志、稍后提醒、真实下载进度和安装重启。

更新地址和公钥已写入 `src-tauri/tauri.conf.json`。仓库不会提交私钥；本机生成的私钥位于被忽略的 `.tauri/` 目录，正式发布时必须复制到 GitHub Actions Secret `TAURI_SIGNING_PRIVATE_KEY`。

### 8.1 签名密钥

```bash
cd apps/desktop
npx tauri signer generate --ci --password "<strong-password>" -w .tauri/gach-updater.key
```

输出示例（真实值由你的机器生成）：

```
Your keypair was generated successfully
Private: .tauri/gach-updater.key (Keep it secret!)
Public:  .tauri/gach-updater.key.pub
```

- **私钥**（`gach-updater.key`）只放在 CI secrets / 本机，绝不提交；
- **公钥**内容写入 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey`。
- **私钥密码**保存为 GitHub Actions Secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。

### 8.2 GitHub Releases 清单

```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/yuchen0x1/GitHub-Achievement-Hub/releases/latest/download/latest.json"
      ],
      "pubkey": "<仓库内固定公钥>",
      "requireSignedVersion": true,
      "windows": { "installMode": "passive" }
    }
  }
}
```

`latest.json`、安装包和 `.sig` 由 `.github/workflows/release.yml` 的
`tauri-apps/tauri-action` 生成，不能手工伪造下载链接、校验值或签名。

### 8.3 构建签名产物

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw .\.tauri\gach-updater.key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = Get-Content -Raw .\.tauri\gach-updater.key.password
npm run write-release-config -- 1.1.0
npx tauri build --config src-tauri/tauri.release.conf.json
```

构建会生成 Tauri updater 使用的签名产物。生产发布优先使用 GitHub Actions，避免把密钥写入仓库或日志。

### 8.4 前端触发检查

```ts
import { check } from '@tauri-apps/plugin-updater';

const update = await check();
if (update?.available) {
  await update.downloadAndInstall();
}
```

前端调用代码位于 `apps/web/src/components/layout/desktop-updater.tsx`；普通浏览器运行时会自动跳过 Tauri API，不影响 Web 站点。

---

## 9. 权限声明

`src-tauri/capabilities/default.json` 只对 `main` 窗口放开最小权限：

| 权限 | 用途 |
| --- | --- |
| `core:default` | 窗口 / 事件 / 路径等基础能力 |
| `store:default` | 轻量 KV 存储 |
| `shell:allow-open` | 用系统浏览器打开外链 |
| `updater:default` | 检查 / 安装更新 |
| `http:default` + 显式 scope | 仅允许 `https://*`、`http://localhost:*`、`http://127.0.0.1:*` |

自定义命令（`cache_*`、`api_base_*`、`app_info`）通过 `invoke_handler` 注册，
不需要额外 capability 声明。

---

## 10. 已知限制

1. **跨端 API 依赖**：静态桌面/移动产物不包含 API 服务，必须配置可访问的 API 地址；开发环境默认使用
   `http://localhost:4000/api/v1`，生产环境建议通过 `GACH_API_BASE` 或运行期配置覆盖。
2. **CORS**：App 内页面 origin 是 `tauri://localhost`（Windows 为
   `http://tauri.localhost`），远程 API 必须把该 Origin 加入 CORS 白名单。
3. **CSP 已关闭**（`app.security.csp = null`）：Next 静态导出包含大量内联
   hydration 脚本，先关闭以便联调。上线前应改为带 `'unsafe-inline'` 的严格策略并回归测试。
4. **仅 Windows 构建**：macOS / Linux 需在对应平台执行 `npx tauri build`。
5. **MSI 需要 WiX**：首次 `--bundles msi` 时 Tauri 会下载 WiX 3.x，需要网络。
6. **NSIS 需要网络**：首次打包会下载 NSIS 与插件到 `%LOCALAPPDATA%\tauri`。
7. **自动更新依赖发布条件**：客户端配置、更新界面和 GitHub Actions 已接入；只有配置 `TAURI_SIGNING_PRIVATE_KEY` 与密码 Secret 并发布正式 Release 后，在线更新才会有可下载资产。
8. **无代码签名**：安装时 SmartScreen 会告警；Tauri updater 的更新包签名仍会单独校验。

---

## 11. 构建验证记录

见本文件末尾「附录 A：真实构建输出」。

---

# 附录 A：真实构建输出

> 记录时间：2026-11-09，环境：Windows 11 Pro x64。
> 下列每一行都是实际执行过的命令与真实结果，未做修饰。

## A.1 环境探测

| 命令 | 实际输出 | 结论 |
| --- | --- | --- |
| `cargo --version` | `cargo 1.99.1 (5f94df478 2026-08-27)` | ✅ |
| `rustc --version` | `rustc 1.99.1 (58cf8f9c3 2026-10-13)` | ✅ |
| `curl -o /dev/null -w %{http_code} https://static.crates.io/` | `403`（根路径不开放目录列举） | 不可作为判据 |
| `curl ... https://index.crates.io/config.json` | `200` | ✅ 索引可达 |
| `curl ... https://static.crates.io/crates/serde/serde-1.0.219.crate` | `200`，78983 bytes | ✅ 包体可下载 |
| `npx tauri --version` | `tauri-cli 2.12.4` | ✅ |

**结论：crates.io 直连可用，未配置任何镜像**（`CARGO_HOME=D:\DevTools\cargo`，
其中没有 `config.toml`）。

## A.2 依赖解析

```
$ cargo fetch
（下载 tauri 2.12.5 / tauri-plugin-updater 2.14.1 / store 2.5.0 / http 2.8.3 / shell 2.6.0 等）
FETCH_EXIT=0
```

## A.3 编译检查

```
$ cargo check
    Checking webview2-com v0.39.1
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1m 36s
CARGO_CHECK_EXIT=0
```

无 error、无 warning。

## A.4 NSIS 安装包

```
$ env -u NODE_OPTIONS GACH_ALLOW_SHELL_FALLBACK=1 npx tauri build --bundles nsis
   Compiling github-achievement-hub v1.0.0
    Finished `release` profile [optimized] target(s) in 4m 23s
       Built application at: ...\src-tauri\target\release\github-achievement-hub.exe
     Running makensis to produce ...\bundle\nsis\GitHub Achievement Hub_1.0.0_x64-setup.exe
    Finished 1 bundle at:
        ...\GitHub Achievement Hub_1.0.0_x64-setup.exe (3.14 MiB)

TAURI_BUILD_EXIT=0
```

产物：

```
src-tauri/target/release/github-achievement-hub.exe   12,062,720 bytes
src-tauri/target/release/bundle/nsis/GitHub Achievement Hub_1.0.0_x64-setup.exe   3.2 MB
```

## A.5 MSI 安装包

```
$ env -u NODE_OPTIONS GACH_ALLOW_SHELL_FALLBACK=1 npx tauri build --bundles msi
     Running candle for "...\target\release\wix\x64\main.wxs"
     Running light to produce ...\bundle\msi\GitHub Achievement Hub_1.0.0_x64_en-US.msi
    Finished 1 bundle at:
        ...\GitHub Achievement Hub_1.0.0_x64_en-US.msi (4.71 MiB)

MSI_EXIT=0
```

## A.6 运行期脚本验证

用 Node `vm` 沙箱加载 `src/runtime/api-base.js`（模拟 `?api=https://api.example.com/api/v1`）：

```
API_BASE   = https://api.example.com/api/v1
rewrite    = https://api.example.com/api/v1/achievements?page=1
fetch 实际请求 = https://api.example.com/api/v1/achievements?page=1
```

→ API 地址注入与 fetch 重写行为正确。

## A.7 失败记录（如实保留）

### A.7.1 Web 静态导出历史失败记录

早期验证曾因 `sitemap.xml` 的静态配置和动态路由缺少静态参数而失败；这些问题已经修复，当前
`NEXT_OUTPUT=export npm run build -w @gach/web` 可成功生成 52 个静态页面。以下保留原始失败记录，
便于追溯，不再作为当前构建状态：

```
# 第 1 次
Error: export const dynamic = "force-static"/export const revalidate not configured
       on route "/sitemap.xml" with "output: export"

# 第 2 次（临时给 sitemap.ts 加 force-static 后）
Error: Page "/github-profile/[username]" is missing "generateStaticParams()"
       so it cannot be used with "output: export" config.
```

### A.7.2 首次 `tauri build` 被环境安全策略拦截

```
$ npx tauri build --bundles nsis
Error: [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED]
  {"count":52,"threshold":50,"scope":"turn","targets":["...\\apps\\desktop\\dist"]}
    at checkBulkDeleteGuard (.../node-safe-delete-shim.cjs:243:19)
beforeBuildCommand `node scripts/prepare-dist.mjs` failed with exit code 1
TAURI_BUILD_EXIT=1
```

**原因**：宿主环境通过 `NODE_OPTIONS` 注入了一个 safe-delete shim，禁止单轮删除 ≥50 个文件，
而 `prepare-dist.mjs` 用 `rmSync` 清空 `dist`。
**绕过**：`env -u NODE_OPTIONS` 后重跑即成功（见 A.4）。
**影响**：仅影响本机自动化环境，普通开发机不会出现。

