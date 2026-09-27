/**
 * AUTH-01C/D — Suecão Account session persistence.
 *
 * Access token: memory only (all platforms).
 * Refresh token:
 *   Web: temporary localStorage `sueca-auth-refresh-v1` (XSS trade-off; NOT final hardened storage —
 *       httpOnly cookie depends on production topology; see AUTH_RELEASE_BASELINE_01F).
 *   Android: Android Keystore via @aparajita/capacitor-secure-storage (NOT Preferences).
 * Google ID token: NEVER persisted.
 *
 * Isolated write surface — do not scatter token storage elsewhere.
 */

import { isAndroidAuthPlatform } from '../platform/authPlatform';
import {
  secureClearRefreshToken,
  secureReadRefreshToken,
  secureWriteRefreshToken
} from './authSecureRefreshStorage';

export const AUTH_REFRESH_STORAGE_KEY = 'sueca-auth-refresh-v1';

/** In-memory access token — not written to durable storage. */
let accessTokenMemory: string | null = null;

/** In-memory refresh cache (warmed from platform store). */
let refreshTokenMemory: string | null = null;
let refreshHydrated = false;

export function getAccessTokenMemory(): string | null {
  return accessTokenMemory;
}

export function setAccessTokenMemory(token: string | null): void {
  accessTokenMemory = token;
}

export function clearAccessTokenMemory(): void {
  accessTokenMemory = null;
}

function readWebRefreshFromLocalStorage(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_REFRESH_STORAGE_KEY);
    if (!raw) return null;
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw) as { refreshToken?: unknown };
      return typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null;
    }
    return raw;
  } catch {
    return null;
  }
}

function writeWebRefreshToLocalStorage(refreshToken: string): void {
  try {
    localStorage.setItem(
      AUTH_REFRESH_STORAGE_KEY,
      JSON.stringify({ refreshToken, updatedAt: Date.now() })
    );
  } catch {
    /* quota — session won't survive reload */
  }
}

function clearWebRefreshFromLocalStorage(): void {
  try {
    localStorage.removeItem(AUTH_REFRESH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Sync read. On Android returns memory only (call hydrateRefreshToken first on cold start).
 * On Web, lazily loads from localStorage into memory.
 */
export function readRefreshToken(): string | null {
  if (refreshTokenMemory != null) return refreshTokenMemory;
  if (isAndroidAuthPlatform()) {
    return null;
  }
  const fromWeb = readWebRefreshFromLocalStorage();
  refreshTokenMemory = fromWeb;
  return fromWeb;
}

/**
 * Load refresh token from platform durable store into memory.
 * Android: Keystore secure storage. Web: localStorage.
 */
export async function hydrateRefreshToken(): Promise<void> {
  if (isAndroidAuthPlatform()) {
    try {
      refreshTokenMemory = await secureReadRefreshToken();
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[authSessionStorage] secure hydrate failed', err);
      }
      refreshTokenMemory = null;
    }
  } else {
    refreshTokenMemory = readWebRefreshFromLocalStorage();
  }
  refreshHydrated = true;
}

export function isRefreshTokenHydrated(): boolean {
  return refreshHydrated;
}

/**
 * Sync write: updates memory immediately; durable write is platform-specific.
 * Prefer writeRefreshTokenDurable on auth success / refresh rotation paths.
 */
export function writeRefreshToken(refreshToken: string): void {
  refreshTokenMemory = refreshToken;
  if (isAndroidAuthPlatform()) {
    void secureWriteRefreshToken(refreshToken).catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[authSessionStorage] secure write failed', err);
      }
    });
    return;
  }
  writeWebRefreshToLocalStorage(refreshToken);
}

export async function writeRefreshTokenDurable(refreshToken: string): Promise<void> {
  refreshTokenMemory = refreshToken;
  if (isAndroidAuthPlatform()) {
    await secureWriteRefreshToken(refreshToken);
    return;
  }
  writeWebRefreshToLocalStorage(refreshToken);
}

export function clearRefreshToken(): void {
  refreshTokenMemory = null;
  if (isAndroidAuthPlatform()) {
    void secureClearRefreshToken().catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[authSessionStorage] secure clear failed', err);
      }
    });
    return;
  }
  clearWebRefreshFromLocalStorage();
}

export async function clearRefreshTokenDurable(): Promise<void> {
  refreshTokenMemory = null;
  if (isAndroidAuthPlatform()) {
    await secureClearRefreshToken();
    return;
  }
  clearWebRefreshFromLocalStorage();
}

export function clearAuthSessionStorage(): void {
  clearAccessTokenMemory();
  clearRefreshToken();
}

export async function clearAuthSessionStorageDurable(): Promise<void> {
  clearAccessTokenMemory();
  await clearRefreshTokenDurable();
}

/** Test helper */
export function __resetAuthSessionStorageForTests(): void {
  accessTokenMemory = null;
  refreshTokenMemory = null;
  refreshHydrated = false;
  clearWebRefreshFromLocalStorage();
}
