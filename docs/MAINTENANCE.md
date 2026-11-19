# 平台和发布维护手册

本项目的正式交付面为响应式 Web 和配套 API。Web 使用同一套响应式页面在桌面与移动浏览器运行。主版本由根 `package.json` 定义；npm workspace、Tauri、Gradle 和 Xcode 的产品版本随发行同步，Android 和 iOS 的构建号各自维护。

## 平台可行性

等级 A 和 B 纳入维护。C 为投入产出比暂时较低，D 为核心功能或分发约束无法满足。Web 的公开知识库、登录、收藏和后台均依赖 API，静态导出时需要独立 API 才能提供在线能力。

| 候选平台 | 等级 | 核心功能、系统依赖和体验 | 开发、分发和升级 |
| --- | --- | --- | --- |
| 桌面 Web | A | 完整 Web 功能，键盘与鼠标，无系统权限 | 复用现有 Next.js，部署更新 |
| 移动 Web、响应式 Web | A | 搜索、详情、攻略与触控导航；登录依赖网络 | 复用现有组件，页面更新无需应用商店 |
| Linux、Ubuntu、Debian 云服务器与私有化 | A | Node.js 24、PostgreSQL、systemd，Redis 可选 | 原有服务和更新脚本，按标签构建并做健康检查 |
| Fedora、Arch Linux 服务器 | C | systemd 方案理论可行，依赖/SELinux 和文件权限需验证 | 独立发行版验收价值较低 |
| Windows 10、Windows 11 安装包 | C | Tauri/WebView2 有离线公共缓存；在线功能依赖独立 API | 历史 x64 资产可下载，当前缺少签名 Secrets 和跨版本验收 |
| Linux、Ubuntu、Debian、Fedora、Arch Linux 原生桌面 | C | 要验证 WebKitGTK、文件访问和系统接口 | 多包格式、签名和更新需要持续投入，Web 已覆盖使用场景 |
| macOS Intel、Apple Silicon 原生应用 | C | 可用 Tauri，需双架构、Gatekeeper、签名、公证 | 当前无原生包与更新链路，现代浏览器可访问 |
| Android 手机、Android 平板、折叠屏 | C | Capacitor 工程使用 Android API 24+；原生布局、横屏、折叠态和真实设备待验 | 需独立适配、长期签名和分发，移动 Web 优先 |
| iOS、iPadOS 原生应用 | C | 已跟踪 Xcode/Capacitor 工程，需 macOS、签名和真实设备 | App Store 分发及独立交互投入较高 |
| PWA | C | 离线资料有潜在价值，账号与实时查询仍需网络 | 要先设计公共数据缓存、撤回与版本一致性 |
| Chrome、Edge、Firefox 扩展 | C | 勋章指南无需浏览器扩展权限，API 无官方完整成就接口 | 增加安装、商店审核和维护成本 |
| Docker、NAS | C | 需验证持久卷、主机架构、HTTPS 和数据库备份 | 当前维护 systemd 源码部署，暂无容器发行 |
| CLI | C | API 调用可自动化，核心用途是浏览图鉴和攻略 | 平台 UI 价值小，另加命令分发和更新成本 |

## 每次发布

1. 更新版本文件、`CHANGELOG.md` 和 `docs/releases/release-notes.md`。原生工程使用同一产品版本，商店构建时再递增平台构建号。
2. 通过 PR 验证应用、依赖和平台影响，合并到 `main`。核对 `node scripts/verify-version.mjs vX.Y.Z` 后推送新标签。
3. Release 工作流重跑 CI，通过后生成源码包、SHA-256 和 `release.json`，签发 GitHub Artifact Attestation。工作流校验草稿附件的字节和签发来源，再公开发布。
4. Release 健康检查定期下载最新公开附件，校验 SHA-256、签发工作流、大小和版本。发布失败时保留草稿以便核对；同名已存在时需要维护者先检查现有资产。已公开版本的修复用新标签。
5. Web 自托管的 `deploy-release.sh` 使用部署 ID 隔离静态资源，在版本不匹配时由 Next.js 执行完整页面导航。原有 systemd 更新器校验 GitHub HTTPS 来源和标签提交，构建后原子切换，健康检查失败时恢复之前的可用版本。这个服务端流程目前独立于源码包 Attestation，不会回滚数据库结构。

源码下载与校验使用 [GitHub Releases](https://github.com/yuchen0x1/GitHub-Achievement-Hub/releases/latest)。在下载目录执行：

```bash
sha256sum -c SHA256SUMS.txt
gh attestation verify GitHub-Achievement-Hub-v0.0.5-Source.tar.gz \
  --repo yuchen0x1/GitHub-Achievement-Hub \
  --signer-workflow yuchen0x1/GitHub-Achievement-Hub/.github/workflows/release.yml
```

## 维护仪表盘

| 轨道 | 证据与边界 |
| --- | --- |
| Web 与 API | [CI](https://github.com/yuchen0x1/GitHub-Achievement-Hub/actions/workflows/ci.yml) 记录类型检查、单元/集成测试、PGlite 启动、Next.js 生产构建和 HTTP 冒烟 |
| Linux 自托管 | [部署说明](../deploy/README.md) 记录服务切换和恢复。生产 PostgreSQL、Redis、systemd 切换和数据库恢复需要在目标环境验收 |
| Windows 历史预览 | [v0.0.2](https://github.com/yuchen0x1/GitHub-Achievement-Hub/releases/tag/v0.0.2) 有 Tauri 签名附件。最新源码发行无 Windows 包，因此旧客户端的 latest.json 入口没有新包，更新验收记录见[更新文档](AUTO_UPDATE.md) |
| Android/iOS | 源码工程，当前无公开、受签名的新版本，可按[移动端文档](../apps/mobile/README.md)构建 |
| 发行与依赖 | [发布记录](https://github.com/yuchen0x1/GitHub-Achievement-Hub/actions/workflows/release.yml)、[发行巡检](https://github.com/yuchen0x1/GitHub-Achievement-Hub/actions/workflows/release-health.yml)和 Dependabot PR 均以 GitHub 实际结果为准 |

大版本前复核[竞品研究](../COMPETITOR_ANALYSIS.md)和[升级清单](../UPGRADE_ROADMAP.md)。每月查看直接竞品的提交、发行和勋章规则变化，优先核对官方资料并记录核对日期。涉及数据库的变更先在恢复副本上试运行。
