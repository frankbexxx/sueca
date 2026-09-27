/**
 * @vitest-environment jsdom
 * AUTH-01D — Android native Google / Conta platform split / secure refresh
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  AUTH_REFRESH_STORAGE_KEY,
  __resetAuthSessionStorageForTests,
  clearAuthSessionStorage,
  getAccessTokenMemory,
  hydrateRefreshToken,
  readRefreshToken,
  writeRefreshToken,
  writeRefreshTokenDurable
} from './authSessionStorage';
import {
  createMemorySecureRefreshAdapter,
  setSecureRefreshAdapterForTests,
  secureReadRefreshToken
} from './authSecureRefreshStorage';
import {
  __resetAuthStateForTests,
  getAuthState,
  getLocalGuestId,
  restoreAuthSession,
  signInWithAndroidGoogle,
  signInWithGoogleCredential,
  signOut,
  ensureAuthInitialized
} from './authState';
import { __resetLocalGuestCacheForTests, getLocalGuestIdentity, LOCAL_GUEST_KEY } from './localGuestIdentity';
import {
  createAndroidGoogleSignInNonce,
  setAndroidGoogleSignInAdapterForTests
} from './googleAndroidSignIn';
import { setGoogleWebSignInAdapterForTests, setGoogleSignInButtonMounterForTests } from './googleWebSignIn';
import { setAuthPlatformForTests } from '../platform/authPlatform';
import { STATS_KEY, loadLocalStats } from './gameSessionStorage';
import { writeDurableEnvelope } from './durableLocalStorage';
import { AccountScreen } from '../components/screens/AccountScreen';
import { __resetAccountAuthFetchForTests } from './accountAuthFetch';

function mockSession(accountId = 'acc-and') {
  return {
    account: { id: accountId, displayName: 'Android', status: 'active' },
    accessToken: 'access-android-1',
    refreshToken: 'refresh-android-1',
    linkResult: 'created' as const,
    email: 'android@example.com'
  };
}

describe('AUTH-01D Android native Google auth', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetLocalGuestCacheForTests();
    __resetAuthSessionStorageForTests();
    __resetAuthStateForTests();
    __resetAccountAuthFetchForTests();
    setAuthPlatformForTests(null);
    setAndroidGoogleSignInAdapterForTests(null);
    setSecureRefreshAdapterForTests(null);
    setGoogleWebSignInAdapterForTests(null);
    setGoogleSignInButtonMounterForTests(null);
    delete process.env.VITE_GOOGLE_WEB_CLIENT_ID;
    delete process.env.VITE_GOOGLE_ANDROID_CLIENT_ID;
    delete process.env.VITE_AUTH_API_BASE_URL;
    vi.restoreAllMocks();
  });

  it('platform routing: Web mounts GIS; Android never mounts GIS', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';

    setAuthPlatformForTests('web');
    setGoogleWebSignInAdapterForTests(async ({ nonce }) => ({
      ok: true,
      idToken: 'tok',
      nonce
    }));
    const { unmount } = render(<AccountScreen showBack onBack={() => undefined} />);
    await waitFor(() => {
      expect(screen.getByTestId('account-gis-host')).toBeTruthy();
    });
    expect(screen.queryByTestId('account-android-link-google')).toBeNull();
    unmount();

    setAuthPlatformForTests('android');
    process.env.VITE_GOOGLE_ANDROID_CLIENT_ID = 'android-client';
    render(<AccountScreen showBack onBack={() => undefined} />);
    await waitFor(() => {
      expect(screen.getByTestId('account-android-link-google')).toBeTruthy();
    });
    expect(screen.queryByTestId('account-gis-host')).toBeNull();
    expect(screen.getByTestId('account-android-link-google').textContent).toMatch(
      /Ligar conta Google|Link Google/i
    );
  });

  it('Android nonce is cryptographic and unique (separate helper)', () => {
    const a = createAndroidGoogleSignInNonce();
    const b = createAndroidGoogleSignInNonce();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it('native credential success → session; cancel / missing token / backend error', async () => {
    setAuthPlatformForTests('android');
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_GOOGLE_ANDROID_CLIENT_ID = 'android-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    setSecureRefreshAdapterForTests(createMemorySecureRefreshAdapter());
    const guestId = getLocalGuestId();

    setAndroidGoogleSignInAdapterForTests(async () => ({
      ok: true,
      idToken: 'native-id-token',
      nonce: 'android-nonce-1'
    }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockSession('acc-nat')), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );
    const ok = await signInWithAndroidGoogle();
    expect(ok.ok).toBe(true);
    expect(getAuthState().status).toBe('authenticated');
    expect(getLocalGuestId()).toBe(guestId);
    expect(getLocalGuestIdentity().linkedAccountId).toBe('acc-nat');
    expect(getAccessTokenMemory()).toBe('access-android-1');
    expect(readRefreshToken()).toBe('refresh-android-1');
    expect(await secureReadRefreshToken()).toBe('refresh-android-1');
    expect(localStorage.getItem(AUTH_REFRESH_STORAGE_KEY)).toBeNull();
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.nonce).toBe('android-nonce-1');
    expect(body.idToken).toBe('native-id-token');

    __resetAuthStateForTests();
    clearAuthSessionStorage();
    setAndroidGoogleSignInAdapterForTests(async () => ({
      ok: false,
      reason: 'cancelled'
    }));
    const cancelled = await signInWithAndroidGoogle();
    expect(cancelled.ok).toBe(false);
    if (!cancelled.ok) expect(cancelled.reason).toBe('cancelled');
    expect(getAuthState().status).toBe('guest');

    setAndroidGoogleSignInAdapterForTests(async () => ({
      ok: false,
      reason: 'error',
      message: 'Missing Google ID token'
    }));
    const missing = await signInWithAndroidGoogle();
    expect(missing.ok).toBe(false);

    setAndroidGoogleSignInAdapterForTests(async () => ({
      ok: true,
      idToken: 'tok',
      nonce: 'n'
    }));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    const backend = await signInWithAndroidGoogle();
    expect(backend.ok).toBe(false);
    if (!backend.ok) expect(backend.reason).toBe('invalid_credential');
    expect(getAuthState().status).toBe('guest');
    expect(getLocalGuestId()).toBe(guestId);
  });

  it('Android Conta UI: tap Ligar conta Google success path; no GIS iframe', async () => {
    setAuthPlatformForTests('android');
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_GOOGLE_ANDROID_CLIENT_ID = 'android-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    setSecureRefreshAdapterForTests(createMemorySecureRefreshAdapter());
    setAndroidGoogleSignInAdapterForTests(async () => ({
      ok: true,
      idToken: 'tok',
      nonce: createAndroidGoogleSignInNonce()
    }));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockSession('acc-ui-and')), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );
    render(<AccountScreen showBack onBack={() => undefined} />);
    expect(screen.queryByTestId('account-gis-host')).toBeNull();
    fireEvent.click(screen.getByTestId('account-android-link-google'));
    await waitFor(() => {
      expect(screen.getByTestId('account-status-signed-in')).toBeTruthy();
    });
    expect(screen.getByTestId('account-email').textContent).toContain('android@example.com');
  });

  it('secure refresh persist, restore, logout; DATA untouched', async () => {
    setAuthPlatformForTests('android');
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_GOOGLE_ANDROID_CLIENT_ID = 'android-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    const secure = createMemorySecureRefreshAdapter();
    setSecureRefreshAdapterForTests(secure);

    writeDurableEnvelope(STATS_KEY, {
      gamesPlayed: 5,
      wins: 2,
      lastPlayedAt: null,
      lastPlayedVariant: null,
      byVariant: {
        sueca: { played: 5, wins: 2 },
        hearts: { played: 0, wins: 0 },
        spades: { played: 0, wins: 0 },
        king: { played: 0, wins: 0 }
      }
    });
    const statsRaw = localStorage.getItem(STATS_KEY);
    const guestId = getLocalGuestId();

    await writeRefreshTokenDurable('refresh-secure-good');
    expect(localStorage.getItem(AUTH_REFRESH_STORAGE_KEY)).toBeNull();
    expect(await secureReadRefreshToken()).toBe('refresh-secure-good');

    __resetAuthSessionStorageForTests();
    setSecureRefreshAdapterForTests(secure);
    await hydrateRefreshToken();
    expect(readRefreshToken()).toBe('refresh-secure-good');

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/auth/session/refresh')) {
        return new Response(JSON.stringify(mockSession('acc-restore-and')), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.endsWith('/me')) {
        return new Response(
          JSON.stringify({
            id: 'acc-restore-and',
            displayName: 'Restored',
            email: 'r@example.com',
            status: 'active'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (url.includes('/auth/logout')) {
        return new Response(JSON.stringify({ ok: true, revoked: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('{}', { status: 404 });
    });

    const restored = await restoreAuthSession();
    expect(restored.status).toBe('authenticated');
    expect(getLocalGuestId()).toBe(guestId);
    expect(localStorage.getItem(STATS_KEY)).toBe(statsRaw);

    const after = await signOut();
    expect(after.status).toBe('guest');
    expect(readRefreshToken()).toBeNull();
    expect(await secureReadRefreshToken()).toBeNull();
    expect(getAccessTokenMemory()).toBeNull();
    expect(getLocalGuestId()).toBe(guestId);
    expect(getLocalGuestIdentity().linkedAccountId).toBe('acc-restore-and');
    expect(loadLocalStats().gamesPlayed).toBe(5);
    expect(localStorage.getItem(LOCAL_GUEST_KEY)).toBeTruthy();
  });

  it('Web GIS path still works when platform is web (regression)', async () => {
    setAuthPlatformForTests('web');
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockSession('acc-web')), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );
    const result = await signInWithGoogleCredential({
      idToken: 'web-tok',
      nonce: 'web-nonce'
    });
    expect(result.ok).toBe(true);
    expect(localStorage.getItem(AUTH_REFRESH_STORAGE_KEY)).toBeTruthy();
  });

  it('writeRefreshToken on Android does not use localStorage', async () => {
    setAuthPlatformForTests('android');
    setSecureRefreshAdapterForTests(createMemorySecureRefreshAdapter());
    writeRefreshToken('r-mem');
    expect(localStorage.getItem(AUTH_REFRESH_STORAGE_KEY)).toBeNull();
    await waitFor(async () => {
      expect(await secureReadRefreshToken()).toBe('r-mem');
    });
  });
});
