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
import { ArticlesService, type ArticleListQuery } from './articles.service';
import { Public } from '../../common/decorators/metadata.decorator';
import { Roles } from '../../common/decorators/metadata.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('攻略知识库')
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '攻略列表' })
  findAll(@Query() query: ArticleListQuery) {
    return this.articles.findAll(query);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: '攻略分类与数量' })
  categories() {
    return this.articles.getCategories();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: '攻略详情' })
  async findOne(@Param('slug') slug: string) {
    const article = await this.articles.findBySlug(slug);
    const related = await this.articles.findRelated(slug);
    return { ...(article as object), related };
  }

  // --------------------------- 管理端 ---------------------------

  @Post('admin')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: '创建文章' })
  create(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.articles.create({
      title: String(body.title ?? ''),
      titleZh: String(body.titleZh ?? body.title ?? ''),
      category: (body.category as never) ?? 'GETTING_STARTED',
      contentMd: String(body.contentMd ?? ''),
      excerpt: body.excerpt ? String(body.excerpt) : undefined,
      coverImage: body.coverImage ? String(body.coverImage) : undefined,
      tags: (body.tags as string[]) ?? [],
      authorId: user.id,
      authorName: user.displayName,
      featured: Boolean(body.featured),
      status: (body.status as never) ?? 'DRAFT',
    });
  }

  @Patch('admin/:id')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: '编辑文章' })
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.articles.update(id, body);
  }

  @Delete('admin/:id')
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: '删除文章' })
  remove(@Param('id') id: string) {
    return this.articles.remove(id);
  }
}
