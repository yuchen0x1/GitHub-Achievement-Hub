import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  BookMarked,
  CalendarCheck,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Info,
  Layers,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { CREDIBILITY_META } from '@gach/shared';
import { apiFetchSafe } from '@/lib/api';
import type { Credibility, SiteStats } from '@/lib/types';
import { CredibilityBadge } from '@/components/achievement/credibility-badge';
import { Container, Notice, PageHeader } from '@/components/common/layout';
import { SectionHeading } from '@/components/common/section-heading';
import { formatDate, formatNumber } from '@/lib/utils';

export const metadata: Metadata = {
  title: '关于本站',
  description:
    'GitHub Achievement Hub 是独立的非官方社区项目，与 GitHub, Inc. 无隶属关系。本页说明数据来源、可信度分级、更新机制、免责声明与技术栈。',
  alternates: { canonical: '/about' },
};

const CREDIBILITY_ORDER: Credibility[] = ['A', 'B', 'C', 'D'];

const CREDIBILITY_APPLIES: Record<Credibility, string> = {
  A: '适用于 GitHub 官方文档、官方 Changelog 中可以直接引用的原文结论。',
  B: '适用于有可复现步骤、截图或账号实证的社区实测结果。',
  C: '适用于多个独立可靠来源结论一致、但官方未明确表态的内容。',
  D: '仅作为线索记录，供进一步验证，不能作为唯一依据。',
};

const DATA_SOURCES = [
  {
    icon: FileText,
    title: 'GitHub 官方文档',
    description:
      '账号与个人资料、贡献设置、Issues / Pull Requests / Discussions / Actions 等功能的权威说明。可直接引用的结论标为 A 级。',
    href: 'https://docs.github.com/zh',
    hrefLabel: 'docs.github.com',
  },
  {
    icon: BookMarked,
    title: 'GitHub Changelog',
    description:
      '功能上线、调整与下线的一手公告。成就与相关功能的变化优先以此为准，避免使用过期教程。',
    href: 'https://github.blog/changelog/',
    hrefLabel: 'github.blog/changelog',
  },
  {
    icon: Users,
    title: '官方社区讨论',
    description:
      'GitHub Community 中官方员工的回复与讨论串。能确认的回答按 B 级记录，仅有用户观察的按 C 级记录。',
    href: 'https://github.com/orgs/community/discussions',
    hrefLabel: 'github.com/orgs/community',
  },
  {
    icon: GitBranch,
    title: '可复现的社区实测',
    description:
      '有明确步骤、时间线与证据的实测记录。单一实测不会写成定论；多源一致时才作为可参考的门槛数据。',
    href: 'https://docs.github.com/zh/account-and-profile',
    hrefLabel: '个人资料与成就说明',
  },
];

const TECH_STACK = [
  {
    name: 'Next.js',
    role: 'Web 前端框架，App Router + React Server Components，负责页面渲染与 SEO。',
  },
  {
    name: 'NestJS',
    role: 'API 服务框架，提供勋章、攻略、常见问题、统计与反馈等接口。',
  },
  {
    name: 'Prisma',
    role: '类型安全的数据库访问层，负责数据模型与查询。',
  },
  {
    name: 'PostgreSQL',
    role: '主数据库，存储勋章、等级、来源、攻略与用户数据。',
  },
  {
    name: 'Tauri',
    role: '桌面端外壳，复用同一套 Web 前端与 API。',
  },
  {
    name: 'Capacitor',
    role: '移动端外壳，把同一套界面打包为 iOS / Android 应用。',
  },
];

export default async function AboutPage() {
  // 站点统计一律从 API 读取（短缓存），页面不写死任何数字
  const stats = await apiFetchSafe<SiteStats>('/achievements/stats', {
    revalidate: 60,
  });

  const statCards = stats
    ? [
        { label: '收录勋章', value: formatNumber(stats.totalAchievements), hint: '已发布' },
        { label: '当前可获取', value: formatNumber(stats.obtainableAchievements), hint: '可正常获取与分级勋章' },
        { label: '攻略文章', value: formatNumber(stats.articleCount), hint: '已发布' },
        { label: '勋章分类', value: formatNumber(stats.categoryCount), hint: '启用中' },
        { label: '最近更新', value: formatDate(stats.lastUpdatedAt), hint: '资料变更' },
        { label: '最近校验', value: formatDate(stats.lastVerifiedAt), hint: '来源复核' },
      ]
    : [];

  return (
    <Container size="md" className="animate-fade-up space-y-10 py-8 sm:py-10">
      <PageHeader
        eyebrow="ABOUT THIS SITE"
        title="关于本站"
        description="GitHub Achievement Hub 是一个由社区维护的 GitHub 成就资料站：把散落在官方文档、Changelog 与社区讨论里的信息整理成可执行的攻略，并为每一条结论标注来源与可信度。"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/guides" className="btn btn-secondary btn-sm">
            <Sparkles size={14} />
            获取攻略
          </Link>
          <Link href="/achievements" className="btn btn-ghost btn-sm">
            <Layers size={14} />
            勋章图鉴
          </Link>
          <Link href="/faq" className="btn btn-ghost btn-sm">
            <Info size={14} />
            常见问题
          </Link>
        </div>
      </PageHeader>

      {/* 站点定位 */}
      <section className="space-y-4">
        <SectionHeading eyebrow="POSITIONING" title="站点定位" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="surface p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Info size={15} />
              独立社区项目
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              本站由爱好者自发维护，目标是降低理解 GitHub 成就机制的成本：把「这枚勋章怎么来的」「门槛是不是官方公布」讲清楚，而不是鼓励为了勋章去制造无意义的活动。
            </p>
          </div>
          <div className="surface p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle size={15} className="text-[var(--color-warning)]" />
              非官方声明
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              本站是<strong className="text-[var(--color-ink)]">非官方社区项目</strong>，
              与 GitHub, Inc. 没有任何隶属、合作或授权关系。站内所有解读、整理与评论仅代表本站编辑的判断。
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              需要账号、安全或计费方面的帮助时，请以 GitHub 官方支持渠道为准。
            </p>
          </div>
        </div>

        <Notice tone="warning">
          成就功能在 GitHub 官方文档中被标注为预览阶段，规则与展示形式可能随时调整。本站内容不能替代官方说明；当两者冲突时，以 GitHub 官方文档与你账号的实际表现为准。
        </Notice>
      </section>

      {/* 可信度分级 */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="CREDIBILITY"
          title="可信度分级体系"
          description="站内每一条条件、门槛与结论都会标注来源等级。分级只衡量「证据强度」，不代表本站对其正确性作出保证。"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {CREDIBILITY_ORDER.map((grade) => {
            const meta = CREDIBILITY_META[grade];
            return (
              <div
                key={grade}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <CredibilityBadge grade={grade} />
                  <span className="text-xs font-semibold text-[var(--color-ink-subtle)]">
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--color-ink)]">
                  {meta.description}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-subtle)]">
                  {CREDIBILITY_APPLIES[grade]}
                </p>
              </div>
            );
          })}
        </div>

        <Notice tone="warning">
          <span className="flex items-start gap-2">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <span>
              <strong>关于等级门槛的特别说明：</strong>
              GitHub 官方文档并未公布各成就的分级门槛数值，本站门槛为社区实测 / 多源一致的 C
              级数据。它们可以帮助你判断大概方向，但不能当作官方标准；请勿以「差一点达标」为由进行任何异常操作。
            </span>
          </span>
        </Notice>
      </section>

      {/* 数据来源 */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="SOURCES"
          title="数据来源"
          description="只收录可追溯到公开来源的信息。无法回溯的内容宁可不写，也不会用推测填空。"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {DATA_SOURCES.map((source) => {
            const Icon = source.icon;
            return (
              <div
                key={source.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Icon size={15} className="text-[var(--color-accent)]" />
                  {source.title}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                  {source.description}
                </p>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
                >
                  {source.hrefLabel}
                  <ExternalLink size={11} />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* 更新机制 */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="MAINTENANCE"
          title="更新机制"
          description="资料不是一次写完就结束：官方规则变化、社区出现新证据、读者反馈纠错，都会触发复核。"
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="surface p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <RefreshCw size={15} />
              定期校验
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              定期回查官方文档与 Changelog，确认功能状态、链接与说明是否仍然有效；失效来源会被替换或降级。
            </p>
          </div>
          <div className="surface p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CalendarCheck size={15} />
              人工复核
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              新增或修改的结论需经过编辑复核：核对原始来源、区分官方表述与社区观察，再决定可信度等级。
            </p>
          </div>
          <div className="surface p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Database size={15} />
              变更留痕
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              资料的更新与验证时间会记录在数据中，页面展示「更新时间 / 最近校验」；争议内容会标注争议状态。
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-[13px] text-[var(--color-ink-muted)]">
          发现错误？欢迎通过
          <Link href="/faq#feedback" className="mx-1 font-semibold text-[var(--color-accent)] hover:underline">
            反馈入口
          </Link>
          提交纠错。请附上页面链接与你的来源，编辑会优先处理有据可查的反馈。
        </div>
      </section>

      {/* 站点统计 */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="LIVE STATS"
          title="站点统计"
          description="以下数字实时取自本站 API 的数据库聚合，不使用任何预设或估算值。"
        />

        {stats ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <p className="text-xs text-[var(--color-ink-subtle)]">{card.label}</p>
                  <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-ink-subtle)]">{card.hint}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-ink-subtle)]">
              统计范围：已发布的勋章与攻略。数据缓存时间较短，刷新页面即可获取最新聚合结果。
            </p>
          </>
        ) : (
          <Notice tone="danger">
            站点统计暂时无法加载。请确认 API 服务（
            <code className="font-mono text-xs">localhost:4000</code>
            ）已启动。本页不会用写死的数字替代真实统计。
          </Notice>
        )}
      </section>

      {/* 免责与商标 */}
      <section className="space-y-4">
        <SectionHeading eyebrow="DISCLAIMER" title="免责声明与商标声明" />

        <div className="space-y-3">
          <div className="surface p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Scale size={15} />
              免责声明
            </p>
            <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              <li>
                本站内容仅供学习与参考，不构成任何形式的官方承诺、法律意见或账号操作建议。
              </li>
              <li>
                成就的授予条件、等级门槛与展示方式完全由 GitHub 决定，可能随时变化；本站不保证内容始终与线上一致。
              </li>
              <li>
                因参考本站内容而产生的任何账号、数据或权益影响，由使用者自行承担；如遇账号问题，请联系 GitHub 官方支持。
              </li>
              <li>
                本站不提供、也不鼓励任何刷取、批量注册、绕过平台安全审查或误导他人的做法；此类内容不会被收录。
              </li>
            </ul>
          </div>

          <div className="surface p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={15} />
              商标声明
            </p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              GitHub、GitHub 徽标及相关名称是 GitHub, Inc. 的商标或注册商标。本站对上述名称的使用仅用于指代相关产品与服务，属于描述性使用，不表示任何赞助、认可或关联。站内其他商标与产品名称归各自权利人所有。
            </p>
          </div>
        </div>
      </section>

      {/* 技术栈 */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="TECH STACK"
          title="技术栈"
          description="Web、API 与多端外壳共享同一套数据模型，减少不同端之间的信息偏差。"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TECH_STACK.map((tech) => (
            <div
              key={tech.name}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <p className="text-sm font-semibold">{tech.name}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {tech.role}
              </p>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
