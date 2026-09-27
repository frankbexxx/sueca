/**
 * @vitest-environment jsdom
 * AUTH-01C — Web Google auth / Conta (renderButton flow)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  AUTH_REFRESH_STORAGE_KEY,
  __resetAuthSessionStorageForTests,
  clearAuthSessionStorage,
  getAccessTokenMemory,
  readRefreshToken,
  writeRefreshToken
} from './authSessionStorage';
import {
  __resetAuthStateForTests,
  getAuthState,
  getLocalGuestId,
  restoreAuthSession,
  signInWithGoogleCredential,
  signOut,
  ensureAuthInitialized
} from './authState';
import { __resetLocalGuestCacheForTests, getLocalGuestIdentity } from './localGuestIdentity';
import {
  setGoogleSignInButtonMounterForTests,
  setGoogleWebSignInAdapterForTests,
  createGoogleSignInNonce
} from './googleWebSignIn';
import { LOCAL_GUEST_KEY } from './localGuestIdentity';
import { STATS_KEY, loadLocalStats } from './gameSessionStorage';
import { writeDurableEnvelope } from './durableLocalStorage';
import { AccountScreen } from '../components/screens/AccountScreen';
import { MoreHubScreen } from '../components/screens/PrimaryHubScreens';
import { APP_VERSION, BUILD_VERSION } from '../generated/buildInfo';
import { setAuthPlatformForTests } from '../platform/authPlatform';

function mockSession(accountId = 'acc-1') {
  return {
    account: { id: accountId, displayName: 'Smoke', status: 'active' },
    accessToken: 'access-token-1',
    refreshToken: 'refresh-token-1',
    linkResult: 'created' as const,
    email: 'smoke@example.com'
  };
}

describe('AUTH-01C web account auth', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetLocalGuestCacheForTests();
    __resetAuthSessionStorageForTests();
    __resetAuthStateForTests();
    setAuthPlatformForTests('web');
    setGoogleWebSignInAdapterForTests(null);
    setGoogleSignInButtonMounterForTests(null);
    delete process.env.VITE_GOOGLE_WEB_CLIENT_ID;
    delete process.env.VITE_GOOGLE_ANDROID_CLIENT_ID;
    delete process.env.VITE_AUTH_API_BASE_URL;
    vi.restoreAllMocks();
  });

  it('guest works without Google env config', () => {
    ensureAuthInitialized();
    expect(getAuthState().status).toBe('guest');
    expect(getLocalGuestId()).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('nonce is cryptographic and unique', () => {
    const a = createGoogleSignInNonce();
    const b = createGoogleSignInNonce();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it('Google success: backend once, auth state, linkedAccountId, guest id stable', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    const guestId = getLocalGuestId();
    const nonce = createGoogleSignInNonce();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockSession('acc-42')), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const result = await signInWithGoogleCredential({
      idToken: 'google-id-token-ephemeral',
      nonce
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe('authenticated');
    expect(getLocalGuestId()).toBe(guestId);
    expect(getLocalGuestIdentity().linkedAccountId).toBe('acc-42');
    expect(getAccessTokenMemory()).toBe('access-token-1');
    expect(readRefreshToken()).toBe('refresh-token-1');
    expect(localStorage.getItem(AUTH_REFRESH_STORAGE_KEY)).toBeTruthy();
    expect(JSON.stringify(localStorage)).not.toContain('google-id-token-ephemeral');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.idToken).toBe('google-id-token-ephemeral');
    expect(body.localGuestId).toBe(guestId);
    expect(body.nonce).toBe(nonce);
  });

  it('existing account response accepted', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ ...mockSession('acc-same'), linkResult: 'existing' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    const result = await signInWithGoogleCredential({
      idToken: 'tok',
      nonce: createGoogleSignInNonce()
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.status).toBe('authenticated');
  });

  it('failure: backend 401 / network; guest remains usable', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    const guestId = getLocalGuestId();

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    const backend = await signInWithGoogleCredential({
      idToken: 'tok',
      nonce: createGoogleSignInNonce()
    });
    expect(backend.ok).toBe(false);
    if (!backend.ok) expect(backend.reason).toBe('backend');
    expect(getAuthState().status).toBe('guest');
    expect(getLocalGuestId()).toBe(guestId);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const net = await signInWithGoogleCredential({
      idToken: 'tok',
      nonce: createGoogleSignInNonce()
    });
    expect(net.ok).toBe(false);
    if (!net.ok) expect(net.reason).toBe('network');
    expect(getAuthState().status).toBe('guest');
  });

  it('session restore: valid refresh → authenticated; invalid → guest; DATA preserved', async () => {
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    writeDurableEnvelope(STATS_KEY, {
      gamesPlayed: 9,
      wins: 4,
      lastPlayedAt: null,
      lastPlayedVariant: null,
      byVariant: {
        sueca: { played: 9, wins: 4 },
        hearts: { played: 0, wins: 0 },
        spades: { played: 0, wins: 0 },
        king: { played: 0, wins: 0 }
      }
    });
    const statsRaw = localStorage.getItem(STATS_KEY);
    writeRefreshToken('refresh-good');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/auth/session/refresh')) {
        return new Response(JSON.stringify(mockSession('acc-restore')), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.endsWith('/me')) {
        return new Response(
          JSON.stringify({
            id: 'acc-restore',
            displayName: 'Restored',
            email: 'r@example.com',
            status: 'active'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 404 });
    });
    const restored = await restoreAuthSession();
    expect(restored.status).toBe('authenticated');
    expect(localStorage.getItem(STATS_KEY)).toBe(statsRaw);

    clearAuthSessionStorage();
    __resetAuthStateForTests();
    writeRefreshToken('refresh-bad');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    const failed = await restoreAuthSession();
    expect(failed.status).toBe('guest');
    expect(loadLocalStats().gamesPlayed).toBe(9);
  });

  it('logout clears session, keeps guest id + linkedAccountId + stats', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    writeDurableEnvelope(STATS_KEY, {
      gamesPlayed: 3,
      wins: 1,
      lastPlayedAt: null,
      lastPlayedVariant: null,
      byVariant: {
        sueca: { played: 3, wins: 1 },
        hearts: { played: 0, wins: 0 },
        spades: { played: 0, wins: 0 },
        king: { played: 0, wins: 0 }
      }
    });
    const guestId = getLocalGuestId();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/auth/google/id-token')) {
        return new Response(JSON.stringify(mockSession('acc-out')), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/auth/logout')) {
        return new Response(JSON.stringify({ ok: true, revoked: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('{}', { status: 404 });
    });
    await signInWithGoogleCredential({
      idToken: 'tok',
      nonce: createGoogleSignInNonce()
    });
    const after = await signOut();
    expect(after.status).toBe('guest');
    expect(getLocalGuestId()).toBe(guestId);
    expect(getLocalGuestIdentity().linkedAccountId).toBe('acc-out');
    expect(getAccessTokenMemory()).toBeNull();
    expect(readRefreshToken()).toBeNull();
    expect(loadLocalStats().gamesPlayed).toBe(3);
    expect(localStorage.getItem(LOCAL_GUEST_KEY)).toBeTruthy();
  });

  it('Conta UI: guest + config missing; no GIS host', () => {
    render(<AccountScreen showBack onBack={() => undefined} />);
    expect(screen.getByTestId('account-status-guest')).toBeTruthy();
    expect(screen.getByTestId('account-config-missing')).toBeTruthy();
    expect(screen.queryByTestId('account-gis-host')).toBeNull();
  });

  it('Conta UI: GIS button mount + sign-in success path', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockSession('acc-ui')), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );
    setGoogleWebSignInAdapterForTests(async ({ nonce }) => ({
      ok: true,
      idToken: 'tok',
      nonce
    }));
    render(<AccountScreen showBack onBack={() => undefined} />);
    await waitFor(() => {
      expect(screen.getByTestId('account-gis-host')).toBeTruthy();
      expect(screen.getByTestId('account-gis-button')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('account-gis-button'));
    await waitFor(() => {
      expect(screen.getByTestId('account-status-signed-in')).toBeTruthy();
    });
    expect(screen.getByTestId('account-email').textContent).toContain('smoke@example.com');
  });

  it('Conta UI: GIS unavailable shows provider error, not cancelled', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    setGoogleSignInButtonMounterForTests(async () => ({
      ok: false,
      reason: 'unavailable',
      message: 'GIS down'
    }));
    render(<AccountScreen showBack onBack={() => undefined} />);
    await waitFor(() => {
      expect(screen.getByTestId('account-error').textContent).toMatch(/indisponível|unavailable/i);
    });
    expect(screen.getByTestId('account-error').textContent).not.toMatch(/cancelad/i);
    expect(getAuthState().status).toBe('guest');
  });

  it('Mais exposes version + short build identifier', () => {
    render(
      <MoreHubScreen
        showBack
        onBack={() => undefined}
        onOpenOnline={() => undefined}
        onOpenRules={() => undefined}
        onOpenSettings={() => undefined}
        onOpenProfile={() => undefined}
        onOpenAccount={() => undefined}
        onOpenDiagnostic={() => undefined}
      />
    );
    const meta = screen.getByTestId('more-build-meta');
    expect(meta.textContent).toContain(APP_VERSION);
    expect(meta.textContent).toContain(BUILD_VERSION);
    expect(meta.textContent).toMatch(/Versão|Version/);
    expect(meta.textContent).toContain('build');
  });
});
