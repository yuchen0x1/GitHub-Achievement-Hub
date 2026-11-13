import { ArticlesService } from '../../src/modules/articles/articles.service';
import type { PrismaService } from '../../src/prisma/prisma.service';
import type { CacheService } from '../../src/cache/cache.service';

describe('ArticlesService public and publish behavior', () => {
  const findMany = jest.fn();
  const count = jest.fn();
  const transaction = jest.fn();
  const findUnique = jest.fn();
  const create = jest.fn();
  const service = new ArticlesService(
    {
      article: { findMany, count, findUnique, create },
      $transaction: transaction,
    } as unknown as PrismaService,
    { delByPrefix: jest.fn() } as unknown as CacheService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not expose non-published articles when a status query is supplied', async () => {
    transaction.mockResolvedValue([[], 0]);

    await service.findAll({ status: 'DRAFT' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PUBLISHED' } }),
    );
    expect(count).toHaveBeenCalledWith({ where: { status: 'PUBLISHED' } });
  });

  it('does not assign a publish timestamp to a draft created without an explicit status', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: 'article-1', status: 'DRAFT', publishedAt: null });

    await service.create({
      title: 'Draft article',
      titleZh: '草稿',
      category: 'GETTING_STARTED',
      contentMd: 'Draft content',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT', publishedAt: null }),
      }),
    );
  });
});
