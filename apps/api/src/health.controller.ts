import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/metadata.decorator';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '服务与数据库健康状态' })
  async check() {
    let database = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'error';
    }
    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
