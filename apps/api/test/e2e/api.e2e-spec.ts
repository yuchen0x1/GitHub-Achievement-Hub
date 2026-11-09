import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import { createTestApp, destroyTestApp, type TestAppContext } from './test-app';

/**
 * e2e 测试（方案 B）：
 * 在测试进程内真实装配 AppModule，启动一份独立的 PGlite（55499 端口 / ./.pglite-test），
 * 执行 prisma db push + 种子数据，然后通过 supertest 直接访问 Nest 的 http server。
 *
 * 优点：不依赖外部正在运行的 API，数据完全隔离，可以真实回归鉴权 / CSRF / 越权等行为。
 */
const PREFIX = '/api/v1';
const url = (path: string): string => `${PREFIX}${path}`;

const ADMIN_EMAIL = 'admin@gach.local';
const ADMIN_PASSWORD = 'Admin@12345';

let context: TestAppContext;
let app: INestApplication;
let server: Parameters<typeof request>[0];

/** 从 Set-Cookie 响应头中取出指定 cookie 的值 */
function readCookie(res: Response, name: string): string {
  const raw = res.headers['set-cookie'];
  const list: string[] = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  for (const entry of list) {
    const [pair] = entry.split(';');
    const index = pair.indexOf('=');
    if (index === -1) continue;
    if (pair.slice(0, index).trim() === name) {
      return pair.slice(index + 1);
    }
  }
  throw new Error(`响应中缺少 cookie: ${name}（实际: ${list.join(' | ')}）`);
}

/** 完整走一次「拿 CSRF → 带 header 登录」流程，返回 access token */
async function loginWithCsrf(email: string, password: string): Promise<string> {
  const agent = request.agent(server);
  const csrfRes = await agent.get(url('/auth/csrf')).expect(200);
  const token = csrfRes.body.csrfToken as string;
  expect(typeof token).toBe('string');

  const loginRes = await agent
    .post(url('/auth/login'))
    .set('x-csrf-token', token)
    .send({ email, password })
    .expect(200);

  expect(loginRes.body.accessToken).toBeTruthy();
  return loginRes.body.accessToken as string;
}

function collectKeys(value: unknown, acc: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, acc);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      acc.add(key);
      collectKeys(child, acc);
    }
  }
  return acc;
}

beforeAll(async () => {
  context = await createTestApp();
  app = context.app;
  server = app.getHttpServer();
}, 180_000);

afterAll(async () => {
  await destroyTestApp(context);
}, 60_000);

describe('健康检查', () => {
  it('GET /health 返回 200 且数据库状态为 ok', async () => {
    const res = await request(server).get(url('/health')).expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('勋章百科（公开接口）', () => {
  it('GET /achievements/stats 返回结构与正数统计', async () => {
    const res = await request(server).get(url('/achievements/stats')).expect(200);

    expect(typeof res.body.totalAchievements).toBe('number');
    expect(res.body.totalAchievements).toBeGreaterThan(0);
    expect(typeof res.body.obtainableAchievements).toBe('number');
    expect(res.body.categoryCount).toBeGreaterThan(0);
    expect(res.body.articleCount).toBeGreaterThan(0);
  });

  it('GET /achievements?pageSize=5 分页生效', async () => {
    const res = await request(server)
      .get(url('/achievements'))
      .query({ pageSize: 5 })
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(5);
  });

  it('GET /achievements?availability=available 只返回可获取勋章', async () => {
    const res = await request(server)
      .get(url('/achievements'))
      .query({ availability: 'available', pageSize: 100 })
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
    for (const item of res.body.items) {
      expect(['AVAILABLE', 'TIERED']).toContain(item.availability);
    }
  });

  it('GET /achievements?tiered=true 不报 500 且全部为分级勋章（回归测试）', async () => {
    const res = await request(server)
      .get(url('/achievements'))
      .query({ tiered: 'true', pageSize: 100 })
      .expect(200);

    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.items.length).toBeGreaterThan(0);
    for (const item of res.body.items) {
      expect(item.isTiered).toBe(true);
    }
  });

  it('GET /achievements/pull-shark 返回四档等级与可信来源', async () => {
    const res = await request(server).get(url('/achievements/pull-shark')).expect(200);

    expect(res.body.slug).toBe('pull-shark');
    expect(res.body.tiers).toHaveLength(4);
    expect(res.body.tiers.map((t: { level: string }) => t.level)).toEqual([
      'DEFAULT',
      'BRONZE',
      'SILVER',
      'GOLD',
    ]);

    const thresholds = res.body.tiers.map((t: { threshold: number }) => t.threshold);
    for (let i = 1; i < thresholds.length; i += 1) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }

    expect(Array.isArray(res.body.sources)).toBe(true);
    expect(res.body.sources.length).toBeGreaterThan(0);
    for (const source of res.body.sources) {
      expect(['A', 'B', 'C', 'D']).toContain(source.credibility);
    }
  });

  it('GET /achievements/not-exist-xxx 返回 404', async () => {
    const res = await request(server).get(url('/achievements/not-exist-xxx')).expect(404);

    expect(res.body.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /achievements/categories 返回 7 个分类，聚合分类数量大于 0', async () => {
    const res = await request(server).get(url('/achievements/categories')).expect(200);

    expect(res.body).toHaveLength(7);
    for (const category of res.body) {
      expect(typeof category.achievementCount).toBe('number');
      expect(category.achievementCount).toBeGreaterThanOrEqual(0);
    }

    const obtainable = res.body.find(
      (c: { slug: string }) => c.slug === 'currently-obtainable',
    );
    expect(obtainable).toBeDefined();
    expect(obtainable.achievementCount).toBeGreaterThan(0);
  });
});

describe('攻略 / FAQ / 搜索（公开接口）', () => {
  it('GET /articles?pageSize=3 分页与总数正确', async () => {
    const res = await request(server)
      .get(url('/articles'))
      .query({ pageSize: 3 })
      .expect(200);

    expect(res.body.items).toHaveLength(3);
    expect(res.body.total).toBe(12);
    expect(res.body.page).toBe(1);
  });

  it('GET /articles/github-getting-started 返回正文与目录', async () => {
    const res = await request(server)
      .get(url('/articles/github-getting-started'))
      .expect(200);

    expect(typeof res.body.contentMd).toBe('string');
    expect(res.body.contentMd.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.toc)).toBe(true);
    expect(res.body.toc.length).toBeGreaterThan(0);
    for (const item of res.body.toc) {
      expect(typeof item.id).toBe('string');
      expect(typeof item.text).toBe('string');
      expect(item.level).toBeGreaterThanOrEqual(2);
    }
  });

  it('GET /faq 返回 12 条中英文问题', async () => {
    const res = await request(server).get(url('/faq')).expect(200);

    expect(res.body).toHaveLength(12);
    for (const faq of res.body) {
      expect(typeof faq.questionZh).toBe('string');
      expect(faq.questionZh.length).toBeGreaterThan(0);
      expect(typeof faq.answerZh).toBe('string');
      expect(faq.answerZh.length).toBeGreaterThan(0);
    }
  });

  it('GET /search?q=starstruck 命中 Starstruck', async () => {
    const res = await request(server)
      .get(url('/search'))
      .query({ q: 'starstruck' })
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.map((i: { slug: string }) => i.slug)).toContain('starstruck');
  });
});

describe('鉴权与安全', () => {
  it('GET /collection/favorites 不带 token 返回 401', async () => {
    const res = await request(server).get(url('/collection/favorites')).expect(401);

    expect(res.body.statusCode).toBe(401);
  });

  it('POST /auth/login 携带 csrf cookie 但不带 header 时被拒绝（401）', async () => {
    // 先拿到 csrf cookie（模拟浏览器已持有 cookie），随后只发 cookie、不发 header
    const csrfRes = await request(server).get(url('/auth/csrf')).expect(200);
    const csrfCookie = readCookie(csrfRes, 'gach_csrf');
    expect(csrfCookie.length).toBeGreaterThan(0);

    const res = await request(server)
      .post(url('/auth/login'))
      .set('Cookie', `gach_csrf=${csrfCookie}`)
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh 携带 csrf cookie 但不带 header 时被拒绝（CSRF 机制本身有效）', async () => {
    const csrfRes = await request(server).get(url('/auth/csrf')).expect(200);
    const csrfCookie = readCookie(csrfRes, 'gach_csrf');

    const res = await request(server)
      .post(url('/auth/refresh'))
      .set('Cookie', `gach_csrf=${csrfCookie}`)
      .send({});

    expect(res.status).toBe(401);
  });

  it('GET /auth/csrf + POST /auth/login（带 header）登录成功并返回 accessToken', async () => {
    const agent = request.agent(server);
    const csrfRes = await agent.get(url('/auth/csrf')).expect(200);
    expect(typeof csrfRes.body.csrfToken).toBe('string');
    // csrf cookie 必须是可被前端读取的非 httpOnly cookie（双提交模式）
    const csrfCookie = readCookie(csrfRes, 'gach_csrf');
    expect(csrfCookie).toBe(csrfRes.body.csrfToken);

    const loginRes = await agent
      .post(url('/auth/login'))
      .set('x-csrf-token', csrfRes.body.csrfToken)
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);

    expect(typeof loginRes.body.accessToken).toBe('string');
    expect(loginRes.body.accessToken.length).toBeGreaterThan(20);
    expect(loginRes.body.user.email).toBe(ADMIN_EMAIL);
    expect(loginRes.body.user.role).toBe('ADMIN');
  });

  it('普通 USER 角色访问 GET /admin/dashboard 返回 403', async () => {
    const email = `e2e-user-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

    const registerRes = await request(server)
      .post(url('/auth/register'))
      .send({ email, password: 'User@12345', displayName: 'E2E 普通用户' })
      .expect(201);

    expect(registerRes.body.user.role).toBe('USER');
    const userToken = registerRes.body.accessToken as string;

    const res = await request(server)
      .get(url('/admin/dashboard'))
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    expect(res.body.statusCode).toBe(403);
  });

  it('GET /auth/me 不泄露 passwordHash / refreshTokenHash 等敏感字段', async () => {
    const adminToken = await loginWithCsrf(ADMIN_EMAIL, ADMIN_PASSWORD);

    const res = await request(server)
      .get(url('/auth/me'))
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const keys = collectKeys(res.body);
    for (const forbidden of [
      'passwordHash',
      'refreshTokenHash',
      'refreshToken',
      'tokenHash',
      'accessTokenEnc',
      'twoFactorSecret',
    ]) {
      expect(keys.has(forbidden)).toBe(false);
    }

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('refreshTokenHash');
    expect(serialized).not.toContain('$2a$');
    expect(serialized).not.toContain('$2b$');
  });
});
