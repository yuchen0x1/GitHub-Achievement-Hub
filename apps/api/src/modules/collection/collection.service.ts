import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  computeTierProgress,
  type TierLevel,
} from '@gach/shared';

@Injectable()
export class CollectionService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // 我的勋章（已获得 / 计划获取）
  // -------------------------------------------------------------------------

  async listMyAchievements(userId: string) {
    const rows = await this.prisma.userAchievement.findMany({
      where: { userId },
      orderBy: [{ acquiredAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        achievement: {
          include: {
            category: true,
            tiers: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    return rows.map((row) => this.decorate(row));
  }

  async upsertAchievement(
    userId: string,
    achievementId: string,
    data: {
      status?: 'EARNED' | 'PLANNED' | 'FAVORITED';
      tierLevel?: TierLevel | null;
      acquiredAt?: string | null;
      notes?: string | null;
    },
  ) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true },
    });
    if (!achievement) throw new NotFoundException('勋章不存在');

    const payload = {
      status: data.status ?? ('EARNED' as const),
      tierLevel: (data.tierLevel ?? null) as TierLevel | null,
      acquiredAt: data.acquiredAt ? new Date(data.acquiredAt) : null,
      notes: data.notes ?? null,
    };

    const record = await this.prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      create: { userId, achievementId, ...payload },
      update: payload,
      include: {
        achievement: {
          include: {
            category: true,
            tiers: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    return this.decorate(record);
  }

  async removeAchievement(userId: string, achievementId: string) {
    await this.prisma.userAchievement.deleteMany({
      where: { userId, achievementId },
    });
    return { message: '已移除记录' };
  }

  // -------------------------------------------------------------------------
  // 收藏
  // -------------------------------------------------------------------------

  async listFavorites(userId: string) {
    const rows = await this.prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        achievement: {
          include: {
            category: true,
            tiers: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      note: row.note,
      createdAt: row.createdAt,
      achievement: row.achievement,
    }));
  }

  async addFavorite(userId: string, achievementId: string, note?: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true },
    });
    if (!achievement) throw new NotFoundException('勋章不存在');

    const record = await this.prisma.userFavorite.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      create: { userId, achievementId, note: note ?? null },
      update: { ...(note !== undefined ? { note } : {}) },
    });
    return record;
  }

  async removeFavorite(userId: string, achievementId: string) {
    await this.prisma.userFavorite.deleteMany({
      where: { userId, achievementId },
    });
    return { message: '已取消收藏' };
  }

  // -------------------------------------------------------------------------
  // 勋章墙 / 完成率
  // -------------------------------------------------------------------------

  async getWall(userId: string) {
    const [earned, favorites, planned, totalAchievements] = await Promise.all([
      this.prisma.userAchievement.findMany({
        where: { userId, status: 'EARNED', achievement: { status: 'PUBLISHED' } },
        include: {
          achievement: {
            include: { tiers: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      }),
      this.prisma.userFavorite.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId, status: 'PLANNED' },
        select: { achievementId: true },
      }),
      this.prisma.achievement.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const obtainable = await this.prisma.achievement.count({
      where: {
        status: 'PUBLISHED',
        availability: { in: ['AVAILABLE', 'TIERED'] },
      },
    });

    const earnedObtainable = earned.filter((row) =>
      ['AVAILABLE', 'TIERED'].includes(row.achievement.availability),
    ).length;

    return {
      earned: earned.map((row) => ({
        achievementId: row.achievementId,
        slug: row.achievement.slug,
        nameEn: row.achievement.nameEn,
        nameZh: row.achievement.nameZh,
        imageUrl: row.achievement.imageUrl,
        tierLevel: row.tierLevel,
        acquiredAt: row.acquiredAt,
        availability: row.achievement.availability,
      })),
      favorites: favorites.map((f) => f.achievementId),
      planned: planned.map((p) => p.achievementId),
      stats: {
        earnedCount: earned.length,
        favoriteCount: favorites.length,
        plannedCount: planned.length,
        totalAchievements,
        obtainableAchievements: obtainable,
        earnedObtainableCount: earnedObtainable,
        completionRate:
          obtainable > 0 ? Math.min(100, Math.round((earnedObtainable / obtainable) * 1000) / 10) : 0,
      },
    };
  }

  /** 个人数据导出（JSON） */
  async exportData(userId: string) {
    const [achievements, favorites, progress] = await Promise.all([
      this.listMyAchievements(userId),
      this.listFavorites(userId),
      this.prisma.userProgress.findMany({
        where: { userId },
        include: { achievement: { select: { slug: true, nameEn: true, nameZh: true } } },
      }),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      achievements,
      favorites,
      progress,
    };
  }

  private decorate<T extends { achievement: { tiers: { level: TierLevel; threshold: number }[] } }>(
    row: T,
  ) {
    const thresholds = row.achievement.tiers.map((t) => ({
      level: t.level,
      threshold: t.threshold,
    }));
    return {
      ...row,
      tierProgress: computeTierProgress({
        tierThresholds: thresholds,
        currentCount: 0,
      }),
    };
  }
}
