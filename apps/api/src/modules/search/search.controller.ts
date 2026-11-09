import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../../common/decorators/metadata.decorator';

@ApiTags('搜索')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '全站搜索' })
  find(@Query() query: Record<string, string>) {
    return this.search.searchFull(query as never);
  }

  @Public()
  @Get('quick')
  @ApiOperation({ summary: '快速搜索（勋章 + 攻略）' })
  quick(@Query('q') q = '', @Query('limit') limit?: string) {
    const n = Number(limit);
    return this.search.search(q, Number.isFinite(n) ? Math.min(n, 50) : 20);
  }

  @Public()
  @Get('suggest')
  @ApiOperation({ summary: '搜索建议' })
  suggest(@Query('q') q = '', @Query('limit') limit?: string) {
    const n = Number(limit);
    return this.search.suggest(q, Number.isFinite(n) ? Math.min(n, 20) : 8);
  }
}
