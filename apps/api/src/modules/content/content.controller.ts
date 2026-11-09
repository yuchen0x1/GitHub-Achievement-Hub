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
import { Roles } from '../../common/decorators/metadata.decorator';

@ApiTags('常见问题')
@Controller('faq')
export class FaqController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '常见问题列表' })
  async list(@Query('category') category?: string) {
    return this.prisma.faq.findMany({
      where: {
        isActive: true,
        ...(category && category !== 'all' ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        slug: true,
        question: true,
        questionZh: true,
        answer: true,
        answerZh: true,
        category: true,
        sortOrder: true,
      },
    });
  }
}

@ApiTags('站点内容')
@Controller('content')
export class ContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('announcements')
  @ApiOperation({ summary: '当前生效的公告' })
  async announcements() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: '分类列表（含统计）' })
  async categories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { achievements: { where: { status: 'PUBLISHED' } } },
        },
      },
    });
  }
}

@ApiTags('后台 · 分类与常见问题')
@Controller('admin/content')
@Roles('ADMIN', 'EDITOR')
export class AdminContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('categories')
  @ApiOperation({ summary: '新增分类' })
  async createCategory(@Body() body: Record<string, unknown>) {
    return this.prisma.category.create({
      data: {
        slug: String(body.slug),
        nameEn: String(body.nameEn),
        nameZh: String(body.nameZh),
        descriptionEn: body.descriptionEn ? String(body.descriptionEn) : null,
        descriptionZh: body.descriptionZh ? String(body.descriptionZh) : null,
        icon: body.icon ? String(body.icon) : null,
        colorHex: body.colorHex ? String(body.colorHex) : null,
        sortOrder: Number(body.sortOrder ?? 0),
      },
    });
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: '编辑分类' })
  async updateCategory(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.prisma.category.update({ where: { id }, data: body as never });
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: '删除分类' })
  async removeCategory(@Param('id') id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { message: '已删除' };
  }

  @Post('faq')
  @ApiOperation({ summary: '新增常见问题' })
  async createFaq(@Body() body: Record<string, unknown>) {
    return this.prisma.faq.create({
      data: {
        slug: String(body.slug),
        question: String(body.question),
        questionZh: String(body.questionZh ?? body.question),
        answer: String(body.answer),
        answerZh: String(body.answerZh ?? body.answer),
        category: String(body.category ?? 'general'),
        sortOrder: Number(body.sortOrder ?? 0),
      },
    });
  }

  @Patch('faq/:id')
  @ApiOperation({ summary: '编辑常见问题' })
  async updateFaq(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.prisma.faq.update({ where: { id }, data: body as never });
  }

  @Delete('faq/:id')
  @ApiOperation({ summary: '删除常见问题' })
  async removeFaq(@Param('id') id: string) {
    await this.prisma.faq.delete({ where: { id } });
    return { message: '已删除' };
  }
}
