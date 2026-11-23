# PROJECT EVOLUTION 升级交付报告

## 2026-11-23 增量交付：真实公开徽章查询

本轮基于 `origin/main` 的 `0075305` 创建分支 `feat/real-achievement-detection`，目标是修复账号查询的核心功能缺口：GitHub REST API 不提供完整 Profile Achievements，但公开个人主页 HTML 会展示可读取的徽章标记。

### 实施结果

- 新增 `apps/api/src/modules/github/achievement-scraper.ts`：解析主页侧栏 `<a>` 和成就卡片 `<details>` 两种结构，按 slug 去重，读取官方图片域名并识别 Bronze / Silver / Gold。
- `GithubApiService` 新增公开主页抓取，复用串行队列、最小请求间隔、超时和限流冷却；通过 `GITHUB_PROFILE_HTML=false` 可在受限部署中关闭。
- `GithubProfileService` 将主页徽章与本站目录对照，显示已确认等级；解析失败、网络出口不可用或结构变化时保持 `UNKNOWN`，不推断「未获得」。
- Web 账号查询、共享类型、README、竞品研究、环境模板、CHANGELOG 和 Release notes 已同步；版本统一为 `0.1.0`。

### 现场研究证据

- GitHub Search API 复核直接同类项目：[Schweinepriester/github-profile-achievements](https://github.com/Schweinepriester/github-profile-achievements)、[drknzz/GitHub-Achievements](https://github.com/drknzz/GitHub-Achievements)、[Thinkright20/Profile-Badges](https://github.com/Thinkright20/Profile-Badges)。
- 2026-11-23 通过公开请求核对 `torvalds`、`tj`、`octocat`、`yuchen0x1` 的 `?tab=achievements` 页面，实测获得徽章 slug、`githubassets.com` 图片和 Bronze/Silver/Gold 标签。
- UI 生态核对：仓库已有 Radix UI、Tailwind CSS、Lucide、next-themes；本轮保持单一设计体系，没有重复引入组件库。

### 验证结果

| 命令 | 结果 |
|---|---|
| `npm run lint --workspaces --if-present` | PASS：API、Web、Desktop、Mobile、Shared |
| `npm run test:unit -w @gach/api` | PASS：11 suites / 84 tests |
| `npm run test:e2e` | PASS：1 suite / 24 tests |
| `npm run build` | PASS：Shared、API、Next.js Web |
| `npm run verify:build` | PASS：临时 PGlite + API ready + Web 页面冒烟 |
| `npm run verify:version` | PASS：`v0.1.0` |
| 真实上游 HTML | PASS：PowerShell 可访问；Node 运行时需配置系统代理（本机验证 `127.0.0.1:7897`） |

### 未完成与风险

- 尚未推送、创建 PR、合并 `main`、创建 `v0.1.0` Release；当前环境只完成了本地开发分支和验证。
- GitHub 公开 HTML 不是稳定 API；页面结构或账号可见性变化时会降级并记录服务端 warning。生产部署应配置可用 HTTPS 代理或将 `GITHUB_PROFILE_HTML=false`。
- 未验证真实生产 PostgreSQL/Redis、OAuth、签名桌面安装包、移动设备和跨版本升级；不把本地构建当作发布证据。

报告日期：2026-11-16（Asia/Shanghai）
升级起点：GitHub Achievement Hub 〈`main` / HEAD `d8a7951`〉；发布前已同步远端 `main` 的依赖安全修复 `7ae6d21`。
主要交付提交：`348d785` 与发布说明提交 `3590269`，分支 `codex/project-evolution-20261116` 已推送到 `origin`。
工作边界：按当前仓库真实架构推进；代码、文档和测试均在仓库工作区完成。现有未跟踪静态导出目录、zip 和 `.edgeone/` 已保留，未纳入本轮源码改动。

## A. 竞品研究

- **实际研究数量：16 个开源或公开源码项目**，超过要求的 15 个。
- **直接同类**：`github-profile-achievements`、`GitHub-Achievements`、`DEVELOPER-ASCEND`。
- **相邻 GitHub 资料**：`github-readme-stats`、`github-readme-streak-stats`、`github-profile-summary-cards`、`open-sauced/app`、`sourcerer-app`、`starhistory.github.io`。
- **知识库/文档**：Starlight、Fumadocs、Docusaurus、Outline、giscus。
- **搜索/性能**：Meilisearch、Typesense。

研究证据包括 README、LICENSE、顶层目录、依赖脚本和最近提交。直接同类项目帮助确认了可获取、停发、内部、等级和多语言资料的分离方式；文档框架帮助确认了目录、主题、国际化、可访问性和构建检查方向；搜索项目帮助确认了后续应保留 provider 抽象和缓存边界。许可证和维护状态不满足时只记录为参考，不直接集成代码。完整表格见 [`COMPETITOR_ANALYSIS.md`](COMPETITOR_ANALYSIS.md)。

### 我们领先的地方

- 资料不是单一 Markdown 清单，而是带来源、可信度、争议、等级、要求、攻略和历史的结构化模型。
- 公开内容、登录数据、后台编辑和多端壳共享同一 API 契约。
- GitHub 账号查询已经区分 404、429、超时和上游故障，并明确成就数据不可用的边界。
- 发布系统已有签名更新清单、校验清单、原子切换和失败回滚。

### 明显短板

- 内容来源没有自动新鲜度队列，资料纠错尚未形成端到端审核工作流。
- 没有生产 Prisma migration 基线、备份恢复演练、SBOM 和构建来源证明。
- 多实例 GitHub 配额协调仍是进程内，搜索仍以 Prisma contains 为主。
- 没有持续 Playwright 浏览器回归、压测、原生安装和真实 OAuth 端到端证据。

## B. 升级数量与完成状态

路线图共 **40 项**，每项都有 EV 编号、问题依据、参考项目、实施方案、预期效果、文件模块、难度、优先级和验收标准。

| 状态 | 数量 | 说明 |
|---|---:|---|
| 完成（本轮） | 10 | EV-001 至 EV-010，均有代码/配置/测试或文档证据 |
| 部分完成 | 11 | EV-018、019、021、023、025、033、034、037、038、039、040；已有基础但缺关键验收或生产条件 |
| 未完成 | 19 | 资料新鲜度、迁移、恢复、认证增强、多实例、搜索索引、目标计划、趋势图、浏览器和压测等 |
| 合计 | 40 | 未把一个小功能拆成重复编号 |

“完成（本轮）”只代表本轮实际做过的代码与文档变更；仓库中此前已有的能力被列为“部分完成/已有基础”，没有冒充本轮新增。

## C. 本轮代码与文档修改

### 修改的主要文件

- `apps/api/src/common/utils/number.util.ts`：新增有界正整数解析。
- `apps/api/src/modules/achievements/achievements.controller.ts`、`achievements.service.ts`：统一 featured、分页参数边界。
- `apps/api/src/modules/articles/articles.service.ts`：统一文章分页边界。
- `apps/api/src/modules/admin/admin.controller.ts`、`achievements/admin-achievements.controller.ts`：统一后台分页边界。
- `apps/api/src/modules/search/search.controller.ts`、`search.service.ts`：搜索 DTO 校验和 service 层二次边界保护。
- `apps/api/src/modules/admin/feedback.dto.ts`：反馈主题、正文、类型和邮箱约束。
- `apps/api/src/health.controller.ts`：新增 live/ready 探针，保留原综合 health 响应。
- `apps/api/src/cache/cache.service.ts`：Redis 前缀失效改用 SCAN 分批删除。
- `apps/web/src/components/layout/search-box.tsx`：请求取消、加载状态、combobox/listbox 语义和 aria 状态。
- `deploy/scripts/common.sh`、`deploy/README.md`：部署健康检查切换到 ready 探针。
- `apps/api/test/unit/number.util.spec.ts`、`apps/api/test/e2e/api.e2e-spec.ts`：边界、健康和反馈回归。

### 新增交付文档

- `PROJECT_AUDIT.md`
- `COMPETITOR_ANALYSIS.md`
- `UPGRADE_ROADMAP.md`
- `UPGRADE_REPORT.md`
- `CHANGELOG.md`

没有数据库 schema 变更、没有 migration、没有删除文件、没有覆盖用户配置，也没有引入新生产依赖。

## D. 测试与质量验收

| 状态 | 命令 | 实际结果 |
|---|---|---|
| PASS | `npm run test:unit -w @gach/api -- --runInBand` | 10 个 suite、75 个测试通过 |
| PASS | `npm run test:e2e`（变更前基线） | 1 个 suite、21 个测试通过 |
| PASS | `npm run test:e2e`（最终工作树） | 1 个 suite、24 个测试通过，覆盖 live/ready 和反馈输入校验 |
| PASS | `npm run build:api` | NestJS/Prisma TypeScript 构建通过 |
| PASS | `npm run lint -w @gach/web` | Web TypeScript noEmit 通过 |
| PASS | `npm run build -w @gach/shared` | shared 包构建通过 |
| PASS | `npm run build` | shared、API、Web 全量构建通过；Next.js 生成 24 个静态页面 |
| PASS | GitHub Actions `43880891131` | 标签 `v0.0.3` 的依赖安装、lint、单元测试、API 集成测试、预渲染启动和生产构建全部通过 |
| PARTIAL | GitHub Actions 桌面发布作业 | 作业成功，但未配置 Tauri 签名 Secrets，桌面打包、更新清单和校验清单步骤跳过 |
| BLOCKED/PARTIAL | 浏览器视觉、Tauri/Capacitor 原生、真实 OAuth、生产 PostgreSQL/Redis、签名安装升级 | 当前环境没有形成完整端到端证据 |

测试脚本中的 Jest e2e 使用 `--forceExit`，所以通过表示断言通过，不表示所有外部句柄已自然关闭。没有运行 `npm audit` 并把网络失败当成通过，也没有伪造性能、生产或安装结果。

## E. 项目变化

### 升级前

项目已经具备完整的资料库、攻略、搜索、用户记录、后台、多端壳和发布脚本，但查询参数边界、搜索联想竞态、反馈输入和部署健康语义仍有明显缺口；Redis 失效在生产 keyspace 上有阻塞风险。

### 升级后

- API 查询参数在主要分页、搜索和管理入口得到一致的正整数边界保护。
- 搜索联想不会继续使用已取消的请求，用户能看到加载状态，键盘和屏幕阅读器可以理解建议列表。
- 部署器能分别使用进程存活和数据库就绪探针，数据库未就绪不会误切换 Web。
- Redis 前缀失效不再使用阻塞性的 `KEYS`。
- 反馈输入在进入 Prisma 前经过 DTO 校验。
- 项目有可追溯的 16 项竞品研究、40 项路线图和当前状态档案。

### 仍然不够的地方

- 本轮没有完成 Prisma migration、生产恢复演练、多实例配额、全文索引、目标计划、趋势图和分享卡片。
- 没有浏览器自动化、压力测试、真实 OAuth、原生安装、生产数据库/Redis 和跨版本升级验收证据。
- 已发布 `v0.0.3`：`main` 与标签已推送到 `origin`，GitHub Actions `43880891131` 全部成功，正式 Release 已创建；由于没有 Tauri 签名 Secrets，发布页不包含 Windows 安装包、更新清单或 SHA-256 附件。

## F. 后续执行建议

下一批应按 P0 顺序处理 EV-016 至 EV-020：先建立迁移和备份恢复证据，再加强生产密钥、刷新令牌和账号防撞库。随后补 EV-011/013/015 的资料可信工作流和 EV-021/022/024 的多实例运行边界，最后根据真实数据规模评估搜索索引，而不是预先引入重型基础设施。
