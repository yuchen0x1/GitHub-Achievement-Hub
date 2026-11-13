#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TAURI_DIR = join(HERE, '..', 'src-tauri');
const rawVersion = process.env.GITHUB_REF_NAME?.replace(/^v/, '') ?? process.argv[2];

if (!rawVersion || !/^\d+\.\d+\.\d+$/.test(rawVersion)) {
  console.error('[write-release-config] expected a vMAJOR.MINOR.PATCH tag or version argument');
  process.exit(1);
}

mkdirSync(TAURI_DIR, { recursive: true });
const output = join(TAURI_DIR, 'tauri.release.conf.json');
writeFileSync(output, `${JSON.stringify({ version: rawVersion }, null, 2)}\n`, 'utf8');
console.log(`[write-release-config] wrote ${output} for ${rawVersion}`);
