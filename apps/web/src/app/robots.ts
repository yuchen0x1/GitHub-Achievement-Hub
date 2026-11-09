import type { MetadataRoute } from 'next';

const BASE = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** 静态导出要求元数据路由可静态生成；robots 内容只依赖环境变量。 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/collection', '/collection/', '/progress', '/progress/', '/api', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
