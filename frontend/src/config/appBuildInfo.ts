/**
 * Canonical app version + short build identifier.
 * Values come from `scripts/write-build-info.mjs` (package.json + git/CI SHA).
 * Dirty local worktrees append `-dirty` to BUILD_VERSION.
 */
import { APP_VERSION, BUILD_VERSION } from '../generated/buildInfo';

export function getAppVersion(): string {
  return typeof APP_VERSION === 'string' && APP_VERSION.length > 0 ? APP_VERSION : '0.0.0';
}

/** Short commit / build id (7-char SHA, optionally `-dirty`). */
export function getBuildId(): string {
  return typeof BUILD_VERSION === 'string' && BUILD_VERSION.length > 0 ? BUILD_VERSION : 'dev';
}

export function isBuildDirty(): boolean {
  return getBuildId().endsWith('-dirty');
}

/** Discreet Mais footer label, e.g. `Versão 0.1.0-beta · build 51bb0c1-dirty`. */
export function formatAppBuildLabel(locale: 'pt' | 'en' = 'pt'): string {
  const versionWord = locale === 'en' ? 'Version' : 'Versão';
  return `${versionWord} ${getAppVersion()} · build ${getBuildId()}`;
}
