/**
 * AUTH-01D closeout — keep cleartext HTTP out of release Android builds.
 *
 * - Strips `android:usesCleartextTraffic` from main AndroidManifest (if present).
 * - Writes `app/src/debug/AndroidManifest.xml` so only debug merges cleartext.
 *
 * Release/main: no global cleartext.
 * Debug: cleartext allowed for LAN Account API during local OPPO smoke.
 *
 * Capacitor `allowMixedContent` stays false unless syncing with
 * SUECAO_ANDROID_ALLOW_MIXED_CONTENT=true (see capacitor.config.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const androidApp = path.resolve(__dirname, '../android/app');
const mainManifest = path.join(androidApp, 'src/main/AndroidManifest.xml');
const debugDir = path.join(androidApp, 'src/debug');
const debugManifest = path.join(debugDir, 'AndroidManifest.xml');

const DEBUG_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<!-- Debug-only: LAN HTTP Account API (AUTH-01D local smoke). Not merged into release. -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:usesCleartextTraffic="true" />
</manifest>
`;

export function stripUsesCleartextTraffic(xml) {
  return xml
    .replace(/\s*android:usesCleartextTraffic\s*=\s*"(true|false)"/g, '')
    .replace(/\r\n/g, '\n');
}

export function applyAndroidDebugCleartext(appRoot = androidApp) {
  const mainPath = path.join(appRoot, 'src/main/AndroidManifest.xml');
  const debugPath = path.join(appRoot, 'src/debug/AndroidManifest.xml');
  if (!fs.existsSync(mainPath)) {
    return { ok: false, reason: 'missing-main-manifest', mainPath };
  }
  const before = fs.readFileSync(mainPath, 'utf8');
  const after = stripUsesCleartextTraffic(before);
  if (after !== before) {
    fs.writeFileSync(mainPath, after, 'utf8');
  }
  fs.mkdirSync(path.dirname(debugPath), { recursive: true });
  fs.writeFileSync(debugPath, DEBUG_MANIFEST, 'utf8');
  return {
    ok: true,
    strippedMain: after !== before,
    debugManifest: debugPath,
    mainHasCleartext: /usesCleartextTraffic\s*=\s*"true"/.test(after),
    debugHasCleartext: true
  };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = applyAndroidDebugCleartext();
  if (!result.ok) {
    console.warn(`[android-debug-cleartext] skip: ${result.reason}`);
    process.exit(0);
  }
  console.log(
    `[android-debug-cleartext] main cleartext stripped=${result.strippedMain}; debug overlay written`
  );
}
