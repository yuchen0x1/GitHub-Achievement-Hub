# 自动更新系统

## 当前方案

GitHub Achievement Hub 的桌面端是 Tauri v2 应用，使用官方 `tauri-plugin-updater`，以 GitHub Releases 作为更新源。Linux 服务端继续使用 `deploy/scripts/deploy-release.sh` 的 Release 轮询和原子回滚流程；这两条链路互不覆盖。

选择依据：

- Tauri 官方 updater 插件与当前桌面壳一致，提供签名清单、下载事件、安装和重启接口。
- Electron Builder / `electron-updater` 面向 Electron 运行时，本项目不是 Electron，强行引入会增加重复运行时和包体。
- Velopack、Squirrel 适合 Windows 安装更新，但不能直接替代当前 Tauri updater 的签名和跨端配置。
- GitHub Releases 已经是仓库现有发布渠道，使用其 `latest.json` 不需要维护额外更新服务器。

桌面端更新清单地址为：

```text
https://github.com/yuchen0x1/GitHub-Achievement-Hub/releases/latest/download/latest.json
```

清单由 `tauri-apps/tauri-action` 在 GitHub Actions 中生成并上传。客户端配置了固定公钥，下载通过 HTTPS，Tauri updater 会在安装前验证签名。签名失败、清单缺失、网络失败或下载失败时，不会替换当前安装版本。

## 客户端功能

`apps/web/src/components/layout/desktop-updater.tsx` 只在 Tauri WebView 中启用：

- 启动后每天自动检查一次；可在桌面端页面关闭自动检查。
- 支持手动检查稳定版。
- 显示版本号、发布时间、更新日志和已知文件大小。
- 使用 Tauri 的真实下载事件计算进度；下载失败自动重试一次。
- 下载完成后交给 Tauri 校验签名，再安装并重启。
- 支持“稍后提醒”，记录被忽略的版本。
- 普通浏览器、SSR 和静态 Web 站点不会加载更新 API。

当前发布通道只有 stable。Beta/dev 通道没有接入独立清单，因此不会把预发布版本误推给稳定用户。

## GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 中配置：

| Secret | 内容 |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | `apps/desktop/.tauri/gach-updater.key` 的完整内容 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 生成该私钥时使用的密码 |

私钥和密码只放在 GitHub Secrets 或受控发布机，不要提交到 Git。`apps/desktop/.tauri/` 已加入忽略规则。若密钥丢失，必须生成新密钥、替换 `tauri.conf.json` 中的公钥，并让所有用户安装一次带新公钥的迁移版本。

Actions 未配置上述 Secret 时会跳过桌面打包；也可以在受控发布机使用现有密钥完成本地签名，再上传完整附件。不要为重跑工作流移动已发布标签。发布版本由 Git 标签和 `write-release-config.mjs` 的版本覆盖配置确定；各 workspace 的 `1.0.0` 是开发包版本。

## 发布流程

发布只接受 `vMAJOR.MINOR.PATCH` 标签，例如：

```bash
git tag v1.1.0
git push origin v1.1.0
```

`.github/workflows/release.yml` 先在 Ubuntu 上执行 lint、API 单元/集成测试，并启动隔离的构建 API 后生成 Web/API 生产产物。配置签名 Secrets 时，Windows runner 会生成真实静态 Web 产物、NSIS/MSI、签名与更新清单并创建 draft Release；未配置时跳过该部分，可由受控发布机上传本地签名产物。确认资产完整后发布 draft，客户端才会从稳定版地址读取更新。

桌面构建使用 `apps/desktop/scripts/write-release-config.mjs` 将标签版本覆盖到 Tauri 配置，不改写仓库中的开发版本文件。Tauri 配置启用了 `createUpdaterArtifacts`，Actions 会上传安装包、`.sig` 和 `latest.json`。

## 本地构建与测试

```bash
npm ci
npm run lint -w @gach/desktop
npm run build -w @gach/shared
npm run write-release-config -w @gach/desktop -- 1.1.0

# 需要一个已初始化且可达的 API，静态导出才会生成真实详情页
npm run export:static -w @gach/web
npm run prepare:dist -w @gach/desktop -- --no-build
```

配置签名环境变量后再构建 Tauri 安装包：

```powershell
Set-Location apps/desktop
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw .\.tauri\gach-updater.key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = Get-Content -Raw .\.tauri\gach-updater.key.password
npm run write-release-config -- 1.1.0
npx tauri build --config src-tauri/tauri.release.conf.json
```

没有真实 Release、签名 Secret 或已构建资产时，只能验证本地代码和构建流程，不能声称在线更新已经完成验收。

## 故障处理

- GitHub 或清单不可访问：保留当前版本，手动检查显示失败。
- 下载中断：自动重试一次；两次失败后不执行安装。
- 签名校验失败：Tauri updater 拒绝安装，当前版本保持可用。
- 安装器启动失败：不会删除旧版本；用户可重新检查或手动安装当前 Release。
- Release 是 draft 或 prerelease：稳定清单不会把它作为正式更新提供。
- 发布失败：Actions 保留失败日志，draft Release 和已上传资产由维护者检查后再处理。

本地打包完成后，在仓库根目录运行 `node apps/desktop/scripts/prepare-release.mjs 0.0.2`（替换为实际版本）。脚本使用客户端公钥校验两种安装包及签名内版本，随后在 `.release/v0.0.2/` 生成发布附件、`latest.json` 和 SHA-256 校验清单。签名不一致时不会生成新清单。上传整套附件并确认远程检查结果后再公开 Release。

## 当前限制

- 只有 Windows 桌面端进入本次自动发布矩阵；移动端仍遵循 Google Play / App Store 的商店更新机制。
- Windows 代码签名证书（Authenticode）未包含在仓库和 Actions 中，安装包可能显示未知发布者；更新包本身仍由 Tauri updater 签名校验。
- 本地签名打包及公钥校验已通过；真实旧客户端发现更新、下载、安装并重启的全过程尚未验收，不能以产物签名成功代替该验收。
- 当前稳定更新源不提供 Beta/dev 通道。
