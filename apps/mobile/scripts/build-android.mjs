#!/usr/bin/env node
/**
 * 跨平台构建 Android Debug APK。
 *
 * 等价于：
 *   cd android && ./gradlew assembleDebug      (macOS / Linux)
 *   cd android && gradlew.bat assembleDebug    (Windows)
 *
 * 前置：
 *   - 已执行 `npx cap add android`
 *   - ANDROID_HOME / ANDROID_SDK_ROOT 指向 Android SDK
 *   - JDK 17+（Capacitor 8 推荐 JDK 21）
 *
 * 用法：node scripts/build-android.mjs [额外 gradle 参数...]
 */

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(HERE, '..');
const ANDROID_DIR = join(APP_DIR, 'android');

if (!existsSync(ANDROID_DIR)) {
  console.error(
    '[build-android] ✗ 未找到 android/ 目录。请先执行：\n' +
      '  npx cap add android && npx cap sync android',
  );
  process.exit(1);
}

if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  console.warn(
    '[build-android] ⚠ 未检测到 ANDROID_HOME / ANDROID_SDK_ROOT，Gradle 可能找不到 SDK。',
  );
}

const isWindows = process.platform === 'win32';
const gradlew = isWindows ? 'gradlew.bat' : './gradlew';
const extra = process.argv.slice(2);

console.log(`[build-android] 执行 ${gradlew} ${['assembleDebug', ...extra].join(' ')}`);

const result = spawnSync(gradlew, ['assembleDebug', ...extra], {
  cwd: ANDROID_DIR,
  stdio: 'inherit',
  shell: isWindows,
});

if (result.status !== 0) {
  console.error(`[build-android] ✗ 构建失败（exit code ${result.status}）`);
  process.exit(result.status ?? 1);
}

console.log('[build-android] ✓ 构建成功');
console.log(
  '[build-android] APK 路径：android/app/build/outputs/apk/debug/app-debug.apk',
);
