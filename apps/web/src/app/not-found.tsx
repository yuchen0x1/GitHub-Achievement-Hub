import Link from 'next/link';
import { ArrowLeft, Compass, Search } from 'lucide-react';
import { Container } from '@/components/common/layout';

/** 全站 404 —— 勋章 slug 不存在、页面路径错误时展示 */
export default function NotFound() {
  return (
    <Container size="md" className="py-20 sm:py-28">
      <div className="surface flex flex-col items-center px-6 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          404 · Not Found
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          没有找到这个页面
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-ink-muted)]">
          这个地址对应的勋章或攻略不存在，可能已经被改名、合并，或者从来就没有收录过。
          你可以回到勋章图鉴重新查找，或者直接使用站内搜索。
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Link href="/achievements" className="btn btn-primary">
            <Compass size={15} />
            浏览勋章图鉴
          </Link>
          <Link href="/search" className="btn btn-secondary">
            <Search size={15} />
            站内搜索
          </Link>
          <Link href="/" className="btn btn-ghost">
            <ArrowLeft size={15} />
            返回首页
          </Link>
        </div>
      </div>
    </Container>
  );
}
