import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { decryptSecret, encryptSecret, randomToken, sha256 } from '../../common/utils/crypto.util';
import { GithubApiService } from '../github/github-api.service';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenTtl: string;
  private readonly refreshTokenDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly github: GithubApiService,
  ) {
    this.accessTokenTtl = this.config.get<string>('JWT_EXPIRES_IN', '7d');
    this.refreshTokenDays = Number(
      this.config.get<string>('REFRESH_TOKEN_TTL_DAYS', '30'),
    );
  }

  // -------------------------------------------------------------------------
  // 本地账号
  // -------------------------------------------------------------------------

  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<AuthResult> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      throw new BadRequestException('该邮箱已被注册');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: normalized, passwordHash, displayName },
    });

    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    // 无论用户是否存在都执行一次哈希比较，避免通过响应时间枚举账号
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const ok = await bcrypt.compare(password, hash);
    if (!user || !user.passwordHash || !ok) {
      throw new UnauthorizedException('邮箱或密码不正确');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('该账号已被停用');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.issueTokens(user);
  }

  // -------------------------------------------------------------------------
  // Token 管理
  // -------------------------------------------------------------------------

  async refresh(refreshToken: string, userAgent?: string, ip?: string): Promise<AuthResult> {
    const tokenHash = sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }
    if (!stored.user.isActive) {
      throw new UnauthorizedException('该账号已被停用');
    }

    // 轮换：旧的 refresh token 立即作废
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = stored.user;
    const result = await this.issueTokens(user, userAgent, ip);
    return result;
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    user: {
      id: string;
      email: string;
      role: string;
      displayName: string;
      isActive: boolean;
    },
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResult> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.accessTokenTtl as unknown as number,
    });

    const refreshToken = randomToken(48);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTokenDays * 86_400_000),
        userAgent: userAgent?.slice(0, 250),
        ipAddress: ip?.slice(0, 60),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirySeconds(this.accessTokenTtl),
    };
  }

  private parseExpirySeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 604_800;
    const value = Number(match[1]);
    const unit = match[2];
    const factor =
      unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86_400;
    return value * factor;
  }

  // -------------------------------------------------------------------------
  // GitHub OAuth
  // -------------------------------------------------------------------------

  /** 生成一次性 state 并落库，用于防止 OAuth CSRF */
  async createOAuthState(redirectUri?: string): Promise<string> {
    const state = randomBytes(24).toString('hex');
    await this.prisma.oAuthState.create({
      data: {
        state,
        provider: 'github',
        redirectUri,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });
    // 清理过期 state
    await this.prisma.oAuthState.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return state;
  }

  /** 校验并消费 state（一次性使用），返回登记的跳转地址 */
  async consumeOAuthState(state: string): Promise<string | null | undefined> {
    const record = await this.prisma.oAuthState.findUnique({ where: { state } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('OAuth state 校验失败，请重新发起登录');
    }
    await this.prisma.oAuthState.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return record.redirectUri;
  }

  async loginWithGithub(
    code: string,
    state: string,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResult & { isNewUser: boolean; redirectUri?: string | null }> {
    const redirectUri = await this.consumeOAuthState(state);

    const tokenResp = await this.github.exchangeCode(code);
    if (!tokenResp.access_token) {
      throw new UnauthorizedException(
        `GitHub 授权失败: ${tokenResp.error_description ?? tokenResp.error ?? '未知错误'}`,
      );
    }

    const profile = await this.github.fetchAuthenticatedUser(tokenResp.access_token);

    const linkedUserId = await this.findUserIdByGithubId(profile.id);
    let userId = linkedUserId;
    let isNewUser = false;

    if (!userId) {
      // 尝试用邮箱匹配已有本地账号，避免重复注册
      const email = `${profile.login}@users.noreply.github.com`;
      const byEmail = await this.prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        userId = byEmail.id;
      } else {
        const created = await this.prisma.user.create({
          data: {
            email,
            displayName: profile.name ?? profile.login,
            avatarUrl: profile.avatar_url,
            emailVerified: true,
          },
        });
        userId = created.id;
        isNewUser = true;
      }
    }

    const encryptionKey = this.config.get<string>('TOKEN_ENCRYPTION_KEY');
    await this.prisma.githubAccount.upsert({
      where: { userId },
      create: {
        userId,
        githubId: profile.id,
        login: profile.login,
        avatarUrl: profile.avatar_url,
        profileUrl: profile.html_url,
        accessTokenEnc: encryptionKey
          ? encryptSecret(tokenResp.access_token, encryptionKey)
          : null,
        scopes: tokenResp.scope ?? null,
        lastSyncedAt: new Date(),
      },
      update: {
        githubId: profile.id,
        login: profile.login,
        avatarUrl: profile.avatar_url,
        profileUrl: profile.html_url,
        accessTokenEnc: encryptionKey
          ? encryptSecret(tokenResp.access_token, encryptionKey)
          : undefined,
        scopes: tokenResp.scope ?? undefined,
        lastSyncedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const result = await this.issueTokens(user, userAgent, ip);
    return { ...result, isNewUser, redirectUri };
  }

  private async findUserIdByGithubId(githubId: number): Promise<string | null> {
    const record = await this.prisma.githubAccount.findFirst({
      where: { githubId },
      select: { userId: true },
    });
    return record?.userId ?? null;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        locale: true,
        createdAt: true,
        githubAccount: {
          select: {
            login: true,
            avatarUrl: true,
            profileUrl: true,
            lastSyncedAt: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('用户不存在');
    return user;
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string; avatarUrl?: string; locale?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        locale: true,
        createdAt: true,
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new BadRequestException('该账号使用 GitHub 登录，暂不支持密码修改');
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('当前密码不正确');

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
    });
    // 改密后使所有会话失效
    await this.revokeAll(userId);
  }

  /** 导出用户全部数据（GDPR 风格的数据可携带性） */
  async exportUserData(userId: string) {
    const [user, achievements, favorites, progress, account, feedback] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.userAchievement.findMany({
          where: { userId },
          include: { achievement: { select: { slug: true, nameEn: true, nameZh: true } } },
        }),
        this.prisma.userFavorite.findMany({
          where: { userId },
          include: { achievement: { select: { slug: true, nameEn: true, nameZh: true } } },
        }),
        this.prisma.userProgress.findMany({
          where: { userId },
          include: { achievement: { select: { slug: true, nameEn: true, nameZh: true } } },
        }),
        this.prisma.githubAccount.findUnique({
          where: { userId },
          select: {
            login: true,
            avatarUrl: true,
            profileUrl: true,
            scopes: true,
            createdAt: true,
            lastSyncedAt: true,
          },
        }),
        this.prisma.feedback.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            subject: true,
            content: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    if (!user) throw new UnauthorizedException('用户不存在');

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        role: user.role,
        locale: user.locale,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      githubAccount: account,
      userAchievements: achievements,
      favorites,
      progress,
      feedback,
    };
  }

  /** 删除用户账号及全部关联数据 */
  async deleteAccount(userId: string, password?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    if (user.passwordHash) {
      if (!password) throw new BadRequestException('请输入当前密码以确认删除');
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new UnauthorizedException('当前密码不正确');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    this.logger.log(`用户账号已删除: ${user.email}`);
  }
}

/** 用于消除计时侧信道的存在性检查哈希 */
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.5Y3qO1nJ7ZgP4tC3Jm5uQqXh5p2wZa';
