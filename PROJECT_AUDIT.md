# GitHub Achievement Hub 项目现状档案

审计日期：2026-11-16（Asia/Shanghai）
审计范围：仓库源码、配置、测试、部署脚本、发布工作流和当前工作树。
基线：`main`，HEAD `d8a7951`，远端为 `origin/main`。

## 1. 项目定位

GitHub Achievement Hub 是一个面向 GitHub 用户、开源贡献者和开发者的成就资料库与个人进度工具。它把勋章名称、获取条件、等级门槛、可信度、资料来源和攻略集中起来，并提供公开查询、全站搜索、登录后的收藏与进度记录。

目标用户包括：

- 想了解 GitHub 成就含义和获取路径的新用户；
- 需要按状态、难度和分类检索资料的开源贡献者；
- 希望保存目标、记录进度并导出个人数据的登录用户；
- 维护勋章资料、来源、攻略和反馈的编辑与管理员。

项目不宣称能够读取 GitHub 官方完整成就状态。当前 GitHub 公开接口只用于读取公开资料，成就资料由本地知识库维护并标注可信度。

## 2. 技术与运行架构

| 层 | 当前实现 | 证据 |
|---|---|---|
| Web | Next.js 16、React 19、App Router、Tailwind CSS 4、React Query、Zustand | `apps/web/package.json`、`apps/web/src/app/` |
| API | NestJS 12、REST、Swagger、Passport/JWT、class-validator、Helmet、Throttler | `apps/api/src/main.ts`、`apps/api/src/app.module.ts` |
| 数据 | Prisma 7；开发使用 PGlite，生产使用 PostgreSQL | `apps/api/prisma/schema.prisma`、`apps/api/src/prisma/` |
| 缓存 | Redis 可选；不可用时降级为进程内缓存 | `apps/api/src/cache/cache.service.ts` |
| 桌面 | Tauri v2 Windows 外壳，复用 Web 产物 | `apps/desktop/src-tauri/` |
| 移动 | Capacitor Android/iOS 外壳、离线缓存和网络状态监听 | `apps/mobile/` |
| 共享 | TypeScript workspace 包，供多端共享类型和工具 | `packages/shared/` |
| 工程化 | npm workspaces、Jest/Supertest、GitHub Actions、systemd 更新器 | `package.json`、`.github/workflows/`、`deploy/` |

仓库当前跟踪的应用源文件约 197 个，包含 API、Web、桌面、移动端和共享包。工作树另有未跟踪的 `.edgeone/`、静态导出目录和 zip 产物；这些文件属于现有本地成果，本轮没有覆盖、删除或纳入代码修改。

## 3. 功能模块清单

### 已实现并可从源码追溯的能力

- 勋章图鉴：列表、关键词、状态、难度、分类、排序、分页、详情和等级阶梯。
- 资料可信度：官方、实测、社区一致和待验证等等级，来源与争议信息单独存储。
- 攻略知识库：分类、Markdown、目录、阅读时间、相关推荐和公开发布状态。
- 搜索：快速搜索、输入建议、全站搜索、分页和结果缓存。
- 用户功能：邮箱注册/登录、JWT、刷新令牌、CSRF 双提交、收藏、进度、成就墙和导出。
- GitHub 查询：公开资料读取、超时、404、限流和上游错误分类；成就数组明确保持不可用说明。
- 管理端：勋章、等级、要求、攻略、来源、分类、FAQ、用户、反馈、公告和操作日志。
- 多端壳：Tauri 桌面端、Capacitor 移动端、静态导出和运行时 API 地址注入。
- 发布与运维：签名更新清单、SHA-256 校验、Release 轮询、原子切换、健康检查和失败回滚。

### 只有在外部条件满足时才可完成的能力

- GitHub OAuth 需要真实 OAuth App 和回调配置；
- 生产部署需要 PostgreSQL、密钥、域名和 systemd 环境；
- Redis、多实例限流协调、真实自动更新安装和原生移动构建尚未在本机完成端到端验收；
- GitHub 官方完整成就同步没有可依赖的公开 API，不能把空数组解释为用户没有勋章。

## 4. 数据模型与数据流

核心资料由 `Achievement`、`AchievementTier`、`AchievementRequirement`、`AchievementGuide`、`AchievementSource` 和 `AchievementHistory` 组成；用户侧由 `User`、`UserFavorite`、`UserProgress`、`UserAchievement`、`GithubAccount` 和同步日志组成。`Article`、`Faq`、`Announcement`、`Feedback`、`AdminLog` 提供内容运营和反馈闭环。

典型公开查询路径：

1. Web 页面通过 `apps/web/src/lib/api.ts` 请求 `/api/v1`。
2. Nest controller 接收请求，公开路由由 `@Public()` 标记。
3. service 组合 Prisma 查询、缓存、分页和错误语义。
4. Prisma 连接 PGlite 或 PostgreSQL；缓存优先使用 Redis。
5. 全局异常过滤器返回统一错误结构，Web 根据 HTTP 状态呈现提示。

登录路径额外经过 CSRF、JWT、刷新令牌和角色守卫；后台写入同时记录操作日志并使相关缓存失效。

## 5. 当前优势

- 多端共享同一资料和 API 契约，Web、桌面、移动端边界清晰。
- 资料模型比单一 Markdown 清单更完整，能够表达等级、来源、可信度、争议和历史变更。
- 已经区分 GitHub 账号不存在、限流、超时和上游故障，避免把服务问题误报成用户问题。
- 开发数据库和测试数据库隔离，e2e 不依赖外部已运行服务。
- 发布脚本具备正式 SemVer、签名清单、原子切换、健康检查和回滚约束。
- UI 已有主题、暗色模式、键盘焦点、减少动效和空状态基础。

## 6. 发现的缺陷与风险

| 编号 | 发现 | 影响 | 当前状态 |
|---|---|---|---|
| A-01 | 查询参数在不同模块的边界处理曾不一致，小数、负数和极端值可能进入 Prisma `skip/take` | 可能出现错误响应或不必要的大查询 | 本轮已统一正整数边界并补测试 |
| A-02 | 搜索联想请求可能在快速输入时由旧响应覆盖新结果 | 用户看到过期建议，移动网络下更明显 | 本轮已使用 AbortController、加载状态和键盘语义 |
| A-03 | 反馈接口原先直接接收裸对象 | 超长、非法邮箱或未知类型会进入业务层 | 本轮已增加 DTO、长度和枚举校验 |
| A-04 | 只有一个综合健康端点，无法区分进程存活和数据库就绪 | 编排器可能把数据库故障误判为进程故障 | 本轮新增 `/health/live` 和 `/health/ready`，部署脚本切换到 ready |
| A-05 | Redis 前缀失效使用 `KEYS` | 大 keyspace 上可能阻塞 Redis | 本轮改为 SCAN 分批删除 |
| A-06 | Prisma production migration 基线尚未提交 | 不能把 `db push` 当成生产迁移流程 | 保留为 P1 计划，生产默认不自动迁移 |
| A-07 | 依赖审计、真实 OAuth、原生安装和生产 PostgreSQL/Redis 未完成本地端到端验证 | 不能据此宣称生产级完成 | 明确列为 PARTIAL/BLOCKED |
| A-08 | 多实例 GitHub 配额、冷却和请求合并仍是进程内 | 水平扩展时可能重复访问上游 | P2 计划使用共享协调层 |
| A-09 | Web 端没有现成 Playwright 回归套件 | UI、键盘和响应式行为缺少自动证据 | P2 计划补齐 |
| A-10 | 内容来源没有自动新鲜度提醒 | 资料变化主要依靠人工维护 | P2 计划增加来源复核队列 |

## 7. 成熟度判断

这是基于源码和本地测试的工程判断，不是安全认证或生产 SLA：

| 维度 | 评分（10） | 依据 |
|---|---:|---|
| 功能完整度 | 7 | 图鉴、攻略、搜索、账号、收藏和后台链路齐全；官方成就同步不可用 |
| UI/UX | 7 | 页面结构和主题完整，本轮修复联想反馈与可访问性；仍缺真实浏览器回归 |
| 代码质量 | 7 | TypeScript 类型检查和 API 测试覆盖主要路径；部分管理组件仍较长 |
| 性能 | 6 | 缓存、取消、分页和 Redis SCAN 已有；无压力测试和多实例实测 |
| 安全性 | 6 | CSRF、JWT、最小 OAuth scope、Helmet 和参数校验存在；依赖审计与生产配置未完成 |
| 稳定性 | 8 | 限流/超时/回滚/就绪探针和异常结构较完整 |
| 可维护性 | 7 | workspace 和模块边界清晰；迁移基线、浏览器测试和内容流水线仍需补齐 |

## 8. 本轮变更与证据

本轮直接修改了 API 参数边界、搜索 DTO、反馈 DTO、健康探针、Redis 失效算法、部署健康 URL、Web 搜索联想和对应文档/测试。没有修改数据库 schema，没有删除用户数据，没有引入生产依赖，也没有把静态导出产物当作源码修改。

验证命令和结果收录在 [`UPGRADE_REPORT.md`](UPGRADE_REPORT.md)。
