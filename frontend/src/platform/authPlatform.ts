/**
 * AUTH-01D — auth platform routing (Web GIS vs Android native Google).
 *
 * Prefer Capacitor native detection. Tests may override via setAuthPlatformForTests.
 */

import { Capacitor } from '@capacitor/core';

export type AuthPlatform = 'web' | 'android' | 'ios';

let platformOverride: AuthPlatform | null = null;

export function setAuthPlatformForTests(platform: AuthPlatform | null): void {
  platformOverride = platform;
}

export function getAuthPlatform(): AuthPlatform {
  if (platformOverride) return platformOverride;
  try {
    if (Capacitor.isNativePlatform()) {
      const p = Capacitor.getPlatform();
      if (p === 'android') return 'android';
      if (p === 'ios') return 'ios';
    }
  } catch {
    /* Capacitor unavailable — treat as web */
  }
  return 'web';
}

export function isAndroidAuthPlatform(): boolean {
  return getAuthPlatform() === 'android';
}

export function isWebAuthPlatform(): boolean {
  return getAuthPlatform() === 'web';
}
