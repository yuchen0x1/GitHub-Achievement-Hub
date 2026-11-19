# Changelog

所有重要变更按版本记录。未发布内容放在 `Unreleased`，不会被当作已经发布的安装包能力。

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
