import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CircleHelp,
  Database,
  ShieldQuestion,
} from 'lucide-react';
import { Container, Notice, PageHeader } from '@/components/common/layout';
import { GithubSearchForm } from './search-form-client';

export const metadata: Metadata = {
  title: 'GitHub 成就查询',
  description:
    '查询任意公开 GitHub 账号的公开徽章与成就展示情况。GitHub 官方 API 不提供完整的成就数据，查不到的勋章一律标注「数据不可用」而非「未获得」。',
  alternates: { canonical: '/github-profile' },
};

export default function GithubProfileEntryPage() {
  return (
    <Container size="md" className="py-10 sm:py-14">
      <PageHeader
        eyebrow="账号查询"
        title="GitHub 成就查询"
        description="输入任意公开的 GitHub 用户名，查看该账号通过官方 API 暴露的公开徽章，并与本站收录的勋章库逐条对照。"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* 查询表单 */}
        <section className="surface relative overflow-hidden p-5 sm:p-7">
          <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <h2 className="text-base font-semibold text-[var(--color-ink)]">
              输入用户名
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              支持直接粘贴 <code className="font-mono text-xs">@octocat</code> 或
              GitHub 主页链接中的用户名。查询会在服务端携带站点配置的 GitHub
              Token 发起，因此登录后使用更稳定。
            </p>

            <div className="mt-5">
              <GithubSearchForm />
            </div>
          </div>
        </section>

        {/* 说明 */}
        <aside className="space-y-4">
          <div className="surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Database size={14} />
              数据从哪来
            </p>
            <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              <li>公开资料：GitHub REST API `GET /users/:username`</li>
              <li>公开徽章：同一接口返回的 `achievements` 字段（仅部分徽章）</li>
              <li>勋章对照：本站数据库中的已发布勋章目录</li>
            </ul>
          </div>

          <div className="surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <ShieldQuestion size={14} />
              查不到 ≠ 未获得
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
              本站在对照表中严格区分「已获得」「数据不可用」「已无法获取」三种状态，
              绝不会把 API 查不到的数据渲染成「未获得」。
            </p>
          </div>

          <Link href="/collection" className="btn btn-secondary w-full">
            手动记录我的勋章
            <ArrowRight size={14} />
          </Link>
        </aside>
      </div>

      {/* 必须显眼的限制说明 */}
      <section className="mt-8" aria-labelledby="api-limitations">
        <Notice tone="warning" className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
            <div>
              <h2 id="api-limitations" className="text-sm font-bold text-[var(--color-ink)]">
                重要：GitHub API 并不提供完整的个人成就数据
              </h2>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                <li>
                  GitHub REST API 只在 <code className="font-mono text-xs">/users/:username</code>{' '}
                  返回<strong className="text-[var(--color-ink)]">部分公开徽章</strong>
                  （<code className="font-mono text-xs">achievements</code> 字段）。
                </li>
                <li>
                  官方接口<strong className="text-[var(--color-ink)]">不提供完整的个人成就列表，也不提供等级（Default / Bronze / Silver / Gold）数据</strong>。
                </li>
                <li>
                  因此，凡是无法从 API 读取的勋章，本站一律标注
                  <span className="mx-1 inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-subtle)]">
                    <CircleHelp size={11} />
                    数据不可用
                  </span>
                  ，而不是「未获得」。
                </li>
                <li>
                  已停止发放或仅限内部的勋章会单独标注「已无法获取」，与「不可用」区分。
                </li>
                <li>
                  查询还可能受 GitHub API 速率限制影响（返回 429 / 限流提示），此时页面不会给出任何结论性数据。
                </li>
              </ul>
            </div>
          </div>
        </Notice>
      </section>
    </Container>
  );
}
