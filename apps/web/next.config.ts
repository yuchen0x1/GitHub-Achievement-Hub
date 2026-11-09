import type { NextConfig } from 'next';

const API_INTERNAL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api/v1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 把构建模式暴露给客户端 bundle（客户端无法直接读取 NEXT_OUTPUT）。
  // 导出模式为 '1'，SSR 模式为 '0'；src/lib/export-mode.ts 据此判断。
  env: {
    NEXT_PUBLIC_EXPORT_MODE: process.env.NEXT_OUTPUT === 'export' ? '1' : '0',
  },
  // 桌面端（Tauri）与移动端（Capacitor）使用静态导出
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : undefined,
  trailingSlash: process.env.NEXT_OUTPUT === 'export',
  images: {
    // 静态导出场景下没有图片优化服务
    unoptimized: process.env.NEXT_OUTPUT === 'export',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.githubassets.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_INTERNAL}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
