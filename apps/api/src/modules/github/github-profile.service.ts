import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  GithubApiService,
  GithubRateLimitError,
  GithubUserNotFoundError,
} from './github-api.service';
import type { GithubProfileResult } from '@gach/shared';

@Injectable()
export class GithubProfileService {
  private readonly logger = new Logger(GithubProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly api: GithubApiService,
    private readonly cache: CacheService,
  ) {}

  /**
   * 查询 GitHub 用户公开资料。
   *
   * 关键原则：
   * - GitHub 官方 API 并不提供 Profile Achievements 的完整数据，
   *   因此结果中明确区分「已确认获得」「数据不可用」「本站收录但状态未知」
   * - 绝不把"查不到"当成"未获得"
   */
  async getProfile(login: string): Promise<
    GithubProfileResult & {
      achievementsOverview: {
        slug: string;
        nameEn: string;
        nameZh: string;
        imageUrl: string | null;
        availability: string;
        isTiered: boolean;
        status: 'EARNED' | 'UNKNOWN' | 'NOT_AVAILABLE';
        reason?: string;
      }[];
      sourceNote: string;
    }
  > {
    const normalized = login.trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(normalized)) {
      throw new NotFoundException('GitHub 用户名格式不正确');
    }

    const cacheKey = `github:profile:${normalized.toLowerCase()}`;
    const cached = await this.cache.get<
      GithubProfileResult & { achievementsOverview: unknown[] }
    >(cacheKey);
    if (cached) return cached as never;

    let profile;
    let badges: Awaited<ReturnType<GithubApiService['fetchPublicBadges']>>;

    try {
      [profile, badges] = await Promise.all([
        this.api.fetchUser(normalized),
        this.api.fetchPublicBadges(normalized),
      ]);
    } catch (err) {
      if (err instanceof GithubUserNotFoundError) {
        throw new NotFoundException(
          `GitHub 用户 "${normalized}" 不存在，或其资料不可公开访问`,
        );
      }
      if (err instanceof GithubRateLimitError) {
        throw new NotFoundException(
          'GitHub API 请求频率受限，请稍后再试（未返回任何伪造数据）',
        );
      }
      throw err;
    }

    // 与本站勋章库对照
    const catalog = await this.prisma.achievement.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        nameEn: true,
        nameZh: true,
        imageUrl: true,
        availability: true,
        isTiered: true,
      },
      orderBy: { popularity: 'desc' },
    });

    // GitHub API 返回的徽章名 → 本站 slug 的映射（部分徽章可直接匹配）
    const badgeNameToSlug = new Map<string, string>();
    for (const b of badges.badges) {
      const slug = b.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      badgeNameToSlug.set(slug, slug);
      badgeNameToSlug.set(
        b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        slug,
      );
    }

    const achievementsOverview = catalog.map((a) => {
      const matched = badgeNameToSlug.get(
        a.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      );
      if (matched) {
        return {
          slug: a.slug,
          nameEn: a.nameEn,
          nameZh: a.nameZh,
          imageUrl: a.imageUrl,
          availability: a.availability,
          isTiered: a.isTiered,
          status: 'EARNED' as const,
        };
      }
      if (a.availability === 'DISCONTINUED' || a.availability === 'INTERNAL') {
        return {
          slug: a.slug,
          nameEn: a.nameEn,
          nameZh: a.nameZh,
          imageUrl: a.imageUrl,
          availability: a.availability,
          isTiered: a.isTiered,
          status: 'NOT_AVAILABLE' as const,
          reason: '该勋章已停止发放或仅限内部获取',
        };
      }
      return {
        slug: a.slug,
        nameEn: a.nameEn,
        nameZh: a.nameZh,
        imageUrl: a.imageUrl,
        availability: a.availability,
        isTiered: a.isTiered,
        status: 'UNKNOWN' as const,
        reason:
          'GitHub 官方 API 未公开该用户的成就数据，无法确认是否已获得（不代表未获得）',
      };
    });

    const result = {
      login: profile.login,
      id: profile.id,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      name: profile.name,
      bio: profile.bio,
      company: profile.company,
      location: profile.location,
      blog: profile.blog,
      publicRepos: profile.public_repos,
      publicGists: profile.public_gists,
      followers: profile.followers,
      following: profile.following,
      createdAt: profile.created_at,
      achievements: badges.badges,
      apiLimitations: badges.limitations,
      achievementsOverview,
      sourceNote:
        '本页数据来自 GitHub 官方公开 API。GitHub 未提供 Profile Achievements 的完整查询接口，' +
        '因此仅标记 API 明确返回的徽章为"已获得"，其余显示"数据不可用"。' +
        '如需精确追踪，请在「我的收藏馆」中手动记录。',
      fetchedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, 300);
    return result as never;
  }

  /** 查询并记录同步日志（用户绑定自己的 GitHub 账号时使用） */
  async syncForUser(userId: string, login: string) {
    const started = Date.now();
    let status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' = 'SUCCESS';
    let message = '';
    let itemsFound = 0;

    try {
      const result = await this.getProfile(login);
      itemsFound = result.achievements.length;
      await this.prisma.githubAccount.updateMany({
        where: { userId },
        data: { lastSyncedAt: new Date() },
      });
    } catch (err) {
      status = err instanceof GithubRateLimitError ? 'RATE_LIMITED' : 'FAILED';
      message = (err as Error).message;
    }

    await this.prisma.githubSyncLog.create({
      data: {
        userId,
        status,
        itemsFound,
        message,
        durationMs: Date.now() - started,
      },
    });

    return { status, itemsFound, message };
  }
}
