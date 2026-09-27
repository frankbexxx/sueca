/**
 * @vitest-environment node
 * AUTH-01D closeout — cleartext / mixed-content policy
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveAndroidAllowMixedContent } from '../../capacitor.config';
import {
  applyAndroidDebugCleartext,
  stripUsesCleartextTraffic
} from '../../scripts/apply-android-debug-cleartext.mjs';

describe('Android cleartext / mixed-content policy', () => {
  it('allowMixedContent defaults false (release-safe)', () => {
    expect(resolveAndroidAllowMixedContent({})).toBe(false);
    expect(resolveAndroidAllowMixedContent({ SUECAO_ANDROID_ALLOW_MIXED_CONTENT: '' })).toBe(
      false
    );
    expect(resolveAndroidAllowMixedContent({ SUECAO_ANDROID_ALLOW_MIXED_CONTENT: 'false' })).toBe(
      false
    );
  });

  it('allowMixedContent opt-in only via SUECAO_ANDROID_ALLOW_MIXED_CONTENT=true', () => {
    expect(
      resolveAndroidAllowMixedContent({ SUECAO_ANDROID_ALLOW_MIXED_CONTENT: 'true' })
    ).toBe(true);
  });

  it('stripUsesCleartextTraffic removes attribute from main manifest XML', () => {
    const xml = `<?xml version="1.0"?>
<manifest>
  <application
      android:theme="@style/AppTheme"
      android:usesCleartextTraffic="true">
  </application>
</manifest>
`;
    const out = stripUsesCleartextTraffic(xml);
    expect(out).not.toMatch(/usesCleartextTraffic/);
    expect(out).toMatch(/android:theme="@style\/AppTheme"/);
  });

  it('applyAndroidDebugCleartext strips main and writes debug overlay', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'suecao-cleartext-'));
    const mainDir = path.join(root, 'src/main');
    fs.mkdirSync(mainDir, { recursive: true });
    fs.writeFileSync(
      path.join(mainDir, 'AndroidManifest.xml'),
      `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="@string/app_name"
        android:usesCleartextTraffic="true">
    </application>
</manifest>
`,
      'utf8'
    );

    const result = applyAndroidDebugCleartext(root);
    expect(result.ok).toBe(true);
    expect(result.mainHasCleartext).toBe(false);
    expect(result.debugHasCleartext).toBe(true);

    const main = fs.readFileSync(path.join(mainDir, 'AndroidManifest.xml'), 'utf8');
    expect(main).not.toMatch(/usesCleartextTraffic/);

    const debug = fs.readFileSync(path.join(root, 'src/debug/AndroidManifest.xml'), 'utf8');
    expect(debug).toMatch(/usesCleartextTraffic="true"/);
    expect(debug).toMatch(/Debug-only/);
  });
});
