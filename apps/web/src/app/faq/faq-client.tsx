'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  Loader2,
  MessageSquarePlus,
  Search,
  Send,
  ShieldQuestion,
  X,
} from 'lucide-react';
import type { FaqItem } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Notice } from '@/components/common/layout';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';

const FAQ_CATEGORY_META: Record<string, { label: string; description: string }> = {
  basics: {
    label: '基础概念',
    description: '成就机制、显示位置与常见误区。',
  },
  contributing: {
    label: '贡献与社区',
    description: '怎样的贡献会被认可，以及如何参与开源。',
  },
  rules: {
    label: '规则与边界',
    description: '哪些做法不可取，以及我们拒绝收录的内容。',
  },
  trust: {
    label: '可信度与数据',
    description: '本站资料从哪来、可信到什么程度。',
  },
  troubleshooting: {
    label: '异常排查',
    description: '勋章未出现、同步延迟等问题的处理。',
  },
  api: {
    label: '账号与接口',
    description: 'GitHub API 的限制与数据读取边界。',
  },
};

const FAQ_CATEGORY_ORDER = [
  'basics',
  'contributing',
  'rules',
  'trust',
  'troubleshooting',
  'api',
];

function categoryMeta(key: string) {
  return (
    FAQ_CATEGORY_META[key] ?? {
      label: '其他问题',
      description: '其他与本站相关的说明。',
    }
  );
}

interface FaqClientProps {
  items: FaqItem[];
}

export function FaqClient({ items }: FaqClientProps) {
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(items[0] ? [items[0].id] : []),
  );

  const keyword = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const matched = items.filter((item) => {
      if (!keyword) return true;
      const label = categoryMeta(item.category).label;
      return [item.questionZh, item.question, item.answerZh, item.answer, label]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });

    const extraCategories = Array.from(
      new Set(items.map((item) => item.category)),
    ).filter((key) => !FAQ_CATEGORY_ORDER.includes(key));

    return [...FAQ_CATEGORY_ORDER, ...extraCategories]
      .map((key) => ({
        key,
        meta: categoryMeta(key),
        entries: matched.filter((item) => item.category === key),
      }))
      .filter((group) => group.entries.length > 0);
  }, [items, keyword]);

  const matchCount = groups.reduce((sum, group) => sum + group.entries.length, 0);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      {/* 搜索 */}
      <div className="surface p-4 sm:p-5">
        <label htmlFor="faq-search" className="text-sm font-semibold">
          搜索问题或答案
        </label>
        <div className="relative mt-2.5">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
            aria-hidden
          />
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：勋章什么时候出现、等级门槛、可信度"
            className="field pl-9 pr-9"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[var(--color-ink-subtle)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]"
              aria-label="清空搜索"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]" aria-live="polite">
          {keyword
            ? `匹配到 ${matchCount} 条问题`
            : `共 ${items.length} 条问题，按主题分组展示`}
        </p>
      </div>

      {items.length === 0 && (
        <EmptyState
          title="常见问题暂时无法加载"
          description="API 服务可能尚未启动或暂时不可用。你仍可以通过下方入口查看本站说明，或直接提交反馈。"
          icon={<HelpCircle size={22} />}
          action={{ label: '查看关于本站', href: '/about' }}
        />
      )}

      {items.length > 0 && groups.length === 0 && (
        <EmptyState
          title="没有匹配的问题"
          description={`关键词「${query.trim()}」没有命中任何问题或答案。可以换个说法，或直接提交反馈，我们会补充对应的解答。`}
          action={{ label: '提交反馈', href: '#feedback' }}
        />
      )}

      {/* 分组折叠面板 */}
      {groups.map((group) => (
        <section key={group.key} className="space-y-3" aria-labelledby={`faq-group-${group.key}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2
                id={`faq-group-${group.key}`}
                className="text-base font-bold tracking-tight"
              >
                {group.meta.label}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-ink-subtle)]">
                {group.meta.description}
              </p>
            </div>
            <span className="text-xs tabular-nums text-[var(--color-ink-subtle)]">
              {group.entries.length} 条
            </span>
          </div>

          <div className="space-y-2">
            {group.entries.map((item) => {
              const open = openIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-border-strong)]"
                >
                  <h3>
                    <button
                      type="button"
                      id={`faq-btn-${item.id}`}
                      aria-expanded={open}
                      aria-controls={`faq-panel-${item.id}`}
                      onClick={() => toggle(item.id)}
                      className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
                    >
                      <span className="text-sm font-semibold leading-relaxed">
                        {item.questionZh}
                      </span>
                      <ChevronDown
                        size={16}
                        aria-hidden
                        className={cn(
                          'mt-0.5 shrink-0 text-[var(--color-ink-subtle)] transition-transform duration-200',
                          open && 'rotate-180',
                        )}
                      />
                    </button>
                  </h3>

                  <div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${item.id}`}
                    aria-hidden={!open}
                    inert={!open}
                    className={cn(
                      'grid transition-[grid-template-rows] duration-300 ease-out',
                      open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-[var(--color-border)] px-4 py-3.5">
                        <p className="whitespace-pre-line text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
                          {item.answerZh}
                        </p>
                        <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
                          {item.question}
                        </p>
                        {item.answer && (
                          <details className="mt-2.5">
                            <summary className="cursor-pointer text-xs font-medium text-[var(--color-accent)]">
                              English answer
                            </summary>
                            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[var(--color-ink-muted)]">
                              {item.answer}
                            </p>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* 没找到答案 */}
      <section id="feedback" className="scroll-mt-24 space-y-4 border-t border-[var(--color-border)] pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            STILL STUCK
          </p>
          <h2 className="section-title mt-1.5">没找到答案？</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
            先看本站的方法与数据说明；如果你确认页面内容有误，或希望补充一个问题，请通过下方表单反馈。我们只处理与本站资料、站点功能相关的问题，不提供账号找回或 GitHub 支持服务。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/about"
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-border-strong)]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold group-hover:text-[var(--color-accent)]">
              <ShieldQuestion size={15} />
              可信度与数据来源
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-[var(--color-ink-subtle)]">
              了解 A/B/C/D 分级、更新机制与免责声明。
            </span>
          </Link>

          <a
            href="https://docs.github.com/zh"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-border-strong)]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold group-hover:text-[var(--color-accent)]">
              <BookOpen size={15} />
              GitHub 官方文档
              <ExternalLink size={12} className="text-[var(--color-ink-subtle)]" />
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-[var(--color-ink-subtle)]">
              账号、个人资料与成就相关的一手说明。
            </span>
          </a>

          <a
            href="#feedback-form"
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-border-strong)]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold group-hover:text-[var(--color-accent)]">
              <MessageSquarePlus size={15} />
              提交反馈
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-[var(--color-ink-subtle)]">
              纠错、提问或建议，登录后直接提交。
            </span>
          </a>
        </div>

        <div id="feedback-form" className="scroll-mt-24">
          <FeedbackForm />
        </div>
      </section>
    </div>
  );
}

const FEEDBACK_TYPES: { value: string; label: string }[] = [
  { value: 'CORRECTION', label: '内容纠错' },
  { value: 'QUESTION', label: '内容提问' },
  { value: 'SUGGESTION', label: '功能建议' },
  { value: 'BUG', label: '站点 Bug' },
  { value: 'OTHER', label: '其他' },
];

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

function FeedbackForm() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [type, setType] = useState('CORRECTION');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  if (!user) {
    return (
      <div className="surface p-5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquarePlus size={15} />
          提交反馈
        </p>
        <div className="mt-3">
          <Notice tone="info">
            提交反馈前需要先登录，这样才能在「我的反馈」里追踪处理进度，也方便我们在需要时向你核实细节。
          </Notice>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/login" className="btn btn-primary btn-sm">
            去登录
          </Link>
          <Link href="/about" className="btn btn-secondary btn-sm">
            先看关于本站
          </Link>
          <span className="text-xs text-[var(--color-ink-subtle)]">
            本站不会公开展示你的邮箱。
          </span>
        </div>
      </div>
    );
  }

  const submitting = state.status === 'submitting';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedSubject = subject.trim();
    const trimmedContent = content.trim();

    if (!trimmedSubject || !trimmedContent) {
      setState({ status: 'error', message: '请填写反馈主题与具体内容。' });
      return;
    }

    setState({ status: 'submitting' });

    try {
      const result = await apiFetch<{ id: string; message: string }>('/feedback', {
        method: 'POST',
        token: accessToken,
        body: {
          type,
          subject: trimmedSubject,
          content: trimmedContent,
          email: user?.email,
        },
      });

      setState({
        status: 'success',
        message: result.message || '反馈已提交，感谢你的支持。',
      });
      setSubject('');
      setContent('');
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof Error && error.message
            ? error.message
            : '提交失败，请稍后重试。',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquarePlus size={15} />
          提交反馈
        </p>
        <span className="text-xs text-[var(--color-ink-subtle)]">
          以 {user.displayName} 的身份提交
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="feedback-type" className="text-xs font-medium text-[var(--color-ink-muted)]">
            反馈类型
          </label>
          <select
            id="feedback-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="field mt-1.5"
            disabled={submitting}
          >
            {FEEDBACK_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="feedback-subject"
            className="text-xs font-medium text-[var(--color-ink-muted)]"
          >
            主题
          </label>
          <input
            id="feedback-subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={120}
            required
            placeholder="一句话说明问题"
            className="field mt-1.5"
            disabled={submitting}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="feedback-content"
          className="text-xs font-medium text-[var(--color-ink-muted)]"
        >
          具体内容
        </label>
        <textarea
          id="feedback-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          rows={5}
          maxLength={2000}
          placeholder="请附上页面链接、你看到的内容与期望的修正，便于我们核对来源。"
          className="field mt-1.5 h-auto min-h-[130px] resize-y py-2.5 leading-relaxed"
          disabled={submitting}
        />
        <p className="mt-1 text-right text-[11px] tabular-nums text-[var(--color-ink-subtle)]">
          {content.length}/2000
        </p>
      </div>

      {state.status === 'success' && (
        <Notice tone="success" className="animate-fade">
          {state.message}
        </Notice>
      )}

      {state.status === 'error' && (
        <Notice tone="danger" className="animate-fade">
          {state.message}
        </Notice>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
          提交即表示你同意我们为处理该问题而记录反馈内容与账号邮箱；不会用于其他用途。
        </p>
        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              提交中…
            </>
          ) : (
            <>
              <Send size={14} />
              提交反馈
            </>
          )}
        </button>
      </div>
    </form>
  );
}
