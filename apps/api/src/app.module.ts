import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { SearchModule } from './modules/search/search.module';
import { CollectionModule } from './modules/collection/collection.module';
import { GithubModule } from './modules/github/github.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContentModule } from './modules/content/content.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 120,
        },
      ],
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    AchievementsModule,
    ArticlesModule,
    SearchModule,
    CollectionModule,
    GithubModule,
    AdminModule,
    ContentModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
