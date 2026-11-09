'use client';

import { Pagination } from '@/components/common/pagination';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  /** 当前生效的筛选参数（不含 page），由服务端组件传入 */
  query: Record<string, string>;
}

/**
 * 分页链接生成器。
 * 必须原样保留所有筛选参数，只替换 page，否则翻页会丢失筛选条件。
 */
export function PaginationBar({ page, totalPages, query }: PaginationBarProps) {
  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    if (target > 1) params.set('page', String(target));
    else params.delete('page');

    const search = params.toString();
    return search ? `/achievements?${search}` : '/achievements';
  };

  return <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />;
}
