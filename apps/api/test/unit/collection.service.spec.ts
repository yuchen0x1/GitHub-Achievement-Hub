import { CollectionService } from '../../src/modules/collection/collection.service';

describe('Collection obtainable completion', () => {
  it.each([[2, 50], [0, 0]])('excludes discontinued badges with obtainable count %s', async (obtainable, completion) => {
    const findMany = jest.fn().mockImplementation(({ where }) => Promise.resolve(where.status === 'EARNED'
      ? ['AVAILABLE', 'DISCONTINUED', 'INTERNAL'].map((availability, i) => ({ achievementId: String(i), achievement: { availability, slug: String(i) } })) : []));
    const service = new CollectionService({
      userAchievement: { findMany },
      userFavorite: { findMany: jest.fn().mockResolvedValue([]) },
      achievement: { count: jest.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(obtainable) },
    } as never);
    const wall = await service.getWall('u1');
    expect(wall.stats.earnedCount).toBe(3);
    expect(wall.stats.earnedObtainableCount).toBe(1);
    expect(wall.stats.completionRate).toBe(completion);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1', status: 'EARNED', achievement: { status: 'PUBLISHED' } } }));
  });
});
