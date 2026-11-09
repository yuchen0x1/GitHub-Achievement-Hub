import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GithubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export interface GithubUserResponse {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  type: string;
}

export interface GithubProfileBadge {
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

/**
 * GitHub 官方 API 客户端。
 *
 * 设计要点：
 * 1. 只读取公开资料，绝不读取私有仓库内容
 * 2. 主动遵守速率限制：请求之间保持最小间隔
 * 3. 明确区分"API 未提供"与"用户未获得"，绝不把两者混淆
 */
@Injectable()
export class GithubApiService {
  private readonly logger = new Logger(GithubApiService.name);
  private readonly minIntervalMs: number;
  private lastRequestAt = 0;

  constructor(private readonly config: ConfigService) {
    this.minIntervalMs = Number(
      this.config.get<string>('GITHUB_API_MIN_INTERVAL_MS', '220'),
    );
  }

  get isOAuthConfigured(): boolean {
    return Boolean(
      this.config.get<string>('GITHUB_CLIENT_ID') &&
        this.config.get<string>('GITHUB_CLIENT_SECRET'),
    );
  }

  get clientId(): string {
    return this.config.get<string>('GITHUB_CLIENT_ID', '');
  }

  get callbackUrl(): string {
    return this.config.get<string>(
      'GITHUB_CALLBACK_URL',
      'http://localhost:4000/api/v1/auth/github/callback',
    );
  }

  /** 构造 GitHub 授权跳转地址 */
  buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'read:user public_repo',
      state,
      allow_signup: 'true',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /** 用授权码换取 access token */
  async exchangeCode(code: string): Promise<GithubTokenResponse> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.config.get<string>('GITHUB_CLIENT_SECRET', ''),
        code,
        redirect_uri: this.callbackUrl,
      }),
    });
    if (!res.ok) {
      throw new Error(`GitHub token 交换失败: HTTP ${res.status}`);
    }
    return (await res.json()) as GithubTokenResponse;
  }

  /** 使用 access token 读取当前授权用户资料 */
  async fetchAuthenticatedUser(token: string): Promise<GithubUserResponse> {
    await this.throttle();
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'GitHub-Achievement-Hub',
      },
    });
    if (!res.ok) {
      throw new Error(`GitHub /user 接口异常: HTTP ${res.status}`);
    }
    return (await res.json()) as GithubUserResponse;
  }

  /** 读取公开用户资料 */
  async fetchUser(login: string, token?: string): Promise<GithubUserResponse> {
    await this.throttle();
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'GitHub-Achievement-Hub',
    };
    const serverToken = this.config.get<string>('GITHUB_TOKEN');
    if (serverToken) headers.Authorization = `Bearer ${serverToken}`;
    else if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(login)}`,
      { headers },
    );
    if (res.status === 404) {
      throw new GithubUserNotFoundError(login);
    }
    if (res.status === 403 || res.status === 429) {
      throw new GithubRateLimitError(res.headers.get('x-ratelimit-remaining'));
    }
    if (!res.ok) {
      throw new Error(`GitHub 用户接口异常: HTTP ${res.status}`);
    }
    return (await res.json()) as GithubUserResponse;
  }

  /**
   * 读取用户公开徽章。
   *
   * 重要说明：GitHub REST API 只暴露极少数"公开徽章"，
   * 并不提供 Profile Achievements 的完整列表与等级。
   * 因此这里只返回 API 真实提供的数据，其余在响应中标注为不可用。
   */
  async fetchPublicBadges(
    login: string,
    token?: string,
  ): Promise<{ badges: GithubProfileBadge[]; limitations: string[] }> {
    const limitations: string[] = [
      'GitHub REST API 未提供 Profile Achievements 的完整列表，仅公开部分徽章信息。',
      '勋章等级（Default/Bronze/Silver/Gold）与解锁数量无法通过官方 API 查询。',
      'GitHub 未公开"某用户是否已获得某枚勋章"的查询接口。',
    ];

    await this.throttle();
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'GitHub-Achievement-Hub',
    };
    const serverToken = this.config.get<string>('GITHUB_TOKEN');
    if (serverToken) headers.Authorization = `Bearer ${serverToken}`;
    else if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(login)}/badges`,
        { headers },
      );
      if (!res.ok) {
        this.logger.warn(`badges 接口返回 HTTP ${res.status}，返回空列表`);
        return { badges: [], limitations };
      }
      const raw = (await res.json()) as {
        id: number;
        slug?: string;
        name: string;
        description?: string | null;
        image_url?: string | null;
        badge_creator?: { login: string };
      }[];
      const badges = raw.map((b) => ({
        slug: b.slug ?? `badge-${b.id}`,
        name: b.name,
        description: b.description ?? null,
        imageUrl: b.image_url ?? null,
      }));
      return { badges, limitations };
    } catch (err) {
      this.logger.warn(`badges 接口请求失败: ${(err as Error).message}`);
      return { badges: [], limitations };
    }
  }

  /** 简单的请求节流，避免触发 GitHub 次级速率限制 */
  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
    }
    this.lastRequestAt = Date.now();
  }
}

export class GithubUserNotFoundError extends Error {
  constructor(public readonly login: string) {
    super(`GitHub 用户 "${login}" 不存在或不可公开访问`);
    this.name = 'GithubUserNotFoundError';
  }
}

export class GithubRateLimitError extends Error {
  constructor(public readonly remaining?: string | null) {
    super('GitHub API 请求频率受限，请稍后再试');
    this.name = 'GithubRateLimitError';
  }
}
