import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  CsrfService,
} from '../../src/common/services/csrf.service';

const TOKEN = 'Zx8kQ2mN4pR7sT1vW3yB6cD9eF0gH5jL';

/** 构造最小可用的 mock Request（只包含 CsrfService.verify 会读取的字段） */
function mockRequest(
  cookies: Record<string, string>,
  headers: Record<string, string | undefined>,
): Request {
  return { cookies, headers } as unknown as Request;
}

describe('CsrfService.verify', () => {
  const service = new CsrfService();

  it('既没有 cookie 也没有 header 时直接放行（原生客户端场景）', () => {
    expect(() => service.verify(mockRequest({}, {}))).not.toThrow();
  });

  it('没有 csrf cookie 时，即使 header 任意也放行', () => {
    expect(() =>
      service.verify(mockRequest({}, { [CSRF_HEADER]: 'anything' })),
    ).not.toThrow();
  });

  it('cookie 与 header 完全一致时放行', () => {
    expect(() =>
      service.verify(
        mockRequest({ [CSRF_COOKIE]: TOKEN }, { [CSRF_HEADER]: TOKEN }),
      ),
    ).not.toThrow();
  });

  it('cookie 存在但 header 缺失时抛出 UnauthorizedException', () => {
    expect(() =>
      service.verify(mockRequest({ [CSRF_COOKIE]: TOKEN }, {})),
    ).toThrow(UnauthorizedException);
  });

  it('cookie 存在但 header 不一致时抛出 UnauthorizedException', () => {
    expect(() =>
      service.verify(
        mockRequest(
          { [CSRF_COOKIE]: TOKEN },
          { [CSRF_HEADER]: `${TOKEN}-tampered` },
        ),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('cookie 存在但 header 长度不同（等长比较前置检查）时抛出 UnauthorizedException', () => {
    expect(() =>
      service.verify(
        mockRequest({ [CSRF_COOKIE]: TOKEN }, { [CSRF_HEADER]: 'short' }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('issue() 生成足够随机的 token，两次调用不重复', () => {
    const a = service.issue();
    const b = service.issue();
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(a).not.toBe(b);
  });
});
