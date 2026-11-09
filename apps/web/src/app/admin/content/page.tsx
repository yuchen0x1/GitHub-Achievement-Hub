'use client';

import { useEffect, useState } from 'react';
import { FolderTree, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminFetch, describeError } from '../_components/admin-api';
import type { AdminCategoryRow } from '../_components/admin-types';
import type { FaqItem } from '@/lib/types';
import {
  AdminCard,
  AdminPageHeader,
  Badge,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  InlineError,
  LoadingBlock,
  Modal,
  TD,
  TH,
  TableWrap,
  Tabs,
  TextArea,
  TextInput,
} from '../_components/admin-ui';

type Tab = 'categories' | 'faq';

interface CategoryForm {
  id: string | null;
  slug: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  icon: string;
  colorHex: string;
  sortOrder: string;
}

const EMPTY_CATEGORY: CategoryForm = {
  id: null,
  slug: '',
  nameEn: '',
  nameZh: '',
  descriptionEn: '',
  descriptionZh: '',
  icon: '',
  colorHex: '',
  sortOrder: '0',
};

interface FaqForm {
  id: string | null;
  slug: string;
  question: string;
  questionZh: string;
  answer: string;
  answerZh: string;
  category: string;
  sortOrder: string;
}

const EMPTY_FAQ: FaqForm = {
  id: null,
  slug: '',
  question: '',
  questionZh: '',
  answer: '',
  answerZh: '',
  category: 'general',
  sortOrder: '0',
};

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryForm | null>(null);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryDeleting, setCategoryDeleting] = useState<AdminCategoryRow | null>(null);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);
  const [categoryDeleteBusy, setCategoryDeleteBusy] = useState(false);

  const [faqForm, setFaqForm] = useState<FaqForm | null>(null);
  const [faqBusy, setFaqBusy] = useState(false);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [faqDeleting, setFaqDeleting] = useState<FaqItem | null>(null);
  const [faqDeleteError, setFaqDeleteError] = useState<string | null>(null);
  const [faqDeleteBusy, setFaqDeleteBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cats, faqItems] = await Promise.all([
        adminFetch<AdminCategoryRow[]>('/content/categories'),
        adminFetch<FaqItem[]>('/faq'),
      ]);
      setCategories(cats);
      setFaq(faqItems);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------- 分类 ---------------------------

  function openCategory(item?: AdminCategoryRow) {
    setCategoryError(null);
    setMessage(null);
    setCategoryForm(
      item
        ? {
            id: item.id,
            slug: item.slug,
            nameEn: item.nameEn,
            nameZh: item.nameZh,
            descriptionEn: item.descriptionEn ?? '',
            descriptionZh: item.descriptionZh ?? '',
            icon: item.icon ?? '',
            colorHex: item.colorHex ?? '',
            sortOrder: String(item.sortOrder ?? 0),
          }
        : { ...EMPTY_CATEGORY },
    );
  }

  async function saveCategory() {
    if (!categoryForm || categoryBusy) return;
    const { id, slug, nameEn, nameZh } = categoryForm;
    if (!slug.trim() || !nameEn.trim() || !nameZh.trim()) {
      setCategoryError('slug、英文名与中文名都是必填项。');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      setCategoryError('slug 只能包含小写字母、数字与连字符。');
      return;
    }
    setCategoryBusy(true);
    setCategoryError(null);
    try {
      const body = {
        slug: slug.trim(),
        nameEn: nameEn.trim(),
        nameZh: nameZh.trim(),
        descriptionEn: categoryForm.descriptionEn.trim() || null,
        descriptionZh: categoryForm.descriptionZh.trim() || null,
        icon: categoryForm.icon.trim() || null,
        colorHex: categoryForm.colorHex.trim() || null,
        sortOrder: Number(categoryForm.sortOrder) || 0,
      };
      if (id) {
        await adminFetch(`/admin/content/categories/${id}`, { method: 'PATCH', body });
        setMessage(`分类「${body.nameZh}」已更新。`);
      } else {
        await adminFetch('/admin/content/categories', { method: 'POST', body });
        setMessage(`分类「${body.nameZh}」已创建。`);
      }
      setCategoryForm(null);
      await load();
    } catch (err) {
      setCategoryError(describeError(err));
    } finally {
      setCategoryBusy(false);
    }
  }

  async function removeCategory() {
    if (!categoryDeleting) return;
    setCategoryDeleteBusy(true);
    setCategoryDeleteError(null);
    try {
      await adminFetch(`/admin/content/categories/${categoryDeleting.id}`, { method: 'DELETE' });
      setMessage(`分类「${categoryDeleting.nameZh}」已删除，关联勋章会被置为未分类。`);
      setCategoryDeleting(null);
      await load();
    } catch (err) {
      setCategoryDeleteError(describeError(err));
    } finally {
      setCategoryDeleteBusy(false);
    }
  }

  // --------------------------- FAQ ---------------------------

  function openFaq(item?: FaqItem) {
    setFaqError(null);
    setMessage(null);
    setFaqForm(
      item
        ? {
            id: item.id,
            slug: item.slug,
            question: item.question,
            questionZh: item.questionZh,
            answer: item.answer,
            answerZh: item.answerZh,
            category: item.category,
            sortOrder: String(item.sortOrder ?? 0),
          }
        : { ...EMPTY_FAQ },
    );
  }

  async function saveFaq() {
    if (!faqForm || faqBusy) return;
    const { id, slug, question, questionZh, answer, answerZh } = faqForm;
    if (!slug.trim() || !question.trim() || !answer.trim()) {
      setFaqError('slug、问题与答案是必填项。');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      setFaqError('slug 只能包含小写字母、数字与连字符。');
      return;
    }
    setFaqBusy(true);
    setFaqError(null);
    try {
      const body = {
        slug: slug.trim(),
        question: question.trim(),
        questionZh: questionZh.trim() || question.trim(),
        answer: answer.trim(),
        answerZh: answerZh.trim() || answer.trim(),
        category: faqForm.category.trim() || 'general',
        sortOrder: Number(faqForm.sortOrder) || 0,
      };
      if (id) {
        await adminFetch(`/admin/content/faq/${id}`, { method: 'PATCH', body });
        setMessage('常见问题已更新。');
      } else {
        await adminFetch('/admin/content/faq', { method: 'POST', body });
        setMessage('常见问题已创建。');
      }
      setFaqForm(null);
      await load();
    } catch (err) {
      setFaqError(describeError(err));
    } finally {
      setFaqBusy(false);
    }
  }

  async function removeFaq() {
    if (!faqDeleting) return;
    setFaqDeleteBusy(true);
    setFaqDeleteError(null);
    try {
      await adminFetch(`/admin/content/faq/${faqDeleting.id}`, { method: 'DELETE' });
      setMessage('常见问题已删除。');
      setFaqDeleting(null);
      await load();
    } catch (err) {
      setFaqDeleteError(describeError(err));
    } finally {
      setFaqDeleteBusy(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-5">
      <AdminPageHeader
        eyebrow="CONTENT"
        title="分类与 FAQ"
        description="维护勋章分类与常见问题。分类删除后，关联勋章会变为未分类（不会删除勋章本身）。"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
              刷新
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => (tab === 'categories' ? openCategory() : openFaq())}
            >
              <Plus size={14} />
              {tab === 'categories' ? '新建分类' : '新建 FAQ'}
            </button>
          </>
        }
      />

      <Tabs<Tab>
        value={tab}
        onChange={(value) => {
          setTab(value);
          setMessage(null);
        }}
        items={[
          { value: 'categories', label: '分类', count: categories.length },
          { value: 'faq', label: '常见问题', count: faq.length },
        ]}
      />

      {message && (
        <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs text-[var(--color-success)]">
          {message}
        </div>
      )}

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : tab === 'categories' ? (
        <AdminCard
          title="勋章分类"
          description="来自 GET /content/categories（仅启用中的分类）。"
          bodyClassName="p-0"
        >
          {categories.length === 0 ? (
            <div className="p-5">
              <EmptyBlock title="还没有分类" description="创建第一个分类，用于组织勋章图鉴。" />
            </div>
          ) : (
            <TableWrap minWidth={820}>
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <tr>
                  <th className={TH}>分类</th>
                  <th className={TH}>Slug</th>
                  <th className={TH}>排序</th>
                  <th className={TH}>勋章数</th>
                  <th className={TH}>操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <td className={TD}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] text-[11px] font-bold"
                          style={{
                            backgroundColor: item.colorHex
                              ? `color-mix(in oklab, ${item.colorHex} 20%, transparent)`
                              : 'var(--color-surface-sunken)',
                          }}
                        >
                          {item.icon ? item.icon.slice(0, 2) : item.nameZh.slice(0, 1)}
                        </span>
                        <div>
                          <p className="text-[13px] font-medium">{item.nameZh}</p>
                          <p className="text-[11px] text-[var(--color-ink-subtle)]">{item.nameEn}</p>
                        </div>
                      </div>
                      {item.descriptionZh && (
                        <p className="mt-1 line-clamp-1 max-w-sm text-[11px] text-[var(--color-ink-muted)]">
                          {item.descriptionZh}
                        </p>
                      )}
                    </td>
                    <td className={`${TD} font-mono text-[11px] text-[var(--color-ink-muted)]`}>
                      {item.slug}
                    </td>
                    <td className={`${TD} tabular-nums text-xs`}>{item.sortOrder}</td>
                    <td className={`${TD} tabular-nums text-xs`}>
                      {item._count?.achievements ?? 0}
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openCategory(item)}
                        >
                          <Pencil size={13} />
                          编辑
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                          onClick={() => {
                            setCategoryDeleteError(null);
                            setCategoryDeleting(item);
                          }}
                          aria-label={`删除分类 ${item.nameZh}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </AdminCard>
      ) : (
        <AdminCard
          title="常见问题"
          description="来自 GET /faq（仅启用中的条目）。每条 FAQ 需要唯一 slug。"
          bodyClassName="p-0"
        >
          {faq.length === 0 ? (
            <div className="p-5">
              <EmptyBlock title="还没有常见问题" description="创建第一条 FAQ，帮助用户理解站点。" />
            </div>
          ) : (
            <TableWrap minWidth={900}>
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <tr>
                  <th className={TH}>问题</th>
                  <th className={TH}>分类</th>
                  <th className={TH}>Slug</th>
                  <th className={TH}>排序</th>
                  <th className={TH}>操作</th>
                </tr>
              </thead>
              <tbody>
                {faq.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <td className={`${TD} max-w-[420px]`}>
                      <p className="text-[13px] font-medium">{item.questionZh}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                        {item.answerZh}
                      </p>
                    </td>
                    <td className={TD}>
                      <Badge tone="muted">{item.category}</Badge>
                    </td>
                    <td className={`${TD} font-mono text-[11px] text-[var(--color-ink-muted)]`}>
                      {item.slug}
                    </td>
                    <td className={`${TD} tabular-nums text-xs`}>{item.sortOrder}</td>
                    <td className={TD}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openFaq(item)}
                        >
                          <Pencil size={13} />
                          编辑
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                          onClick={() => {
                            setFaqDeleteError(null);
                            setFaqDeleting(item);
                          }}
                          aria-label="删除常见问题"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </AdminCard>
      )}

      {/* 分类表单 */}
      <Modal
        open={Boolean(categoryForm)}
        onClose={() => setCategoryForm(null)}
        title={categoryForm?.id ? '编辑分类' : '新建分类'}
        description="slug 用于前端路由与筛选，创建后不建议修改。"
        width="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCategoryForm(null)}
              disabled={categoryBusy}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void saveCategory()}
              disabled={categoryBusy}
            >
              {categoryBusy ? '保存中…' : '保存分类'}
            </button>
          </>
        }
      >
        {categoryForm && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug" required hint="小写字母、数字、连字符">
              <TextInput
                value={categoryForm.slug}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, slug: event.target.value })
                }
                placeholder="eg. pull-shark"
              />
            </Field>
            <Field label="排序">
              <TextInput
                type="number"
                value={categoryForm.sortOrder}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, sortOrder: event.target.value })
                }
              />
            </Field>
            <Field label="英文名" required>
              <TextInput
                value={categoryForm.nameEn}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, nameEn: event.target.value })
                }
              />
            </Field>
            <Field label="中文名" required>
              <TextInput
                value={categoryForm.nameZh}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, nameZh: event.target.value })
                }
              />
            </Field>
            <Field label="图标（可选）" hint="当前前端使用文本/Emoji，填入 1-2 个字符即可">
              <TextInput
                value={categoryForm.icon}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, icon: event.target.value })
                }
                placeholder="🦈"
              />
            </Field>
            <Field label="主题色（可选）" hint="十六进制颜色，例如 #0969da">
              <TextInput
                value={categoryForm.colorHex}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, colorHex: event.target.value })
                }
                placeholder="#0969da"
              />
            </Field>
            <Field label="英文简介" className="sm:col-span-2">
              <TextArea
                rows={2}
                value={categoryForm.descriptionEn}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, descriptionEn: event.target.value })
                }
              />
            </Field>
            <Field label="中文简介" className="sm:col-span-2">
              <TextArea
                rows={2}
                value={categoryForm.descriptionZh}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, descriptionZh: event.target.value })
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <InlineError message={categoryError} />
            </div>
          </div>
        )}
      </Modal>

      {/* FAQ 表单 */}
      <Modal
        open={Boolean(faqForm)}
        onClose={() => setFaqForm(null)}
        title={faqForm?.id ? '编辑常见问题' : '新建常见问题'}
        description="中文内容会优先展示；英文可留空，后端会回落为中文。"
        width="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setFaqForm(null)}
              disabled={faqBusy}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void saveFaq()}
              disabled={faqBusy}
            >
              {faqBusy ? '保存中…' : '保存 FAQ'}
            </button>
          </>
        }
      >
        {faqForm && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug" required hint="小写字母、数字、连字符">
              <TextInput
                value={faqForm.slug}
                onChange={(event) => setFaqForm({ ...faqForm, slug: event.target.value })}
                placeholder="eg. how-tiers-work"
              />
            </Field>
            <Field label="分类" hint="与前台 FAQ 分组对应，例如 basics / trust">
              <TextInput
                value={faqForm.category}
                onChange={(event) => setFaqForm({ ...faqForm, category: event.target.value })}
              />
            </Field>
            <Field label="问题（中文）" required>
              <TextInput
                value={faqForm.questionZh}
                onChange={(event) => setFaqForm({ ...faqForm, questionZh: event.target.value })}
              />
            </Field>
            <Field label="Question (English)">
              <TextInput
                value={faqForm.question}
                onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })}
              />
            </Field>
            <Field label="答案（中文）" required className="sm:col-span-2">
              <TextArea
                rows={4}
                value={faqForm.answerZh}
                onChange={(event) => setFaqForm({ ...faqForm, answerZh: event.target.value })}
              />
            </Field>
            <Field label="Answer (English)" className="sm:col-span-2">
              <TextArea
                rows={3}
                value={faqForm.answer}
                onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })}
              />
            </Field>
            <Field label="排序">
              <TextInput
                type="number"
                value={faqForm.sortOrder}
                onChange={(event) => setFaqForm({ ...faqForm, sortOrder: event.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <InlineError message={faqError} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(categoryDeleting)}
        title="删除分类"
        description={
          <>
            将删除分类「{categoryDeleting?.nameZh}」（{categoryDeleting?.slug}）。
            该分类下的勋章不会被删除，但会变为未分类。此操作不可恢复。
          </>
        }
        confirmLabel="删除分类"
        requireText={categoryDeleting?.slug}
        busy={categoryDeleteBusy}
        error={categoryDeleteError}
        onCancel={() => setCategoryDeleting(null)}
        onConfirm={() => void removeCategory()}
      />

      <ConfirmDialog
        open={Boolean(faqDeleting)}
        title="删除常见问题"
        description={
          <>
            将永久删除 FAQ「{faqDeleting?.questionZh}」。前台立即不再展示，且无法恢复。
          </>
        }
        confirmLabel="删除 FAQ"
        requireText={faqDeleting?.slug}
        busy={faqDeleteBusy}
        error={faqDeleteError}
        onCancel={() => setFaqDeleting(null)}
        onConfirm={() => void removeFaq()}
      />

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--color-ink-subtle)]">
        <span className="inline-flex items-center gap-1.5">
          <FolderTree size={13} /> 分类 {categories.length} 个
        </span>
        <span className="inline-flex items-center gap-1.5">
          <HelpCircle size={13} /> FAQ {faq.length} 条
        </span>
      </div>
    </div>
  );
}
