/**
 * REL-LEGAL-01D1 — Play v1: strip advertising-related permissions merged via
 * Capgo Social Login → facebook-core / installreferrer (Auth Conta is soft-hidden;
 * Facebook Login is unused).
 *
 * Idempotent. Safe to run after every `cap sync android`.
 * Does NOT remove USE_CREDENTIALS (Capgo / Credential Manager — retained for later Auth).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const androidApp = path.resolve(__dirname, '../android/app');
const mainManifest = path.join(androidApp, 'src/main/AndroidManifest.xml');

/** Permissions removed for Play v1 (ads/Auth Facebook unused). */
export const PLAY_V1_REMOVED_PERMISSIONS = [
  'com.google.android.gms.permission.AD_ID',
  'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
  'android.permission.ACCESS_ADSERVICES_AD_ID',
  'android.permission.ACCESS_ADSERVICES_CUSTOM_AUDIENCE',
  'com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE'
];

function ensureToolsNamespace(xml) {
  if (/xmlns:tools=/.test(xml)) return xml;
  return xml.replace(
    /<manifest(\s+[^>]*)?>/,
    (full, attrs = '') => {
      if (/xmlns:android=/.test(attrs)) {
        return `<manifest${attrs} xmlns:tools="http://schemas.android.com/tools">`;
      }
      return `<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"${attrs}>`;
    }
  );
}

function removePositivePermissionDecls(xml, permission) {
  const escaped = permission.replace(/\./g, '\\.');
  // Drop affirmative decls only (not tools:node="remove" entries from our block).
  const re = new RegExp(
    `\\s*<uses-permission\\b(?![^>]*tools:node\\s*=\\s*"remove")[^>]*android:name\\s*=\\s*"${escaped}"[^/]*/>`,
    'g'
  );
  return xml.replace(re, '');
}

function buildRemoveBlock() {
  const lines = [
    '',
    '    <!-- REL-LEGAL-01D1 Play v1: strip ads/referrer perms from facebook-core / installreferrer (Capgo transitive). -->'
  ];
  for (const name of PLAY_V1_REMOVED_PERMISSIONS) {
    lines.push(
      `    <uses-permission android:name="${name}" tools:node="remove" />`
    );
  }
  return `${lines.join('\n')}\n`;
}

/**
 * @param {string} xml
 * @returns {string}
 */
export function applyPlayV1PermissionRemovalsToXml(xml) {
  let out = ensureToolsNamespace(xml.replace(/\r\n/g, '\n'));
  // Drop a previously injected block so re-runs stay idempotent.
  out = out.replace(
    /\n\s*<!-- REL-LEGAL-01D1 Play v1:[\s\S]*?(?=\n<\/manifest>)/,
    ''
  );
  for (const name of PLAY_V1_REMOVED_PERMISSIONS) {
    out = removePositivePermissionDecls(out, name);
  }
  if (!/<\/manifest>/.test(out)) {
    throw new Error('AndroidManifest missing </manifest>');
  }
  out = out.replace(/<\/manifest>/, `${buildRemoveBlock()}</manifest>`);
  return out;
}

/**
 * @param {string} [appRoot]
 */
export function applyAndroidPlayV1Permissions(appRoot = androidApp) {
  const mainPath = path.join(appRoot, 'src/main/AndroidManifest.xml');
  if (!fs.existsSync(mainPath)) {
    return { ok: false, reason: 'missing-main-manifest', mainPath };
  }
  const before = fs.readFileSync(mainPath, 'utf8');
  const after = applyPlayV1PermissionRemovalsToXml(before);
  if (after !== before) {
    fs.writeFileSync(mainPath, after, 'utf8');
  }
  return {
    ok: true,
    changed: after !== before,
    mainPath,
    removed: PLAY_V1_REMOVED_PERMISSIONS
  };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = applyAndroidPlayV1Permissions();
  if (!result.ok) {
    console.warn(`[android-play-v1-permissions] skip: ${result.reason}`);
    process.exit(0);
  }
  console.log(
    `[android-play-v1-permissions] applied=${result.changed}; strip=${result.removed.join(', ')}`
  );
}
