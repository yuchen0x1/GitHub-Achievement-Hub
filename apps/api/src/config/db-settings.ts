/**
 * 数据库运行时配置解析（模块加载时读取环境变量）。
 *
 * 独立成文件，避免 PrismaService 与 DatabaseConfig 之间的循环依赖，
 * 同时保证在 `super()` 阶段即可拿到连接串。
 */
export type DbProvider = 'pglite' | 'postgres';

export interface DbSettings {
  provider: DbProvider;
  connectionString: string;
  pglitePort: number;
  pgliteDataDir: string;
  reuseExternalPglite: boolean;
  autoPush: boolean;
  autoSeed: boolean;
  isProduction: boolean;
}

/**
 * Refuse to infer that an arbitrary PostgreSQL listener belongs to this app.
 * Returns true only when an existing listener may explicitly be reused.
 */
export function assertExternalPgliteReuse(
  port: number,
  isPortAlive: boolean,
  reuseAllowed: boolean,
): boolean {
  if (!isPortAlive) return false;
  if (!reuseAllowed) {
    throw new Error(
      `PGlite 端口 ${port} 已被占用。为避免连接到其他项目的数据库，启动已中止。` +
        '如确认该端口属于本项目的外部 PGlite 实例，可设置 PGLITE_REUSE_EXTERNAL=true。',
    );
  }
  return true;
}

export function resolveDbSettings(): DbSettings {
  const provider: DbProvider =
    (process.env.DB_PROVIDER ?? 'pglite') === 'postgres' ? 'postgres' : 'pglite';
  const isProduction = process.env.NODE_ENV === 'production';
  const pglitePort = Number(process.env.PGLITE_PORT ?? '55432');

  const connectionString =
    provider === 'pglite'
      ? `postgresql://postgres:postgres@127.0.0.1:${pglitePort}/postgres`
      : (process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@127.0.0.1:5432/github_achievement_hub');

  return {
    provider,
    connectionString,
    pglitePort,
    pgliteDataDir: process.env.PGLITE_DATA_DIR ?? './.pglite',
    reuseExternalPglite: process.env.PGLITE_REUSE_EXTERNAL === 'true',
    autoPush: (process.env.DB_AUTO_PUSH ?? 'false') === 'true' && !isProduction,
    autoSeed: (process.env.DB_AUTO_SEED ?? 'false') === 'true' && !isProduction,
    isProduction,
  };
}
