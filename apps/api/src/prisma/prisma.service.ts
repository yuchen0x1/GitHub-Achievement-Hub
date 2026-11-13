import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { PrismaClient } from '../generated/prisma/client';
import {
  assertExternalPgliteReuse,
  resolveDbSettings,
  type DbProvider,
  type DbSettings,
} from '../config/db-settings';

const execFileAsync = promisify(execFile);

export type { DbProvider, DbSettings };
export { resolveDbSettings };

/**
 * Prisma 客户端封装。
 *
 * 开发环境 (DB_PROVIDER=pglite) 会自动：
 *   1. 启动内嵌的 PostgreSQL 兼容实例 (PGlite + wire protocol socket)
 *   2. 执行 prisma db push 同步表结构
 *   3. 暴露一个标准 postgresql:// 连接串，供 Prisma / 迁移 CLI / psql 使用
 *
 * 生产环境 (DB_PROVIDER=postgres) 直接连接标准 PostgreSQL，
 * 表结构通过 prisma migrate deploy 管理。
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly settings: DbSettings = resolveDbSettings();
  private pgliteServer: { close: () => Promise<void> } | null = null;

  constructor() {
    const settings = resolveDbSettings();
    super({
      adapter: new PrismaPg({
        connectionString: settings.connectionString,
        // PGlite 是单实例 WASM 数据库，连接池必须限制为 1 条连接，
        // 否则并发查询会导致连接被服务端关闭。
        max: settings.provider === 'pglite' ? 1 : 10,
        idleTimeoutMillis: settings.provider === 'pglite' ? 0 : 30_000,
        connectionTimeoutMillis: 30_000,
      }),
      log:
        process.env.PRISMA_LOG === 'query'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    if (this.settings.provider === 'pglite') {
      await this.startEmbeddedPostgres();
      if (this.settings.autoPush) {
        await this.pushSchema();
      }
    }
    await this.$connect();
    this.logger.log(
      `数据库已连接 (${this.settings.provider}) → ${this.maskConnectionString()}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    if (this.pgliteServer) {
      await this.pgliteServer.close();
      this.pgliteServer = null;
    }
  }

  /** 启动内嵌 PostgreSQL 兼容实例 */
  private async startEmbeddedPostgres(): Promise<void> {
    const dataDir = this.settings.pgliteDataDir;
    const port = this.settings.pglitePort;

    // Never infer database ownership from an open port. Reusing an unrelated
    // Postgres service is especially dangerous when autoPush is enabled.
    const shouldReuseExternal = assertExternalPgliteReuse(
      port,
      await this.isPortAlive(port),
      this.settings.reuseExternalPglite,
    );
    if (shouldReuseExternal) {
      this.logger.warn(
        `按 PGLITE_REUSE_EXTERNAL=true 配置复用 ${port} 上的外部数据库；请确认该数据库属于本项目。`,
      );
      return;
    }

    const { PGlite } = await import('@electric-sql/pglite');
    const { PGLiteSocketServer } = await import('@electric-sql/pglite-socket');

    const dir = join(process.cwd(), dataDir);
    const db = await PGlite.create({ dataDir: dir });

    const server = new PGLiteSocketServer({
      db,
      port,
      host: '127.0.0.1',
    });
    await server.start();
    this.pgliteServer = server as unknown as { close: () => Promise<void> };
    this.logger.log(`内嵌 PostgreSQL 已启动 → postgresql://127.0.0.1:${port}/postgres`);
  }

  private async isPortAlive(port: number): Promise<boolean> {
    const net = await import('node:net');
    return new Promise((resolve) => {
      const socket = net.connect({ port, host: '127.0.0.1' });
      const done = (ok: boolean) => {
        socket.destroy();
        resolve(ok);
      };
      socket.setTimeout(800);
      socket.once('connect', () => done(true));
      socket.once('error', () => done(false));
      socket.once('timeout', () => done(false));
    });
  }

  /** 执行 prisma db push 同步表结构（仅开发环境） */
  private async pushSchema(): Promise<void> {
    const prismaBin = this.resolvePrismaBin();
    if (!prismaBin) {
      this.logger.warn('未找到本地 prisma CLI，跳过 db push');
      return;
    }
    try {
      await execFileAsync(
        process.execPath,
        [prismaBin, 'db', 'push'],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            DATABASE_URL: this.settings.connectionString,
          },
          timeout: 180_000,
        },
      );
      this.logger.log('数据库表结构已同步 (prisma db push)');
    } catch (err) {
      this.logger.error(
        `prisma db push 失败: ${(err as Error).message?.split('\n')[0] ?? err}`,
      );
      throw err;
    }
  }

  private resolvePrismaBin(): string | null {
    const candidates = [
      join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js'),
      join(
        process.cwd(),
        '..',
        '..',
        'node_modules',
        'prisma',
        'build',
        'index.js',
      ),
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return null;
  }

  private maskConnectionString(): string {
    return this.settings.connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  }
}
