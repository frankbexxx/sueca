/**
 * Production-bundle boot smoke.
 * Builds (optional), serves dist via vite preview, opens Chromium (playwright),
 * asserts #root mounts and fails on TDZ / uncaught init pageerrors.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(frontendRoot, 'dist');
const require = createRequire(import.meta.url);

function log(msg) {
  console.log(`[smoke:boot] ${msg}`);
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureDist() {
  const indexHtml = path.join(distDir, 'index.html');
  const force = process.env.SUECAO_SMOKE_REBUILD === '1' || process.argv.includes('--rebuild');
  if (!force && fs.existsSync(indexHtml)) {
    log('reusing existing dist/');
    return;
  }
  log('building production bundle…');
  await new Promise((resolve, reject) => {
    const p = spawn('npm', ['run', 'build'], {
      cwd: frontendRoot,
      env: process.env,
      stdio: 'inherit',
      shell: true
    });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build exit ${code}`))));
  });
}

async function withPreview(fn) {
  const port = Number(process.env.SUECAO_SMOKE_PORT || 4173);
  log(`starting vite preview on :${port}`);
  const preview = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: frontendRoot, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], shell: true }
  );
  let ready = false;
  const onData = (buf) => {
    const s = String(buf);
    if (/Local:/i.test(s) || /http:\/\/127\.0\.0\.1/i.test(s)) ready = true;
  };
  preview.stdout?.on('data', onData);
  preview.stderr?.on('data', onData);

  const deadline = Date.now() + 20000;
  while (!ready && Date.now() < deadline) {
    if (preview.exitCode != null) throw new Error(`preview exited early: ${preview.exitCode}`);
    await wait(200);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) ready = true;
    } catch {
      /* wait */
    }
  }
  if (!ready) {
    preview.kill('SIGTERM');
    throw new Error('vite preview did not become ready');
  }

  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    if (preview.pid) {
      try {
        spawnSync(process.platform === 'win32' ? 'taskkill' : 'kill',
          process.platform === 'win32'
            ? ['/PID', String(preview.pid), '/T', '/F']
            : ['-TERM', String(preview.pid)],
          { stdio: 'ignore', shell: true }
        );
      } catch {
        preview.kill('SIGTERM');
      }
    }
  }
}

async function runInChromium(baseUrl) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    try {
      ({ chromium } = require('playwright'));
    } catch {
      throw new Error(
        'playwright is required for test:smoke:boot — run: npm i -D playwright && npx playwright install chromium'
      );
    }
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(baseUrl + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return !!(root && root.childElementCount > 0);
    },
    { timeout: 15000 }
  );

  const bodyText = await page.evaluate(() => (document.body?.innerText || '').slice(0, 400));
  await browser.close();

  if (pageErrors.length) {
    console.error('[smoke:boot] page errors:', pageErrors);
    throw new Error(`boot smoke failed: ${pageErrors[0]}`);
  }
  if (!/SUEC|Entrar|Sueca/i.test(bodyText)) {
    throw new Error(`boot smoke: unexpected body content: ${bodyText.slice(0, 120)}`);
  }
  log('PASS — root mounted, no init pageerror');
}

async function main() {
  await ensureDist();
  await withPreview(runInChromium);
}

main().catch((err) => {
  console.error('[smoke:boot] FAIL', err?.message || err);
  process.exit(1);
});
