/**
 * Android debug prep: adb reverse → 127.0.0.1:8787 (no LAN DHCP/firewall).
 *
 * Steps:
 * 1) verify adb device
 * 2) adb reverse tcp:8787 tcp:8787
 * 3) host backend /health
 * 4) soft device nc -z (informational)
 * 5) build:android + cap sync + debug cleartext
 * 6) optional --install: adb install + WebView fetch /health (hard gate)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUTH_URL = 'http://127.0.0.1:8787';
const wantInstall = process.argv.includes('--install');

function log(msg) {
  console.log(`[android:dev:prepare] ${msg}`);
}

function fail(msg) {
  console.error(`[android:dev:prepare] FAIL: ${msg}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd || frontendRoot,
    env: { ...process.env, ...opts.env },
    stdio: 'inherit',
    shell: true
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  return r;
}

function runCapture(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: frontendRoot,
    env: process.env,
    encoding: 'utf8',
    shell: opts.shell !== false
  });
  return {
    status: r.status ?? 1,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim()
  };
}

function sleepMs(ms) {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${ms})`], { stdio: 'ignore' });
}

// 1) adb device
const devices = runCapture('adb', ['devices']);
const lines = devices.stdout.split(/\r?\n/).filter((l) => /\tdevice$/.test(l));
if (lines.length < 1) fail('no adb device in "device" state');
log(`adb device: ${lines[0].split(/\t/)[0]}`);

// 2) reverse
run('adb', ['reverse', 'tcp:8787', 'tcp:8787']);
const rev = runCapture('adb', ['reverse', '--list']);
if (!/tcp:8787/.test(rev.stdout)) fail(`adb reverse not listed:\n${rev.stdout}`);
log(`adb reverse ok: ${rev.stdout.replace(/\s+/g, ' ')}`);

// 3) host health
let hostBody = runCapture('curl.exe', ['-s', '-m', '3', `${AUTH_URL}/health`]).stdout;
if (!/"ok"\s*:\s*true/.test(hostBody)) {
  hostBody = runCapture('curl', ['-s', '-m', '3', `${AUTH_URL}/health`]).stdout;
}
if (
  !/"ok"\s*:\s*true/.test(hostBody) ||
  !/"accountAuthDb"\s*:\s*true/.test(hostBody) ||
  !/"googleAudiencesConfigured"\s*:\s*true/.test(hostBody)
) {
  fail(`host ${AUTH_URL}/health failed: ${hostBody}`);
}
log(`host health: ${hostBody}`);

// 4) soft device probe
const zProbe = runCapture('adb', ['shell', 'toybox', 'nc', '-z', '-w', '3', '127.0.0.1', '8787']);
log(
  zProbe.status === 0
    ? 'device nc -z 127.0.0.1:8787 ok'
    : `device nc -z inconclusive (status=${zProbe.status}); WebView probe required after install`
);

// 5) build + sync
log(`building android with VITE_AUTH_API_BASE_URL=${AUTH_URL}`);
const buildEnv = {
  VITE_AUTH_API_BASE_URL: AUTH_URL,
  SUECAO_ANDROID_ALLOW_MIXED_CONTENT: 'true'
};
run('npm', ['run', 'build:android'], { env: buildEnv });
run('npx', ['cap', 'sync', 'android'], { env: buildEnv });
run('node', ['scripts/apply-android-debug-cleartext.mjs']);

log('assembleDebug…');
run('.\\gradlew.bat', ['assembleDebug'], { cwd: path.join(frontendRoot, 'android') });

const apk = path.join(
  frontendRoot,
  'android/app/build/outputs/apk/debug/app-debug.apk'
);

if (!wantInstall) {
  log(`APK ready (pass --install to push): ${apk}`);
  log('PASS');
  process.exit(0);
}

log('adb install -r …');
run('adb', ['install', '-r', apk]);
run('adb', ['reverse', 'tcp:8787', 'tcp:8787']);
log('installed + reverse re-applied');

log('launching app for WebView /health probe…');
run('adb', ['shell', 'am', 'force-stop', 'com.suecao.cardgames']);
run('adb', ['shell', 'am', 'start', '-n', 'com.suecao.cardgames/.MainActivity']);

let appPid = '';
for (let i = 0; i < 20; i += 1) {
  appPid = runCapture('adb', ['shell', 'pidof', '-s', 'com.suecao.cardgames']).stdout.trim();
  if (appPid) break;
  sleepMs(500);
}
if (!appPid) fail('app did not start');

runCapture('adb', ['forward', '--remove', 'tcp:9222']);
run('adb', ['forward', 'tcp:9222', `localabstract:webview_devtools_remote_${appPid}`]);
sleepMs(3000);

const exprPath = path.join(frontendRoot, '.tmp', 'webview-health.expr.js');
fs.mkdirSync(path.dirname(exprPath), { recursive: true });
fs.writeFileSync(
  exprPath,
  `(async () => {
  try {
    const r = await fetch('http://127.0.0.1:8787/health');
    const j = await r.json();
    return { ok: true, status: r.status, body: j };
  } catch (e) {
    return { ok: false, name: e && e.name, message: String((e && e.message) || e) };
  }
})()`,
  'utf8'
);

const probe = runCapture(process.execPath, ['scripts/oppo-cdp-eval.mjs', '--file', exprPath], {
  shell: false
});
log(`webview health probe: ${probe.stdout || probe.stderr}`);
if (probe.status !== 0) fail(`WebView CDP health probe failed: ${probe.stderr || probe.stdout}`);

let parsed;
try {
  parsed = JSON.parse(probe.stdout);
} catch {
  fail(`WebView health probe non-JSON: ${probe.stdout}`);
}
if (
  !parsed?.ok ||
  parsed?.body?.ok !== true ||
  parsed?.body?.accountAuthDb !== true ||
  parsed?.body?.googleAudiencesConfigured !== true
) {
  fail(`device WebView cannot reach ${AUTH_URL}/health via adb reverse: ${JSON.stringify(parsed)}`);
}
log('device WebView /health PASS');
log('PASS');
