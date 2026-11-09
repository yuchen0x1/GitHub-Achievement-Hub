/**
 * 测试环境变量（在测试文件加载前执行）。
 *
 * 与开发环境（127.0.0.1:55432 / ./.pglite）完全隔离：
 * e2e 使用 127.0.0.1:55499 + ./.pglite-test，结束后删除数据目录，
 * 因此可以反复运行且不会干扰正在运行的开发 API。
 *
 * 注意：@nestjs/config 不会覆盖已经存在的 process.env 变量，
 * 所以这里先写入的 PGLITE_PORT / PGLITE_DATA_DIR 不会被 .env 覆盖。
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PGLITE_PORT = process.env.PGLITE_PORT ?? '55499';
process.env.PGLITE_DATA_DIR = process.env.PGLITE_DATA_DIR ?? './.pglite-test';

// 测试库需要自动建表；种子数据由测试用例显式调用 seedDatabase 写入
process.env.DB_PROVIDER = process.env.DB_PROVIDER ?? 'pglite';
process.env.DB_AUTO_PUSH = 'true';
process.env.DB_AUTO_SEED = 'false';

// 关闭 Redis，避免测试环境误连外部依赖（默认即内存缓存）
process.env.REDIS_URL = '';
