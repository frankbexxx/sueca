/**
 * AUTH-01C/D — authenticated fetch helpers for Account API only.
 * Single refresh-in-flight; on refresh failure clear Suecão session only.
 * Do NOT use for multiplayer.
 */
import { getMe, refreshSession, AccountAuthApiError } from './accountAuthApi';
import {
  clearAuthSessionStorage,
  clearAuthSessionStorageDurable,
  getAccessTokenMemory,
  readRefreshToken,
  setAccessTokenMemory,
  writeRefreshTokenDurable
} from './authSessionStorage';

type FetchFn = typeof fetch;

let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessTokenOnce(fetchFn: FetchFn = fetch): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = readRefreshToken();
    if (!refresh) return null;
    try {
      const session = await refreshSession(refresh, fetchFn);
      setAccessTokenMemory(session.accessToken);
      await writeRefreshTokenDurable(session.refreshToken);
      return session.accessToken;
    } catch {
      try {
        await clearAuthSessionStorageDurable();
      } catch {
        clearAuthSessionStorage();
      }
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function ensureValidAccessToken(fetchFn: FetchFn = fetch): Promise<string | null> {
  const existing = getAccessTokenMemory();
  if (existing) return existing;
  return refreshAccessTokenOnce(fetchFn);
}

/**
 * Refresh once if needed, then call getMe. On failure clear session tokens only.
 */
export async function fetchMeWithSession(fetchFn: FetchFn = fetch) {
  let access = getAccessTokenMemory();
  if (!access) {
    access = await refreshAccessTokenOnce(fetchFn);
  }
  if (!access) {
    throw new AccountAuthApiError('No session', 401, 'unauthorized');
  }
  try {
    return await getMe(access, fetchFn);
  } catch (err) {
    if (err instanceof AccountAuthApiError && err.status === 401) {
      access = await refreshAccessTokenOnce(fetchFn);
      if (!access) throw err;
      return getMe(access, fetchFn);
    }
    throw err;
  }
}

/** Test helper */
export function __resetAccountAuthFetchForTests(): void {
  refreshInFlight = null;
}
