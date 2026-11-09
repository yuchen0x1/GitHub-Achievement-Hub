import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaService } from './prisma/prisma.service';
import { DatabaseConfig } from './config/database.config';
import { seedDatabase } from './scripts/seed';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
  });

  const config = app.get(ConfigService);
  const dbConfig = app.get(DatabaseConfig);
  const prefix = config.get<string>('API_PREFIX', '/api/v1');
  const port = Number(config.get<string>('PORT', '4000'));

  // ---- 安全响应头 ----
  app.use(
    helmet({
      contentSecurityPolicy: false, // API 不返回 HTML，交由前端网关设置
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // ---- CORS：仅允许白名单来源 ----
  // 除浏览器 Web 端外，桌面端（Tauri）与移动端（Capacitor）使用各自的自定义协议来源，
  // 这些来源是固定的、可枚举的，因此同样走白名单而不是通配符。
  const NATIVE_APP_ORIGINS = [
    'tauri://localhost',
    'http://tauri.localhost',
    'https://tauri.localhost',
    'capacitor://localhost',
    'http://localhost', // Android WebView（capacitor androidScheme=http 时）
    'https://localhost', // Android WebView（capacitor androidScheme=https 时）
  ];

  const allowedOrigins = (config.get<string>('WEB_ORIGIN', 'http://localhost:3000'))
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .concat(NATIVE_APP_ORIGINS);
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS 拒绝来源: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-RateLimit-Remaining'],
    maxAge: 86_400,
  });

  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  // ---- Swagger API 文档 ----
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GitHub Achievement Hub API')
    .setDescription(
      'GitHub 个人成就勋章百科与获取指南平台的 REST API。所有统计与勋章数据均来自真实数据库。',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port, '0.0.0.0');

  logger.log(`API 已启动 → http://localhost:${port}${prefix}`);
  logger.log(`API 文档 → http://localhost:${port}${prefix}/docs`);

  // ---- 开发环境：自动灌入 / 刷新种子数据（幂等 upsert）----
  // 种子脚本使用 upsert，因此每次启动都会把资料同步为代码中的最新版本，
  // 保证开发期「改了种子 → 重启 → 立即可见」，生产环境由 DB_AUTO_SEED 控制为关闭。
  if (dbConfig.autoSeed) {
    const prisma = app.get(PrismaService);
    const count = await prisma.achievement.count();
    logger.log(
      count === 0
        ? '检测到数据库为空，正在写入初始勋章资料…'
        : `数据库已有 ${count} 枚勋章，正在同步最新资料…`,
    );
    const result = await seedDatabase(prisma);
    logger.log(
      `资料同步完成：${result.achievements} 枚勋章 / ${result.tiers} 个等级 / ${result.articles} 篇攻略`,
    );
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('启动失败:', err);
  process.exit(1);
});
