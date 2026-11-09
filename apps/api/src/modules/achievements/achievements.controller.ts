import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AchievementsService, type AchievementListQuery } from './achievements.service';
import { Public } from '../../common/decorators/metadata.decorator';

@ApiTags('勋章百科')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '勋章列表（支持搜索 / 筛选 / 排序 / 分页）' })
  findAll(@Query() query: AchievementListQuery) {
    return this.achievements.findAll(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: '首页热门勋章' })
  featured(@Query('limit') limit?: string) {
    const n = Number(limit);
    return this.achievements.findFeatured(
      Number.isFinite(n) && n > 0 ? Math.min(n, 24) : 6,
    );
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: '勋章分类列表' })
  categories() {
    return this.achievements.findCategories();
  }

  @Public()
  @Get('tiers')
  @ApiOperation({ summary: '全部等级阶梯总览' })
  tiers() {
    return this.achievements.findTierOverview();
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: '站点统计（真实数据库聚合）' })
  stats() {
    return this.achievements.getStats();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: '勋章详情' })
  findOne(@Param('slug') slug: string) {
    return this.achievements.findBySlug(slug);
  }
}
