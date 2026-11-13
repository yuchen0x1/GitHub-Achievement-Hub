#!/usr/bin/env node
// Verify Tauri/minisign signatures with the configured public key before
// assembling release assets. No private signing material is read here.
import { createHash, createPublicKey, verify } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Expected MAJOR.MINOR.PATCH');
const config = JSON.parse(readFileSync(join(root, 'apps/desktop/src-tauri/tauri.conf.json'), 'utf8'));
const keyLines = Buffer.from(config.plugins.updater.pubkey, 'base64').toString('utf8').trim().split(/\r?\n/);
const key = Buffer.from(keyLines[1], 'base64');
if (key.length !== 42 || key.subarray(0, 2).toString() !== 'Ed') throw new Error('Invalid public key');
const publicKey = createPublicKey({
  key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), key.subarray(10)]),
  format: 'der', type: 'spki',
});

function verifiedSignature(file) {
  const signature = readFileSync(`${file}.sig`, 'utf8').trim();
  const lines = Buffer.from(signature, 'base64').toString('utf8').trim().split(/\r?\n/);
  const packet = Buffer.from(lines[1] ?? '', 'base64');
  if (packet.length !== 74 || packet.subarray(0, 2).toString() !== 'ED' || !packet.subarray(2, 10).equals(key.subarray(2, 10))) {
    throw new Error(`Invalid signature packet: ${file}`);
  }
  const comment = lines[2]?.replace(/^trusted comment: /, '');
  if (!comment?.split('\t').includes(`version:${version}`)) throw new Error(`Signed version mismatch: ${file}`);
  const hash = createHash('blake2b512').update(readFileSync(file)).digest();
  const validFile = verify(null, hash, publicKey, packet.subarray(10));
  const validComment = verify(null, Buffer.concat([packet.subarray(10), Buffer.from(comment)]), publicKey, Buffer.from(lines[3] ?? '', 'base64'));
  if (!validFile || !validComment) throw new Error(`Signature verification failed: ${file}`);
  return signature;
}

const bundle = join(root, 'apps/desktop/src-tauri/target/release/bundle');
const specifications = [
  ['nsis', `GitHub Achievement Hub_${version}_x64-setup.exe`, `GitHub-Achievement-Hub_${version}_x64-setup.exe`],
  ['msi', `GitHub Achievement Hub_${version}_x64_en-US.msi`, `GitHub-Achievement-Hub_${version}_x64_en-US.msi`],
];
// Check all packages before writing any manifest.
const artifacts = specifications.map(([type, source, name]) => ({ type, name, file: join(bundle, type, source), signature: verifiedSignature(join(bundle, type, source)) }));
const output = join(root, '.release', `v${version}`);
mkdirSync(output, { recursive: true });
const notes = readFileSync(join(root, 'docs/releases/release-notes.md'), 'utf8').split(`## v${version} · `)[1]?.split('\n## ')[0];
if (!notes) throw new Error('Missing release notes');
const body = notes.slice(notes.indexOf('\n')).trim();
const platforms = {};
const files = [];
for (const artifact of artifacts) {
  copyFileSync(artifact.file, join(output, artifact.name));
  copyFileSync(`${artifact.file}.sig`, join(output, `${artifact.name}.sig`));
  files.push(artifact.name, `${artifact.name}.sig`);
  const entry = {
    signature: artifact.signature,
    url: `https://github.com/yuchen0x1/GitHub-Achievement-Hub/releases/download/v${version}/${artifact.name}`,
  };
  platforms[`windows-x86_64-${artifact.type}`] = entry;
  if (artifact.type === 'nsis') platforms['windows-x86_64'] = entry;
}
writeFileSync(join(output, 'latest.json'), JSON.stringify({ version, notes: body, pub_date: new Date().toISOString(), platforms }, null, 2) + '\n');
writeFileSync(join(output, 'release-notes.md'), `# GitHub Achievement Hub v${version}\n\n${body}\n`);
files.push('latest.json');
const sums = files.map(name => `${createHash('sha256').update(readFileSync(join(output, name))).digest('hex')}  ${name}`);
writeFileSync(join(output, 'SHA256SUMS.txt'), sums.join('\n') + '\n');
console.log(`PASS: ${artifacts.length} package signatures and signed version ${version} verified; release assets: ${output}`);
