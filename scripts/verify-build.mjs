import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Use temporary storage and individually allocated loopback ports.
const tempDir = await mkdtemp(join(tmpdir(), 'gach-smoke-'));
const ports = [createServer(), createServer(), createServer()];
const apps = [];
const secret = () => randomBytes(32).toString('hex');

function launch(label, executable, args, options) {
  const child = spawn(executable, args, { stdio: 'inherit', ...options });
  const done = once(child, 'exit').then(([code, signal]) => {
    if (code !== 0) throw new Error(`${label} exited with ${signal ?? code}`);
  });
  // Attach a handler immediately so startup failures reach the main cleanup.
  done.catch(() => {});
  apps.push({ child, done });
  return { child, done };
}

async function waitFor(url, processDone, validate) {
  const ready = (async () => {
    const deadline = Date.now() + 180_000;
    while (Date.now() < deadline) {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) }).catch(() => null);
      if (response?.ok && await validate(response)) return;
      await response?.body?.cancel().catch(() => {});
      await delay(500);
    }
    throw new Error(`No valid response from ${url}`);
  })();
  await Promise.race([
    ready,
    processDone.then(() => { throw new Error(`Process exited before serving ${url}`); }),
  ]);
  console.log(`PASS ${url}`);
}

async function runNpm(args) {
  await launch('npm ' + args.join(' '), process.execPath, [process.env.npm_execpath, ...args]).done;
}

try {
  await Promise.all(ports.map(async (server) => {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
  }));
  const [apiPort, dbPort, webPort] = ports.map((server) => server.address().port);
  const apiBase = `http://127.0.0.1:${apiPort}/api/v1`;
  const webBase = `http://127.0.0.1:${webPort}`;
  await Promise.all(ports.map((server) => new Promise((resolve) => server.close(resolve))));

  await runNpm(['run', 'build', '-w', '@gach/shared']);
  await runNpm(['run', 'build:api']);
  const api = launch('API', process.execPath, ['dist/main.js'], {
    cwd: 'apps/api',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      API_HOST: '127.0.0.1',
      PORT: String(apiPort),
      API_PREFIX: '/api/v1',
      WEB_ORIGIN: webBase,
      DB_PROVIDER: 'pglite',
      DB_AUTO_PUSH: 'true',
      DB_AUTO_SEED: 'true',
      PGLITE_REUSE_EXTERNAL: 'false',
      PGLITE_DATA_DIR: join(tempDir, 'database'),
      PGLITE_PORT: String(dbPort),
      JWT_SECRET: secret(),
      REFRESH_TOKEN_SECRET: secret(),
      TOKEN_ENCRYPTION_KEY: secret(),
      ADMIN_EMAIL: 'smoke@gach.invalid',
      ADMIN_PASSWORD: secret(),
      REDIS_URL: '',
    },
  });
  await waitFor(`${apiBase}/achievements?pageSize=1`, api.done, async (response) => {
    const data = await response.json();
    return data.items?.length === 1;
  });

  const webEnv = {
    ...process.env,
    API_INTERNAL_URL: apiBase,
    API_BUILD_URL: apiBase,
    NEXT_OUTPUT: '',
    NEXT_DEPLOYMENT_ID: 'gach-build-smoke',
    NEXT_TELEMETRY_DISABLED: '1',
  };
  const next = '../../node_modules/next/dist/bin/next';
  await launch('Next.js build', process.execPath, [next, 'build'], {
    cwd: 'apps/web',
    env: webEnv,
  }).done;
  const web = launch('Web', process.execPath, [next, 'start', '-H', '127.0.0.1', '-p', String(webPort)], {
    cwd: 'apps/web',
    env: webEnv,
  });
  await waitFor(`${webBase}/healthz`, web.done, async (response) => (await response.text()).trim() === 'ok');
  await waitFor(`${webBase}/api/v1/health/ready`, web.done, async (response) => Boolean(await response.json()));
  await waitFor(`${webBase}/achievements/pull-shark`, web.done, async (response) => {
    const html = await response.text();
    return html.includes('Pull Shark') && html.includes('官方资料') && html.includes('社区证据');
  });
} finally {
  for (const { child, done } of apps.reverse()) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await done.catch(() => {});
  }
  await rm(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
}
