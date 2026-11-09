# @gach/api — 测试说明

本目录包含 API 的单元测试与 e2e 测试。**运行测试不需要手动启动 API，也不需要手动启动数据库**：
e2e 会在测试进程内启动一份独立的 PGlite，并自动完成建表与种子数据写入。

## 技术栈

| 组件 | 说明 |
| --- | --- |
| `jest` + `ts-jest` | 使用 TypeScript 编译器转译（**不是** swc/esbuild），保证 `emitDecoratorMetadata` 生成的 `design:paramtypes` 存在，NestJS 依赖注入才正常 |
| `supertest` | 直接访问 `app.getHttpServer()`，不占用真实端口 |
| `@electric-sql/pglite` | 测试专用数据库实例，与开发库完全隔离 |

## 环境说明（重要）

1. **Node 24 测试运行时**
   NestJS 12 的 `@nestjs/*` 已是纯 ESM 包，而 `@nestjs/throttler@6` 仍是 CJS 包（其 `dist` 内部
   `require("@nestjs/common")`）。Node 22 的 `require()` 支持加载 ESM，但 Jest 30 的 CJS 运行时需要
   Node >= 24.9 才具备同步 `require(esm)` 能力。
   因此 `package.json` 增加了 devDependency `node@24`，npm scripts 会自动通过
   `node_modules/.bin/node` 使用它（无需修改系统 Node）。
2. **`--experimental-vm-modules`**
   Jest 加载 ESM 依赖需要该 Node 标志，已通过 `cross-env NODE_OPTIONS=...` 写进脚本（Windows / POSIX 通用）。
3. **`--forceExit`**
   `supertest` 的传递依赖 `debug` 在 Windows 上会残留一个 stdout 管道句柄（Jest 报 `PIPEWRAP`），
   测试结束后进程无法自然退出，因此 e2e 脚本显式 `--forceExit`。
4. **测试数据库隔离**
   `test/setup/env.ts` 在测试文件加载前写入：

   ```
   PGLITE_PORT=55499
   PGLITE_DATA_DIR=./.pglite-test
   ```

   每次运行前会删除 `.pglite-test`，结束后再次删除；不会影响开发环境正在使用的 `55432` 端口与 `.pglite` 目录。
   由于种子脚本是幂等 upsert，即使目录清理失败也能安全重跑。

## 命令

在仓库根目录执行：

```bash
# 全量测试（单元 + e2e）
npm run test -w @gach/api
# 等价于
npm run test:api

# 只跑单元测试
npm run test:unit -w @gach/api

# 只跑 e2e（串行）
npm run test:e2e -w @gach/api

# 覆盖率
npm run test:cov -w @gach/api
```

在 `apps/api` 目录内也可直接 `npm test` / `npm run test:e2e`。

## 目录结构

```
apps/api/
├── jest.config.js          # Jest 配置（ts-jest / node 环境 / 120s 超时）
├── tsconfig.spec.json      # 测试专用 tsconfig（include src + test）
└── test/
    ├── setup/
    │   └── env.ts          # 隔离的 PGlite 端口与数据目录
    ├── unit/
    │   ├── tier-progress.spec.ts   # @gach/shared computeTierProgress
    │   ├── text.util.spec.ts       # slugify / estimateReadingTime / extractToc / truncate
    │   └── csrf.service.spec.ts    # CsrfService.verify 双提交校验
    └── e2e/
        ├── test-app.ts             # 装配 AppModule + 启动独立 PGlite + seed
        └── api.e2e-spec.ts         # 18 条 HTTP 层用例
```

## e2e 覆盖范围

- 健康检查；勋章列表 / 统计 / 分类 / 详情；`availability`、`tiered` 筛选（含 `tiered=true` 500 回归）
- 攻略列表 / 详情（`contentMd` 与 `toc`）、FAQ、全站搜索
- 鉴权（未登录 401）、CSRF 双提交校验、登录成功流程
- 越权（普通 USER 访问 `/admin/dashboard` → 403）
- 敏感字段不泄露（`/auth/me` 不含 `passwordHash` / `refreshTokenHash` / bcrypt 哈希）

## 安全回归验证

- e2e 已验证：`POST /auth/login` 携带 `gach_csrf` cookie 但不带 `x-csrf-token` 头时返回 401。
- `POST /auth/refresh` 与 `POST /auth/logout` 同样覆盖 CSRF 双提交校验。
- `/auth/me` 不返回 `passwordHash`、`refreshTokenHash` 或 bcrypt 哈希等敏感字段。

## 跳过说明

当前没有 `skip` 的用例。测试中未依赖任何外部 GitHub Token / 网络服务。
