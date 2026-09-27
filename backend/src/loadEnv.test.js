import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadLocalEnv } from './loadEnv.js';

test('loadLocalEnv sets missing keys from file and does not override', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'suecao-env-'));
  const envPath = path.join(dir, '.env');
  fs.writeFileSync(
    envPath,
    ['# comment', 'GOOGLE_WEB_CLIENT_ID=web-from-file', 'ALREADY_SET=from-file', ''].join('\n')
  );
  process.env.ALREADY_SET = 'from-process';
  delete process.env.GOOGLE_WEB_CLIENT_ID;

  const result = loadLocalEnv(envPath);
  assert.equal(result.loaded, true);
  assert.equal(process.env.GOOGLE_WEB_CLIENT_ID, 'web-from-file');
  assert.equal(process.env.ALREADY_SET, 'from-process');

  delete process.env.GOOGLE_WEB_CLIENT_ID;
  delete process.env.ALREADY_SET;
  fs.rmSync(dir, { recursive: true, force: true });
});
