/**
 * Sync Android with LAN/dev mixed-content allowed (OPPO local smoke only).
 * Release/default sync: npm run cap:sync:android (allowMixedContent false).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.SUECAO_ANDROID_ALLOW_MIXED_CONTENT = 'true';

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
