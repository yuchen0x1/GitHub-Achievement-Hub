'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';

const AUTO_CHECK_KEY = 'gach.desktop.auto-update-check';
const LAST_CHECK_KEY = 'gach.desktop.last-update-check';
const DISMISSED_VERSION_KEY = 'gach.desktop.dismissed-update-version';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

type DownloadEvent =
  | { event: 'Started'; data: { contentLength?: number } }
  | { event: 'Progress'; data: { chunkLength: number } }
  | { event: 'Finished' };

type UpdateHandle = {
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
  download: (onEvent?: (event: DownloadEvent) => void) => Promise<void>;
  install: (options?: { restartAfterInstall?: boolean }) => Promise<void>;
  close: () => Promise<void>;
};

type Status = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'latest' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(date);
}

function isAutoCheckEnabled(): boolean {
  return window.localStorage.getItem(AUTO_CHECK_KEY) !== 'false';
}

export function DesktopUpdater() {
  const [isTauri, setIsTauri] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [update, setUpdate] = useState<UpdateHandle | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState<number | undefined>();
  const [dismissed, setDismissed] = useState(false);
  const updateRef = useRef<UpdateHandle | null>(null);
  const totalRef = useRef<number | undefined>(undefined);
  const mountedRef = useRef(true);

  const checkForUpdate = useCallback(async (silent = false) => {
    if (!mountedRef.current) return;
    setStatus('checking');
    if (!silent) setMessage('正在检查稳定版更新…');

    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const found = (await check({ timeout: 12_000 })) as UpdateHandle | null;
      if (!mountedRef.current) {
        await found?.close();
        return;
      }

      const previous = updateRef.current;
      if (previous && previous !== found) await previous.close().catch(() => undefined);
      updateRef.current = found;
      setUpdate(found);
      setDismissed(
        Boolean(
          silent &&
            found &&
            window.localStorage.getItem(DISMISSED_VERSION_KEY) === found.version,
        ),
      );
      window.localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));

      if (found) {
        setStatus('available');
        setMessage(`发现新版本 ${found.version}`);
      } else {
        setStatus('latest');
        setMessage('当前已是最新版本');
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setStatus(silent ? 'idle' : 'error');
      if (!silent) {
        setMessage(error instanceof Error ? error.message : '更新检查失败，请稍后重试');
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function initialize() {
      try {
        const { isTauri: detectTauri } = await import('@tauri-apps/api/core');
        if (cancelled || !detectTauri()) return;
        setIsTauri(true);
        const enabled = isAutoCheckEnabled();
        setAutoCheck(enabled);
        const lastCheck = Number(window.localStorage.getItem(LAST_CHECK_KEY) ?? '0');
        if (enabled && Date.now() - lastCheck >= CHECK_INTERVAL_MS) {
          await checkForUpdate(true);
        }
      } catch {
        // A normal browser build has no Tauri runtime. It must remain unaffected.
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      const current = updateRef.current;
      if (current) void current.close().catch(() => undefined);
    };
  }, [checkForUpdate]);

  const installUpdate = async () => {
    const current = updateRef.current;
    if (!current) return;
    setStatus('downloading');
    setMessage(`正在下载 ${current.version}…`);
    setDownloaded(0);
    setProgress(0);
    setTotal(undefined);
    totalRef.current = undefined;

    let downloadError: unknown;
    let downloadedSuccessfully = false;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await current.download((event) => {
          if (event.event === 'Started') {
            totalRef.current = event.data.contentLength;
            setTotal(event.data.contentLength);
          } else if (event.event === 'Progress') {
            setDownloaded((value) => {
              const next = value + event.data.chunkLength;
              setProgress((currentProgress) =>
                totalRef.current && totalRef.current > 0
                  ? Math.min(100, Math.round((next / totalRef.current) * 100))
                  : currentProgress,
              );
              return next;
            });
          }
        });
        downloadedSuccessfully = true;
        break;
      } catch (error) {
        downloadError = error;
        if (attempt === 1) {
          setMessage('下载失败，正在重试…');
          setDownloaded(0);
          setProgress(0);
          totalRef.current = undefined;
        }
      }
    }

    if (!downloadedSuccessfully) {
      setStatus('error');
      setMessage(downloadError instanceof Error ? downloadError.message : '更新下载失败，当前版本保持不变');
      return;
    }

    try {
      setStatus('ready');
      setMessage('下载完成，正在校验签名并安装…');
      await current.install({ restartAfterInstall: true });
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '更新安装失败，当前版本保持不变');
    }
  };

  const toggleAutoCheck = (enabled: boolean) => {
    setAutoCheck(enabled);
    window.localStorage.setItem(AUTO_CHECK_KEY, String(enabled));
  };

  const remindLater = () => {
    if (!update) return;
    window.localStorage.setItem(DISMISSED_VERSION_KEY, update.version);
    setDismissed(true);
  };

  if (!isTauri) return null;

  const date = formatDate(update?.date);
  return (
    <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="桌面端更新">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={16} className="text-[var(--color-success)]" />
            桌面端更新
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            仅从 GitHub Releases 获取稳定版，并在安装前校验 Tauri 更新签名。
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void checkForUpdate(false)}
          disabled={status === 'checking' || status === 'downloading' || status === 'ready'}
        >
          <RefreshCw size={14} className={status === 'checking' ? 'animate-spin' : undefined} />
          检查更新
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-ink-muted)]">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoCheck}
            onChange={(event) => toggleAutoCheck(event.target.checked)}
          />
          启动后每日自动检查
        </label>
        {status === 'latest' && <span className="text-[var(--color-success)]">{message}</span>}
        {status === 'error' && <span className="text-[var(--color-danger)]">{message}</span>}
      </div>

      {update && !dismissed && (status === 'available' || status === 'downloading' || status === 'ready') && (
        <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">新版本 {update.version}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                {date ? `发布时间：${date}` : '稳定版更新'}
                {total ? ` · ${formatBytes(total)}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={remindLater}
                disabled={status === 'downloading' || status === 'ready'}
              >
                稍后提醒
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void installUpdate()}
                disabled={status === 'downloading' || status === 'ready'}
              >
                <Download size={14} />
                {status === 'ready' ? '安装中…' : '立即更新'}
              </button>
            </div>
          </div>
          {update.body && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-ink-muted)]">
              {update.body}
            </p>
          )}
          {status === 'downloading' && (
            <div className="mt-3" aria-live="polite">
              <div className="mb-1 flex justify-between text-xs text-[var(--color-ink-muted)]">
                <span>{message}</span>
                <span>{total ? `${progress}%` : formatBytes(downloaded)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                <div className="h-full rounded-full bg-[var(--color-accent)] transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status === 'ready' && <p className="mt-3 text-xs text-[var(--color-success)]">{message}</p>}
        </div>
      )}
      </div>
    </section>
  );
}
