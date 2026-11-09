import { computeTierProgress, type TierLevel } from '@gach/shared';

/**
 * Pull Shark 的四档门槛（来自种子数据，也是社区报告中唯一被反复验证的分级体系）：
 * DEFAULT 2 / BRONZE 16 / SILVER 128 / GOLD 1024
 */
const PULL_SHARK_TIERS: { level: TierLevel; threshold: number }[] = [
  { level: 'DEFAULT', threshold: 2 },
  { level: 'BRONZE', threshold: 16 },
  { level: 'SILVER', threshold: 128 },
  { level: 'GOLD', threshold: 1024 },
];

describe('computeTierProgress', () => {
  it('数量为 0 时：尚未达到任何等级，下一级为 DEFAULT，还差 2 个', () => {
    const result = computeTierProgress({
      tierThresholds: PULL_SHARK_TIERS,
      currentCount: 0,
    });

    expect(result.currentLevel).toBeNull();
    expect(result.nextLevel).toBe('DEFAULT');
    expect(result.remaining).toBe(2);
    expect(result.percent).toBe(0);
    expect(result.currentThreshold).toBeNull();
    expect(result.nextThreshold).toBe(2);
  });

  it('数量为 2 时：刚好达到 DEFAULT，下一级为 BRONZE', () => {
    const result = computeTierProgress({
      tierThresholds: PULL_SHARK_TIERS,
      currentCount: 2,
    });

    expect(result.currentLevel).toBe('DEFAULT');
    expect(result.nextLevel).toBe('BRONZE');
    expect(result.remaining).toBe(14);
    expect(result.currentThreshold).toBe(2);
    expect(result.nextThreshold).toBe(16);
    // 刚跨入 DEFAULT，本段进度为 0%
    expect(result.percent).toBe(0);
  });

  it('数量为 16 时：达到 BRONZE', () => {
    const result = computeTierProgress({
      tierThresholds: PULL_SHARK_TIERS,
      currentCount: 16,
    });

    expect(result.currentLevel).toBe('BRONZE');
    expect(result.nextLevel).toBe('SILVER');
    expect(result.remaining).toBe(112);
  });

  it('数量为 127 时：停在 BRONZE，距离 SILVER 还差 1 个，进度接近 100%', () => {
    const result = computeTierProgress({
      tierThresholds: PULL_SHARK_TIERS,
      currentCount: 127,
    });

    expect(result.currentLevel).toBe('BRONZE');
    expect(result.nextLevel).toBe('SILVER');
    expect(result.remaining).toBe(1);
    expect(result.percent).toBeGreaterThanOrEqual(99);
    expect(result.percent).toBeLessThan(100);
  });

  it('数量为 1024（满级）时：GOLD，无下一级，剩余为 null，进度 100%', () => {
    const result = computeTierProgress({
      tierThresholds: PULL_SHARK_TIERS,
      currentCount: 1024,
    });

    expect(result.currentLevel).toBe('GOLD');
    expect(result.nextLevel).toBeNull();
    expect(result.remaining).toBeNull();
    expect(result.percent).toBe(100);
    expect(result.currentThreshold).toBe(1024);
    expect(result.nextThreshold).toBeNull();
  });

  it('数量超过满级门槛时依然保持 GOLD / 100%', () => {
    const result = computeTierProgress({
      tierThresholds: PULL_SHARK_TIERS,
      currentCount: 5000,
    });

    expect(result.currentLevel).toBe('GOLD');
    expect(result.nextLevel).toBeNull();
    expect(result.remaining).toBeNull();
    expect(result.percent).toBe(100);
  });

  it('空的等级数组：全部返回 null / percent 为 0', () => {
    const result = computeTierProgress({ tierThresholds: [], currentCount: 42 });

    expect(result.currentLevel).toBeNull();
    expect(result.nextLevel).toBeNull();
    expect(result.remaining).toBeNull();
    expect(result.percent).toBe(0);
    expect(result.currentThreshold).toBeNull();
    expect(result.nextThreshold).toBeNull();
  });

  it('阈值乱序传入时结果与排序后一致，且不修改原数组', () => {
    const unsorted: { level: TierLevel; threshold: number }[] = [
      { level: 'GOLD', threshold: 1024 },
      { level: 'DEFAULT', threshold: 2 },
      { level: 'SILVER', threshold: 128 },
      { level: 'BRONZE', threshold: 16 },
    ];
    const snapshot = unsorted.map((t) => ({ ...t }));

    const fromUnsorted = computeTierProgress({
      tierThresholds: unsorted,
      currentCount: 127,
    });
    const fromSorted = computeTierProgress({
      tierThresholds: PULL_SHARK_TIERS,
      currentCount: 127,
    });

    expect(fromUnsorted).toEqual(fromSorted);
    // 原数组顺序不应被 sort 修改
    expect(unsorted).toEqual(snapshot);
  });
});
