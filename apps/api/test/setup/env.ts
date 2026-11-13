/**
 * 测试环境变量（在测试文件加载前执行）。
 *
 * 与开发环境（127.0.0.1:55432 / ./.pglite）完全隔离：
 * e2e 使用专用 55499 端口和每次运行独立的数据目录；端口若被占用，
 * PrismaService 会拒绝复用并使测试失败，绝不连接已有数据库。
 *
 * 注意：@nestjs/config 不会覆盖已经存在的 process.env 变量，
 * 所以这里先写入的 PGLITE_PORT / PGLITE_DATA_DIR 不会被 .env 覆盖。
 */
process.env.NODE_ENV = 'test';
// Fixture identities must not depend on an untracked .env file.
process.env.JWT_SECRET = 'test-only-disposable-jwt-secret-not-for-production';
process.env.REFRESH_TOKEN_SECRET = 'test-only-disposable-refresh-secret-not-for-production';
process.env.ADMIN_EMAIL = 'admin@gach.local';
process.env.ADMIN_PASSWORD = 'Admin@12345';
process.env.GITHUB_TOKEN = '';
process.env.GITHUB_CLIENT_ID = '';
process.env.GITHUB_CLIENT_SECRET = '';
// Use a dedicated test port and a unique directory. Never honor inherited DB
// settings here: the fixture must not point at a developer database.
process.env.PGLITE_PORT = '55499';
process.env.PGLITE_DATA_DIR = `./.pglite-test-${process.pid}-${Date.now()}`;
process.env.PGLITE_REUSE_EXTERNAL = 'false';

// 测试库需要自动建表；种子数据由测试用例显式调用 seedDatabase 写入
process.env.DB_PROVIDER = 'pglite';
process.env.DB_AUTO_PUSH = 'true';
process.env.DB_AUTO_SEED = 'false';

// 关闭 Redis，避免测试环境误连外部依赖（默认即内存缓存）
process.env.REDIS_URL = '';
