#!/usr/bin/env node
/**
 * Build and verify the static Web artifact consumed by the Tauri and
 * Capacitor wrappers.
 *
 * Keeping this in a script (instead of relying on shell-specific
 * `NEXT_OUTPUT=export` syntax) makes the workspace command work on Windows,
 * macOS, Linux and CI alike. The script intentionally fails if Next.js does
 * not produce an index.html; callers must never silently fall back to a shell
 * page when they requested a real export.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(APP_DIR, '..', '..');
const NEXT_BIN = join(REPO_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
const OUT_DIR = join(APP_DIR, 'out');

function fail(message) {
  console.error(`[export-static] ✗ ${message}`);
  process.exit(1);
}

if (!existsSync(NEXT_BIN)) {
  fail(`未找到 Next.js CLI：${NEXT_BIN}。请先在仓库根目录执行 npm ci。`);
}

console.log('[export-static] 开始生成 Next.js 静态导出…');
const result = spawnSync(process.execPath, [NEXT_BIN, 'build'], {
  cwd: APP_DIR,
  stdio: 'inherit',
  env: { ...process.env, NEXT_OUTPUT: 'export' },
});

if (result.error) fail(`Next.js 构建进程启动失败：${result.error.message}`);
if (result.status !== 0) fail(`Next.js 静态导出失败（exit code ${result.status ?? 'unknown'}）。`);

const indexFile = join(OUT_DIR, 'index.html');
if (!existsSync(indexFile)) {
  fail(`构建完成但缺少 ${indexFile}；拒绝把不完整产物交给桌面/移动端。`);
}

function countFiles(dir, predicate) {
  let count = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) count += countFiles(full, predicate);
    else if (predicate(full)) count += 1;
  }
  return count;
}

const htmlCount = countFiles(OUT_DIR, (file) => file.endsWith('.html'));
const assetCount = countFiles(OUT_DIR, (file) => /\.(?:js|css|json|svg|png|webp|ico)$/.test(file));

console.log(`[export-static] ✓ 输出目录：${OUT_DIR}`);
console.log(`[export-static] ✓ HTML 页面：${htmlCount}`);
console.log(`[export-static] ✓ 静态资源：${assetCount}`);
