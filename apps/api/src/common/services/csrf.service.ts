import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request } from 'express';

export const CSRF_COOKIE = 'gach_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/**
 * CSRF 防护（双提交 Cookie 模式）。
 *
 * 只对"依赖 Cookie 的写操作"生效：
 * 浏览器 Web 端使用 httpOnly refresh cookie，因此需要 CSRF token；
 * 桌面端 / 移动端通过 Authorization 头携带 token，不受 Cookie 影响，可跳过校验。
 */
@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);

  issue(): string {
    return randomBytes(24).toString('base64url');
  }

  /**
   * 校验请求的 CSRF token。
   * 若请求不携带 CSRF cookie（例如原生客户端使用 Authorization 头），则放行。
   */
  verify(request: Request): void {
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies ?? {};
    const cookieToken = cookies[CSRF_COOKIE];
    const headerToken = request.headers[CSRF_HEADER];

    if (!cookieToken) return; // 原生客户端场景，无 Cookie 即无 CSRF 风险

    if (
      typeof headerToken !== 'string' ||
      headerToken.length !== cookieToken.length ||
      !timingSafeEqualStrings(headerToken, cookieToken)
    ) {
      throw new UnauthorizedException('CSRF 校验失败，请刷新页面后重试');
    }
  }
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** 校验 refresh token 是否以 Bearer 方式由客户端显式提供 */
export function extractBearerRefresh(request: Request): string | undefined {
  const header = request.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    const value = header.slice(7).trim();
    // refresh token 是 64 位 base64url，明显长于 access token 的 JWT 结构
    if (value && value.split('.').length === 1 && value.length > 40) {
      return value;
    }
  }
  return undefined;
}

export function requireRefreshToken(request: Request): string {
  const fromHeader = extractBearerRefresh(request);
  if (fromHeader) return fromHeader;

  const body = request.body as { refreshToken?: string } | undefined;
  if (body?.refreshToken) return body.refreshToken;

  const cookies = (request as Request & { cookies?: Record<string, string> }).cookies ?? {};
  if (cookies['gach_refresh']) return cookies['gach_refresh'];

  throw new BadRequestException('缺少 refresh token');
}
