import { BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import type { ArticleSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ARTICLE_CATEGORY_META } from '@/lib/article-meta';

interface ArticleCardProps {
  article: ArticleSummary;
  className?: string;
  compact?: boolean;
}

export function ArticleCard({ article, className, compact }: ArticleCardProps) {
  const meta = ARTICLE_CATEGORY_META[article.category] ?? {
    label: '攻略',
    color: 'var(--color-accent)',
  };

  return (
    <Link
      href={`/guides/${article.slug}`}
      className={cn(
        'group flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      {article.coverImage && !compact && (
        <div className="mb-3 aspect-[16/9] overflow-hidden rounded-xl bg-[var(--color-surface-sunken)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span
          className="chip"
          style={{
            color: meta.color,
            borderColor: `color-mix(in oklab, ${meta.color} 40%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
          }}
        >
          {meta.label}
        </span>
        {article.featured && (
          <span className="chip border-[var(--color-warning)]/40 text-[var(--color-warning)]">
            推荐
          </span>
        )}
      </div>

      <h3 className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {article.titleZh}
      </h3>
      <p className="mt-1 truncate text-xs text-[var(--color-ink-subtle)]">{article.title}</p>

      {article.excerpt && !compact && (
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
          {article.excerpt}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-ink-subtle)]">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} />约 {article.readingTime} 分钟
        </span>
        <span className="inline-flex items-center gap-1">
          <BookOpen size={12} />
          {article.authorName}
        </span>
      </div>
    </Link>
  );
}
