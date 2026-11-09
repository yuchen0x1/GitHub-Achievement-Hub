/**
 * Jest 配置。
 *
 * 关键点：
 * 1. 使用 ts-jest（而非 swc / esbuild）转译 —— NestJS 的依赖注入依赖
 *    `emitDecoratorMetadata` 生成的 `design:paramtypes`，esbuild 不生成该元数据，
 *    会导致构造函数注入拿到 undefined。因此不能开启 isolatedModules。
 * 2. NestJS 12 的 @nestjs/* 已经是纯 ESM 包，而 @nestjs/throttler@6 仍是 CJS 包
 *    （其 dist 内部使用 require("@nestjs/common")）。Node 22 的 require() 虽然支持
 *    加载 ESM，但 Jest 30 的 CJS 运行时要求 Node >= 24.9 才具备同步 require(esm) 能力。
 *    因此测试通过 workspace 内的 `node@24` devDependency 运行（npm scripts 会把
 *    node_modules/.bin 加入 PATH，从而使用 Node 24），与业务代码在 Node 22 上
 *    由 ts-node 运行的方式保持一致（两者都走 TypeScript 的 CommonJS 输出）。
 * 3. testTimeout 放宽到 120s：e2e 用例会在测试进程内启动一份独立的 PGlite
 *    （WASM）并执行 prisma db push + seed，冷启动较慢。
 *
 * @type {import('jest').Config}
 */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/test/**/*.spec.ts',
    '<rootDir>/test/**/*.e2e-spec.ts',
  ],
  // 必须在测试文件加载前写入，PrismaService / db-settings 在模块加载期就会读取
  setupFiles: ['<rootDir>/test/setup/env.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 120_000,
  clearMocks: true,
  verbose: true,
  // e2e 会启动 PGlite，串行执行避免端口 / 文件句柄竞争
  maxWorkers: 1,
};
