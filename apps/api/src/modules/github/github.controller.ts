import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GithubProfileService } from './github-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators/metadata.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('GitHub 账号查询')
@Controller('github')
export class GithubController {
  constructor(
    private readonly profiles: GithubProfileService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('profile/:username')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: '查询 GitHub 用户公开资料与成就状态' })
  getProfile(@Param('username') username: string) {
    return this.profiles.getProfile(username);
  }

  @Public()
  @Get('validate')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: '校验用户名是否存在' })
  async validate(@Query('username') username: string) {
    try {
      const profile = await this.profiles.getProfile(username);
      return { valid: true, login: profile.login, avatarUrl: profile.avatarUrl };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) return { valid: false };
      throw error;
    }
  }

  @Post('sync')
  @ApiOperation({ summary: '同步本人绑定的 GitHub 账号数据' })
  async sync(@CurrentUser() user: AuthUser) {
    const account = await this.prisma.githubAccount.findUnique({
      where: { userId: user.id },
      select: { login: true },
    });
    if (!account) {
      throw new BadRequestException(
        '尚未绑定 GitHub 账号。请先使用 GitHub 登录，或在设置中绑定账号。',
      );
    }
    return this.profiles.syncForUser(user.id, account.login);
  }
}
