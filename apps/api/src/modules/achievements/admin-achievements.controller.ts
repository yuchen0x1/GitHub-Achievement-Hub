import {
  BadRequestException,
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
import { AchievementsService } from './achievements.service';
import { Roles } from '../../common/decorators/metadata.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/text.util';

/** 可选文本字段：空字符串归一为 null，避免写入无意义的空串 */
function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

/** 难度限定在 1~5，非法值回退到 3（中等） */
function clampDifficulty(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

@ApiTags('后台 · 勋章管理')
@Controller('admin/achievements')
@Roles('ADMIN', 'EDITOR')
export class AdminAchievementsController {
  constructor(
    private readonly achievements: AchievementsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: '后台勋章列表（含未发布内容）' })
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (q?.trim()) {
      where.OR = [
        { nameEn: { contains: q.trim(), mode: 'insensitive' } },
        { nameZh: { contains: q.trim() } },
        { slug: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.achievement.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (p - 1) * size,
        take: size,
        include: { category: true, tiers: true },
      }),
      this.prisma.achievement.count({ where }),
    ]);
    return { items, total, page: p, pageSize: size };
  }

  @Post()
  @ApiOperation({ summary: '新增勋章' })
  create(@Body() body: Record<string, unknown>, @CurrentUser() admin: AuthUser) {
    const nameEn = String(body.nameEn ?? '').trim();
    if (!nameEn) throw new BadRequestException('英文名称不能为空');
    return this.achievements.create(
      {
        slug: slugify(String(body.slug ?? nameEn)),
        nameEn,
        nameZh: String(body.nameZh ?? nameEn),
        summaryEn: String(body.summaryEn ?? ''),
        summaryZh: String(body.summaryZh ?? ''),
        descriptionEn: String(body.descriptionEn ?? ''),
        descriptionZh: String(body.descriptionZh ?? ''),
        backgroundEn: optionalText(body.backgroundEn),
        backgroundZh: optionalText(body.backgroundZh),
        conditionEn: String(body.conditionEn ?? ''),
        conditionZh: String(body.conditionZh ?? ''),
        availability: (body.availability as never) ?? 'AVAILABLE',
        difficulty: clampDifficulty(body.difficulty),
        isTiered: Boolean(body.isTiered),
        hasTiers: Boolean(body.hasTiers ?? body.isTiered),
        status: (body.status as never) ?? 'DRAFT',
        credibility: (body.credibility as never) ?? 'C',
        uncertain: Boolean(body.uncertain),
        uncertaintyNote: optionalText(body.uncertaintyNote),
        popularity: Number.isFinite(Number(body.popularity)) ? Number(body.popularity) : 0,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
        imageUrl: optionalText(body.imageUrl),
        imageHdUrl: optionalText(body.imageHdUrl),
        verifiedAt: body.verifiedAt ? new Date(String(body.verifiedAt)) : null,
        ...(body.categoryId ? { category: { connect: { id: String(body.categoryId) } } } : {}),
      } as never,
      admin.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '勋章详情（后台）' })
  findOne(@Param('id') id: string) {
    return this.prisma.achievement.findUnique({
      where: { id },
      include: {
        category: true,
        tiers: true,
        requirements: true,
        guides: true,
        sources: true,
        translations: true,
      },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑勋章' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() admin: AuthUser,
  ) {
    // note 是审计备注，不是勋章字段，必须剔除，否则 Prisma 会因未知字段报错
    const { note, id: _ignoredId, createdAt, updatedAt, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (data.categoryId !== undefined) {
      data.category = data.categoryId
        ? { connect: { id: String(data.categoryId) } }
        : { disconnect: true };
      delete data.categoryId;
    }
    if (data.difficulty !== undefined) data.difficulty = clampDifficulty(data.difficulty);
    if (data.verifiedAt !== undefined) {
      data.verifiedAt = data.verifiedAt ? new Date(String(data.verifiedAt)) : null;
    }
    return this.achievements.update(
      id,
      data as never,
      admin.id,
      typeof note === 'string' ? note : undefined,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除勋章' })
  async remove(@Param('id') id: string, @CurrentUser() admin: AuthUser) {
    await this.achievements.remove(id, admin.id);
    return { message: '已删除' };
  }

  @Get(':id/history')
  @ApiOperation({ summary: '勋章变更历史' })
  history(@Param('id') id: string) {
    return this.achievements.getHistory(id);
  }

  // -------------------------------------------------------------------------
  // 等级 / 条件 / 教程 / 来源
  // -------------------------------------------------------------------------

  @Post(':id/tiers')
  @ApiOperation({ summary: '新增或更新等级' })
  async upsertTier(
    @Param('id') id: string,
    @Body()
    body: {
      level: string;
      threshold: number;
      labelEn?: string;
      labelZh?: string;
      descriptionEn?: string;
      descriptionZh?: string;
      credibility?: string;
      sourceNote?: string;
    },
  ) {
    const tier = await this.prisma.achievementTier.upsert({
      where: {
        achievementId_level: { achievementId: id, level: body.level as never },
      },
      create: {
        achievementId: id,
        level: body.level as never,
        threshold: Number(body.threshold),
        labelEn: body.labelEn ?? body.level,
        labelZh: body.labelZh ?? body.level,
        descriptionEn: body.descriptionEn ?? null,
        descriptionZh: body.descriptionZh ?? null,
        credibility: (body.credibility as never) ?? 'C',
        sourceNote: body.sourceNote ?? null,
        sortOrder: ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'].indexOf(body.level),
      },
      update: {
        threshold: Number(body.threshold),
        labelEn: body.labelEn ?? body.level,
        labelZh: body.labelZh ?? body.level,
        descriptionEn: body.descriptionEn ?? null,
        descriptionZh: body.descriptionZh ?? null,
        credibility: (body.credibility as never) ?? 'C',
        sourceNote: body.sourceNote ?? null,
        sortOrder: ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'].indexOf(body.level),
      },
    });
    await this.achievements.invalidate();
    return tier;
  }

  @Delete(':id/tiers/:tierId')
  @ApiOperation({ summary: '删除等级' })
  async removeTier(@Param('id') id: string, @Param('tierId') tierId: string) {
    await this.prisma.achievementTier.deleteMany({ where: { id: tierId, achievementId: id } });
    await this.achievements.invalidate();
    return { message: '已删除等级' };
  }

  @Post(':id/requirements')
  @ApiOperation({ summary: '新增获取条件' })
  async addRequirement(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const count = await this.prisma.achievementRequirement.count({
      where: { achievementId: id },
    });
    const created = await this.prisma.achievementRequirement.create({
      data: {
        achievementId: id,
        title: String(body.title ?? ''),
        titleZh: String(body.titleZh ?? body.title ?? ''),
        content: String(body.content ?? ''),
        contentZh: String(body.contentZh ?? body.content ?? ''),
        steps: (body.steps as never) ?? undefined,
        codeExample: body.codeExample ? String(body.codeExample) : null,
        order: count,
      },
    });
    await this.achievements.invalidate();
    return created;
  }

  @Patch(':id/requirements/:reqId')
  @ApiOperation({ summary: '编辑获取条件' })
  async updateRequirement(
    @Param('id') id: string,
    @Param('reqId') reqId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const updated = await this.prisma.achievementRequirement.updateMany({
      where: { id: reqId, achievementId: id },
      data: body as never,
    });
    await this.achievements.invalidate();
    return updated;
  }

  @Delete(':id/requirements/:reqId')
  @ApiOperation({ summary: '删除获取条件' })
  async removeRequirement(
    @Param('id') id: string,
    @Param('reqId') reqId: string,
  ) {
    await this.prisma.achievementRequirement.deleteMany({
      where: { id: reqId, achievementId: id },
    });
    await this.achievements.invalidate();
    return { message: '已删除' };
  }

  @Post(':id/guides')
  @ApiOperation({ summary: '新增获取教程' })
  async addGuide(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const count = await this.prisma.achievementGuide.count({ where: { achievementId: id } });
    const created = await this.prisma.achievementGuide.create({
      data: {
        achievementId: id,
        title: String(body.title ?? ''),
        titleZh: String(body.titleZh ?? body.title ?? ''),
        content: String(body.content ?? ''),
        contentZh: String(body.contentZh ?? body.content ?? ''),
        coverImage: body.coverImage ? String(body.coverImage) : null,
        readingTime: Number(body.readingTime ?? 5),
        order: count,
      },
    });
    await this.achievements.invalidate();
    return created;
  }

  @Patch(':id/guides/:guideId')
  @ApiOperation({ summary: '编辑获取教程' })
  async updateGuide(
    @Param('id') id: string,
    @Param('guideId') guideId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const updated = await this.prisma.achievementGuide.updateMany({
      where: { id: guideId, achievementId: id },
      data: body as never,
    });
    await this.achievements.invalidate();
    return updated;
  }

  @Delete(':id/guides/:guideId')
  @ApiOperation({ summary: '删除获取教程' })
  async removeGuide(@Param('id') id: string, @Param('guideId') guideId: string) {
    await this.prisma.achievementGuide.deleteMany({
      where: { id: guideId, achievementId: id },
    });
    await this.achievements.invalidate();
    return { message: '已删除' };
  }

  @Post(':id/sources')
  @ApiOperation({ summary: '新增资料来源' })
  async addSource(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const created = await this.prisma.achievementSource.create({
      data: {
        achievementId: id,
        title: String(body.title ?? ''),
        url: String(body.url ?? ''),
        sourceType: (body.sourceType as never) ?? 'COMMUNITY',
        credibility: (body.credibility as never) ?? 'C',
        status: (body.status as never) ?? 'ACTIVE',
        verifiedAt: body.verifiedAt ? new Date(String(body.verifiedAt)) : new Date(),
        note: body.note ? String(body.note) : null,
        isDisputed: Boolean(body.isDisputed),
      },
    });
    await this.achievements.invalidate();
    return created;
  }

  @Delete(':id/sources/:sourceId')
  @ApiOperation({ summary: '删除资料来源' })
  async removeSource(@Param('id') id: string, @Param('sourceId') sourceId: string) {
    await this.prisma.achievementSource.deleteMany({
      where: { id: sourceId, achievementId: id },
    });
    await this.achievements.invalidate();
    return { message: '已删除' };
  }
}
