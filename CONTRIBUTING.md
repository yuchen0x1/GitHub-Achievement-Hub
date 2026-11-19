# 参与贡献

在 GitHub 提交 [问题或资料纠错](https://github.com/yuchen0x1/GitHub-Achievement-Hub/issues/new/choose)。勋章资料变更请提供条目、证据链接、观察日期和可信度依据。安全问题请遵循[安全策略](SECURITY.md)。

1. 从 `main` 创建短期分支，按 [README](README.md#快速开始) 安装和启动。
2. 执行 `npm run build -w @gach/shared`、`npm run lint --workspaces --if-present`、`npm run test:unit -w @gach/api`、`npm run test:e2e` 和 `npm run verify:build`。
3. 创建指向 `main` 的 PR，填写平台影响、数据库和更新兼容性、测试记录。合并前解决冲突并刷新 CI。
4. 有用户可见的变更时，更新相关文档。变更数据库前，记录旧数据兼容性和恢复步骤。

紧急修复沿用短分支和 PR 流程。发布标签仅指向通过检查并已进入 `main` 的提交。版本与发布验收见[维护手册](docs/MAINTENANCE.md)。
