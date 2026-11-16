# PROJECT EVOLUTION 升级路线图

制定日期：2026-11-16
状态口径：`完成（本轮）` 表示本轮有代码和验证证据；`部分完成` 表示仓库已有相关基础但验收或关键能力仍缺失；`未实施` 表示有明确价值但尚未改代码。共 40 项，覆盖核心功能、体验、架构、性能、安全、自动化和发布。

| ID | 升级名称 / 模块 | 当前问题与依据 | 对标参考 | 实施方案与预期效果 | 文件/模块 | 难度 | 优先级 | 验收标准 | 状态 |
|---|---|---|---|---|---|---|---|---|---|
| EV-001 | 统一分页与 limit 边界 / API | 多模块对小数、负数和极端值处理不同，可能把非法值传给 Prisma | Typesense 的查询边界和 API 约束 | 统一正整数解析、默认值和上限，避免 500 与过大查询 | `common/utils/number.util.ts`、achievements/articles/admin/search | 低 | P0 | 非法值回退，合法值截断，现有分页保持不变 | 完成（本轮） |
| EV-002 | 全站搜索 DTO 校验 / API | 全站搜索原先用裸 `Record`，参数约束不完整 | Nest validation、Starlight 搜索配置 | 使用 `SearchQueryDto`，限制关键词长度、筛选枚举和分页 | `query.dto.ts`、`search.controller.ts` | 低 | P1 | 非法枚举返回 400，合法查询结果不变 | 完成（本轮） |
| EV-003 | 搜索联想请求取消 / Web | 快速输入时旧响应可能覆盖新响应 | github-readme-stats 的请求重试/缓存边界 | 每次输入取消旧 fetch，防止过期结果和无效请求 | `search-box.tsx` | 低 | P1 | 连续输入只保留最后一次请求结果 | 完成（本轮） |
| EV-004 | 搜索联想可访问性 / Web | 输入建议缺少完整 combobox/listbox 语义 | Starlight、Docusaurus | 添加角色、活动项、当前项、状态提示和中文 aria-label | `search-box.tsx` | 低 | P1 | 键盘上下/回车/Escape 与屏幕阅读器语义可用 | 完成（本轮） |
| EV-005 | 进程存活探针 / API | 综合健康检查不能单独表达进程是否活着 | Outline、systemd 运行检查 | 新增 `/health/live`，不访问数据库 | `health.controller.ts` | 低 | P1 | 数据库故障时 live 仍可返回 200 | 完成（本轮） |
| EV-006 | 数据库就绪探针 / API | 部署器需要区分启动中、数据库故障和正常状态 | Docusaurus/Outline 的运行时错误边界 | 新增 `/health/ready`，数据库不可用返回 503 | `health.controller.ts`、e2e | 低 | P0 | DB 正常为 200，DB 失败为 503 且不误报 ready | 完成（本轮） |
| EV-007 | 部署器改用 ready / DevOps | 生产脚本原先只依赖综合 health | systemd 部署脚本 | 构建 API、重启 API、回滚检查统一使用 ready URL | `deploy/scripts/common.sh`、`health-check.sh` | 低 | P0 | 数据库未就绪时不切换 Web，失败能回滚 | 完成（本轮） |
| EV-008 | Redis 前缀失效改用 SCAN / 性能 | `KEYS` 可能阻塞生产 Redis | Meilisearch/Typesense 资源清理实践 | 使用分批 SCAN + DEL，保留内存缓存清理 | `cache.service.ts` | 中 | P1 | 大 keyspace 失效不使用 KEYS，缓存结果一致 | 完成（本轮） |
| EV-009 | 反馈输入 DTO / 安全 | 反馈接口原先接收裸对象，长度和邮箱未限制 | giscus 的边界配置、Nest DTO | 增加类型、长度、邮箱和必填校验，降低垃圾/异常写入 | `feedback.dto.ts`、`admin.controller.ts` | 低 | P1 | 非法请求 400，合法反馈仍可创建 | 完成（本轮） |
| EV-010 | 回归测试扩展 / 测试 | 新增行为需要 HTTP 契约证据 | Streak Stats 的格式回归测试 | 为数字解析、健康探针、反馈校验补单元/e2e | `test/unit`、`test/e2e` | 低 | P1 | unit/e2e/build/typecheck 全部通过 | 完成（本轮） |
| EV-011 | 来源新鲜度提醒 / 内容 | 来源有 `verifiedAt`，但没有过期队列 | 同类资料库的更新记录 | 按来源类型和年龄生成待复核列表，避免旧资料继续显得权威 | `AchievementSource`、admin | 中 | P1 | 超过阈值的来源出现在后台队列并可标记复核 | 未实施 |
| EV-012 | 内容版本快照 / 内容 | 编辑历史主要记录字段差异，难以整页回滚 | Outline 文档历史 | 增加发布版本快照和预览 diff，支持单次回滚 | Prisma schema、admin UI | 高 | P1 | 发布前后可比较，回滚不丢用户记录 | 未实施 |
| EV-013 | 纠错审核工作流 / 内容 | 用户反馈与资料发布没有状态关联 | OpenSauced issue/贡献流程 | 将 CORRECTION 反馈关联到勋章/来源并支持处理状态 | feedback/admin | 中 | P1 | 反馈可追踪到实体，关闭时记录处理人和备注 | 未实施 |
| EV-014 | 资料来源指纹 / 内容可信度 | URL 变化后难以发现内容是否改变 | GitHub 提交/文档版本链接 | 保存抓取摘要或引用指纹，不保存未授权全文 | source service | 中 | P2 | 来源内容变化能触发复核，不泄露抓取内容 | 未实施 |
| EV-015 | 官方与社区证据分层展示 / Web | 可信度字段存在，但用户仍需自行理解来源类型 | github-profile-achievements 的状态区块 | 在详情页按证据等级、时间和争议状态分组 | detail page、source component | 中 | P1 | 用户能区分官方、实测、社区和待验证信息 | 未实施 |
| EV-016 | Prisma migration 基线 / 数据 | 生产没有 migrations 目录，不能安全升级 schema | Prisma 官方迁移流程 | 建立初始 migration，生产只允许 migrate deploy | `apps/api/prisma/migrations`、deploy | 高 | P0 | 备份 PostgreSQL 可重复部署，旧版本可读 | 未实施 |
| EV-017 | 备份与恢复演练 / 运维 | 有回滚脚本，但没有数据库恢复证据 | Outline 运维文档 | 提供 pg_dump、校验、恢复到隔离库的 runbook | `deploy/README.md`、scripts | 中 | P0 | 恢复后 health/ready、seed 和核心查询通过 | 未实施 |
| EV-018 | 启动密钥与生产配置校验 / 安全 | env 模板有要求，启动时仍可遗漏关键密钥 | Nest ConfigModule、发布工作流 | 生产启动拒绝短密钥、默认密码和错误 provider | `config`、`main.ts` | 中 | P0 | 缺失/弱密钥在启动前失败，开发配置仍可用 | 部分完成 |
| EV-019 | 刷新令牌轮换与重放检测 / 认证 | 有刷新令牌表，但需确认旧 token 重放处理 | Outline/Giscus token cache 思路 | 每次刷新轮换 hash，旧 token 重放时撤销会话族 | auth service/schema | 高 | P0 | 重放测试能撤销同一会话，其他设备不受影响 | 部分完成 |
| EV-020 | 登录失败锁定 / 认证 | 全局限流不能按账号阻止撞库 | 常见身份系统实践 | 对邮箱+IP 组合做短期失败计数和渐进冷却 | auth/cache | 中 | P0 | 连续失败触发 429，成功登录清除计数 | 未实施 |
| EV-021 | 按身份/路由限流 / API | 当前主要是全局 120/min | GitHub API 限流分类 | 为登录、反馈、GitHub 查询、搜索设置独立桶 | throttler/config | 中 | P1 | 不同路由配额独立，响应含 Retry-After | 部分完成 |
| EV-022 | 请求关联 ID / 可观测性 | 日志有路径和消息，没有跨 Web/API 请求 ID | Docusaurus CI、Outline 服务日志 | 生成或透传 `X-Request-Id`，错误响应和日志一致 | middleware/filter | 中 | P1 | 单次请求可从客户端响应关联到服务日志 | 未实施 |
| EV-023 | 结构化请求指标 / 可观测性 | 只有文本日志，没有延迟、状态和上游统计 | Meilisearch/Typesense analytics | 记录脱敏的 route、状态、耗时、缓存命中和上游错误 | logger/metrics | 中 | P2 | 能导出聚合指标，不记录 token/正文 | 部分完成 |
| EV-024 | 多实例 GitHub 配额协调 / 稳定性 | 冷却和请求合并只在单进程内 | Redis/Typesense 共享状态 | 将冷却、队列和同用户名锁迁移到 Redis，可降级本地 | github/cache | 高 | P1 | 两个 API 实例不会同时突破共享冷却 | 未实施 |
| EV-025 | 搜索服务抽象层 / 架构 | Prisma contains 查询适合小数据，难以替换索引 | Meilisearch、Typesense | 定义 SearchProvider 接口，保留 Prisma fallback | `modules/search` | 中 | P2 | provider 可切换，响应结构不变 | 部分完成 |
| EV-026 | typo-tolerant 搜索与排名 / 搜索 | 中文/英文 contains 对拼写和相关性有限 | Meilisearch/Typesense | 先建立字段权重和短语匹配，再评估外部索引 | search service | 中 | P2 | 关键字、别名、短语和中文结果顺序可解释 | 未实施 |
| EV-027 | 隐私友好的搜索分析 / 搜索 | 无查询热词和零结果反馈 | OpenSauced analytics、Typesense analytics | 只存归一化词形、计数和时间桶，不存用户身份 | analytics model/job | 中 | P2 | 能发现零结果词，无法还原个人搜索历史 | 未实施 |
| EV-028 | 个人目标计划 / 用户功能 | 只有收藏和进度，没有有序行动路径 | DEVELOPER-ASCEND | 从攻略/要求生成可编辑目标和步骤 | progress schema/UI | 高 | P1 | 用户可创建、排序、完成和取消目标 | 未实施 |
| EV-029 | 进度提醒 / 用户功能 | 进度记录没有下一步或提醒 | GitHub 个人统计工具 | 增加可选提醒时间和站内通知，不默认发外部消息 | progress/announcements | 中 | P2 | 用户可关闭提醒，过期任务不重复通知 | 未实施 |
| EV-030 | 勋章资料变更订阅 / 用户功能 | 用户无法知道收藏勋章条件变了 | 同类资料库更新记录 | 对收藏内容生成变更摘要和站内通知 | history/collection | 中 | P2 | 条件、等级、状态变化可见且可标记已读 | 未实施 |
| EV-031 | 个人趋势图 / 数据可视化 | 当前有进度数字，没有时间趋势 | Sourcerer、profile summary cards | 保存每日聚合快照，展示勋章/进度变化 | jobs/chart component | 高 | 个人能看到时间范围、数据来源和缺失日期 | 未实施 |
| EV-032 | 分享型成就卡片 / Web | 无安全的公开分享视图 | github-readme-stats、streak-stats | 生成不含邮箱/token 的公开摘要和 SVG/PNG | share route/component | 中 | 未登录也能查看明确过期/撤销的分享链接 | 未实施 |
| EV-033 | 移动端 stale-while-revalidate / 移动 | 有离线缓存但需确认过期和冲突策略 | profile summary cards 缓存边界 | 先读本地旧数据，再后台刷新并标注时间 | `apps/mobile/src/offline-cache.ts` | 中 | 断网可读，联网后成功更新，失败不覆盖旧值 | 部分完成 |
| EV-034 | Tauri 深链接和 API 配置 | 桌面端更新器存在，链接/API 地址注入边界仍需验收 | Tauri updater/desktop apps | 支持 `gach://achievement/...` 和安全配置页 | desktop/runtime | 中 | 安装包点击深链接能打开对应页面且不执行任意 URL | 部分完成 |
| EV-035 | Playwright 浏览器回归 | 没有持续的真实渲染证据 | Starlight/Docusaurus 文档站 | 覆盖搜索键盘、暗色、移动导航、登录错误和打印 | `web/tests`、CI | 中 | Chromium 测试通过并上传截图/日志 | 未实施 |
| EV-036 | API 压测与长稳测试 | 无启动、搜索、GitHub 查询基线 | Meilisearch/Typesense 性能习惯 | 固定数据集下记录 p50/p95、内存和错误率 | `perf/`、CI | 中 | 结果可复现，不能把单次本地结果当生产 SLA | 未实施 |
| EV-037 | SBOM 与依赖审计 | lockfile 有版本，但未形成定期审计证据 | Docusaurus CI、npm audit | 生成 SBOM，固定 npm audit/许可证检查并保留 artifact | `.github/workflows` | 低 | PR/Release 能报告高危依赖和许可证变化 | 部分完成 |
| EV-038 | 发布来源证明 / DevOps | 有签名更新清单和 SHA-256，但没有构建来源证明 | Tauri updater、现代 release provenance | 补构建摘要、产物清单、commit/tag 绑定和签名记录 | release workflow | 中 | Release 可追溯到 tag、commit、workflow run 和 hash | 部分完成 |
| EV-039 | 贡献模板与内容规范 / 生态 | README 有贡献说明，但没有结构化 issue/PR 模板 | GitHub 项目与开源文档框架 | 增加 bug、资料纠错、翻译、功能 PR 模板和证据要求 | `.github/ISSUE_TEMPLATE`、CONTRIBUTING | 低 | 新反馈包含复现/来源/许可证字段 | 部分完成 |
| EV-040 | 种子数据与文档同步检查 / 工程化 | 种子内容、README 统计和截图容易漂移 | Fumadocs/Docusaurus 文档构建 | CI 校验统计、路由、来源链接和公开文章状态 | scripts/CI/docs | 中 | 数据变更导致文档不一致时 CI 明确失败 | 部分完成 |

## 计划执行顺序

1. **P0**：EV-016、EV-017、EV-018、EV-019、EV-020，先补生产数据与认证安全边界。
2. **P1**：EV-011、EV-013、EV-015、EV-021、EV-022、EV-024、EV-028，提升资料可信度、故障可见性和用户行动能力。
3. **P2**：EV-012、EV-014、EV-023、EV-025 至 EV-027、EV-029 至 EV-036，按数据规模和用户反馈推进。
4. **P3**：EV-037 至 EV-040，完善供应链、发布和贡献生态。

路线图不把许可证不兼容的代码列为直接依赖，也不把外部服务成功接入前的设计写成已完成能力。
