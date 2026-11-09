import 'reflect-metadata';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../../src/prisma/prisma.service';
import { seedDatabase } from '../../src/scripts/seed';

/**
 * e2e 测试专用的应用实例（方案 B：真实装配 AppModule + 独立 PGlite）。
 *
 * 这里复刻 main.ts 的启动流程中与 HTTP 行为相关的部分：
 *   - cookieParser（CSRF 双提交 Cookie 依赖它）
 *   - 全局前缀 /api/v1
 *   - ValidationPipe（DTO 校验与隐式类型转换）
 *   - AllExceptionsFilter（统一错误响应体）
 *
 * 与 main.ts 的差异：不挂 helmet / compression / Swagger，也不监听真实端口，
 * 测试通过 supertest 直接访问 Nest 的 http server。
 */
export interface TestAppContext {
  app: INestApplication;
  prisma: PrismaService;
  /** 本次测试使用的 PGlite 数据目录（绝对路径），供 teardown 清理 */
  dataDir: string;
}

export async function createTestApp(): Promise<TestAppContext> {
  const dataDir = join(process.cwd(), process.env.PGLITE_DATA_DIR ?? './.pglite-test');

  // 每次运行都从空库开始，保证「重复运行结果一致」
  removeDataDir(dataDir);

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ logger: false });

  app.use(cookieParser());
  app.setGlobalPrefix('/api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // 触发 PrismaService.onModuleInit：启动 PGlite → prisma db push → $connect
  await app.init();

  const prisma = app.get(PrismaService);
  // 种子脚本是幂等 upsert，测试库为空时写入完整数据集
  await seedDatabase(prisma);

  return { app, prisma, dataDir };
}

export async function destroyTestApp(context: TestAppContext | undefined): Promise<void> {
  if (!context) return;
  try {
    await context.app.close();
  } finally {
    // PGlite 在 Windows 上可能短暂占用文件句柄，失败时不阻塞测试结果
    removeDataDir(context.dataDir);
  }
}

function removeDataDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    /* 目录被占用时忽略：下一次运行开始前还会再删一次 */
  }
}
