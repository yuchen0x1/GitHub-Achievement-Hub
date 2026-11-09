'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch, registerAuthRefreshHandler } from './api';
import type { AuthUser } from './types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  hydrate: () => Promise<void>;
}

const AUTH_PATH = '/auth';
let hydratePromise: Promise<void> | null = null;
let refreshPromise: Promise<string> | null = null;

function isNativeRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as Window & { __TAURI__?: unknown }).__TAURI__ ||
      document.querySelector('meta[name="gach-runtime"]'),
  );
}

/**
 * 客户端认证状态。
 *
 * 安全说明：
 * - Web 端只持久化用户资料，refresh token 由 httpOnly Cookie 承载；
 * - 桌面端 / 移动端静态壳没有同源 Cookie 代理，因此才持久化两类 token。
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,

      async hydrate() {
        if (get().hydrated) return;
        if (hydratePromise) return hydratePromise;

        hydratePromise = (async () => {
          try {
            const refreshToken = get().refreshToken;
            const res = await apiFetch<{
              user: AuthUser;
              accessToken?: string;
              refreshToken?: string;
            }>(`${AUTH_PATH}/refresh`, {
              method: 'POST',
              body: refreshToken ? { refreshToken } : undefined,
              credentials: 'include',
              skipAuthRefresh: true,
            });
            set({
              user: res.user,
              accessToken: res.accessToken ?? get().accessToken,
              refreshToken: res.refreshToken ?? get().refreshToken,
              hydrated: true,
            });
          } catch {
            // 未登录或 refresh 失效 → 保持匿名状态
            set({ user: null, accessToken: null, refreshToken: null, hydrated: true });
          } finally {
            hydratePromise = null;
          }
        })();

        return hydratePromise;
      },

      async login(email, password) {
        const res = await apiFetch<{
          user: AuthUser;
          accessToken: string;
          refreshToken: string;
        }>(`${AUTH_PATH}/login`, {
          method: 'POST',
          body: { email, password },
          credentials: 'include',
        });
        set({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          hydrated: true,
        });
      },

      async register(email, password, displayName) {
        const res = await apiFetch<{
          user: AuthUser;
          accessToken: string;
          refreshToken: string;
        }>(`${AUTH_PATH}/register`, {
          method: 'POST',
          body: { email, password, displayName },
          credentials: 'include',
        });
        set({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          hydrated: true,
        });
      },

      loginWithTokens(accessToken, refreshToken, user) {
        set({ accessToken, refreshToken, user, hydrated: true });
      },

      async logout() {
        try {
          await apiFetch(`${AUTH_PATH}/logout`, {
            method: 'POST',
            credentials: 'include',
            body: { refreshToken: get().refreshToken ?? undefined },
          });
        } catch {
          /* 即使请求失败也要清理本地状态 */
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },

      async refresh() {
        if (refreshPromise) {
          await refreshPromise;
          return;
        }

        const token = get().refreshToken;
        refreshPromise = (async () => {
          const res = await apiFetch<{
            user: AuthUser;
            accessToken: string;
            refreshToken: string;
          }>(`${AUTH_PATH}/refresh`, {
            method: 'POST',
            body: token ? { refreshToken: token } : undefined,
            credentials: 'include',
            skipAuthRefresh: true,
          });
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
          });
          return res.accessToken;
        })()
          .catch((error) => {
            set({ user: null, accessToken: null, refreshToken: null });
            throw error;
          })
          .finally(() => {
            refreshPromise = null;
          });

        await refreshPromise;
      },

      setUser(user) {
        set({ user });
      },
    }),
    {
      name: 'gach-auth',
      partialize: (state) => ({
        ...(isNativeRuntime()
          ? {
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
            }
          : {}),
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setUser(state.user ?? null);
        if (!isNativeRuntime()) {
          useAuthStore.setState({ accessToken: null, refreshToken: null });
        }
      },
    },
  ),
);

registerAuthRefreshHandler(async () => {
  await useAuthStore.getState().refresh();
  return useAuthStore.getState().accessToken;
});
