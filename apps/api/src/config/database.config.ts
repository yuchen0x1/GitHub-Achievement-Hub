import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveDbSettings, type DbProvider } from './db-settings';

/**
 * 统一的数据库连接串解析。
 * - pglite: 本地开发，API 进程内嵌一个 PostgreSQL 兼容实例并监听本地端口
 * - postgres: 生产环境标准 PostgreSQL
 */
@Injectable()
export class DatabaseConfig {
  constructor(private readonly config: ConfigService) {}

  private get settings() {
    return resolveDbSettings();
  }

  get provider(): DbProvider {
    return this.settings.provider;
  }

  get isProduction(): boolean {
    return this.settings.isProduction;
  }

  get pglitePort(): number {
    return this.settings.pglitePort;
  }

  get pgliteDataDir(): string {
    return this.settings.pgliteDataDir;
  }

  get autoPush(): boolean {
    return this.settings.autoPush;
  }

  get autoSeed(): boolean {
    return this.settings.autoSeed;
  }

  /** pglite 模式下对外暴露的 Postgres 协议地址 */
  get pgliteConnectionString(): string {
    return this.settings.connectionString;
  }

  get connectionString(): string {
    if (this.provider === 'pglite') return this.pgliteConnectionString;
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error(
        'DATABASE_URL 未配置。DB_PROVIDER=postgres 时必须提供标准 PostgreSQL 连接串。',
      );
    }
    return url;
  }
}
