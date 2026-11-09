'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  FileText,
  HelpCircle,
  Info,
  Languages,
  ListOrdered,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { AchievementDetail, SourceType } from '@/lib/types';
import { availabilityMeta } from '@/lib/tier';
import { cn, formatDate } from '@/lib/utils';
import { CredibilityBadge } from '@/components/achievement/credibility-badge';
import { TierLadder } from '@/components/achievement/tier-progress';
import { Notice } from '@/components/common/layout';
import { MarkdownViewer } from '@/components/markdown/markdown-viewer';
import { TierCalculator } from './tier-calculator';

type Locale = 'zh' | 'en';

interface DetailContentProps {
  detail: AchievementDetail;
}

/** 来源类型 → 中英文名称 */
const SOURCE_TYPE_LABELS: Record<SourceType, { zh: string; en: string }> = {
  OFFICIAL_DOC: { zh: '官方文档', en: 'Official Docs' },
  CHANGELOG: { zh: '更新日志', en: 'Changelog' },
  OFFICIAL_DISCUSSION: { zh: '官方讨论', en: 'Official Discussion' },
  COMMUNITY: { zh: '社区来源', en: 'Community' },
  COLLECTIVE_EVIDENCE: { zh: '社区共识证据', en: 'Collective Evidence' },
};

/** 来源状态 → 展示文案 */
const SOURCE_STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  ACTIVE: { zh: '有效', en: 'Active' },
  OUTDATED: { zh: '已过时', en: 'Outdated' },
  DISPUTED: { zh: '存在争议', en: 'Disputed' },
  BROKEN: { zh: '链接失效', en: 'Broken' },
};

function Section({
  id,
  step,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  step: number;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[var(--color-border)] pt-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-accent-soft)] text-xs font-bold text-[var(--color-accent)]">
          {step}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-5 pl-0 sm:pl-10">{children}</div>
    </section>
  );
}

/**
 * 勋章详情正文（客户端组件）。
 *
 * 统一 6 段式模板：介绍 → 解锁条件 → 详细获取教程 → 等级升级攻略 → 常见问题 → 资料来源。
 * 中英切换在本组件内用本地 state 实现，页面其余部分仍是服务端渲染。
 */
export function DetailContent({ detail }: DetailContentProps) {
  const [locale, setLocale] = useState<Locale>('zh');
  const zh = locale === 'zh';

  const meta = availabilityMeta(detail.availability);
  const tiers = [...detail.tiers].sort((a, b) => a.threshold - b.threshold);
  const hasTiers = detail.hasTiers || detail.isTiered || tiers.length > 0;

  const text = (zhText: string | null | undefined, enText: string | null | undefined) =>
    zh ? (zhText ?? '') : (enText ?? '');

  const emptyHint = zh
    ? '暂无官方说明。该条目在数据库中没有收录对应的官方文字，我们不会用推测内容填充它。'
    : 'No official description available. This entry has no official wording recorded in the database, and we will not fill it with speculation.';

  const derivedFaq: { q: string; a: string }[] = [
    {
      q: zh ? '这枚勋章现在还能获得吗？' : 'Is this achievement still obtainable?',
      a: zh
        ? `当前状态标记为「${meta.labelZh}」。${meta.description}`
        : `Currently marked as "${meta.label}". ${
            detail.availability === 'AVAILABLE' || detail.availability === 'TIERED'
              ? 'It can be unlocked through normal GitHub activity.'
              : 'It is not awarded through normal activity any more.'
          }`,
    },
    {
      q: zh ? '这些资料可靠吗？' : 'How reliable is this information?',
      a: zh
        ? `本页资料的可信度等级为 ${detail.credibility} 级。${
            detail.uncertaintyNote ? `备注：${detail.uncertaintyNote}` : ''
          }`.trim()
        : `The credibility grade of this page is ${detail.credibility}. ${
            detail.uncertaintyNote ? `Note: ${detail.uncertaintyNote}` : ''
          }`.trim(),
    },
    {
      q: zh ? '资料是什么时候核对的？' : 'When was this information last verified?',
      a: zh
        ? `最后核对时间：${formatDate(detail.verifiedAt)}；最近更新：${formatDate(detail.updatedAt)}。`
        : `Last verified: ${formatDate(detail.verifiedAt)}; last updated: ${formatDate(detail.updatedAt)}.`,
    },
  ];

  if (hasTiers) {
    derivedFaq.push({
      q: zh ? '等级门槛数值是官方公布的吗？' : 'Are the tier thresholds published by GitHub?',
      a: zh
        ? '不是。GitHub 官方至今没有公布分级成就的准确门槛数值，本站数值来自多个社区来源的一致记录，可信度按等级分别标注。'
        : 'No. GitHub has not published the exact thresholds for tiered achievements. The values here come from multiple consistent community sources, and each tier carries its own credibility grade.',
    });
  }

  return (
    <div className="space-y-10">
      {/* 语言切换 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
        <p className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <Languages size={14} />
          {zh ? '当前语言：中文' : 'Current language: English'}
        </p>
        <div
          className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
          role="group"
          aria-label="切换语言"
        >
          {(
            [
              { key: 'zh', label: '中文' },
              { key: 'en', label: 'English' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLocale(item.key)}
              aria-pressed={locale === item.key}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                locale === item.key
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. 介绍 */}
      <Section
        id="intro"
        step={1}
        eyebrow="Overview"
        title={zh ? '勋章介绍' : 'About this achievement'}
        description={
          zh
            ? '这枚勋章是什么、面向谁、GitHub 为什么把它放进成就体系。'
            : 'What this achievement is, who it is for, and why GitHub put it into the achievements system.'
        }
      >
        <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">
          {text(detail.descriptionZh, detail.descriptionEn) || emptyHint}
        </p>

        {text(detail.backgroundZh, detail.backgroundEn) && (
          <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              <ScrollText size={13} />
              {zh ? '背景说明' : 'Background'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
              {text(detail.backgroundZh, detail.backgroundEn)}
            </p>
          </div>
        )}
      </Section>

      {/* 2. 解锁条件 */}
      <Section
        id="condition"
        step={2}
        eyebrow={zh ? 'Requirements' : 'Requirements'}
        title={zh ? '解锁条件' : 'Unlock conditions'}
        description={
          zh
            ? '达到什么状态才会拿到这枚勋章。所有条件都标注了资料可信度。'
            : 'What you need to achieve to earn this badge. Every condition carries a credibility grade.'
        }
      >
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              {zh ? '官方条件' : 'Official condition'}
            </span>
            <CredibilityBadge grade={detail.credibility} />
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">
            {text(detail.conditionZh, detail.conditionEn) || emptyHint}
          </p>
        </div>

        {detail.requirements.length > 0 && (
          <div className="mt-5 space-y-3">
            {detail.requirements.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <h3 className="text-sm font-semibold">
                  {text(req.titleZh, req.title) || (zh ? '条件说明' : 'Condition')}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  {text(req.contentZh, req.content) || emptyHint}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 3. 详细获取教程 */}
      <Section
        id="how-to"
        step={3}
        eyebrow={zh ? 'Step-by-step' : 'Step-by-step'}
        title={zh ? '详细获取教程' : 'How to earn it'}
        description={
          zh
            ? '按顺序执行下面的步骤即可。每一步都来自站内已核实的资料，未收录的步骤我们不会替你编造。'
            : 'Follow the steps in order. Every step comes from verified material; we never invent the missing ones.'
        }
      >
        {detail.requirements.length === 0 ? (
          <Notice tone="info">
            {zh
              ? '这枚勋章目前没有收录分步教程。可以先查看通用获取攻略，或看看同分类下的其他勋章。'
              : 'No step-by-step guide is recorded for this achievement yet. You can read the general guides, or browse related achievements in the same category.'}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/guides" className="btn btn-secondary btn-sm">
                <BookOpen size={14} />
                {zh ? '查看通用攻略' : 'Browse guides'}
              </Link>
              {detail.category && (
                <Link
                  href={`/achievements?category=${detail.category.slug}`}
                  className="btn btn-secondary btn-sm"
                >
                  {zh ? '同分类勋章' : 'Same category'}
                </Link>
              )}
            </div>
          </Notice>
        ) : (
          <div className="space-y-6">
            {detail.requirements.map((req, index) => {
              const steps = Array.isArray(req.steps) ? req.steps : [];
              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip">
                      {zh ? `方案 ${index + 1}` : `Approach ${index + 1}`}
                    </span>
                    <h3 className="text-sm font-semibold">
                      {text(req.titleZh, req.title) || (zh ? '操作步骤' : 'Steps')}
                    </h3>
                  </div>

                  {text(req.contentZh, req.content) && (
                    <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                      {text(req.contentZh, req.content)}
                    </p>
                  )}

                  {steps.length > 0 ? (
                    <ol className="mt-4 space-y-2.5">
                      {steps.map((step, stepIndex) => (
                        <li key={`${req.id}-step-${stepIndex}`} className="flex gap-3">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-surface-sunken)] text-[11px] font-bold text-[var(--color-ink-muted)]">
                            {stepIndex + 1}
                          </span>
                          <span className="text-sm leading-relaxed text-[var(--color-ink)]">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--color-ink-subtle)]">
                      {zh
                        ? '该条目没有收录分步说明，请以本节的条件描述为准。'
                        : 'No individual steps are recorded for this entry — rely on the condition described above.'}
                    </p>
                  )}

                  {req.codeExample && (
                    <div className="mt-4">
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                        <FileText size={12} />
                        {zh ? '命令示例' : 'Command example'}
                      </p>
                      <div className="prose-gach">
                        <pre>
                          <code>{req.codeExample}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* 4. 等级升级攻略 */}
      <Section
        id="tiers"
        step={4}
        eyebrow="Tier ladder"
        title={zh ? '等级升级攻略' : 'Tier progression'}
        description={
          zh
            ? '分级勋章的每一级门槛，以及基于公开门槛数值的等级推算工具。'
            : 'The threshold of every tier, plus a calculator based on the published community thresholds.'
        }
      >
        {!hasTiers || tiers.length === 0 ? (
          <Notice tone="info">
            {zh
              ? '该勋章没有等级阶梯。GitHub 只对部分勋章设置了 Default → Bronze → Silver → Gold 的分级，其余勋章一次性解锁。'
              : 'This achievement has no tier ladder. GitHub only tiers a subset of achievements (Default → Bronze → Silver → Gold); the rest unlock in one go.'}
          </Notice>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                <ListOrdered size={13} />
                {zh ? '等级阶梯' : 'Tier ladder'}
              </p>
              <TierLadder tiers={tiers} />
            </div>

            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                <Sparkles size={13} />
                {zh ? '等级推算器' : 'Tier calculator'}
              </p>
              <TierCalculator tiers={tiers} />
            </div>
          </div>
        )}
      </Section>

      {/* 5. 常见问题 */}
      <Section
        id="faq"
        step={5}
        eyebrow="FAQ"
        title={zh ? '常见问题' : 'FAQ'}
        description={
          zh
            ? '围绕这枚勋章的高频疑问与专项解答。'
            : 'Common questions and dedicated answers about this achievement.'
        }
      >
        {detail.guides.length === 0 && (
          <Notice tone="info" className="mb-4">
            {zh
              ? '暂无针对该勋章的专项问答。你可以查看全站常见问题，或浏览获取攻略中的相关内容。'
              : 'There are no dedicated Q&A entries for this achievement yet. You can browse the site-wide FAQ or the guides section instead.'}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/faq" className="btn btn-secondary btn-sm">
                <HelpCircle size={14} />
                {zh ? '全站常见问题' : 'Site-wide FAQ'}
              </Link>
              <Link href="/guides" className="btn btn-secondary btn-sm">
                <BookOpen size={14} />
                {zh ? '获取攻略' : 'Guides'}
              </Link>
            </div>
          </Notice>
        )}

        <div className="space-y-2.5">
          {derivedFaq.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span>{item.q}</span>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-[var(--color-ink-subtle)] transition-transform group-open:rotate-180"
                  >
                    ▾
                  </span>
                </span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                {item.a}
              </p>
            </details>
          ))}

          {detail.guides.map((guide) => (
              <details
                key={guide.id}
                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      {text(guide.titleZh, guide.title)}
                      {guide.readingTime > 0 && (
                        <span className="ml-2 text-xs font-normal text-[var(--color-ink-subtle)]">
                          {zh ? `约 ${guide.readingTime} 分钟` : `~${guide.readingTime} min`}
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden
                      className="mt-0.5 shrink-0 text-[var(--color-ink-subtle)] transition-transform group-open:rotate-180"
                    >
                      ▾
                    </span>
                  </span>
                </summary>
                <div className="mt-3">
                  <MarkdownViewer
                    content={text(guide.contentZh, guide.content)}
                    className="text-sm"
                  />
                </div>
              </details>
            ))}
        </div>
      </Section>

      {/* 6. 资料来源 */}
      <Section
        id="sources"
        step={6}
        eyebrow="Sources"
        title={zh ? '资料来源' : 'Sources'}
        description={
          zh
            ? '本页每一条结论都可以在这里找到出处。点击来源名称可在新标签页打开原文。'
            : 'Every claim on this page can be traced back to a source. Click a source title to open the original page in a new tab.'
        }
      >
        {detail.sources.length === 0 ? (
          <Notice tone="warning">
            {zh
              ? '这枚勋章暂时没有登记资料来源，因此其条件与门槛的可靠性无法验证，请谨慎参考。'
              : 'No sources are recorded for this achievement, so its conditions and thresholds cannot be verified. Please treat them with caution.'}
          </Notice>
        ) : (
          <ul className="space-y-3">
            {detail.sources.map((source) => {
              const typeMeta = SOURCE_TYPE_LABELS[source.sourceType] ?? {
                zh: source.sourceType,
                en: source.sourceType,
              };
              const statusMeta = SOURCE_STATUS_LABELS[source.status] ?? {
                zh: source.status,
                en: source.status,
              };
              return (
                <li
                  key={source.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      <span>{source.title}</span>
                      <ExternalLink size={13} className="mt-1 shrink-0" />
                    </a>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="chip">{zh ? typeMeta.zh : typeMeta.en}</span>
                      <CredibilityBadge grade={source.credibility} />
                      <span className="chip">{zh ? statusMeta.zh : statusMeta.en}</span>
                    </div>
                  </div>

                  {source.isDisputed && (
                    <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-danger)]/40 bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--color-danger)]">
                      <AlertTriangle size={13} />
                      {zh
                        ? '存在争议：该来源与其他来源的结论不一致，请以多方交叉验证为准。'
                        : 'Disputed: this source disagrees with other sources. Cross-check before relying on it.'}
                    </p>
                  )}

                  {source.note && (
                    <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                      {source.note}
                    </p>
                  )}

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
                    <ShieldCheck size={12} />
                    {zh ? '验证日期' : 'Verified at'}：{formatDate(source.verifiedAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <Notice tone="info" className="mt-4">
          <span className="flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              {zh
                ? '所有门槛与条件都请以本页标注的可信度等级理解：A 级为官方确认，B 级为可复现实测，C 级为多源一致，D 级为待验证推测。'
                : 'Read every threshold through its credibility grade: A = officially confirmed, B = reproducible in practice, C = consistent across multiple sources, D = unverified inference.'}
            </span>
          </span>
        </Notice>
      </Section>
    </div>
  );
}
