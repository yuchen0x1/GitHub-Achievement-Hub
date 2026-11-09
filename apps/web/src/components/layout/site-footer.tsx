import { Award, BookOpen, Code2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const COLUMNS = [
  {
    title: '勋章百科',
    links: [
      { href: '/achievements', label: '全部勋章' },
      { href: '/achievements/categories', label: '勋章分类' },
      { href: '/achievements/tiers', label: '等级阶梯' },
      { href: '/github-profile', label: '查询 GitHub 账号' },
    ],
  },
  {
    title: '学习中心',
    links: [
      { href: '/guides', label: '获取攻略' },
      { href: '/guides/github-getting-started', label: '新手入门' },
      { href: '/guides/achievement-earning-tips', label: '成就获取技巧' },
      { href: '/guides/achievement-troubleshooting', label: '异常排查' },
    ],
  },
  {
    title: '我的空间',
    links: [
      { href: '/collection', label: '勋章收藏馆' },
      { href: '/progress', label: '成就进度' },
      { href: '/login', label: '登录 / 注册' },
    ],
  },
  {
    title: '关于',
    links: [
      { href: '/about', label: '关于本站' },
      { href: '/faq', label: '常见问题' },
      {
        href: 'https://docs.github.com/en/account-and-profile/reference/profile-reference',
        label: 'GitHub 官方文档',
        external: true,
      },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-[var(--color-border)] bg-[var(--color-canvas-alt)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-accent)] text-white">
                <Award size={19} strokeWidth={2.4} />
              </span>
              <div className="leading-tight">
                <p className="text-[15px] font-bold">GitHub Achievement Hub</p>
                <p className="text-[11px] text-[var(--color-ink-subtle)]">
                  成就勋章百科与获取指南
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">
              一本持续更新的 GitHub 个人成就百科。每一条获取条件都标注了资料来源与可信度等级，
              区分「官方明确说明」与「社区实测」，不编造，也不夸大。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">
                <ShieldCheck size={12} /> 资料可溯源
              </span>
              <span className="chip">
                <BookOpen size={12} /> 12 篇系统攻略
              </span>
              <span className="chip">
                <Code2 size={12} /> 数据同步自 GitHub 官方 API
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {'external' in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-ink-subtle)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} GitHub Achievement Hub · 本站为非官方社区项目，与 GitHub, Inc. 无隶属关系。
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>GitHub 商标归 GitHub, Inc. 所有</span>
            <span>·</span>
            <span>资料遵循 GitHub 官方文档与公开实测</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
