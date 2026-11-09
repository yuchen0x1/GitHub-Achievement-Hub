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
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators/metadata.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/metadata.decorator';

@ApiTags('用户反馈')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: '提交反馈' })
  async submit(
    @Body()
    body: {
      type?: 'BUG' | 'SUGGESTION' | 'CORRECTION' | 'QUESTION' | 'OTHER';
      subject: string;
      content: string;
      email?: string;
    },
    @CurrentUser() user?: AuthUser,
  ) {
    const created = await this.prisma.feedback.create({
      data: {
        userId: user?.id ?? null,
        type: body.type ?? 'OTHER',
        subject: body.subject,
        content: body.content,
        email: body.email ?? user?.email ?? null,
      },
    });
    return { id: created.id, message: '反馈已提交，感谢你的支持' };
  }

  @Get('mine')
  @ApiOperation({ summary: '我的反馈记录' })
  async mine(@CurrentUser() user: AuthUser) {
    return this.prisma.feedback.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        type: true,
        subject: true,
        content: true,
        status: true,
        adminNote: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

@ApiTags('后台 · 反馈与日志')
@Controller('admin')
@Roles('ADMIN', 'EDITOR')
export class AdminOpsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('feedback')
  @ApiOperation({ summary: '反馈列表' })
  async feedback(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const where = status && status !== 'all' ? { status: status as never } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * size,
        take: size,
        include: { user: { select: { displayName: true, email: true } } },
      }),
      this.prisma.feedback.count({ where }),
    ]);
    return { items, total, page: p, pageSize: size };
  }

  @Patch('feedback/:id')
  @ApiOperation({ summary: '处理反馈' })
  async handleFeedback(
    @Param('id') id: string,
    @Body() body: { status?: string; adminNote?: string },
    @CurrentUser() admin: AuthUser,
  ) {
    const updated = await this.prisma.feedback.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status as never } : {}),
        ...(body.adminNote !== undefined ? { adminNote: body.adminNote } : {}),
        handledById: admin.id,
      },
    });
    await this.log(admin, 'UPDATE', 'feedback', id, body);
    return updated;
  }

  @Delete('feedback/:id')
  @ApiOperation({ summary: '删除反馈' })
  async removeFeedback(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
  ) {
    await this.prisma.feedback.delete({ where: { id } });
    await this.log(admin, 'DELETE', 'feedback', id);
    return { message: '已删除' };
  }

  @Get('logs')
  @ApiOperation({ summary: '管理员操作日志' })
  async logs(
    @Query('entityType') entityType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const size = Math.min(100, Math.max(1, Number(pageSize) || 30));
    const where = entityType && entityType !== 'all' ? { entityType } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * size,
        take: size,
      }),
      this.prisma.adminLog.count({ where }),
    ]);
    return { items, total, page: p, pageSize: size };
  }

  @Get('users')
  @ApiOperation({ summary: '用户列表' })
  async users(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const where = q?.trim()
      ? {
          OR: [
            { email: { contains: q.trim(), mode: 'insensitive' as const } },
            { displayName: { contains: q.trim(), mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { userAchievements: true, favorites: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * size,
        take: size,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: p, pageSize: size };
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: '调整用户角色' })
  async setRole(
    @Param('id') id: string,
    @Body() body: { role: 'USER' | 'EDITOR' | 'ADMIN' },
    @CurrentUser() admin: AuthUser,
  ) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, email: true, role: true },
    });
    await this.log(admin, 'UPDATE', 'user', id, { role: body.role });
    return updated;
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: '启用 / 停用用户' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @CurrentUser() admin: AuthUser,
  ) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: Boolean(body.isActive) },
      select: { id: true, email: true, isActive: true },
    });
    await this.log(admin, 'UPDATE', 'user', id, { isActive: body.isActive });
    return updated;
  }

  // --------------------------- 公告 ---------------------------

  @Get('announcements')
  @ApiOperation({ summary: '公告列表' })
  async announcements(@Query('all') all?: string) {
    return this.prisma.announcement.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  @Post('announcements')
  @ApiOperation({ summary: '发布公告' })
  async createAnnouncement(
    @Body()
    body: { title: string; content: string; level?: 'INFO' | 'WARNING' | 'IMPORTANT' },
    @CurrentUser() admin: AuthUser,
  ) {
    const created = await this.prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        level: body.level ?? 'INFO',
      },
    });
    await this.log(admin, 'CREATE', 'announcement', created.id, body);
    return created;
  }

  @Delete('announcements/:id')
  @ApiOperation({ summary: '删除公告' })
  async removeAnnouncement(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
  ) {
    await this.prisma.announcement.delete({ where: { id } });
    await this.log(admin, 'DELETE', 'announcement', id);
    return { message: '已删除' };
  }

  @Get('dashboard')
  @ApiOperation({ summary: '后台总览数据' })
  async dashboard() {
    const [
      totalAchievements,
      publishedAchievements,
      draftAchievements,
      totalArticles,
      totalUsers,
      pendingFeedback,
      totalSources,
      disputedSources,
      totalCategories,
      totalTiers,
    ] = await Promise.all([
      this.prisma.achievement.count(),
      this.prisma.achievement.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.achievement.count({ where: { status: 'DRAFT' } }),
      this.prisma.article.count(),
      this.prisma.user.count(),
      this.prisma.feedback.count({ where: { status: 'PENDING' } }),
      this.prisma.achievementSource.count(),
      this.prisma.achievementSource.count({ where: { isDisputed: true } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.achievementTier.count(),
    ]);

    const byCredibility = await this.prisma.achievement.groupBy({
      by: ['credibility'],
      _count: { _all: true },
    });
    const byAvailability = await this.prisma.achievement.groupBy({
      by: ['availability'],
      where: { status: 'PUBLISHED' },
      _count: { _all: true },
    });

    return {
      totalAchievements,
      publishedAchievements,
      draftAchievements,
      totalArticles,
      totalUsers,
      pendingFeedback,
      totalSources,
      disputedSources,
      totalCategories,
      totalTiers,
      byCredibility: byCredibility.map((c) => ({
        grade: c.credibility,
        count: c._count._all,
      })),
      byAvailability: byAvailability.map((a) => ({
        availability: a.availability,
        count: a._count._all,
      })),
    };
  }

  private async log(
    admin: AuthUser,
    action: string,
    entityType: string,
    entityId?: string,
    after?: unknown,
  ): Promise<void> {
    await this.prisma.adminLog.create({
      data: {
        userId: admin.id,
        userName: admin.displayName,
        action,
        entityType,
        entityId: entityId ?? null,
        after: (after as never) ?? undefined,
      },
    });
  }
}
