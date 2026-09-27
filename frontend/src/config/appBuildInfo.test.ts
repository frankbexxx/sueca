/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { formatAppBuildLabel, getAppVersion, getBuildId, isBuildDirty } from './appBuildInfo';
import { APP_VERSION, BUILD_VERSION } from '../generated/buildInfo';

describe('appBuildInfo', () => {
  it('exposes package version and short build id', () => {
    expect(getAppVersion()).toBe(APP_VERSION);
    expect(getBuildId()).toBe(BUILD_VERSION);
    expect(getAppVersion().length).toBeGreaterThan(0);
    expect(getBuildId().length).toBeGreaterThanOrEqual(3);
    expect(isBuildDirty()).toBe(BUILD_VERSION.endsWith('-dirty'));
  });

  it('formats discreet Mais label without Landing dependency', () => {
    const pt = formatAppBuildLabel('pt');
    const en = formatAppBuildLabel('en');
    expect(pt).toBe(`Versão ${APP_VERSION} · build ${BUILD_VERSION}`);
    expect(en).toBe(`Version ${APP_VERSION} · build ${BUILD_VERSION}`);
  });
});
