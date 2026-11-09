import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CollectionService } from './collection.service';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { computeTierProgress } from '@gach/shared';
import { NotFoundException } from '@nestjs/common';
import {
  FavoriteDto,
  ProgressDto,
  UpsertAchievementDto,
} from './collection.dto';

@ApiTags('我的勋章收藏馆')
@Controller('collection')
export class CollectionController {
  constructor(
    private readonly collection: CollectionService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('achievements')
  @ApiOperation({ summary: '我记录的勋章（已获得 / 计划获取）' })
  listAchievements(@CurrentUser() user: AuthUser) {
    return this.collection.listMyAchievements(user.id);
  }

  @Post('achievements/:achievementId')
  @ApiOperation({ summary: '记录一枚勋章' })
  upsertAchievement(
    @CurrentUser() user: AuthUser,
    @Param('achievementId') achievementId: string,
    @Body() body: UpsertAchievementDto,
  ) {
    return this.collection.upsertAchievement(user.id, achievementId, {
      status: body.status,
      tierLevel: body.tierLevel ?? null,
      acquiredAt: body.acquiredAt ?? null,
      notes: body.notes ?? null,
    });
  }

  @Patch('achievements/:achievementId')
  @ApiOperation({ summary: '更新勋章记录' })
  updateAchievement(
    @CurrentUser() user: AuthUser,
    @Param('achievementId') achievementId: string,
    @Body() body: UpsertAchievementDto,
  ) {
    return this.collection.upsertAchievement(user.id, achievementId, {
      status: body.status,
      tierLevel: body.tierLevel ?? null,
      acquiredAt: body.acquiredAt ?? null,
      notes: body.notes ?? null,
    });
  }

  @Delete('achievements/:achievementId')
  @ApiOperation({ summary: '删除勋章记录' })
  removeAchievement(
    @CurrentUser() user: AuthUser,
    @Param('achievementId') achievementId: string,
  ) {
    return this.collection.removeAchievement(user.id, achievementId);
  }

  @Get('favorites')
  @ApiOperation({ summary: '我的收藏' })
  listFavorites(@CurrentUser() user: AuthUser) {
    return this.collection.listFavorites(user.id);
  }

  @Post('favorites/:achievementId')
  @ApiOperation({ summary: '收藏一枚勋章' })
  addFavorite(
    @CurrentUser() user: AuthUser,
    @Param('achievementId') achievementId: string,
    @Body() body: FavoriteDto,
  ) {
    return this.collection.addFavorite(user.id, achievementId, body?.note);
  }

  @Delete('favorites/:achievementId')
  @ApiOperation({ summary: '取消收藏' })
  removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('achievementId') achievementId: string,
  ) {
    return this.collection.removeFavorite(user.id, achievementId);
  }

  @Get('wall')
  @ApiOperation({ summary: '个人勋章墙数据' })
  wall(@CurrentUser() user: AuthUser) {
    return this.collection.getWall(user.id);
  }

  @Get('export')
  @ApiOperation({ summary: '导出个人勋章数据 (JSON)' })
  exportData(@CurrentUser() user: AuthUser) {
    return this.collection.exportData(user.id);
  }
}

@ApiTags('我的成就进度')
@Controller('progress')
export class ProgressController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '我的进度列表（含自动计算结果）' })
  async list(@CurrentUser() user: AuthUser) {
    const rows = await this.prisma.userProgress.findMany({
      where: { userId: user.id },
      include: {
        achievement: {
          include: {
            tiers: { orderBy: { sortOrder: 'asc' } },
            category: true,
          },
        },
      },
    });

    return rows.map((row) => {
      const tiers = row.achievement.tiers.map((t) => ({
        id: t.id,
        level: t.level,
        threshold: t.threshold,
        labelEn: t.labelEn,
        labelZh: t.labelZh,
        credibility: t.credibility,
      }));
      const computed = computeTierProgress({
        tierThresholds: tiers.map((t) => ({
          level: t.level,
          threshold: t.threshold,
        })),
        currentCount: row.currentCount,
      });
      return {
        id: row.id,
        achievementId: row.achievementId,
        slug: row.achievement.slug,
        nameEn: row.achievement.nameEn,
        nameZh: row.achievement.nameZh,
        imageUrl: row.achievement.imageUrl,
        category: row.achievement.category,
        currentCount: row.currentCount,
        targetCount: row.targetCount,
        targetTier: row.targetTier,
        note: row.note,
        updatedAt: row.updatedAt,
        tiers,
        computed,
        disclaimer:
          '进度依据公开门槛推算，不代表 GitHub 官方实时成就状态。',
      };
    });
  }

  @Post(':achievementId')
  @ApiOperation({ summary: '设置某枚勋章的进度' })
  async upsert(
    @CurrentUser() user: AuthUser,
    @Param('achievementId') achievementId: string,
    @Body() body: ProgressDto,
  ) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      include: { tiers: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!achievement) throw new NotFoundException('勋章不存在');

    const currentCount = body.currentCount ?? 0;

    const record = await this.prisma.userProgress.upsert({
      where: { userId_achievementId: { userId: user.id, achievementId } },
      create: {
        userId: user.id,
        achievementId,
        currentCount,
        targetCount: body.targetCount ?? null,
        targetTier: body.targetTier ?? null,
        note: body.note ?? null,
      },
      update: {
        currentCount,
        targetCount: body.targetCount ?? null,
        targetTier: body.targetTier ?? null,
        note: body.note ?? null,
      },
    });

    const computed = computeTierProgress({
      tierThresholds: achievement.tiers.map((t) => ({
        level: t.level,
        threshold: t.threshold,
      })),
      currentCount,
    });

    return { ...record, computed };
  }

  @Delete(':achievementId')
  @ApiOperation({ summary: '清除某枚勋章的进度' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('achievementId') achievementId: string,
  ) {
    await this.prisma.userProgress.deleteMany({
      where: { userId: user.id, achievementId },
    });
    return { message: '已清除进度' };
  }

  @Get('summary')
  @ApiOperation({ summary: '进度总览' })
  async summary(@CurrentUser() user: AuthUser) {
    const rows = await this.prisma.userProgress.findMany({
      where: { userId: user.id },
      include: { achievement: { include: { tiers: true } } },
    });
    let total = 0;
    let done = 0;
    for (const row of rows) {
      const computed = computeTierProgress({
        tierThresholds: row.achievement.tiers.map((t) => ({
          level: t.level,
          threshold: t.threshold,
        })),
        currentCount: row.currentCount,
      });
      total += 1;
      if (computed.nextLevel === null) done += 1;
    }
    return {
      tracked: total,
      maxed: done,
      overallPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }
}
