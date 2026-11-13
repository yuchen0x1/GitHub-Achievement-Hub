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
   PGLITE_DATA_DIR=./.pglite-test-<process>-<run>
   ```

   每次运行使用唯一目录，初始化失败或测试结束时都会清理。若专用测试端口已被占用，启动会失败，且默认不会复用该端口上的服务；不会影响开发环境的 `55432` 端口与 `.pglite` 目录。
   `PGLITE_REUSE_EXTERNAL=true` 仅适用于已经确认属于本项目的外部 PGlite 实例，默认关闭。

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


## GitHub 查询可靠性与错误契约（2026-11-13）

`GET /api/v1/github/profile/:username` 仅查询公开资料，账号名按大小写无关缓存 300 秒；同一进程内的同名并发查询合并为一个上游请求。没有官方成就列表接口，因此 `achievements` 保留为空数组，并在 `apiLimitations` 中说明未知状态。不要将空数组用于判定用户没有勋章。

| 情况 | HTTP | 响应行为 |
| --- | --- | --- |
| 格式错误 | 400 | 不访问 GitHub |
| GitHub 明确返回用户 404 | 404 | 提示用户不存在或不可公开访问 |
| 主/次级限流 | 429 | `Retry-After` 响应头及 JSON `retryAfterSeconds`；冷却期间拒绝新的上游访问 |
| 上游网络/权限/响应故障 | 502 | 通用可重试提示，不泄露上游细节 |
| 进程内请求队列达到 32 | 503 | 提示繁忙，允许之后重试 |
| 上游超时 | 504 | 中止请求并释放队列 |

`GET /github/validate` 仅在用户名格式错误或不存在时返回 `{ valid: false }`；限流、网络故障继续返回对应错误状态。`POST /github/sync` 的同步日志正确区分 `RATE_LIMITED` 和 `FAILED`。

`GITHUB_API_MIN_INTERVAL_MS` 默认 220，范围 0–5000；`GITHUB_API_TIMEOUT_MS` 默认 10000，范围 100–30000。无效配置回落默认值。超时包含网络请求和读取响应体，不包含此前排队时间。冷却与队列限于单个 API 进程，多实例部署仍需共享配额协调。

OAuth 新授权只申请 `read:user`，不需要 `public_repo` 仓库写权限；既有 GitHub 授权不会被此代码自动撤销。原有 Token 和用户数据保持兼容。

`GET /collection/wall` 的 `stats.completionRate` 采用已发布且当前可获取勋章的同范围分子/分母，并增加 `earnedObtainableCount`。历史勋章仍在 `earned` 中。数据库无需迁移。

开发模式 `DB_AUTO_PUSH=true` 仅执行普通 `prisma db push`。存在数据损失风险时命令失败并停止启动；请先备份并设计迁移，禁止把自动容许数据丢失作为启动的默认行为。
