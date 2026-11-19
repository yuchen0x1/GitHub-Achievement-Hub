import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const { version, workspaces } = readJson('../package.json');
const lock = readJson('../package-lock.json');
const tag = `v${version}`;
const semver = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const expectedTag = process.argv[2];

if (!semver.test(tag) || (expectedTag && expectedTag !== tag)) {
  throw new Error(`Expected ${tag} as a stable SemVer tag, received ${expectedTag ?? tag}`);
}

const root = fileURLToPath(new URL('../', import.meta.url));
const manifests = ['package.json', ...globSync(workspaces.map((dir) => `${dir}/package.json`), { cwd: root })];
for (const manifestPath of manifests) {
  const path = manifestPath.replaceAll('\\', '/');
  const workspace = path.slice(0, -'package.json'.length).replace(/\/$/, '');
  if (readJson('../' + path).version !== version || lock.packages[workspace]?.version !== version) {
    throw new Error(`Version drift in ${workspace || 'root workspace'}`);
  }
}

if (lock.version !== version || readJson('../apps/desktop/src-tauri/tauri.conf.json').version !== version) {
  throw new Error('Version drift in lockfile or Tauri configuration');
}

if (expectedTag) {
  for (const file of ['CHANGELOG.md', 'docs/releases/release-notes.md']) {
    const entries = readFileSync(new URL('../' + file, import.meta.url), 'utf8').split(/\r?\n/);
    if (!entries.some((line) => line.startsWith(`## ${tag} · `))) {
      throw new Error(`Missing release entry for ${tag} in ${file}`);
    }
  }
}

console.log(`Verified product version ${tag}`);
