'use client';

import { useState } from 'react';
import { BookOpen, Layers, Link2, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Credibility, SourceType, Tier, TierLevel } from '@/lib/types';
import {
  CREDIBILITY_OPTIONS,
  SOURCE_STATUS_OPTIONS,
  SOURCE_TYPE_META,
  type AdminAchievementDetail,
  type AdminGuide,
  type AdminRequirement,
  type AdminSource,
} from './admin-types';
import { adminFetch, describeError } from './admin-api';
import {
  Badge,
  CheckboxRow,
  ConfirmDialog,
  EmptyBlock,
  Field,
  InlineError,
  Modal,
  SelectInput,
  TextArea,
  TextInput,
} from './admin-ui';

const TIER_LEVELS: TierLevel[] = ['DEFAULT', 'BRONZE', 'SILVER', 'GOLD'];

interface SubProps {
  detail: AdminAchievementDetail;
  onChanged: () => Promise<void>;
}

export function AchievementSubresources({ detail, onChanged }: SubProps) {
  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
        子资源独立于勋章主表保存。等级按 level 唯一键 upsert；条件与教程支持编辑；资料来源接口仅提供新增与删除，修改请删除后重新添加。
      </p>
      <TiersSection detail={detail} onChanged={onChanged} />
      <RequirementsSection detail={detail} onChanged={onChanged} />
      <GuidesSection detail={detail} onChanged={onChanged} />
      <SourcesSection detail={detail} onChanged={onChanged} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 等级
// ---------------------------------------------------------------------------

interface TierDraft {
  level: TierLevel;
  threshold: string;
  labelEn: string;
  labelZh: string;
  descriptionEn: string;
  descriptionZh: string;
  credibility: Credibility;
  sourceNote: string;
}

const EMPTY_TIER: TierDraft = {
  level: 'DEFAULT',
  threshold: '',
  labelEn: '',
  labelZh: '',
  descriptionEn: '',
  descriptionZh: '',
  credibility: 'C',
  sourceNote: '',
};

function TiersSection({ detail, onChanged }: SubProps) {
  const [draft, setDraft] = useState<TierDraft | null>(null);
  const [editing, setEditing] = useState<Tier | null>(null);
  const [deleting, setDeleting] = useState<Tier | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const tiers = [...detail.tiers].sort(
    (a, b) => TIER_LEVELS.indexOf(a.level) - TIER_LEVELS.indexOf(b.level),
  );
  const missing = TIER_LEVELS.filter((level) => !tiers.some((tier) => tier.level === level));

  function openNew() {
    const level = missing[0] ?? 'DEFAULT';
    setEditing(null);
    setModalError(null);
    setDraft({ ...EMPTY_TIER, level });
  }

  function openEdit(tier: Tier) {
    setEditing(tier);
    setModalError(null);
    setDraft({
      level: tier.level,
      threshold: String(tier.threshold),
      labelEn: tier.labelEn,
      labelZh: tier.labelZh,
      descriptionEn: tier.descriptionEn ?? '',
      descriptionZh: tier.descriptionZh ?? '',
      credibility: tier.credibility,
      sourceNote: tier.sourceNote ?? '',
    });
  }

  async function save() {
    if (!draft || busy) return;
    if (draft.threshold.trim() === '' || Number.isNaN(Number(draft.threshold))) {
      setModalError('请填写有效的门槛数量。');
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await adminFetch(`/admin/achievements/${detail.id}/tiers`, {
        method: 'POST',
        body: {
          level: draft.level,
          threshold: Number(draft.threshold),
          labelEn: draft.labelEn.trim() || draft.level,
          labelZh: draft.labelZh.trim() || draft.level,
          descriptionEn: draft.descriptionEn.trim() || null,
          descriptionZh: draft.descriptionZh.trim() || null,
          credibility: draft.credibility,
          sourceNote: draft.sourceNote.trim() || null,
        },
      });
      setDraft(null);
      await onChanged();
    } catch (err) {
      setModalError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/admin/achievements/${detail.id}/tiers/${deleting.id}`, {
        method: 'DELETE',
      });
      setDeleting(null);
      await onChanged();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionShell
      icon={<Layers size={15} />}
      title="等级阶梯"
      description="分级勋章的 Default → Bronze → Silver → Gold 门槛。同一 level 再次保存会覆盖。"
      count={tiers.length}
      onAdd={missing.length > 0 ? openNew : undefined}
      addLabel={missing.length > 0 ? `添加等级（缺 ${missing.length}）` : undefined}
    >
      <InlineError message={error} />
      {tiers.length === 0 ? (
        <EmptyBlock
          title="还没有等级数据"
          description="仅当勋章为分级勋章时需要配置。非分级勋章可留空。"
        />
      ) : (
        <ul className="space-y-2">
          {tiers.map((tier) => (
            <li
              key={tier.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{tier.level}</Badge>
                  <span className="text-[13px] font-semibold">门槛 {tier.threshold}</span>
                  <span className="text-[11px] text-[var(--color-ink-subtle)]">
                    {tier.labelZh} / {tier.labelEn}
                  </span>
                  <Badge tone="muted">可信度 {tier.credibility}</Badge>
                </div>
                {(tier.descriptionZh || tier.sourceNote) && (
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                    {tier.descriptionZh}
                    {tier.sourceNote ? ` · 来源：${tier.sourceNote}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(tier)}>
                  <Pencil size={13} />
                  编辑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                  onClick={() => setDeleting(tier)}
                  aria-label={`删除等级 ${tier.level}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={editing ? `编辑等级 ${editing.level}` : '新增等级'}
        description="level + threshold 会展示在前台等级阶梯与进度计算中。"
        width="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDraft(null)} disabled={busy}>
              取消
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}>
              {busy ? '保存中…' : '保存等级'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="等级">
              <SelectInput
                value={draft.level}
                disabled={Boolean(editing)}
                onChange={(event) =>
                  setDraft({ ...draft, level: event.target.value as TierLevel })
                }
              >
                {TIER_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="门槛数量" required>
              <TextInput
                type="number"
                min={0}
                value={draft.threshold}
                onChange={(event) => setDraft({ ...draft, threshold: event.target.value })}
              />
            </Field>
            <Field label="中文标签">
              <TextInput
                value={draft.labelZh}
                onChange={(event) => setDraft({ ...draft, labelZh: event.target.value })}
                placeholder="例如：金章"
              />
            </Field>
            <Field label="英文标签">
              <TextInput
                value={draft.labelEn}
                onChange={(event) => setDraft({ ...draft, labelEn: event.target.value })}
                placeholder="e.g. Gold"
              />
            </Field>
            <Field label="可信度">
              <SelectInput
                value={draft.credibility}
                onChange={(event) =>
                  setDraft({ ...draft, credibility: event.target.value as Credibility })
                }
              >
                {CREDIBILITY_OPTIONS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="来源说明">
              <TextInput
                value={draft.sourceNote}
                onChange={(event) => setDraft({ ...draft, sourceNote: event.target.value })}
                placeholder="门槛来源（官方文档 / 社区实测）"
              />
            </Field>
            <Field label="中文说明" className="sm:col-span-2">
              <TextArea
                rows={2}
                value={draft.descriptionZh}
                onChange={(event) => setDraft({ ...draft, descriptionZh: event.target.value })}
              />
            </Field>
            <Field label="英文说明" className="sm:col-span-2">
              <TextArea
                rows={2}
                value={draft.descriptionEn}
                onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <InlineError message={modalError} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除等级"
        description={
          <>
            将删除等级 <span className="font-semibold">{deleting?.level}</span>（门槛 {deleting?.threshold}）。
            前台等级阶梯会立即更新，此操作不可恢复。
          </>
        }
        confirmLabel="删除等级"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// 获取条件
// ---------------------------------------------------------------------------

interface RequirementDraft {
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  stepsText: string;
  codeExample: string;
}

const EMPTY_REQUIREMENT: RequirementDraft = {
  title: '',
  titleZh: '',
  content: '',
  contentZh: '',
  stepsText: '',
  codeExample: '',
};

function RequirementsSection({ detail, onChanged }: SubProps) {
  const [draft, setDraft] = useState<RequirementDraft | null>(null);
  const [editing, setEditing] = useState<AdminRequirement | null>(null);
  const [deleting, setDeleting] = useState<AdminRequirement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  function openNew() {
    setEditing(null);
    setModalError(null);
    setDraft({ ...EMPTY_REQUIREMENT });
  }

  function openEdit(item: AdminRequirement) {
    setEditing(item);
    setModalError(null);
    setDraft({
      title: item.title,
      titleZh: item.titleZh,
      content: item.content,
      contentZh: item.contentZh,
      stepsText: (item.steps ?? []).join('\n'),
      codeExample: item.codeExample ?? '',
    });
  }

  async function save() {
    if (!draft || busy) return;
    if (!draft.title.trim() && !draft.titleZh.trim()) {
      setModalError('请至少填写中/英文标题之一。');
      return;
    }
    const steps = draft.stepsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const body = {
      title: draft.title.trim() || draft.titleZh.trim(),
      titleZh: draft.titleZh.trim() || draft.title.trim(),
      content: draft.content.trim(),
      contentZh: draft.contentZh.trim(),
      steps: steps.length > 0 ? steps : null,
      codeExample: draft.codeExample.trim() || null,
    };
    setBusy(true);
    setModalError(null);
    try {
      if (editing) {
        await adminFetch(`/admin/achievements/${detail.id}/requirements/${editing.id}`, {
          method: 'PATCH',
          body,
        });
      } else {
        await adminFetch(`/admin/achievements/${detail.id}/requirements`, {
          method: 'POST',
          body,
        });
      }
      setDraft(null);
      await onChanged();
    } catch (err) {
      setModalError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/admin/achievements/${detail.id}/requirements/${deleting.id}`, {
        method: 'DELETE',
      });
      setDeleting(null);
      await onChanged();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionShell
      icon={<ListChecks size={15} />}
      title="获取条件"
      description="拆解为可执行的条件与步骤；步骤每行一条，会以有序数组保存。"
      count={detail.requirements.length}
      onAdd={openNew}
      addLabel="新增条件"
    >
      <InlineError message={error} />
      {detail.requirements.length === 0 ? (
        <EmptyBlock title="还没有获取条件" description="补充条件可以帮助读者判断如何解锁。" />
      ) : (
        <ul className="space-y-2">
          {detail.requirements.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">
                  {item.order + 1}. {item.titleZh || item.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                  {item.contentZh || item.content}
                </p>
                {item.steps && item.steps.length > 0 && (
                  <p className="mt-1 text-[11px] text-[var(--color-ink-subtle)]">
                    包含 {item.steps.length} 个步骤
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>
                  <Pencil size={13} />
                  编辑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                  onClick={() => setDeleting(item)}
                  aria-label="删除获取条件"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={editing ? '编辑获取条件' : '新增获取条件'}
        width="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDraft(null)} disabled={busy}>
              取消
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}>
              {busy ? '保存中…' : '保存条件'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="中文标题">
                <TextInput
                  value={draft.titleZh}
                  onChange={(event) => setDraft({ ...draft, titleZh: event.target.value })}
                />
              </Field>
              <Field label="英文标题">
                <TextInput
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </Field>
            </div>
            <Field label="中文内容">
              <TextArea
                rows={3}
                value={draft.contentZh}
                onChange={(event) => setDraft({ ...draft, contentZh: event.target.value })}
              />
            </Field>
            <Field label="英文内容">
              <TextArea
                rows={2}
                value={draft.content}
                onChange={(event) => setDraft({ ...draft, content: event.target.value })}
              />
            </Field>
            <Field label="操作步骤" hint="每行一个步骤，保存为数组。">
              <TextArea
                rows={4}
                value={draft.stepsText}
                onChange={(event) => setDraft({ ...draft, stepsText: event.target.value })}
                placeholder={'Fork 仓库\n创建分支\n提交 Pull Request'}
              />
            </Field>
            <Field label="代码示例（可选）">
              <TextArea
                rows={3}
                value={draft.codeExample}
                onChange={(event) => setDraft({ ...draft, codeExample: event.target.value })}
                className="font-mono text-xs"
              />
            </Field>
            <InlineError message={modalError} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除获取条件"
        description={
          <>
            将删除「{deleting?.titleZh || deleting?.title}」。删除后无法恢复，如需保留请先复制内容。
          </>
        }
        confirmLabel="删除条件"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// 攻略教程
// ---------------------------------------------------------------------------

interface GuideDraft {
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  coverImage: string;
  readingTime: string;
}

const EMPTY_GUIDE: GuideDraft = {
  title: '',
  titleZh: '',
  content: '',
  contentZh: '',
  coverImage: '',
  readingTime: '5',
};

function GuidesSection({ detail, onChanged }: SubProps) {
  const [draft, setDraft] = useState<GuideDraft | null>(null);
  const [editing, setEditing] = useState<AdminGuide | null>(null);
  const [deleting, setDeleting] = useState<AdminGuide | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  function openNew() {
    setEditing(null);
    setModalError(null);
    setDraft({ ...EMPTY_GUIDE });
  }

  function openEdit(item: AdminGuide) {
    setEditing(item);
    setModalError(null);
    setDraft({
      title: item.title,
      titleZh: item.titleZh,
      content: item.content,
      contentZh: item.contentZh,
      coverImage: item.coverImage ?? '',
      readingTime: String(item.readingTime ?? 5),
    });
  }

  async function save() {
    if (!draft || busy) return;
    if (!draft.title.trim() && !draft.titleZh.trim()) {
      setModalError('请至少填写中/英文标题之一。');
      return;
    }
    const body = {
      title: draft.title.trim() || draft.titleZh.trim(),
      titleZh: draft.titleZh.trim() || draft.title.trim(),
      content: draft.content.trim(),
      contentZh: draft.contentZh.trim(),
      coverImage: draft.coverImage.trim() || null,
      readingTime: Number(draft.readingTime) || 5,
    };
    setBusy(true);
    setModalError(null);
    try {
      if (editing) {
        await adminFetch(`/admin/achievements/${detail.id}/guides/${editing.id}`, {
          method: 'PATCH',
          body,
        });
      } else {
        await adminFetch(`/admin/achievements/${detail.id}/guides`, {
          method: 'POST',
          body,
        });
      }
      setDraft(null);
      await onChanged();
    } catch (err) {
      setModalError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/admin/achievements/${detail.id}/guides/${deleting.id}`, {
        method: 'DELETE',
      });
      setDeleting(null);
      await onChanged();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionShell
      icon={<BookOpen size={15} />}
      title="获取教程"
      description="面向读者的分步教程，可附带封面图与预计阅读时间。"
      count={detail.guides.length}
      onAdd={openNew}
      addLabel="新增教程"
    >
      <InlineError message={error} />
      {detail.guides.length === 0 ? (
        <EmptyBlock title="还没有教程" description="教程会展示在勋章详情页的攻略区块。" />
      ) : (
        <ul className="space-y-2">
          {detail.guides.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">{item.titleZh || item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                  {item.contentZh || item.content}
                </p>
                <p className="mt-1 text-[11px] text-[var(--color-ink-subtle)]">
                  阅读时间约 {item.readingTime} 分钟
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>
                  <Pencil size={13} />
                  编辑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                  onClick={() => setDeleting(item)}
                  aria-label="删除教程"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={editing ? '编辑教程' : '新增教程'}
        width="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDraft(null)} disabled={busy}>
              取消
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}>
              {busy ? '保存中…' : '保存教程'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="中文标题">
                <TextInput
                  value={draft.titleZh}
                  onChange={(event) => setDraft({ ...draft, titleZh: event.target.value })}
                />
              </Field>
              <Field label="英文标题">
                <TextInput
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </Field>
            </div>
            <Field label="中文正文">
              <TextArea
                rows={6}
                value={draft.contentZh}
                onChange={(event) => setDraft({ ...draft, contentZh: event.target.value })}
              />
            </Field>
            <Field label="英文正文">
              <TextArea
                rows={4}
                value={draft.content}
                onChange={(event) => setDraft({ ...draft, content: event.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="封面图 URL">
                <TextInput
                  value={draft.coverImage}
                  onChange={(event) => setDraft({ ...draft, coverImage: event.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <Field label="阅读时间（分钟）">
                <TextInput
                  type="number"
                  min={1}
                  value={draft.readingTime}
                  onChange={(event) => setDraft({ ...draft, readingTime: event.target.value })}
                />
              </Field>
            </div>
            <InlineError message={modalError} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除教程"
        description={<>将删除教程「{deleting?.titleZh || deleting?.title}」，此操作不可恢复。</>}
        confirmLabel="删除教程"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// 资料来源
// ---------------------------------------------------------------------------

interface SourceDraft {
  title: string;
  url: string;
  sourceType: SourceType;
  credibility: Credibility;
  status: string;
  note: string;
  isDisputed: boolean;
  verifiedAt: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_SOURCE: SourceDraft = {
  title: '',
  url: '',
  sourceType: 'OFFICIAL_DOC',
  credibility: 'C',
  status: 'ACTIVE',
  note: '',
  isDisputed: false,
  verifiedAt: todayIso(),
};

function SourcesSection({ detail, onChanged }: SubProps) {
  const [draft, setDraft] = useState<SourceDraft | null>(null);
  const [deleting, setDeleting] = useState<AdminSource | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  function openNew() {
    setModalError(null);
    setDraft({ ...EMPTY_SOURCE, verifiedAt: todayIso() });
  }

  async function save() {
    if (!draft || busy) return;
    if (!draft.title.trim() || !draft.url.trim()) {
      setModalError('标题与链接都不能为空。');
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await adminFetch(`/admin/achievements/${detail.id}/sources`, {
        method: 'POST',
        body: {
          title: draft.title.trim(),
          url: draft.url.trim(),
          sourceType: draft.sourceType,
          credibility: draft.credibility,
          status: draft.status,
          note: draft.note.trim() || null,
          isDisputed: draft.isDisputed,
          verifiedAt: new Date(`${draft.verifiedAt}T00:00:00.000Z`).toISOString(),
        },
      });
      setDraft(null);
      await onChanged();
    } catch (err) {
      setModalError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/admin/achievements/${detail.id}/sources/${deleting.id}`, {
        method: 'DELETE',
      });
      setDeleting(null);
      await onChanged();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionShell
      icon={<Link2 size={15} />}
      title="资料来源"
      description="每条来源都应有可访问链接与可信度。API 未提供 PATCH，修改来源需删除后重新添加。"
      count={detail.sources.length}
      onAdd={openNew}
      addLabel="新增来源"
    >
      <InlineError message={error} />
      {detail.sources.length === 0 ? (
        <EmptyBlock
          title="还没有资料来源"
          description="至少添加一条官方文档或社区实测来源，才能支撑门槛与条件。"
        />
      ) : (
        <ul className="space-y-2">
          {detail.sources.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[13px] font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {item.title}
                  </a>
                  <Badge tone="muted">{SOURCE_TYPE_META[item.sourceType] ?? item.sourceType}</Badge>
                  <Badge tone="muted">可信度 {item.credibility}</Badge>
                  <Badge tone={item.isDisputed ? 'warning' : 'success'}>
                    {item.isDisputed ? '存在争议' : item.status}
                  </Badge>
                </div>
                <p className="mt-0.5 break-all font-mono text-[10px] text-[var(--color-ink-subtle)]">
                  {item.url}
                </p>
                {item.note && (
                  <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">{item.note}</p>
                )}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                onClick={() => setDeleting(item)}
                aria-label="删除来源"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title="新增资料来源"
        description="保存后立即生效；如需修改，请删除旧记录后重新添加。"
        width="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDraft(null)} disabled={busy}>
              取消
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}>
              {busy ? '保存中…' : '添加来源'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="标题" required className="sm:col-span-2">
              <TextInput
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="GitHub Docs — About achievements"
              />
            </Field>
            <Field label="链接" required className="sm:col-span-2">
              <TextInput
                value={draft.url}
                onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                placeholder="https://docs.github.com/…"
              />
            </Field>
            <Field label="来源类型">
              <SelectInput
                value={draft.sourceType}
                onChange={(event) =>
                  setDraft({ ...draft, sourceType: event.target.value as SourceType })
                }
              >
                {(Object.keys(SOURCE_TYPE_META) as SourceType[]).map((type) => (
                  <option key={type} value={type}>
                    {SOURCE_TYPE_META[type]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="可信度">
              <SelectInput
                value={draft.credibility}
                onChange={(event) =>
                  setDraft({ ...draft, credibility: event.target.value as Credibility })
                }
              >
                {CREDIBILITY_OPTIONS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="来源状态">
              <SelectInput
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              >
                {SOURCE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="核实日期">
              <TextInput
                type="date"
                value={draft.verifiedAt}
                onChange={(event) => setDraft({ ...draft, verifiedAt: event.target.value })}
              />
            </Field>
            <Field label="备注" className="sm:col-span-2">
              <TextArea
                rows={2}
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <CheckboxRow
                label="标记为存在争议"
                description="多个来源说法不一致时勾选，前台会提示读者谨慎参考。"
                checked={draft.isDisputed}
                onChange={(checked) => setDraft({ ...draft, isDisputed: checked })}
              />
            </div>
            <div className="sm:col-span-2">
              <InlineError message={modalError} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除资料来源"
        description={<>将删除来源「{deleting?.title}」，此操作不可恢复。</>}
        confirmLabel="删除来源"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------

function SectionShell({
  icon,
  title,
  description,
  count,
  onAdd,
  addLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold">
            <span className="text-[var(--color-accent)]">{icon}</span>
            {title}
            <span className="ml-1 rounded-full bg-[var(--color-surface-raised)] px-1.5 text-[10px] tabular-nums text-[var(--color-ink-subtle)]">
              {count}
            </span>
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
            {description}
          </p>
        </div>
        {onAdd && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>
            <Plus size={13} />
            {addLabel ?? '新增'}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
