'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  CheckCircle2,
  FolderTree,
  Inbox,
  Megaphone,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { adminFetch, describeError, formatDateTime, summariseJson } from './_components/admin-api';
import {
  ANNOUNCEMENT_LEVEL_META,
  LOG_ACTION_META,
  LOG_ENTITY_LABELS,
  type AdminAnnouncement,
  type AdminCategoryRow,
  type AdminLogItem,
  type AnnouncementLevel,
  type DashboardData,
  type RawPage,
} from './_components/admin-types';
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
  SelectInput,
  StatCard,
  TD,
  TH,
  TableWrap,
  TextArea,
  TextInput,
} from './_components/admin-ui';

interface DashboardState {
  dashboard: DashboardData;
  logs: AdminLogItem[];
}

export default function AdminDashboardPage() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annLevel, setAnnLevel] = useState<AnnouncementLevel>('INFO');
  const [annBusy, setAnnBusy] = useState(false);
  const [annError, setAnnError] = useState<string | null>(null);
  const [annMessage, setAnnMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminAnnouncement | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadSecondary() {
    const [cats, anns] = await Promise.all([
      adminFetch<AdminCategoryRow[]>('/content/categories').catch(() => [] as AdminCategoryRow[]),
      adminFetch<AdminAnnouncement[]>('/admin/announcements?all=true').catch(
        () => [] as AdminAnnouncement[],
      ),
    ]);
    setCategories(cats);
    setAnnouncements(anns);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, logs] = await Promise.all([
        adminFetch<DashboardData>('/admin/dashboard'),
        adminFetch<RawPage<AdminLogItem>>('/admin/logs?page=1&pageSize=10'),
      ]);
      setState({ dashboard, logs: logs.items });
      await loadSecondary();
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

  async function createAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (annBusy) return;
    if (!annTitle.trim() || !annContent.trim()) {
      setAnnError('标题与内容都不能为空。');
      return;
    }
    setAnnBusy(true);
    setAnnError(null);
    setAnnMessage(null);
    try {
      await adminFetch('/admin/announcements', {
        method: 'POST',
        body: {
          title: annTitle.trim(),
          content: annContent.trim(),
          level: annLevel,
        },
      });
      setAnnTitle('');
      setAnnContent('');
      setAnnLevel('INFO');
      setAnnMessage('公告已发布。');
      await loadSecondary();
    } catch (err) {
      setAnnError(describeError(err));
    } finally {
      setAnnBusy(false);
    }
  }

  async function removeAnnouncement() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await adminFetch(`/admin/announcements/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      await loadSecondary();
    } catch (err) {
      setDeleteError(describeError(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <LoadingBlock label="正在加载后台数据…" />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!state) return null;

  const { dashboard, logs } = state;
  const publishedRate =
    dashboard.totalAchievements > 0
      ? Math.round((dashboard.publishedAchievements / dashboard.totalAchievements) * 100)
      : 0;
  const maxCredibility = Math.max(1, ...dashboard.byCredibility.map((item) => item.count));

  return (
    <div className="animate-fade-up space-y-6">
      <AdminPageHeader
        eyebrow="OVERVIEW"
        title="仪表盘"
        description="所有数字均来自后端实时聚合。最近操作与公告管理同样直接调用管理接口。"
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            刷新数据
          </button>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Link href="/admin/achievements" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label="勋章总数"
            value={dashboard.totalAchievements}
            hint={`草稿 ${dashboard.draftAchievements} 枚`}
            icon={<Award size={17} />}
          />
        </Link>
        <Link href="/admin/achievements" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label="已发布"
            value={dashboard.publishedAchievements}
            hint={`占全部 ${publishedRate}%`}
            icon={<CheckCircle2 size={17} />}
            tone="success"
          />
        </Link>
        <Link href="/admin/content" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label="分类数"
            value={categories.length}
            hint="来自 /content/categories"
            icon={<FolderTree size={17} />}
            tone="accent"
          />
        </Link>
        <Link href="/admin/achievements" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label="攻略数"
            value={dashboard.totalArticles}
            hint="知识库文章总量"
            icon={<BookOpen size={17} />}
            tone="accent"
          />
        </Link>
        <Link href="/admin/users" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label="用户数"
            value={dashboard.totalUsers}
            hint="含管理员与编辑"
            icon={<Users size={17} />}
            tone="accent"
          />
        </Link>
        <Link href="/admin/feedback" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label="待处理反馈"
            value={dashboard.pendingFeedback}
            hint="状态为 PENDING"
            icon={<Inbox size={17} />}
            tone={dashboard.pendingFeedback > 0 ? 'warning' : 'success'}
          />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 可信度分布 */}
        <AdminCard
          title="资料可信度分布"
          description="按全部勋章（含未发布）统计。A 官方 / B 实测 / C 多源 / D 推测。"
        >
          {dashboard.byCredibility.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-subtle)]">暂无数据。</p>
          ) : (
            <ul className="space-y-2.5">
              {['A', 'B', 'C', 'D'].map((grade) => {
                const count =
                  dashboard.byCredibility.find((item) => item.grade === grade)?.count ?? 0;
                return (
                  <li key={grade} className="flex items-center gap-3 text-xs">
                    <span className="w-16 shrink-0 font-mono font-semibold">{grade} 级</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                      <span
                        className="block h-full rounded-full bg-[var(--color-accent)]"
                        style={{ width: `${Math.round((count / maxCredibility) * 100)}%` }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right tabular-nums text-[var(--color-ink-muted)]">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="muted">来源总数 {dashboard.totalSources}</Badge>
            <Badge tone={dashboard.disputedSources > 0 ? 'warning' : 'success'}>
              争议来源 {dashboard.disputedSources}
            </Badge>
            <Badge tone="muted">草稿 {dashboard.draftAchievements}</Badge>
          </div>
        </AdminCard>

        {/* 获取状态分布 */}
        <AdminCard
          title="已发布勋章的获取状态"
          description="用于判断图鉴中「当前可获取」与「已停止发放」的比例。"
        >
          {dashboard.byAvailability.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-subtle)]">暂无已发布勋章。</p>
          ) : (
            <ul className="space-y-1.5">
              {dashboard.byAvailability.map((item) => (
                <li
                  key={item.availability}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs"
                >
                  <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                    {item.availability}
                  </span>
                  <span className="font-semibold tabular-nums">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/achievements"
            className="mt-4 inline-flex text-[11px] font-medium text-[var(--color-accent)] hover:underline"
          >
            前往勋章管理 →
          </Link>
        </AdminCard>
      </div>

      {/* 最近操作日志 */}
      <AdminCard
        title="最近操作日志"
        description="最新的 10 条管理端写操作记录。"
        action={
          <Link href="/admin/logs" className="btn btn-secondary btn-sm">
            查看全部
          </Link>
        }
        bodyClassName="p-0"
      >
        {logs.length === 0 ? (
          <div className="p-5">
            <EmptyBlock title="还没有操作记录" description="管理端的写操作会自动记录到这里。" />
          </div>
        ) : (
          <TableWrap minWidth={640}>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <tr>
                <th className={TH}>时间</th>
                <th className={TH}>操作人</th>
                <th className={TH}>动作</th>
                <th className={TH}>对象</th>
                <th className={TH}>详情</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const action = LOG_ACTION_META[log.action] ?? {
                  label: log.action,
                  tone: 'muted' as const,
                };
                return (
                  <tr
                    key={log.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <td className={`${TD} whitespace-nowrap text-[11px] text-[var(--color-ink-subtle)]`}>
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className={`${TD} whitespace-nowrap`}>{log.userName ?? '系统'}</td>
                    <td className={TD}>
                      <Badge tone={action.tone}>{action.label}</Badge>
                    </td>
                    <td className={`${TD} whitespace-nowrap text-xs`}>
                      {LOG_ENTITY_LABELS[log.entityType] ?? log.entityType}
                      {log.entityId ? (
                        <span className="ml-1 font-mono text-[10px] text-[var(--color-ink-subtle)]">
                          {log.entityId.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className={`${TD} max-w-[320px]`}>
                      <span className="line-clamp-1 font-mono text-[11px] text-[var(--color-ink-muted)]">
                        {summariseJson(log.after)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </AdminCard>

      {/* 公告管理 */}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <AdminCard
          title="发布公告"
          description="公告会展示在前台。发布后立即生效，删除不可恢复。"
        >
          <form className="space-y-3" onSubmit={createAnnouncement}>
            <Field label="标题" required>
              <TextInput
                value={annTitle}
                onChange={(event) => setAnnTitle(event.target.value)}
                maxLength={120}
                placeholder="例如：新增 3 枚 2026 年成就"
              />
            </Field>
            <Field label="内容" required>
              <TextArea
                value={annContent}
                onChange={(event) => setAnnContent(event.target.value)}
                rows={4}
                placeholder="公告正文（纯文本）"
              />
            </Field>
            <Field label="级别">
              <SelectInput
                value={annLevel}
                onChange={(event) => setAnnLevel(event.target.value as AnnouncementLevel)}
              >
                <option value="INFO">通知</option>
                <option value="WARNING">警告</option>
                <option value="IMPORTANT">重要</option>
              </SelectInput>
            </Field>
            <InlineError message={annError} />
            {annMessage && (
              <p className="text-xs text-[var(--color-success)]">{annMessage}</p>
            )}
            <button type="submit" className="btn btn-primary btn-sm" disabled={annBusy}>
              <Plus size={14} />
              {annBusy ? '发布中…' : '发布公告'}
            </button>
          </form>
        </AdminCard>

        <AdminCard
          title="公告列表"
          description="含已停用公告（?all=true）。"
          action={<Badge tone="muted">{announcements.length} 条</Badge>}
        >
          {announcements.length === 0 ? (
            <EmptyBlock title="暂无公告" description="通过左侧表单发布第一条公告。" />
          ) : (
            <ul className="space-y-2">
              {announcements.map((item) => {
                const meta = ANNOUNCEMENT_LEVEL_META[item.level] ?? ANNOUNCEMENT_LEVEL_META.INFO;
                return (
                  <li
                    key={item.id}
                    className="rounded-lg border border-[var(--color-border)] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          {!item.isActive && <Badge tone="muted">已停用</Badge>}
                          <span className="text-[11px] text-[var(--color-ink-subtle)]">
                            {formatDateTime(item.publishedAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] font-semibold">{item.title}</p>
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-ink-muted)]">
                          {item.content}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm shrink-0 text-[var(--color-danger)]"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(item);
                        }}
                        aria-label={`删除公告 ${item.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除公告"
        description={
          <>
            你将永久删除公告「{deleting?.title}」。前端将立即不再展示，此操作不可撤销。
          </>
        }
        confirmLabel="删除公告"
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void removeAnnouncement()}
      />

      <div className="surface-raised flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <Megaphone size={15} className="text-[var(--color-accent)]" />
          公告与操作日志均直接来自 API，未使用本地模拟数据。
        </div>
        <Link href="/admin/content" className="btn btn-ghost btn-sm">
          管理分类与 FAQ →
        </Link>
      </div>
    </div>
  );
}
