import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * 缓存层。
 * 优先使用 Redis（配置 REDIS_URL 时），未配置时自动降级为进程内 LRU 缓存，
 * 保证在没有 Redis 的环境中功能完整可用。
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private memory = new Map<string, CacheEntry>();
  private redis: import('ioredis').Redis | null = null;
  private readonly ttl: number;

  constructor(private readonly config: ConfigService) {
    this.ttl = Number(this.config.get<string>('CACHE_TTL_SECONDS', '300'));
  }

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.log('未配置 REDIS_URL，使用进程内缓存');
      return;
    }
    try {
      const { Redis } = await import('ioredis');
      const client = new Redis(url, {
        maxRetriesPerRequest: 2,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      client.on('error', (err) => {
        this.logger.warn(`Redis 连接异常，已降级为进程内缓存: ${err.message}`);
        this.redis = null;
      });
      await client.connect();
      await client.ping();
      this.redis = client;
      this.logger.log('Redis 缓存已启用');
    } catch (err) {
      this.logger.warn(
        `Redis 不可用 (${(err as Error).message})，降级为进程内缓存`,
      );
      this.redis = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        /* fall through to memory */
      }
    }
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const ttl = (ttlSeconds ?? this.ttl) * 1000;
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'PX', ttl);
        return;
      } catch {
        /* fall through to memory */
      }
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttl });
    this.evictIfNeeded();
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch {
        /* ignore */
      }
    }
    this.memory.delete(key);
  }

  /** 按前缀批量清除（用于后台修改内容后失效缓存） */
  async delByPrefix(prefix: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys.length) await this.redis.del(...keys);
      } catch {
        /* ignore */
      }
    }
    for (const key of [...this.memory.keys()]) {
      if (key.startsWith(prefix)) this.memory.delete(key);
    }
  }

  private evictIfNeeded(): void {
    if (this.memory.size <= 1000) return;
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt < now) this.memory.delete(key);
    }
    // 仍然超限时按插入顺序淘汰最早的条目
    while (this.memory.size > 1000) {
      const oldest = this.memory.keys().next().value;
      if (oldest === undefined) break;
      this.memory.delete(oldest);
    }
  }
}
