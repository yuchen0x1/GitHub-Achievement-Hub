'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Info, Save, ShieldAlert } from 'lucide-react';
import { availabilityMeta } from '@/lib/tier';
import {
  AVAILABILITY_OPTIONS,
  CONTENT_STATUSES,
  CONTENT_STATUS_META,
  CREDIBILITY_OPTIONS,
  nextStatus,
  type AdminAchievementDetail,
  type AdminCategoryRow,
  type ContentStatus,
} from './admin-types';
import type { Availability, Credibility } from '@/lib/types';
import { adminFetch, describeError } from './admin-api';
import {
  Badge,
  CheckboxRow,
  ConfirmDialog,
  Drawer,
  ErrorBlock,
  Field,
  InlineError,
  LoadingBlock,
  SelectInput,
  Tabs,
  TextArea,
  TextInput,
} from './admin-ui';
import { AchievementHistoryPanel } from './achievement-history';
import { AchievementSubresources } from './achievement-subresources';

interface FormState {
  slug: string;
  nameEn: string;
  nameZh: string;
  summaryEn: string;
  summaryZh: string;
  descriptionEn: string;
  descriptionZh: string;
  backgroundEn: string;
  backgroundZh: string;
  conditionEn: string;
  conditionZh: string;
  imageUrl: string;
  imageHdUrl: string;
  difficulty: number;
  availability: Availability;
  isTiered: boolean;
  categoryId: string;
  credibility: Credibility;
  uncertain: boolean;
  uncertaintyNote: string;
  popularity: number;
  status: ContentStatus;
}

function blankForm(): FormState {
  return {
    slug: '',
    nameEn: '',
    nameZh: '',
    summaryEn: '',
    summaryZh: '',
    descriptionEn: '',
    descriptionZh: '',
    backgroundEn: '',
    backgroundZh: '',
    conditionEn: '',
    conditionZh: '',
    imageUrl: '',
    imageHdUrl: '',
    difficulty: 3,
    availability: 'AVAILABLE',
    isTiered: false,
    categoryId: '',
    credibility: 'C',
    uncertain: false,
    uncertaintyNote: '',
    popularity: 0,
    status: 'DRAFT',
  };
}

function formFromDetail(detail: AdminAchievementDetail): FormState {
  return {
    slug: detail.slug,
    nameEn: detail.nameEn,
    nameZh: detail.nameZh,
    summaryEn: detail.summaryEn ?? '',
    summaryZh: detail.summaryZh ?? '',
    descriptionEn: detail.descriptionEn ?? '',
    descriptionZh: detail.descriptionZh ?? '',
    backgroundEn: detail.backgroundEn ?? '',
    backgroundZh: detail.backgroundZh ?? '',
    conditionEn: detail.conditionEn ?? '',
    conditionZh: detail.conditionZh ?? '',
    imageUrl: detail.imageUrl ?? '',
    imageHdUrl: detail.imageHdUrl ?? '',
    difficulty: detail.difficulty,
    availability: detail.availability,
    isTiered: detail.isTiered,
    categoryId: detail.categoryId ?? '',
    credibility: detail.credibility,
    uncertain: detail.uncertain,
    uncertaintyNote: detail.uncertaintyNote ?? '',
    popularity: detail.popularity,
    status: detail.status,
  };
}

type Tab = 'basic' | 'sub' | 'history';

const DIFFICULTY_LABELS = ['', '很容易', '较容易', '中等', '较难', '极难'];

export function AchievementEditor({
  open,
  achievementId,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  achievementId: string | null;
  categories: AdminCategoryRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [currentId, setCurrentId] = useState<string | null>(achievementId);
  const [detail, setDetail] = useState<AdminAchievementDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [initial, setInitial] = useState<FormState | null>(null);
  const [tab, setTab] = useState<Tab>('basic');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ContentStatus | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function fetchDetail(id: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminFetch<AdminAchievementDetail | null>(`/admin/achievements/${id}`);
      if (!res) {
        setLoadError('勋章不存在，可能已被其他管理员删除。');
        return;
      }
      setDetail(res);
      const nextForm = formFromDetail(res);
      setForm(nextForm);
      setInitial(nextForm);
    } catch (err) {
      setLoadError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setCurrentId(achievementId);
    setTab('basic');
    setMessage(null);
    setSaveError(null);
    setStatusError(null);
    setDetail(null);
    if (!achievementId) {
      const blank = blankForm();
      setForm(blank);
      setInitial(blank);
      setLoading(false);
      setLoadError(null);
      return;
    }
    void fetchDetail(achievementId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, achievementId]);

  async function refreshDetail() {
    if (!currentId) return;
    setRefreshing(true);
    try {
      const res = await adminFetch<AdminAchievementDetail | null>(
        `/admin/achievements/${currentId}`,
      );
      if (res) {
        setDetail(res);
        // 子资源变更后不覆盖用户正在编辑的主表草稿，仅在无改动时同步
        if (form && initial && JSON.stringify(form) === JSON.stringify(initial)) {
          const nextForm = formFromDetail(res);
          setForm(nextForm);
          setInitial(nextForm);
        }
      }
    } catch (err) {
      setSaveError(describeError(err));
    } finally {
      setRefreshing(false);
    }
  }

  const dirty = Boolean(form && initial && JSON.stringify(form) !== JSON.stringify(initial));

  async function save() {
    if (!form || saving) return;
    if (!form.nameEn.trim() || !form.nameZh.trim()) {
      setSaveError('英文名与中文名都是必填项。');
      return;
    }
    if (form.difficulty < 1 || form.difficulty > 5) {
      setSaveError('难度必须在 1–5 之间。');
      return;
    }
    if (form.popularity < 0) {
      setSaveError('热度不能为负数。');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setMessage(null);

    const payload = {
      nameEn: form.nameEn.trim(),
      nameZh: form.nameZh.trim(),
      summaryEn: form.summaryEn.trim(),
      summaryZh: form.summaryZh.trim(),
      descriptionEn: form.descriptionEn.trim(),
      descriptionZh: form.descriptionZh.trim(),
      backgroundEn: form.backgroundEn.trim() || null,
      backgroundZh: form.backgroundZh.trim() || null,
      conditionEn: form.conditionEn.trim(),
      conditionZh: form.conditionZh.trim(),
      imageUrl: form.imageUrl.trim() || null,
      imageHdUrl: form.imageHdUrl.trim() || null,
      difficulty: form.difficulty,
      availability: form.availability,
      isTiered: form.isTiered,
      hasTiers: form.isTiered,
      categoryId: form.categoryId || null,
      credibility: form.credibility,
      uncertain: form.uncertain,
      uncertaintyNote: form.uncertain ? form.uncertaintyNote.trim() || null : null,
      popularity: form.popularity,
      status: form.status,
    };

    try {
      if (currentId) {
        const saved = await adminFetch<AdminAchievementDetail>(
          `/admin/achievements/${currentId}`,
          { method: 'PATCH', body: payload },
        );
        setDetail(saved);
        const nextForm = formFromDetail(saved);
        setForm(nextForm);
        setInitial(nextForm);
        setMessage('已保存。字段级变更已写入变更历史。');
      } else {
        const created = await adminFetch<AdminAchievementDetail>('/admin/achievements', {
          method: 'POST',
          body: { ...payload, slug: form.slug.trim() || undefined },
        });
        // 后端 create 只落库部分字段（不含 background / categoryId / uncertain /
        // uncertaintyNote / popularity），创建后立即补一次 PATCH，保证表单内容完整保存。
        let saved = created;
        let patchFailed = false;
        try {
          saved = await adminFetch<AdminAchievementDetail>(
            `/admin/achievements/${created.id}`,
            { method: 'PATCH', body: payload },
          );
        } catch {
          patchFailed = true;
        }
        setCurrentId(created.id);
        setDetail(saved);
        const nextForm = formFromDetail(saved);
        setForm(nextForm);
        setInitial(nextForm);
        setMessage(
          patchFailed
            ? '勋章已创建，但部分字段（背景 / 分类 / 存疑说明 / 热度）可能未保存，请打开编辑后再次保存。'
            : '勋章已创建。现在可以继续补充子资源（等级 / 条件 / 教程 / 来源）。',
        );
      }
      onSaved();
    } catch (err) {
      setSaveError(describeError(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus() {
    if (!currentId || !pendingStatus) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      await adminFetch(`/admin/achievements/${currentId}`, {
        method: 'PATCH',
        body: { status: pendingStatus },
      });
      setMessage(
        `发布状态已变更为「${CONTENT_STATUS_META[pendingStatus].label}」。状态变更会写入变更历史。`,
      );
      setPendingStatus(null);
      await fetchDetail(currentId);
      onSaved();
    } catch (err) {
      setStatusError(describeError(err));
    } finally {
      setStatusBusy(false);
    }
  }

  const statusMeta = detail ? CONTENT_STATUS_META[detail.status] : null;
  const upcoming = detail ? nextStatus(detail.status) : null;

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={currentId ? '编辑勋章' : '新建勋章'}
        subtitle={
          form
            ? `${form.nameZh || '未命名'}${form.slug ? ` · ${form.slug}` : ''}${dirty ? ' · 有未保存修改' : ''}`
            : undefined
        }
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
              关闭
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void save()}
              disabled={saving || loading || !form}
            >
              <Save size={14} />
              {saving ? '保存中…' : currentId ? '保存修改' : '创建勋章'}
            </button>
          </>
        }
      >
        {loading ? (
          <LoadingBlock label="正在加载勋章详情…" />
        ) : loadError ? (
          <ErrorBlock
            message={loadError}
            onRetry={currentId ? () => void fetchDetail(currentId) : undefined}
          />
        ) : !form ? null : (
          <div className="space-y-4">
            {message && (
              <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--color-success)]">
                {message}
              </div>
            )}

            {statusMeta && detail && (
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  <span className="text-[11px] text-[var(--color-ink-muted)]">
                    {statusMeta.description}
                  </span>
                  {upcoming && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm ml-auto"
                      onClick={() => {
                        setStatusError(null);
                        setPendingStatus(upcoming);
                      }}
                    >
                      流转为 {CONTENT_STATUS_META[upcoming].label}
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
                  流转顺序：草稿 → 待审 → 已发布 → 归档。系统不提供一键回滚；若需恢复旧内容，请在「变更历史」中查看旧值后手动改回并保存。
                </p>
              </div>
            )}

            <Tabs<Tab>
              value={tab}
              onChange={(value) => {
                if (value !== 'basic' && !currentId) return;
                setTab(value);
              }}
              items={[
                { value: 'basic', label: '基本信息' },
                {
                  value: 'sub',
                  label: `子资源${
                    detail
                      ? `（${detail.tiers.length + detail.requirements.length + detail.guides.length + detail.sources.length}）`
                      : ''
                  }`,
                },
                { value: 'history', label: '变更历史' },
              ]}
            />

            {tab !== 'basic' && !currentId && (
              <p className="rounded-lg border border-[var(--color-warning)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs text-[var(--color-warning)]">
                请先保存基本信息创建勋章，之后才能管理子资源与查看变更历史。
              </p>
            )}

            {tab === 'basic' && (
              <div className="space-y-5">
                {!currentId && (
                  <Field
                    label="Slug"
                    hint="留空则根据英文名自动生成；创建后不建议修改。只能包含小写字母、数字与连字符。"
                  >
                    <TextInput
                      value={form.slug}
                      onChange={(event) => setForm({ ...form, slug: event.target.value })}
                      placeholder="eg. pull-shark"
                    />
                  </Field>
                )}

                <fieldset className="space-y-3">
                  <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
                    标识与分类
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="英文名" required>
                      <TextInput
                        value={form.nameEn}
                        onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
                      />
                    </Field>
                    <Field label="中文名" required>
                      <TextInput
                        value={form.nameZh}
                        onChange={(event) => setForm({ ...form, nameZh: event.target.value })}
                      />
                    </Field>
                    <Field label="分类">
                      <SelectInput
                        value={form.categoryId}
                        onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                      >
                        <option value="">未分类</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.nameZh}（{category.slug}）
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="发布状态">
                      <SelectInput
                        value={form.status}
                        onChange={(event) =>
                          setForm({ ...form, status: event.target.value as ContentStatus })
                        }
                      >
                        {CONTENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {CONTENT_STATUS_META[status].label}（{status}）
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
                    简介与描述
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="中文简介">
                      <TextArea
                        rows={2}
                        value={form.summaryZh}
                        onChange={(event) => setForm({ ...form, summaryZh: event.target.value })}
                      />
                    </Field>
                    <Field label="English summary">
                      <TextArea
                        rows={2}
                        value={form.summaryEn}
                        onChange={(event) => setForm({ ...form, summaryEn: event.target.value })}
                      />
                    </Field>
                    <Field label="中文描述">
                      <TextArea
                        rows={4}
                        value={form.descriptionZh}
                        onChange={(event) =>
                          setForm({ ...form, descriptionZh: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="English description">
                      <TextArea
                        rows={4}
                        value={form.descriptionEn}
                        onChange={(event) =>
                          setForm({ ...form, descriptionEn: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="中文背景（可选）">
                      <TextArea
                        rows={3}
                        value={form.backgroundZh}
                        onChange={(event) =>
                          setForm({ ...form, backgroundZh: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="English background（可选）">
                      <TextArea
                        rows={3}
                        value={form.backgroundEn}
                        onChange={(event) =>
                          setForm({ ...form, backgroundEn: event.target.value })
                        }
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
                    获取条件
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="中文获取条件">
                      <TextArea
                        rows={3}
                        value={form.conditionZh}
                        onChange={(event) =>
                          setForm({ ...form, conditionZh: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="English condition">
                      <TextArea
                        rows={3}
                        value={form.conditionEn}
                        onChange={(event) =>
                          setForm({ ...form, conditionEn: event.target.value })
                        }
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
                    图片
                  </legend>
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="badge-frame grid h-20 w-20 shrink-0 place-items-center">
                      {form.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.imageUrl}
                          alt=""
                          className="h-16 w-16 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[10px] text-[var(--color-ink-subtle)]">无图片</span>
                      )}
                    </span>
                    <div className="min-w-[220px] flex-1 space-y-3">
                      <Field label="勋章图片 URL">
                        <TextInput
                          value={form.imageUrl}
                          onChange={(event) =>
                            setForm({ ...form, imageUrl: event.target.value })
                          }
                          placeholder="https://github.githubassets.com/…"
                        />
                      </Field>
                      <Field label="高清图片 URL">
                        <TextInput
                          value={form.imageHdUrl}
                          onChange={(event) =>
                            setForm({ ...form, imageHdUrl: event.target.value })
                          }
                          placeholder="https://github.githubassets.com/…"
                        />
                      </Field>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
                    属性与可信度
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="难度（1–5）">
                      <SelectInput
                        value={String(form.difficulty)}
                        onChange={(event) =>
                          setForm({ ...form, difficulty: Number(event.target.value) })
                        }
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value} · {DIFFICULTY_LABELS[value]}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="获取状态">
                      <SelectInput
                        value={form.availability}
                        onChange={(event) =>
                          setForm({ ...form, availability: event.target.value as Availability })
                        }
                      >
                        {AVAILABILITY_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {availabilityMeta(value).labelZh}（{value}）
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="可信度">
                      <SelectInput
                        value={form.credibility}
                        onChange={(event) =>
                          setForm({ ...form, credibility: event.target.value as Credibility })
                        }
                      >
                        {CREDIBILITY_OPTIONS.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade} 级
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="热度（整数）" hint="用于首页热门排序，非实时浏览量。">
                      <TextInput
                        type="number"
                        min={0}
                        value={form.popularity}
                        onChange={(event) =>
                          setForm({ ...form, popularity: Number(event.target.value) || 0 })
                        }
                      />
                    </Field>
                  </div>
                  <CheckboxRow
                    label="分级勋章"
                    description="启用后应配置 Default → Bronze → Silver → Gold 的门槛。"
                    checked={form.isTiered}
                    onChange={(checked) => setForm({ ...form, isTiered: checked })}
                  />
                  <CheckboxRow
                    label="资料仍存疑"
                    description="条件或门槛尚未被充分验证时勾选，并在下方说明原因。"
                    checked={form.uncertain}
                    onChange={(checked) => setForm({ ...form, uncertain: checked })}
                  />
                  <Field label="存疑说明">
                    <TextArea
                      rows={2}
                      value={form.uncertaintyNote}
                      disabled={!form.uncertain}
                      onChange={(event) =>
                        setForm({ ...form, uncertaintyNote: event.target.value })
                      }
                      placeholder="例如：社区说法与官方文档不一致，Gold 门槛尚未复现。"
                    />
                  </Field>
                </fieldset>

                <InlineError message={saveError} />
              </div>
            )}

            {tab === 'sub' && currentId && detail && (
              <AchievementSubresources detail={detail} onChanged={refreshDetail} />
            )}

            {tab === 'history' && currentId && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-[var(--color-warning)] bg-[var(--color-surface-raised)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
                  <span>
                    变更为字段级记录。系统<strong>不提供一键回滚</strong>：确认旧值后，请回到「基本信息」手动改回并保存；
                    新的保存会生成一条新的变更记录，历史不会被覆盖。
                  </span>
                </div>
                {refreshing && (
                  <p className="text-[11px] text-[var(--color-ink-subtle)]">正在刷新详情…</p>
                )}
                <AchievementHistoryPanel achievementId={currentId} />
              </div>
            )}

            {!currentId && tab === 'basic' && (
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
                <Info size={13} className="mt-0.5 shrink-0" />
                新建默认为草稿状态。保存后会自动创建一条 CREATE 变更记录，并可继续配置子资源。
              </p>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title="变更发布状态"
        description={
          <>
            将状态变更为
            <span className="mx-1 font-semibold">
              {pendingStatus ? CONTENT_STATUS_META[pendingStatus].label : ''}
            </span>
            。该操作会记录到勋章变更历史；如需恢复旧内容，请手动改回。
            {dirty && (
              <span className="mt-2 block text-[var(--color-warning)]">
                注意：表单中存在未保存的修改，本次状态变更不会保存这些字段。
              </span>
            )}
          </>
        }
        confirmLabel="确认变更"
        tone="warning"
        busy={statusBusy}
        error={statusError}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => void changeStatus()}
      />
    </>
  );
}

export type { FormState };
