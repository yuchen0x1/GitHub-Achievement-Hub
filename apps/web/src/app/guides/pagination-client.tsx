'use client';

import { Pagination } from '@/components/common/pagination';

interface GuidesPaginationProps {
  page: number;
  totalPages: number;
  /** 当前生效的筛选参数（不含 page），由服务端组件传入 */
  category?: string;
}

/**
 * 攻略列表分页。
 * buildHref 必须是客户端函数，因此用这个薄包装把筛选条件带进分页链接。
 */
export function GuidesPagination({ page, totalPages, category }: GuidesPaginationProps) {
  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (target > 1) params.set('page', String(target));

    const search = params.toString();
    return search ? `/guides?${search}` : '/guides';
  };

  return <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />;
}
