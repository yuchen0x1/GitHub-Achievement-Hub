'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, UserCheck, Users } from 'lucide-react';
import {
  adminFetch,
  currentAdminProfile,
  describeError,
  formatDateTime,
  useDebouncedValue,
} from '../_components/admin-api';
import {
  ROLE_META,
  totalPagesOf,
  type AdminUserItem,
  type RawPage,
  type UserRole,
} from '../_components/admin-types';
import {
  AdminPageHeader,
  Badge,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  InlineError,
  LoadingBlock,
  Modal,
  PaginationBar,
  SearchInput,
  SelectInput,
  TD,
  TH,
  TableWrap,
  TextInput,
  Toolbar,
} from '../_components/admin-ui';

const PAGE_SIZE = 10;
const ROLES: UserRole[] = ['USER', 'EDITOR', 'ADMIN'];

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RawPage<AdminUserItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [roleTarget, setRoleTarget] = useState<AdminUserItem | null>(null);
  const [roleValue, setRoleValue] = useState<UserRole>('USER');
  const [roleConfirm, setRoleConfirm] = useState('');
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<AdminUserItem | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const me = currentAdminProfile();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
      const res = await adminFetch<RawPage<AdminUserItem>>(`/admin/users?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  function openRole(item: AdminUserItem) {
    setRoleTarget(item);
    setRoleValue(item.role);
    setRoleConfirm('');
    setRoleError(null);
    setMessage(null);
  }

  async function saveRole() {
    if (!roleTarget || roleBusy) return;
    if (roleConfirm.trim() !== '确认') {
      setRoleError('请输入「确认」以继续。');
      return;
    }
    if (roleValue === roleTarget.role) {
      setRoleError('角色没有变化。');
      return;
    }
    setRoleBusy(true);
    setRoleError(null);
    try {
      await adminFetch(`/admin/users/${roleTarget.id}/role`, {
        method: 'PATCH',
        body: { role: roleValue },
      });
      setMessage(
        `已将 ${roleTarget.email} 的角色从 ${ROLE_META[roleTarget.role].label} 调整为 ${ROLE_META[roleValue].label}。`,
      );
      setRoleTarget(null);
      await load();
    } catch (err) {
      setRoleError(describeError(err));
    } finally {
      setRoleBusy(false);
    }
  }

  async function toggleStatus() {
    if (!statusTarget) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      const nextActive = !statusTarget.isActive;
      await adminFetch(`/admin/users/${statusTarget.id}/status`, {
        method: 'PATCH',
        body: { isActive: nextActive },
      });
      setMessage(
        `已${nextActive ? '启用' : '停用'}账号 ${statusTarget.email}。${
          nextActive ? '' : '该用户将无法继续登录。'
        }`,
      );
      setStatusTarget(null);
      await load();
    } catch (err) {
      setStatusError(describeError(err));
    } finally {
      setStatusBusy(false);
    }
  }

  const items = data?.items ?? [];
  const totalPages = data ? totalPagesOf(data) : 1;

  return (
    <div className="animate-fade-up space-y-5">
      <AdminPageHeader
        eyebrow="USERS"
        title="用户管理"
        description="查询用户、调整角色与启用状态。列表只展示公开资料与统计数据，接口不会下发密码哈希或任何 token。"
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            刷新
          </button>
        }
      />

      <Toolbar>
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="搜索邮箱或昵称…"
        />
        <span className="text-[11px] text-[var(--color-ink-subtle)]">
          共 {data?.total ?? 0} 位用户
        </span>
      </Toolbar>

      {message && (
        <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs text-[var(--color-success)]">
          {message}
        </div>
      )}

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyBlock title="没有匹配的用户" description="尝试更换搜索关键词。" />
      ) : (
        <>
          <TableWrap minWidth={900}>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <tr>
                <th className={TH}>用户</th>
                <th className={TH}>角色</th>
                <th className={TH}>状态</th>
                <th className={TH}>获得 / 收藏</th>
                <th className={TH}>注册时间</th>
                <th className={TH}>最后登录</th>
                <th className={TH}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const roleMeta = ROLE_META[item.role] ?? { label: item.role, tone: 'muted' as const };
                const isSelf = me?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <td className={TD}>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface-sunken)] text-[11px] font-bold">
                          {(item.displayName || item.email).slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">
                            {item.displayName}
                            {isSelf && (
                              <span
                                className="ml-1.5 rounded px-1 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]"
                                style={{
                                  backgroundColor:
                                    'color-mix(in oklab, var(--color-accent) 14%, transparent)',
                                }}
                              >
                                当前账号
                              </span>
                            )}
                          </p>
                          <p className="truncate font-mono text-[11px] text-[var(--color-ink-subtle)]">
                            {item.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      <Badge tone={roleMeta.tone}>{roleMeta.label}</Badge>
                    </td>
                    <td className={TD}>
                      <Badge tone={item.isActive ? 'success' : 'danger'}>
                        {item.isActive ? '已启用' : '已停用'}
                      </Badge>
                    </td>
                    <td className={`${TD} whitespace-nowrap tabular-nums text-xs text-[var(--color-ink-muted)]`}>
                      {item._count.userAchievements} / {item._count.favorites}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-[11px] text-[var(--color-ink-subtle)]`}>
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-[11px] text-[var(--color-ink-subtle)]`}>
                      {item.lastLoginAt ? formatDateTime(item.lastLoginAt) : '从未登录'}
                    </td>
                    <td className={TD}>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openRole(item)}
                        >
                          <ShieldCheck size={13} />
                          改角色
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setStatusError(null);
                            setStatusTarget(item);
                          }}
                        >
                          {item.isActive ? <UserCheck size={13} /> : <CheckCircle2 size={13} />}
                          {item.isActive ? '停用' : '启用'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>

          <PaginationBar page={page} totalPages={totalPages} total={data?.total} onChange={setPage} />
        </>
      )}

      {/* 角色变更 */}
      <Modal
        open={Boolean(roleTarget)}
        onClose={() => setRoleTarget(null)}
        title="调整用户角色"
        description="角色决定后台访问权限：ADMIN 与 EDITOR 可进入后台，USER 不可。"
        width="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setRoleTarget(null)}
              disabled={roleBusy}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void saveRole()}
              disabled={roleBusy || roleConfirm.trim() !== '确认' || roleValue === roleTarget?.role}
            >
              {roleBusy ? '保存中…' : '保存角色'}
            </button>
          </>
        }
      >
        {roleTarget && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[var(--color-warning)] bg-[var(--color-surface-raised)] p-3 text-xs leading-relaxed">
              正在调整 <span className="font-mono">{roleTarget.email}</span>
              <br />
              当前角色：
              <span className="font-semibold">{ROLE_META[roleTarget.role].label}</span>
              {roleValue !== roleTarget.role && (
                <>
                  {' → '}
                  <span className="font-semibold text-[var(--color-accent)]">
                    {ROLE_META[roleValue].label}
                  </span>
                </>
              )}
            </div>
            <Field label="新角色">
              <SelectInput
                value={roleValue}
                onChange={(event) => {
                  setRoleValue(event.target.value as UserRole);
                  setRoleConfirm('');
                }}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_META[role].label}（{role}）
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field
              label="输入「确认」以继续"
              required
              hint={roleTarget.id === me?.id ? '这是你当前登录的账号，降级后将立即失去后台权限。' : undefined}
            >
              <TextInput
                value={roleConfirm}
                onChange={(event) => setRoleConfirm(event.target.value)}
                placeholder="确认"
              />
            </Field>
            <InlineError message={roleError} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.isActive ? '停用用户' : '启用用户'}
        description={
          <>
            将{statusTarget?.isActive ? '停用' : '启用'}账号{' '}
            <span className="font-mono">{statusTarget?.email}</span>。
            {statusTarget?.isActive
              ? ' 停用后该用户无法登录，已获得的收藏与进度数据会保留。'
              : ' 启用后该用户可以重新登录。'}
          </>
        }
        confirmLabel={statusTarget?.isActive ? '确认停用' : '确认启用'}
        tone={statusTarget?.isActive ? 'warning' : 'accent'}
        requireText="确认"
        busy={statusBusy}
        error={statusError}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => void toggleStatus()}
      />

      <p className="flex items-center gap-2 text-[11px] text-[var(--color-ink-subtle)]">
        <Users size={13} />
        接口仅返回 id / 邮箱 / 昵称 / 角色 / 状态 / 时间与统计，不含密码哈希或 token。
      </p>
    </div>
  );
}
