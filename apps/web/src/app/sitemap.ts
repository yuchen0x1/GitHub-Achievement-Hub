import type { MetadataRoute } from 'next';
import { apiFetchSafe } from '@/lib/api';
import type { Achievement, ArticleSummary, Paginated } from '@/lib/types';

const BASE = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/**
 * 静态导出要求元数据路由可静态生成；sitemap 依赖的内容已通过
 * `apiFetchSafe` 降级，API 不可达时只输出静态路由。
 */
export const dynamic = 'force-static';

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/achievements', priority: 0.9, changeFrequency: 'daily' },
  { path: '/achievements/tiers', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/achievements/categories', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/guides', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/github-profile', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.4, changeFrequency: 'yearly' },
];

/**
 * 动态 sitemap：API 不可用时静默降级为静态路由，构建/运行都不会崩溃。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const [achievements, articles] = await Promise.all([
    apiFetchSafe<Paginated<Achievement>>('/achievements?pageSize=100', {
      revalidate: 3600,
    }),
    apiFetchSafe<Paginated<ArticleSummary>>('/articles?pageSize=100', {
      revalidate: 3600,
    }),
  ]);

  const seen = new Set<string>();

  for (const item of achievements?.items ?? []) {
    if (!item?.slug || seen.has(`a:${item.slug}`)) continue;
    seen.add(`a:${item.slug}`);
    entries.push({
      url: `${BASE}/achievements/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const item of articles?.items ?? []) {
    if (!item?.slug || seen.has(`g:${item.slug}`)) continue;
    seen.add(`g:${item.slug}`);
    entries.push({
      url: `${BASE}/guides/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
