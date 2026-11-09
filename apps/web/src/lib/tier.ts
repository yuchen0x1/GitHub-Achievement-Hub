import type { Availability, Credibility } from './types';
import { TIER_META, difficultyMeta } from '@gach/shared';

/**
 * 获取状态 → 展示文案 / 颜色 / 徽标
 * 前端统一从这里取文案，避免各页面各写一份导致口径不一致。
 */
export const AVAILABILITY_META: Record<
  Availability,
  { label: string; labelZh: string; color: string; dot: string; description: string }
> = {
  AVAILABLE: {
    label: 'Obtainable',
    labelZh: '当前可获取',
    color: '#3fb950',
    dot: 'bg-[var(--color-success)]',
    description: '通过正常的 GitHub 活动即可解锁。',
  },
  TIERED: {
    label: 'Tiered',
    labelZh: '等级型',
    color: '#58a6ff',
    dot: 'bg-[var(--color-accent)]',
    description: '随累计数量增长依次解锁 Default → Bronze → Silver → Gold。',
  },
  LIMITED: {
    label: 'Limited',
    labelZh: '历史限定',
    color: '#d29922',
    dot: 'bg-[var(--color-warning)]',
    description: '仅在特定活动窗口内发放，现已无法获得。',
  },
  DISCONTINUED: {
    label: 'Discontinued',
    labelZh: '已停止发放',
    color: '#8b949e',
    dot: 'bg-[var(--color-ink-subtle)]',
    description: 'GitHub 已停止发放，已获得的徽章仍会保留。',
  },
  TESTING: {
    label: 'Testing / Unclear',
    labelZh: '状态不明',
    color: '#a371f7',
    dot: 'bg-[var(--color-ink-muted)]',
    description: '公开资料无法确认当前是否仍可获得。',
  },
  INTERNAL: {
    label: 'Special / Internal',
    labelZh: '内部专属',
    color: '#db61a2',
    dot: 'bg-[#db61a2]',
    description: '仅通过特定身份或计划授予的专属勋章。',
  },
};

export function availabilityMeta(availability: Availability) {
  return AVAILABILITY_META[availability] ?? AVAILABILITY_META.AVAILABLE;
}

/** 可信度分级 → 展示文案 */
export const CREDIBILITY_LABELS: Record<Credibility, { label: string; color: string }> = {
  A: { label: 'A级 · 官方确认', color: '#3fb950' },
  B: { label: 'B级 · 可复现实测', color: '#58a6ff' },
  C: { label: 'C级 · 多源一致', color: '#d29922' },
  D: { label: 'D级 · 待验证推测', color: '#8b949e' },
};

export function credibilityLabel(grade: Credibility) {
  return CREDIBILITY_LABELS[grade] ?? CREDIBILITY_LABELS.D;
}

/** 难度分档 */
export function difficultyInfo(value: number) {
  return difficultyMeta(value);
}

/** 等级展示信息 */
export function tierMeta(level: keyof typeof TIER_META) {
  return TIER_META[level];
}

export const TIER_ORDER = ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'] as const;

/** 难度星级数组（用于渲染星星） */
export function difficultyStars(value: number): boolean[] {
  const v = Math.max(1, Math.min(5, Math.round(value)));
  return Array.from({ length: 5 }, (_, i) => i < v);
}
