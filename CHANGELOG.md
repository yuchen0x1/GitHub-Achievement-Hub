# Changelog

所有重要变更按版本记录。未发布内容放在 `Unreleased`，不会被当作已经发布的安装包能力。

## v0.1.0 · 2026-11-23

### Added

- GitHub 账号查询现在读取公开个人主页 `?tab=achievements` 的真实徽章标记，识别徽章 slug、官方图片和 Bronze / Silver / Gold 等级。
- 同一徽章在桌面侧栏、移动区块和成就卡片重复渲染时会自动去重；页面结构变化、上游限流或无法解析时明确降级为「数据不可用」。
- 成就对照表显示已确认的等级，资料来源说明区分 REST API、公开主页和本站目录，避免把未知状态误判为未获得。
- 新增公开 HTML 解析器单元测试，覆盖真实 GitHub 标记、重复徽章、非可信图片域名和结构变化。

### Changed

- GitHub 公开主页请求复用串行队列、最小间隔、超时和限流冷却，不调用未公开的 GitHub API 端点。
- Web 查询页面更新数据来源、限制说明和徽章展示文案；保留现有 Radix / Tailwind / Lucide 设计系统，不引入重复组件库。

### Verification

- `npm run lint --workspaces --if-present`
- API unit：11 suites / 84 tests passed
- API e2e：1 suite / 24 tests passed
- `npm run build`
- `npm run verify:version`

## Unreleased

## v0.0.5 · 2026-11-18

### Added

- Web 核心导航、账号菜单和设置入口支持简体中文/English 手动切换与自动语言检测。
- 语言选择保存到浏览器本地存储，自动模式按浏览器/系统语言匹配，无法识别时回退到简体中文。
- 勋章来源按官方资料、社区证据和需要核对分组，保留每条资料的链接、可信度、核对日期及争议说明。
- Web 和 API 增加 PR 质量门禁、依赖检查、生产构建和启动冒烟。
- 标签发布增加源码包、SHA-256、版本元数据、构建来源证明及发行巡检。

### Fixed

- PGlite 支持 Windows 和 Linux 下配置绝对数据目录。
- 自托管 Web 按部署版本区分静态资源，减轻滚动部署时旧页面与新服务混用的问题。

### Added

## v0.0.3 · 2026-11-16

### Added

- API 存活探针 `GET /api/v1/health/live` 和数据库就绪探针 `GET /api/v1/health/ready`。
- `boundedPositiveInt` 查询参数工具和反馈提交 DTO。
- 全站搜索 DTO 校验、搜索联想加载状态、请求取消和 combobox/listbox 无障碍语义。
- 40 项带验收标准、优先级和证据字段的升级路线图。

### Changed

- 文章、勋章、搜索和管理端分页统一正整数边界。
- 部署脚本和构建期 API 健康检查改用 `/health/ready`。
- Redis 前缀失效从 `KEYS` 改为分批 `SCAN`，减少生产阻塞风险。
- README、API 说明和部署文档同步新的健康探针契约。

### Fixed

- 修复快速输入时旧搜索建议覆盖新结果的问题。
- 拒绝反馈主题/正文缺失、类型非法、内容过长和邮箱格式错误的请求。

### Verification

- API unit、e2e、API build、Web typecheck 和 shared build 已运行；详细命令与限制见 [`UPGRADE_REPORT.md`](UPGRADE_REPORT.md)。

## v0.0.2 · 2026-11-13

历史发布内容见 [`docs/releases/release-notes.md`](docs/releases/release-notes.md)。
