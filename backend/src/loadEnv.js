/**
 * Load backend/.env into process.env when keys are unset.
 * Does not override already-exported environment variables (prod-safe).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function loadLocalEnv(envPath) {
  const resolved =
    envPath ||
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
  if (!fs.existsSync(resolved)) return { loaded: false, path: resolved, keys: 0 };
  const text = fs.readFileSync(resolved, 'utf8');
  let keys = 0;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
      keys += 1;
    }
  }
  return { loaded: true, path: resolved, keys };
}
