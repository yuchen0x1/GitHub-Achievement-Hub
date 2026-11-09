/** 统一分页响应 */
export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
