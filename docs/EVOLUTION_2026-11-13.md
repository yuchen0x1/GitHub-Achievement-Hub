# GitHub Achievement Hub 自主升级报告（2026-11-13）

## 交付范围与现状

本轮在 `E:\移动云盘同步盘\GitHub Achievement Hub`、`main` 分支、HEAD `5a5954f` 上进行。开始时已有 35 个跟踪文件修改，以及 `.evolution/`、旧审计报告、测试和更新器文件等未跟踪成果。本轮保留这些内容，没有重置、清理、提交、推送、发布或修改远程仓库。旧报告对应此前执行，不作为本轮测试证据。

项目定位是 GitHub 成就百科、获取指南和个人记录工具。现有 npm workspaces 包括：

| 层 | 技术与职责 | 本轮审阅 |
| --- | --- | --- |
| Web | Next.js 16 / React 19 / Tailwind 4；图鉴、攻略、查询、收藏、进度、后台 | 查询页、收藏统计、API 客户端、路由/构建配置；构建覆盖全部页面 |
| API | NestJS 12 / Prisma 7；认证、内容、GitHub 集成、收藏和进度 | 从请求到上游、数据库、缓存、异常过滤器和同步日志的完整查询链路；收藏统计与数据库启动 |
| 数据 | PGlite 开发库；PostgreSQL 生产配置；可选 Redis | 配置、建表与测试隔离，未操作原有数据 |
| 桌面/移动 | Tauri 2 / Capacitor 8，复用 Web 产物 | 工程和已有更新器改动保留；本轮未做原生安装验收 |
| 交付 | shared 包、Jest/Supertest、发布与回滚脚本 | 现有测试与构建，发布配置仅审阅 |

种子数据实际装载 17 枚勋章、16 个等级、12 篇攻略。已有搜索、分类、等级计算、资料来源、登录、收藏导出和后台编辑，不重复新增这些功能。没有引入生产依赖、数据库字段或基础设施。

## 问题、优先级与实施决策

| 优先级 | 原问题 | 价值 / 风险 | 本轮处理 |
| --- | --- | --- | --- |
| P0 | 开发启动 `db push --accept-data-loss` 自动接受潜在破坏性同步 | 保护本地数据；遇到不兼容 schema 后启动可能失败，这是必要的保护 | 删除自动接受数据损失参数；不执行破坏性验证 |
| P1 | GitHub 限流转成 404，用户名校验吞掉所有错误；同步日志错记 FAILED | 防止把服务故障判断成用户不存在 | 保留 429 类型和冷却信息；校验只吞格式错误/真正 404；同步正确记 RATE_LIMITED |
| P1 | GitHub 请求没有超时；并发 throttle 同时睡眠后一起发出 | 防止长期占用、减少次级限流 | 完整请求串行化，默认 10 秒超时，32 个请求上限；主/次级冷却 |
| P1 | 同名并发请求重复访问上游；调用未文档化 `/badges` | 降低无效流量，避免误导成就判断 | 同用户名合并请求，保留 300 秒缓存；移除未文档化网络请求，明确不可用 |
| P1 | OAuth 申请 `public_repo`，当前功能只读取资料 | 减少不需要的仓库权限；既有授权不自动撤销 | 新授权仅使用 `read:user` |
| P1 | 收藏可获取完成率的分子含停发/内部勋章，可大于 100% | 统计口径一致，历史记录继续保留 | 分子仅计已发布可获取勋章；增加 `earnedObtainableCount`；墙仍展示历史勋章 |
| P2 | 查询页只能连续重试，且暗示登录可提高配额 | 提供可操作错误提示 | 倒计时禁用重试，到期恢复；离开页面取消请求；修正文案 |
| P2 | 测试数据库清理路径缺少执行时边界校验 | 避免测试辅助代码删除非测试目录 | 只接受 cwd 下 `.pglite-test-数字-数字` 直接子目录 |

## 至少五个开源参考项目

于 2026-11-13 通过 GitHub 连接器读取仓库元信息、目录和相关源文件，并联网核对官方文档。五个项目的 LICENSE 均为 MIT / MIT 许可文本，与本仓库 package.json 声明兼容。本轮仅借鉴设计，没有复制源代码或资源、安装或运行第三方仓库代码。仓库未归档不代表持续活跃；没有根据星数推断质量。

| 项目 | 阅读的实际证据 | 参考价值与落地 |
| --- | --- | --- |
| [github-profile-achievements](https://github.com/Schweinepriester/github-profile-achievements) | [README](https://github.com/Schweinepriester/github-profile-achievements/blob/main/README.md)、目录、LICENSE；目录区分可获取、内部、停发及等级，列出样例和来源 | 直接同类资料库。延续可获取范围与已获得状态分离，修正收藏完成率，不把未知数据当作未获得 |
| [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) | `src/` 结构、[retryer.js](https://github.com/anuraghazra/github-readme-stats/blob/master/src/common/retryer.js)、LICENSE；实现区分限流和普通错误，有重试上限 | 相邻 GitHub 资料服务。采用明确错误分类、有限等待和上游保护；不照搬多 Token 轮换 |
| [github-profile-trophy](https://github.com/ryo-ma/github-profile-trophy) | README、[api/index.ts](https://github.com/ryo-ma/github-profile-trophy/blob/master/api/index.ts)、main.ts、目录和 LICENSE；请求层有参数校验、用户缓存、错误响应及 SVG 主题/布局 | 相邻数据展示服务。采用请求复用与错误独立呈现；其自定义奖杯与 GitHub 原生成就含义不同，不混入本项目勋章数据 |
| [my-badges](https://github.com/my-badges/my-badges) | [process-tasks.ts](https://github.com/my-badges/my-badges/blob/master/src/process-tasks.ts)、`src/` 目录、LICENSE、仓库元信息（已归档） | 相邻 README 徽章生成器，任务有有限尝试及保存状态。参考有限请求与故障处理；不引入已归档依赖、不添加未经授权的 README 写入任务 |
| [github-readme-stats-action](https://github.com/stats-organization/github-readme-stats-action) | [action.js](https://github.com/stats-organization/github-readme-stats-action/blob/main/action.js)、action.yml、目录、LICENSE；`fail_on_error` 可阻止错误卡片写出 | 相邻离线生成流程。参考失败不冒充成功，查询失败不入成功缓存，同步限流保留真实状态；自动提交卡片不适合本轮资料库主流程 |

额外依据：[GitHub API 最佳实践](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)、[OAuth scope](https://docs.github.com/en/developers/apps/scopes-for-oauth-apps)、[用户 REST 接口](https://docs.github.com/en/rest/users/users)、[Prisma CLI](https://www.prisma.io/docs/orm/v7/reference/prisma-cli-reference)。代码依据当前文档选择串行访问、尊重 Retry-After/reset、减少授权；没有声称有未公开的成就 API。

### 对比维度

| 维度 | 本项目实际能力 / 原缺口 | 参考实践 | 已落实 / 后续 |
| --- | --- | --- | --- |
| 核心功能 | 图鉴+指南+手动记录完整，官方成就不可查询 | 资料目录区分可获取与历史状态 | 统计分母与分子一致，明确数据边界 |
| UI | 已有主题、筛选、空状态；限流只提供通用重试 | 参考服务独立呈现错误 | 增加倒计时和错误说明；浏览器验收受阻 |
| 体验 | 校验曾误报账号不存在 | 有区别地处理上游错误 | 400/404/429/502/503/504 独立语义 |
| 架构 | 上游访问集中但没有完整请求保护 | 访问层封装、缓存、有限请求 | 串行队列、超时、并发请求合并 |
| 自动化 | 已有发布脚本；查询无冷却保护 | 有限自动尝试、失败阻止产出 | 自动冷却、不重复访问；没有新增远程写入 |
| 扩展 | workspace 和共享类型已有 | 采集、计算、呈现模块区分 | 保持已有模块和响应兼容，避免引入新框架 |

## 主要文件变更

以下仅列本轮改动；上一轮的更新器/构建/文章/重定向改动未撤销。

- `apps/api/src/modules/github/github-api.service.ts`：超时、串行队列、限流识别和冷却；OAuth 最小权限；移除未文档化请求。
- `apps/api/src/modules/github/github-profile.service.ts`：同名查询合并、缓存版本键、类型一致、同步错误保持。
- `apps/api/src/modules/github/github.controller.ts`：用户名校验不再吞掉服务故障。
- `apps/api/src/common/filters/all-exceptions.filter.ts`：429 响应头及 JSON 倒计时。
- `apps/web/src/app/github-profile/[username]/profile-client.tsx`：取消请求、重试等待、错误说明。
- `apps/api/src/modules/collection/collection.service.ts`、`apps/web/src/app/collection/collection-client.tsx`：完成率修复和口径说明。
- `apps/api/src/prisma/prisma.service.ts`：开发同步不自动接受数据损失。
- `apps/api/test/unit/{github-api.service,github-profile.service,collection.service}.spec.ts`：新增 20 项回归测试。
- `apps/api/test/e2e/api.e2e-spec.ts`：新增 3 项 HTTP 契约测试；`test-app.ts` 增加清理路径检查。
- `.gitignore`：只忽略本轮隔离验证数据库与临时工具缓存。
- `README.md`、`apps/api/README.md`、`apps/api/.env.example`、本报告：真实行为、错误契约、配置和证据。
- `.evolution/audit-2026-11-13.json`：审计端点失败的原始结果。

没有删除源代码文件、修改表结构或覆盖已有用户记录。开发数据库、测试数据库和本轮预览数据库分别隔离；预览仅创建新目录 `apps/api/.pglite-evolution-preview/`。

## 验证结果

| 状态 | 命令 / 检查 | 实际结果 |
| --- | --- | --- |
| PASS | `npm run test:unit -w @gach/api -- --runInBand` | 9 suites、67 tests；原有 47 项 + 本轮 20 项 |
| PASS | `npm run test:e2e` | 1 suite、21 tests；真实 Nest 装配、独立 PGlite 建表/seed，覆盖原有权限/内容和新增 429 HTTP 契约 |
| PASS | `npm run lint` | API/Web TypeScript noEmit；本项目 lint 实为类型检查，并非 ESLint |
| PASS | `API_INTERNAL_URL=http://localhost:4311/api/v1 npm run build` | shared/API/Web 均通过，Next.js 输出 53 个页面；构建时使用新建隔离数据库的 API |
| PASS | API 开发启动及 `GET /api/v1/health` | 4311 端口启动，数据库健康；独立 PGlite 使用 55498 |
| PASS | 本地 API 真实访问 GitHub `octocat` | HTTP 200、8 个公开仓库；17 项本地图鉴对照；achievements 为空并附限制说明，重复请求保留同一 fetchedAt |
| PASS | `git diff --check` | 无空白错误 |
| BLOCKED | 浏览器交互/响应式/截图 | Browser 插件引用的 browser-service.mjs 缺失；已找到本机 Python 3.14 Playwright，但前端服务启动两次被自动审批检查以 `blocked by policy` 拒绝；没有绕过或伪造截图 |
| BLOCKED | `npm audit --registry=https://registry.npmjs.org --omit=dev --json` | 审计 bulk endpoint 网络失败；不能声称依赖无漏洞 |
| PARTIAL | 安装与运行环境 | 复用既有 node_modules；未对全新安装作复现。备用 Python 下载尝试因 TLS 失败，后来发现已有安装；未新增生产依赖 |
| PARTIAL | GitHub 上游异常验证 | 限流、超时、故障和并发使用受控 fixture；真实公开查询成功；没有人为消耗 GitHub 配额触发真实限流 |
| PARTIAL | 数据保护 | 独立空测试库建表/seed 及正常业务读写通过；移除危险参数已核对，未对原数据库执行破坏性 schema 测试 |
| NOT APPLICABLE | 数据迁移 | 本轮无 schema 变更 |
| 未执行 | 原生 / 外部系统 | Tauri/Android/iOS 安装、真实 OAuth、PostgreSQL/Redis、签名发布、升级/回滚、生产部署和压力测试 |

初次类型检查发现新响应类型与共享 Badge.login 不一致及 JSON unknown 访问问题，已修正后重新通过。测试脚本使用仓库原有 `--forceExit`，因此 e2e 通过不证明退出时没有活动句柄。

## 后续优先级与限制

- P1：解除本地预览启动限制后补做桌面/手机宽度、键盘、倒计时到期重试与导航取消的浏览器验收；本轮未完成视觉验收。
- P1：恢复依赖审计网络后确认漏洞；真实 OAuth 应用验收，检查旧授权是否需要由用户在 GitHub 中撤销后重新授权。
- P1：生产 PostgreSQL 迁移基线仍需按实际部署数据库制定；不能凭开发建表通过就推断生产可迁移。
- P2：多 API 实例使用共享配额/冷却协调；本轮是进程内控制，队列等待不计入上游超时，峰值下可能长时间等待。
- P2：Redis 生命周期、`KEYS` 前缀失效与内存缓存淘汰机制仍值得专项测试和改进；本轮未运行 Redis。
- P2：逐步拆分较长的收藏和管理 UI 文件；增加独立 Web 交互测试入口。
- P3：在真实需求明确后评估 README 分享卡片或用户任务计划；不自动写入用户 GitHub 仓库，不引入与原生成就混淆的第三方奖杯。

## 成熟度评估

以下为基于本轮证据的工程判断，满分 10；不是覆盖率或安全认证，也不把已有功能算作本轮新增。

| 维度 | 评分 | 依据与扣分项 |
| --- | --- | --- |
| 功能完整度 | 7 | 资料/查询/手动记录链路存在且回归通过；官方成就不可查询，OAuth/原生未验收 |
| UI/UX | 6 | 原有完整页面结构和新错误交互；本轮无浏览器验收，不能确认布局和无障碍完成度 |
| 代码质量 | 7 | 类型检查、88 项单元/集成测试；仍有长 UI 模块和缺少浏览器自动化的问题 |
| 性能 | 6 | 请求合并、缓存、取消、队列上限；无并发压测，串行队列存在等待成本 |
| 安全性 | 6 | 最小授权、无损启动、错误脱敏；依赖审计及生产验证未完成 |
| 稳定性 | 7 | 超时/限流/404/网络故障有回归；真实上游查询和构建通过，原生/生产仍未知 |
| 可维护性 | 7 | 保留栈和数据结构、补配置/API 文档与测试；旧报告需与本轮报告分开阅读 |
| 扩展性 | 7 | workspace、服务层和附加响应字段保持兼容；多实例配额和原生验收尚缺 |

本轮完成可验证的可靠性增量与研究落地；浏览器、依赖审计和外部系统验收未完成，不宣称全面生产就绪。
