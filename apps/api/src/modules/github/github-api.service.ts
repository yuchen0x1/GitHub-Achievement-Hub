import { HttpException, Injectable } from '@nestjs/common';
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
  private readonly minIntervalMs: number;
  private readonly timeoutMs: number;
  private lastRequestAt = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private pending = 0;
  private blockedUntil = 0;

  constructor(private readonly config: ConfigService) {
    this.minIntervalMs = this.readDuration('GITHUB_API_MIN_INTERVAL_MS', 220, 0, 5000);
    this.timeoutMs = this.readDuration('GITHUB_API_TIMEOUT_MS', 10000, 100, 30000);
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
      scope: 'read:user',
      state,
      allow_signup: 'true',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /** 用授权码换取 access token */
  async exchangeCode(code: string): Promise<GithubTokenResponse> {
    return this.requestJson<GithubTokenResponse>(
      'https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.config.get<string>('GITHUB_CLIENT_SECRET', ''),
          code,
          redirect_uri: this.callbackUrl,
        }),
      },
    );
  }

  async fetchAuthenticatedUser(token: string): Promise<GithubUserResponse> {
    return this.requestJson('https://api.github.com/user', {
      headers: this.headers(token),
    });
  }

  async fetchUser(login: string, token?: string): Promise<GithubUserResponse> {
    return this.requestJson(
      `https://api.github.com/users/${encodeURIComponent(login)}`,
      { headers: this.headers(this.config.get<string>('GITHUB_TOKEN') || token) },
      login,
    );
  }

  /** Keep the response contract without calling an undocumented /badges endpoint. */
  async fetchPublicBadges(
    _login: string,
    _token?: string,
  ): Promise<{ badges: GithubProfileBadge[]; limitations: string[] }> {
    return {
      badges: [],
      limitations: [
        'GitHub 官方 REST API 未提供 Profile Achievements 列表查询接口。',
        '勋章等级与解锁数量无法通过官方 API 查询。',
        '空列表表示数据不可用，不代表用户未获得任何勋章；请前往 GitHub 个人主页核对。',
      ],
    };
  }

  private headers(token?: string): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'GitHub-Achievement-Hub',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private readDuration(key: string, fallback: number, min: number, max: number): number {
    const value = Number(this.config.get<string>(key, String(fallback)));
    return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
  }

  /** Serialize the full request (including body), with bounded queue and timeout. */
  private async requestJson<T>(url: string, init: RequestInit, login?: string): Promise<T> {
    if (this.pending >= 32) {
      throw new HttpException('GitHub 查询繁忙，请稍后重试', 503);
    }
    this.pending++;
    const task = this.queue.then(async () => {
      if (this.blockedUntil > Date.now()) {
        throw new GithubRateLimitError(null, Math.ceil((this.blockedUntil - Date.now()) / 1000));
      }
      const delay = this.minIntervalMs - (Date.now() - this.lastRequestAt);
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      this.lastRequestAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (res.status === 404 && login) throw new GithubUserNotFoundError(login);
        // A plain 403 can be a permission failure. Inspect the documented headers
        // and secondary-rate-limit message before classifying it as quota exhaustion.
        const payload: unknown = await res.json().catch((error: unknown) => {
          if (res.ok) throw error;
          return null;
        });
        const message = payload && typeof payload === 'object' && 'message' in payload
          && typeof payload.message === 'string' ? payload.message : '';
        const remaining = res.headers.get('x-ratelimit-remaining');
        if (res.status === 429 || (res.status === 403 &&
            (remaining === '0' || res.headers.has('retry-after') || /rate limit/i.test(message)))) {
          const retry = Number(res.headers.get('retry-after'));
          const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
          const seconds = Number.isFinite(retry) && retry > 0 ? retry
            : remaining === '0' && reset > Date.now() ? Math.ceil((reset - Date.now()) / 1000) : 60;
          this.blockedUntil = Date.now() + seconds * 1000;
          throw new GithubRateLimitError(remaining, seconds);
        }
        if (!res.ok) throw new HttpException('GitHub 服务暂时不可用，请稍后重试', 502);
        return payload as T;
      } catch (error) {
        if (error instanceof HttpException || error instanceof GithubUserNotFoundError) throw error;
        throw new HttpException(
          controller.signal.aborted ? 'GitHub 请求超时，请稍后重试' : '无法读取 GitHub 响应，请稍后重试',
          controller.signal.aborted ? 504 : 502,
        );
      } finally {
        clearTimeout(timer);
      }
    });
    this.queue = task.catch(() => undefined);
    try { return await task; } finally { this.pending--; }
  }
}

export class GithubUserNotFoundError extends Error {
  constructor(public readonly login: string) {
    super(`GitHub 用户 "${login}" 不存在或不可公开访问`);
    this.name = 'GithubUserNotFoundError';
  }
}

export class GithubRateLimitError extends HttpException {
  constructor(
    public readonly remaining?: string | null,
    public readonly retryAfterSeconds: number = 60,
  ) {
    super({
      message: 'GitHub API 请求频率受限，请在等待时间结束后重试',
      error: 'GitHub Rate Limit',
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterSeconds)),
    }, 429);
  }
}
