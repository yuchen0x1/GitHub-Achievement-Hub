import { ConfigService } from '@nestjs/config';
import { GithubApiService, GithubRateLimitError, GithubUserNotFoundError } from '../../src/modules/github/github-api.service';

const config = (values: Record<string, string> = {}) => ({
  get: (key: string, fallback?: string) => values[key] ?? fallback,
}) as ConfigService;
const reply = (status: number, body: unknown = {}, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });

describe('GitHub upstream boundaries', () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let service: GithubApiService;
  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
    service = new GithubApiService(config({ GITHUB_API_MIN_INTERVAL_MS: '0' }));
  });
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

  it('requests only read:user OAuth scope', () => {
    expect(new URL(service.buildAuthorizeUrl('state')).searchParams.get('scope')).toBe('read:user');
  });
  it('does not query an undocumented badges endpoint or invent badges', async () => {
    expect((await service.fetchPublicBadges('octocat')).badges).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('preserves a real missing user error', async () => {
    fetchMock.mockResolvedValue(reply(404));
    await expect(service.fetchUser('missing')).rejects.toBeInstanceOf(GithubUserNotFoundError);
  });
  it('honors Retry-After and avoids upstream traffic during cooldown', async () => {
    fetchMock.mockResolvedValue(reply(429, {}, { 'retry-after': '120' }));
    await expect(service.fetchUser('one')).rejects.toMatchObject({ retryAfterSeconds: 120 });
    await expect(service.fetchUser('two')).rejects.toBeInstanceOf(GithubRateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('uses quota reset time for exhausted primary limits', async () => {
    jest.useFakeTimers({ now: 100000 });
    fetchMock.mockResolvedValue(reply(403, {}, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '190' }));
    await expect(service.fetchUser('one')).rejects.toMatchObject({ retryAfterSeconds: 90 });
  });
  it('distinguishes ordinary forbidden responses from rate limits', async () => {
    fetchMock.mockResolvedValue(reply(403, { message: 'Forbidden' }));
    await expect(service.fetchUser('one')).rejects.toMatchObject({ status: 502 });
  });
  it('recognizes secondary limits without a remaining header', async () => {
    fetchMock.mockResolvedValue(reply(403, { message: 'You have exceeded a secondary rate limit.' }));
    await expect(service.fetchUser('one')).rejects.toMatchObject({ status: 429, retryAfterSeconds: 60 });
  });
  it('resumes after the cooldown expires', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValueOnce(reply(429, {}, { 'retry-after': '2' })).mockResolvedValueOnce(reply(200, { login: 'two' }));
    await expect(service.fetchUser('one')).rejects.toMatchObject({ status: 429 });
    await jest.advanceTimersByTimeAsync(2000);
    await expect(service.fetchUser('two')).resolves.toMatchObject({ login: 'two' });
  });
  it('serializes concurrent calls and releases the queue after failure', async () => {
    let release!: (value: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    fetchMock.mockResolvedValueOnce(reply(200, { login: 'two' }));
    const first = service.fetchUser('one').catch(error => error);
    const second = service.fetchUser('two');
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release(reply(500));
    expect(await first).toMatchObject({ status: 502 });
    await expect(second).resolves.toMatchObject({ login: 'two' });
  });
  it('aborts stalled responses and returns a timeout', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const result = service.fetchUser('slow').catch(error => error);
    await jest.advanceTimersByTimeAsync(10001);
    expect(await result).toMatchObject({ status: 504 });
  });
  it('does not expose upstream network details or credentials', async () => {
    fetchMock.mockRejectedValue(new Error('secret-token sensitive-network-details'));
    const error = await service.fetchUser('one').catch(error => error);
    expect(error.getResponse()).not.toContain('secret-token');
    expect(error.getStatus()).toBe(502);
  });
  it('preserves minimum spacing under concurrent load', async () => {
    jest.useFakeTimers();
    service = new GithubApiService(config({ GITHUB_API_MIN_INTERVAL_MS: '220' }));
    const starts: number[] = [];
    fetchMock.mockImplementation(async () => {
      starts.push(Date.now());
      return reply(200, { login: 'user' });
    });
    const requests = Promise.all([service.fetchUser('one'), service.fetchUser('two'), service.fetchUser('three')]);
    await jest.advanceTimersByTimeAsync(500);
    await requests;
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(220);
    expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(220);
  });
  it('bounds the queue and recovers capacity after completion', async () => {
    let release!: (value: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    fetchMock.mockImplementation(async () => reply(200, { login: 'user' }));
    const requests = Array.from({ length: 32 }, (_, i) => service.fetchUser(`user${i}`));
    await expect(service.fetchUser('overflow')).rejects.toMatchObject({ status: 503 });
    release(reply(200, { login: 'user' }));
    await Promise.all(requests);
    await expect(service.fetchUser('recovered')).resolves.toMatchObject({ login: 'user' });
  });
});
