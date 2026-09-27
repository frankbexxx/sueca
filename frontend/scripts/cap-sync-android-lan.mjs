/**
 * OPTIONAL multi-device LAN sync (not default).
 * Prefer: npm run android:dev:prepare (adb reverse → http://127.0.0.1:8787).
 *
 * LAN path still needs DHCP IP + inbound firewall + cleartext/mixed-content.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.SUECAO_ANDROID_ALLOW_MIXED_CONTENT = 'true';

console.warn(
  '[cap-sync-android-lan] Prefer android:dev:prepare (adb reverse). LAN is for multi-device only.'
);

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: frontendRoot,
    env: process.env,
    stdio: 'inherit',
    shell: true
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('npm', ['run', 'build:android']);
run('npx', ['cap', 'sync', 'android']);
run('node', ['scripts/apply-android-debug-cleartext.mjs']);
