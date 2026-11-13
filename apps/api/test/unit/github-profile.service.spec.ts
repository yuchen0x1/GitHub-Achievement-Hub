import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { GithubProfileService } from '../../src/modules/github/github-profile.service';
import { GithubController } from '../../src/modules/github/github.controller';
import { GithubRateLimitError, GithubUserNotFoundError } from '../../src/modules/github/github-api.service';

function setup() {
  const api = { fetchUser: jest.fn().mockResolvedValue({ login: 'octocat' }), fetchPublicBadges: jest.fn().mockResolvedValue({ badges: [], limitations: ['Unavailable'] }) };
  const prisma = { achievement: { findMany: jest.fn().mockResolvedValue([{ slug: 'pull-shark', nameEn: 'Pull Shark', availability: 'TIERED' }]) }, githubAccount: { updateMany: jest.fn() }, githubSyncLog: { create: jest.fn() } };
  const cache = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
  const service = new GithubProfileService(prisma as never, api as never, cache as never);
  return { service, api, cache, prisma, controller: new GithubController(service, prisma as never) };
}
describe('GitHub profile truth and request coalescing', () => {
  it('coalesces case-insensitive concurrent requests and leaves unverified badges unknown', async () => {
    const { service, api } = setup();
    const [a, b] = await Promise.all([service.getProfile('octocat'), service.getProfile('@Octocat')]);
    expect(api.fetchUser).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(a.achievementsOverview[0].status).toBe('UNKNOWN');
  });
  it('does not cache failures or retain a failed in-flight request', async () => {
    const { service, api, cache } = setup();
    api.fetchUser.mockRejectedValueOnce(new GithubUserNotFoundError('missing'));
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(cache.set).not.toHaveBeenCalled();
    await service.getProfile('missing');
    expect(api.fetchUser).toHaveBeenCalledTimes(2);
  });
  it('rejects invalid input before reading upstream', async () => {
    const { service, api } = setup();
    await expect(service.getProfile(undefined as never)).rejects.toBeInstanceOf(BadRequestException);
    expect(api.fetchUser).not.toHaveBeenCalled();
  });
  it('keeps rate limits typed so synchronization logs RATE_LIMITED', async () => {
    const { service, api, prisma } = setup();
    api.fetchUser.mockRejectedValue(new GithubRateLimitError('0', 60));
    expect((await service.syncForUser('u1', 'octocat')).status).toBe('RATE_LIMITED');
    expect(prisma.githubAccount.updateMany).not.toHaveBeenCalled();
    expect(prisma.githubSyncLog.create).toHaveBeenCalled();
  });
  it('validation never reports an outage as a nonexistent account', async () => {
    const { controller, api } = setup();
    api.fetchUser.mockRejectedValueOnce(new HttpException('unavailable', 502));
    await expect(controller.validate('octocat')).rejects.toMatchObject({ status: 502 });
    api.fetchUser.mockRejectedValueOnce(new GithubUserNotFoundError('missing'));
    await expect(controller.validate('missing')).resolves.toEqual({ valid: false });
  });
});
