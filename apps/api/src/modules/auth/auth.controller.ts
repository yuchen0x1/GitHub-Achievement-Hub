import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { GithubApiService } from '../github/github-api.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/metadata.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import {
  CSRF_COOKIE,
  CsrfService,
  requireRefreshToken,
} from '../../common/services/csrf.service';
import { sanitizeRedirect } from '../../common/utils/redirect.util';

const REFRESH_COOKIE = 'gach_refresh';
const NATIVE_OAUTH_ORIGINS = [
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
];

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;
  private readonly webOrigin: string;
  private readonly allowedOAuthOrigins: Set<string>;

  constructor(
    private readonly auth: AuthService,
    private readonly github: GithubApiService,
    private readonly csrf: CsrfService,
    private readonly config: ConfigService,
  ) {
    this.isProduction =
      this.config.get<string>('NODE_ENV') === 'production';
    const configuredOrigins = this.config
      .get<string>('WEB_ORIGIN', 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    this.webOrigin = (configuredOrigins[0] ?? 'http://localhost:3000').replace(/\/$/, '');
    this.allowedOAuthOrigins = new Set(
      [...configuredOrigins, ...NATIVE_OAUTH_ORIGINS].flatMap((origin) => {
        try {
          return [new URL(origin).origin];
        } catch {
          return [];
        }
      }),
    );
  }

  // -------------------------------------------------------------------------
  // 本地账号
  // -------------------------------------------------------------------------

  @Public()
  @Post('register')
  @ApiOperation({ summary: '注册本地账号' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 双提交 Cookie 校验：若浏览器已持有 gach_csrf Cookie，则必须同时带上匹配的请求头。
    // 缺失 Cookie（原生客户端 / 首次访问）时按设计放行。
    this.csrf.verify(req);
    const result = await this.auth.register(dto.email, dto.password, dto.displayName);
    this.setAuthCookies(res, result.refreshToken, this.csrf.issue());
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '邮箱密码登录' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 修复 Login CSRF：登录同样会写 Cookie，必须与 refresh/logout 一致地做双提交校验。
    this.csrf.verify(req);
    const result = await this.auth.login(dto.email, dto.password);
    const csrfToken = this.csrf.issue();
    this.setAuthCookies(res, result.refreshToken, csrfToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      csrfToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '使用 refresh token 换取新 access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.csrf.verify(req);
    const refreshToken = requireRefreshToken(req);
    const result = await this.auth.refresh(
      refreshToken,
      req.headers['user-agent'],
      req.ip,
    );
    const csrfToken = this.csrf.issue();
    this.setAuthCookies(res, result.refreshToken, csrfToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      csrfToken,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '退出登录' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.csrf.verify(req);
    try {
      const refreshToken = requireRefreshToken(req);
      await this.auth.logout(refreshToken);
    } catch {
      /* 没有 token 也视为登出成功 */
    }
    this.clearAuthCookies(res);
    return { message: '已退出登录' };
  }

  @Public()
  @Get('csrf')
  @ApiOperation({ summary: '获取 CSRF token（双提交 Cookie）' })
  csrfToken(@Res({ passthrough: true }) res: Response) {
    const token = this.csrf.issue();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 86_400_000,
    });
    return { csrfToken: token };
  }

  // -------------------------------------------------------------------------
  // GitHub OAuth
  // -------------------------------------------------------------------------

  @Public()
  @Get('github')
  @ApiOperation({ summary: '跳转到 GitHub OAuth 授权页' })
  async githubAuthorize(
    @Query('redirect_uri') redirectUri: string | undefined,
    @Res() res: Response,
  ) {
    if (!this.github.isOAuthConfigured) {
      throw new UnauthorizedException(
        '站点尚未配置 GitHub OAuth。请在服务端配置 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET 后重启。',
      );
    }
    const state = await this.auth.createOAuthState(
      this.resolveOAuthRedirect(redirectUri),
    );
    res.redirect(this.github.buildAuthorizeUrl(state));
  }

  @Public()
  @Get('github/callback')
  @ApiOperation({ summary: 'GitHub OAuth 回调' })
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new UnauthorizedException('GitHub 回调参数缺失');
    }
    const result = await this.auth.loginWithGithub(
      code,
      state,
      req.headers['user-agent'],
      req.ip,
    );

    const csrfToken = this.csrf.issue();
    this.setAuthCookies(res, result.refreshToken, csrfToken);

    // 桌面端 / 移动端通过 redirect_uri 回传 token；Web 端同时使用 Cookie + 前端存储
    const redirect = this.resolveOAuthRedirect(result.redirectUri);
    const tokenPayload = encodeURIComponent(
      Buffer.from(
        JSON.stringify({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        }),
      ).toString('base64'),
    );
    res.redirect(`${redirect}#token=${tokenPayload}`);
  }

  // -------------------------------------------------------------------------
  // 个人资料
  // -------------------------------------------------------------------------

  @Get('me')
  @ApiOperation({ summary: '获取当前登录用户资料' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: '更新个人资料' })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body()
    body: { displayName?: string; bio?: string; avatarUrl?: string; locale?: string },
  ) {
    return this.auth.updateProfile(user.id, body);
  }

  @Post('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改密码' })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    if (!body?.currentPassword || !body?.newPassword) {
      throw new UnauthorizedException('请填写当前密码与新密码');
    }
    if (body.newPassword.length < 8) {
      throw new UnauthorizedException('新密码至少 8 位');
    }
    await this.auth.changePassword(user.id, body.currentPassword, body.newPassword);
    return { message: '密码已更新，所有登录会话已失效' };
  }

  @Get('export')
  @ApiOperation({ summary: '导出个人全部数据 (JSON)' })
  exportData(@CurrentUser() user: AuthUser) {
    return this.auth.exportUserData(user.id);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '注销账号并删除全部个人数据' })
  async deleteAccount(
    @CurrentUser() user: AuthUser,
    @Body() body: { password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.deleteAccount(user.id, body?.password);
    this.clearAuthCookies(res);
    return { message: '账号及其全部数据已删除' };
  }

  // -------------------------------------------------------------------------

  private setAuthCookies(res: Response, refreshToken: string, csrfToken: string): void {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 86_400_000,
    });
    res.cookie(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 86_400_000,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    res.clearCookie(CSRF_COOKIE, { path: '/' });
  }

  private resolveOAuthRedirect(input?: string | null): string {
    const raw = input?.trim();
    if (!raw) return `${this.webOrigin}/`;

    if (raw.startsWith('/')) {
      return `${this.webOrigin}${sanitizeRedirect(raw)}`;
    }

    try {
      const url = new URL(raw);
      if (!this.allowedOAuthOrigins.has(url.origin)) return `${this.webOrigin}/`;
      url.hash = '';
      return url.toString();
    } catch {
      return `${this.webOrigin}/`;
    }
  }
}
