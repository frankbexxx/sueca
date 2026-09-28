/**
 * @vitest-environment node
 * REL-LEGAL-01D1 — Play v1 advertising permission strip
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  applyAndroidPlayV1Permissions,
  applyPlayV1PermissionRemovalsToXml,
  PLAY_V1_REMOVED_PERMISSIONS
} from '../../scripts/apply-android-play-v1-permissions.mjs';

describe('Android Play v1 permission removals', () => {
  it('lists AD_ID / AdServices / install-referrer permissions', () => {
    expect(PLAY_V1_REMOVED_PERMISSIONS).toContain('com.google.android.gms.permission.AD_ID');
    expect(PLAY_V1_REMOVED_PERMISSIONS).toContain(
      'android.permission.ACCESS_ADSERVICES_AD_ID'
    );
    expect(PLAY_V1_REMOVED_PERMISSIONS).toContain(
      'com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE'
    );
  });

  it('injects tools:node=remove and xmlns:tools', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`;
    const out = applyPlayV1PermissionRemovalsToXml(xml);
    expect(out).toMatch(/xmlns:tools="http:\/\/schemas\.android\.com\/tools"/);
    expect(out).toMatch(
      /com\.google\.android\.gms\.permission\.AD_ID" tools:node="remove"/
    );
    expect(out).toMatch(/android\.permission\.INTERNET"/);
    expect(out).not.toMatch(/USE_CREDENTIALS.*tools:node="remove"/);
  });

  it('is idempotent and drops prior positive AD_ID decls', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="com.google.android.gms.permission.AD_ID" />
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`;
    const once = applyPlayV1PermissionRemovalsToXml(xml);
    const twice = applyPlayV1PermissionRemovalsToXml(once);
    expect(twice).toBe(once);
    expect(once.match(/tools:node="remove"/g)?.length).toBe(
      PLAY_V1_REMOVED_PERMISSIONS.length
    );
    expect(once).toMatch(/com\.google\.android\.gms\.permission\.AD_ID" tools:node="remove"/);
  });

  it('applyAndroidPlayV1Permissions writes main manifest', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'suecao-play-v1-perm-'));
    const mainDir = path.join(root, 'src/main');
    fs.mkdirSync(mainDir, { recursive: true });
    fs.writeFileSync(
      path.join(mainDir, 'AndroidManifest.xml'),
      `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:label="@string/app_name" />
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`,
      'utf8'
    );

    const result = applyAndroidPlayV1Permissions(root);
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(true);
    const main = fs.readFileSync(path.join(mainDir, 'AndroidManifest.xml'), 'utf8');
    expect(main).toMatch(/tools:node="remove"/);
    expect(main).toMatch(/AD_ID/);
  });
});
