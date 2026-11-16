/**
 * Parse a positive integer received from an HTTP query and keep it within a
 * predictable upper bound. Invalid, fractional, zero and negative values use
 * the caller supplied fallback instead of reaching Prisma as an invalid take
 * or skip value.
 */
export function boundedPositiveInt(
  value: unknown,
  fallback: number,
  max: number,
): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}
