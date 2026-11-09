#!/usr/bin/env node
/**
 * 把 Web 静态导出产物同步到 Capacitor 的 `www`，并注入移动端运行期脚本。
 *
 * 流程：
 *   1. 确保 `apps/web/out` 存在（不存在则用 NEXT_OUTPUT=export 现场导出）。
 *   2. 清空并复制 `apps/web/out` → `apps/mobile/www`。
 *   3. 用 `tsc -p tsconfig.json` 把 `src/*.ts` 编译到 `dist/`，
 *      再把编译结果（普通脚本，非 ESM）放到 `www/__gach/`。
 *   4. 生成 `www/__gach/api-base.js`（替换 API 地址占位符）。
 *   5. 在每个 HTML 的 `</head>` 前注入 4 个脚本。
 *
 * 用法：
 *   node scripts/sync-web.mjs
 *   GACH_API_BASE=https://api.example.com/api/v1 node scripts/sync-web.mjs
 *   node scripts/sync-web.mjs --no-build     # 不做 Web 构建，out 必须已存在
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(HERE, '..');
const REPO_ROOT = resolve(APP_DIR, '..', '..');
const WEB_OUT = join(REPO_ROOT, 'apps', 'web', 'out');
const WWW = join(APP_DIR, 'www');
const TSC_DIST = join(APP_DIR, 'dist');
const RUNTIME_SRC = join(APP_DIR, 'src', 'runtime');

const NO_BUILD = process.argv.includes('--no-build');
const ALLOW_SHELL =
  process.env.GACH_ALLOW_SHELL_FALLBACK === '1' || process.argv.includes('--allow-shell');
const API_BASE = (process.env.GACH_API_BASE || '').trim();
const TOKEN = '__GACH_DEFAULT_API_BASE__';

/** Web 导出不可用时的降级页（仅用于验证原生工具链，不是真实界面） */
const SHELL_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="dark" />
<title>GitHub Achievement Hub</title>
<style>
  :root { color-scheme: dark; }
  html, body { height: 100%; margin: 0; }
  body {
    display: grid; place-items: center; padding: 24px;
    background: #0d1117; color: #e6edf3;
    font: 14px/1.6 -apple-system, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif;
  }
  .card {
    width: 100%; max-width: 520px; padding: 24px;
    background: #161b22; border: 1px solid #30363d; border-radius: 14px;
  }
  h1 { font-size: 17px; margin: 0 0 4px; }
  .muted { color: #8b949e; font-size: 12.5px; }
  .warn {
    margin: 16px 0; padding: 10px 14px; border-radius: 8px; font-size: 13px;
    color: #f0b72f; background: rgba(240,183,47,.1); border: 1px solid rgba(240,183,47,.4);
  }
  dl { display: grid; grid-template-columns: 96px 1fr; gap: 8px 12px; font-size: 13px; margin: 0; }
  dt { color: #8b949e; }
  dd { margin: 0; word-break: break-all; font-family: ui-monospace, Consolas, monospace; }
  button {
    margin-top: 20px; width: 100%; padding: 10px; border-radius: 8px; font: inherit;
    color: #e6edf3; background: #21262d; border: 1px solid #30363d;
  }
</style>
</head>
<body>
  <div class="card">
    <h1>GitHub Achievement Hub</h1>
    <div class="muted">移动端本地壳页 · Local shell</div>
    <div class="warn">
      当前为本地壳页。Web 端 <code>output: 'export'</code> 尚未通过，页面内容未就绪。
    </div>
    <dl>
      <dt>API 地址</dt><dd id="api-base">-</dd>
      <dt>缓存后端</dt><dd id="cache">-</dd>
      <dt>网络</dt><dd id="net">-</dd>
    </dl>
    <button id="retry" type="button">重新加载</button>
  </div>
  <script>
    function paint() {
      document.getElementById('api-base').textContent = window.__GACH_API_BASE__ || '(未配置)';
      var c = window.__GACH_CACHE__;
      document.getElementById('cache').textContent = c ? c.backend : '不可用';
      var n = window.__GACH_NETWORK__;
      document.getElementById('net').textContent = n ? (n.status.connected ? '在线' : '离线') : '-';
    }
    document.getElementById('retry').addEventListener('click', function () { location.reload(); });
    window.addEventListener('gach:network', paint);
    document.addEventListener('DOMContentLoaded', paint, { once: true });
  </script>
</body>
</html>
`;

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function log(msg) {
  console.log(`[sync-web] ${msg}`);
}

function fail(msg) {
  console.error(`[sync-web] ✗ ${msg}`);
  process.exit(1);
}

function run(command, args, env) {
  if (process.platform === 'win32') {
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', [command, ...args].join(' ')], {
      cwd: APP_DIR,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
  }
  return spawnSync(command, args, {
    cwd: APP_DIR,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

/* ------------------------------------------------ 1. 确保静态导出产物 */

let useShell = false;

if (!existsSync(join(WEB_OUT, 'index.html'))) {
  if (NO_BUILD) {
    log(`未找到 ${WEB_OUT}/index.html（已指定 --no-build）`);
  } else {
    log('未找到静态导出产物，开始构建 Web（NEXT_OUTPUT=export）…');
    const built = spawnSync(npm, ['run', 'build', '-w', '@gach/web'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, NEXT_OUTPUT: 'export' },
    });
    if (built.status !== 0) {
      log(`⚠ Web 静态导出失败（exit code ${built.status}）`);
    }
  }

  if (!existsSync(join(WEB_OUT, 'index.html'))) {
    if (ALLOW_SHELL) {
      useShell = true;
      log('⚠ 降级使用内置壳页（GACH_ALLOW_SHELL_FALLBACK=1）');
      log('⚠ 该产物不含真实 Web 界面，仅用于验证原生工具链');
    } else {
      fail(
        'Web 静态导出产物不可用。\n' +
          '  修复 Web 端 export 问题后执行：\n' +
          '    cd apps/web && NEXT_OUTPUT=export npx next build\n' +
          '  或临时降级到内置壳页：\n' +
          '    node scripts/sync-web.mjs --allow-shell',
      );
    }
  }
}

/* ------------------------------------------------------- 2. 复制产物 */

rmSync(WWW, { recursive: true, force: true });
mkdirSync(WWW, { recursive: true });

if (useShell) {
  writeFileSync(join(WWW, 'index.html'), SHELL_HTML, 'utf8');
  log(`生成壳页 ${join(WWW, 'index.html')}`);
} else {
  log(`复制 ${WEB_OUT} → ${WWW}`);
  cpSync(WEB_OUT, WWW, { recursive: true });
}

/* ------------------------------------------------- 3. 编译 TS 运行期脚本 */

log('编译 src/*.ts → dist/');
const tsc = run(npx, ['tsc', '-p', 'tsconfig.json']);
if (tsc.status !== 0) {
  fail(`tsc 编译失败（exit code ${tsc.status}）。请先执行 npm install（仓库根目录）`);
}

const compiled = ['offline-cache.js', 'network.js'];
const runtimeOut = join(WWW, '__gach');
mkdirSync(runtimeOut, { recursive: true });

for (const file of compiled) {
  const from = join(TSC_DIST, file);
  if (!existsSync(from)) fail(`编译产物缺失：${from}`);
  cpSync(from, join(runtimeOut, file));
  log(`注入 ${file}`);
}

/* ------------------------------------------------- 4. 生成 api-base.js */

const apiBaseTemplate = join(RUNTIME_SRC, 'api-base.js');
if (!existsSync(apiBaseTemplate)) fail(`缺少模板 ${apiBaseTemplate}`);

let apiBaseSource = readFileSync(apiBaseTemplate, 'utf8');
const occurrences = apiBaseSource.split(TOKEN).length - 1;
if (occurrences !== 1) {
  fail(`api-base.js 中占位符 ${TOKEN} 应恰好出现 1 次，实际 ${occurrences} 次`);
}
apiBaseSource = apiBaseSource.replace(TOKEN, API_BASE || TOKEN);
writeFileSync(join(runtimeOut, 'api-base.js'), apiBaseSource, 'utf8');
log(`注入 api-base.js（API_BASE=${API_BASE || '未配置，运行时回退本地默认'}）`);

/* ----------------------------------------------------------- 5. boot.js */

writeFileSync(
  join(runtimeOut, 'boot.js'),
  [
    '/* 自动生成：启用 fetch 层离线缓存 */',
    '(function () {',
    "  'use strict';",
    '  function ready() {',
    '    var cache = window.__GACH_CACHE__;',
    '    if (cache && typeof cache.installFetchCache === "function") {',
    '      cache.installFetchCache();',
    '    }',
    '  }',
    '  if (document.readyState === "loading") {',
    '    document.addEventListener("DOMContentLoaded", ready, { once: true });',
    '  } else {',
    '    ready();',
    '  }',
    '})();',
    '',
  ].join('\n'),
  'utf8',
);
log('注入 boot.js');

/* --------------------------------------------------------- 6. 注入 HTML */

const SNIPPET = [
  '<meta name="gach-runtime" content="capacitor" />',
  '<script src="/__gach/api-base.js"></script>',
  '<script src="/__gach/offline-cache.js"></script>',
  '<script src="/__gach/boot.js"></script>',
  '<script src="/__gach/network.js"></script>',
].join('\n    ');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlFiles = walk(WWW);
let injected = 0;
let skipped = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  if (html.includes('__gach/api-base.js')) {
    skipped++;
    continue;
  }
  const idx = html.toLowerCase().indexOf('</head>');
  if (idx === -1) {
    skipped++;
    continue;
  }
  writeFileSync(file, html.slice(0, idx) + '  ' + SNIPPET + '\n  ' + html.slice(idx), 'utf8');
  injected++;
}

log(`HTML 注入完成：${injected} 个已注入，${skipped} 个跳过（共 ${htmlFiles.length} 个）`);
log(`完成。webDir = ${WWW}`);
