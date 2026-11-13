#!/usr/bin/env node
/**
 * 准备桌面端前端产物。
 *
 * 流程：
 *   1. 重新生成 `apps/web/out`，避免把旧界面打进新版本（--no-build 除外）。
 *   2. 复制 `apps/web/out` → `apps/desktop/dist`（tauri.conf.json 的 frontendDist）。
 *   3. 把 `src/runtime/*.js` 放进 `dist/__gach/`。
 *   4. 给每个 HTML 的 `</head>` 前注入运行期脚本（API base + 离线缓存）。
 *
 * 用法：
 *   node scripts/prepare-dist.mjs            # 自动导出 + 复制 + 注入
 *   node scripts/prepare-dist.mjs --no-build # 只复制 + 注入（out 必须已存在）
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(HERE, '..');
const REPO_ROOT = resolve(APP_DIR, '..', '..');
const WEB_OUT = join(REPO_ROOT, 'apps', 'web', 'out');
const DIST = join(APP_DIR, 'dist');
const RUNTIME_SRC = join(APP_DIR, 'src', 'runtime');

const NO_BUILD = process.argv.includes('--no-build');
// 允许降级到本地壳页：仅在明确开启时生效（避免静默产出「假前端」）
const ALLOW_SHELL =
  process.env.GACH_ALLOW_SHELL_FALLBACK === '1' || process.argv.includes('--allow-shell');
const SHELL_DIR = join(APP_DIR, 'src', 'shell');

function log(msg) {
  console.log(`[prepare-dist] ${msg}`);
}

function fail(msg) {
  console.error(`[prepare-dist] ✗ ${msg}`);
  process.exit(1);
}

/* ------------------------------------------------ 1. 确保静态导出产物 */

let sourceDir = WEB_OUT;

if (!NO_BUILD) {
  log('生成当前源码的 Web 静态产物…');
  const result = spawnSync(process.execPath, [join(REPO_ROOT, 'apps', 'web', 'scripts', 'export-static.mjs')], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) fail('Web 静态导出失败，拒绝使用旧的缓存产物发布。');
}

if (!existsSync(join(WEB_OUT, 'index.html'))) {
  if (NO_BUILD) {
    log(`未找到 ${WEB_OUT}/index.html（已指定 --no-build）`);
  } else {
    log('未找到静态导出产物，开始构建 Web（NEXT_OUTPUT=export）…');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = spawnSync(npm, ['run', 'build', '-w', '@gach/web'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: { ...process.env, NEXT_OUTPUT: 'export' },
      shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
      log(`⚠ Web 静态导出失败（exit code ${result.status}）`);
    }
  }

  if (existsSync(join(WEB_OUT, 'index.html'))) {
    sourceDir = WEB_OUT;
  } else if (ALLOW_SHELL) {
    sourceDir = SHELL_DIR;
    log('⚠ 降级使用本地壳页 src/shell（GACH_ALLOW_SHELL_FALLBACK=1）');
    log('⚠ 该产物不包含真实 Web 界面，仅用于验证桌面端工具链');
  } else {
    fail(
      'Web 静态导出产物不可用。\n' +
        '  修复 Web 端 export 问题后执行：\n' +
        '    cd apps/web && NEXT_OUTPUT=export npx next build\n' +
        '  或临时降级到本地壳页：\n' +
        '    node scripts/prepare-dist.mjs --allow-shell',
    );
  }
}

/* ------------------------------------------------------- 2. 复制产物 */

log(`复制 ${sourceDir} → ${DIST}`);
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(sourceDir, DIST, { recursive: true });

/* --------------------------------------------------- 3. 放置运行期脚本 */

const RUNTIME_FILES = ['api-base.js', 'offline-cache.js'];
const runtimeOut = join(DIST, '__gach');
mkdirSync(runtimeOut, { recursive: true });
for (const file of RUNTIME_FILES) {
  const src = join(RUNTIME_SRC, file);
  if (!existsSync(src)) fail(`缺少运行期脚本 ${src}`);
  cpSync(src, join(runtimeOut, file));
  log(`注入运行期脚本 ${file}`);
}

/* --------------------------------------------------------- 4. 注入 HTML */

const SNIPPET = [
  '<meta name="gach-runtime" content="desktop" />',
  '<script src="/__gach/api-base.js"></script>',
  '<script src="/__gach/offline-cache.js"></script>',
].join('\n    ');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlFiles = walk(DIST);
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
  const next = html.slice(0, idx) + '  ' + SNIPPET + '\n  ' + html.slice(idx);
  writeFileSync(file, next, 'utf8');
  injected++;
}

log(`HTML 注入完成：${injected} 个已注入，${skipped} 个跳过（共 ${htmlFiles.length} 个）`);
log(`完成。frontendDist = ${DIST}`);
