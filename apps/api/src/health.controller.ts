import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
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
    const result = await this.databaseStatus();
    return {
      ...result,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '进程存活探针' })
  live() {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: '服务就绪探针（含数据库）' })
  async ready() {
    const result = await this.databaseStatus();
    if (result.status !== 'ok') {
      // 让反向代理、systemd 和编排器能够把数据库故障识别为未就绪。
      throw new ServiceUnavailableException('服务尚未就绪');
    }
    return {
      ...result,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private async databaseStatus(): Promise<{ status: 'ok' | 'degraded'; database: 'ok' | 'error' }> {
    let database: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'error';
    }
    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
    };
  }
}
