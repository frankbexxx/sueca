/**
 * @vitest-environment jsdom
 * AUTH-01E — Conta delete / keep-local / wipe-local / failure safety
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  AUTH_REFRESH_STORAGE_KEY,
  __resetAuthSessionStorageForTests,
  getAccessTokenMemory,
  readRefreshToken
} from './authSessionStorage';
import {
  __resetAuthStateForTests,
  __setAuthenticatedForTests,
  deleteAccount,
  getAuthState,
  getLocalGuestId,
  ensureAuthInitialized,
  signInWithGoogleCredential,
  signOut
} from './authState';
import {
  __resetLocalGuestCacheForTests,
  getLocalGuestIdentity,
  LOCAL_GUEST_KEY
} from './localGuestIdentity';
import { createGoogleSignInNonce } from './googleWebSignIn';
import { STATS_KEY, loadLocalStats } from './gameSessionStorage';
import { writeDurableEnvelope } from './durableLocalStorage';
import { MATCH_HISTORY_KEY } from './matchHistoryStorage';
import { SETUP_PREFS_KEY } from './setupPreferences';
import { clearLocalUserData, LOCAL_USER_DATA_KEYS } from './clearLocalUserData';
import { AccountScreen } from '../components/screens/AccountScreen';
import { setAuthPlatformForTests } from '../platform/authPlatform';

function mockSession(accountId = 'acc-del') {
  return {
    account: { id: accountId, displayName: 'Delete Me', status: 'active' },
    accessToken: 'access-del-1',
    refreshToken: 'refresh-del-1',
    linkResult: 'created' as const,
    email: 'delete@example.com'
  };
}

function seedStats() {
  writeDurableEnvelope(STATS_KEY, {
    gamesPlayed: 7,
    wins: 3,
    lastPlayedAt: null,
    lastPlayedVariant: null,
    byVariant: {
      sueca: { played: 7, wins: 3 },
      hearts: { played: 0, wins: 0 },
      spades: { played: 0, wins: 0 },
      king: { played: 0, wins: 0 }
    }
  });
  localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify([{ id: 'm1' }]));
  localStorage.setItem(SETUP_PREFS_KEY, JSON.stringify({ foo: 1 }));
}

describe('AUTH-01E account delete', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetLocalGuestCacheForTests();
    __resetAuthSessionStorageForTests();
    __resetAuthStateForTests();
    setAuthPlatformForTests('web');
    delete process.env.VITE_GOOGLE_WEB_CLIENT_ID;
    delete process.env.VITE_GOOGLE_ANDROID_CLIENT_ID;
    delete process.env.VITE_AUTH_API_BASE_URL;
    vi.restoreAllMocks();
  });

  it('clearLocalUserData never uses localStorage.clear and leaves language', () => {
    localStorage.setItem('sueca-language', 'pt');
    localStorage.setItem(STATS_KEY, 'stats');
    localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify({ localGuestId: 'g1' }));
    const clearSpy = vi.spyOn(Storage.prototype, 'clear');
    const result = clearLocalUserData();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('sueca-language')).toBe('pt');
    expect(localStorage.getItem(STATS_KEY)).toBeNull();
    expect(result.removedKeys.length).toBeGreaterThan(0);
    expect(LOCAL_USER_DATA_KEYS).toContain(STATS_KEY);
    expect(LOCAL_USER_DATA_KEYS).not.toContain('sueca-language');
  });

  it('Conta guest UI + Google CTA host when configured', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    render(<AccountScreen showBack onBack={() => undefined} />);
    expect(screen.getByTestId('account-status-guest')).toBeTruthy();
    expect(screen.getByText(/Jogar sem conta|Play without/i)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('account-gis-host')).toBeTruthy();
    });
  });

  it('Conta authenticated: name/email, logout, delete visible', () => {
    ensureAuthInitialized();
    __setAuthenticatedForTests(
      { id: 'acc-ui', displayName: 'Ada', email: 'ada@example.com' },
      'access-ui'
    );
    render(<AccountScreen showBack onBack={() => undefined} />);
    expect(screen.getByTestId('account-status-signed-in')).toBeTruthy();
    expect(screen.getByTestId('account-display-name').textContent).toContain('Ada');
    expect(screen.getByTestId('account-email').textContent).toContain('ada@example.com');
    expect(screen.getByTestId('account-sign-out')).toBeTruthy();
    expect(screen.getByTestId('account-delete')).toBeTruthy();
    expect(screen.queryByText(/acc-ui/)).toBeNull();
  });

  it('logout revokes backend, clears session, preserves DATA', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    seedStats();
    const guestId = getLocalGuestId();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
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
    expect(loadLocalStats().gamesPlayed).toBe(7);
    expect(fetchSpy.mock.calls.some((c) => String(c[0]).includes('/auth/logout'))).toBe(true);
  });

  it('delete account / keep local: Guest, linked cleared, guest+DATA same', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    seedStats();
    const guestId = getLocalGuestId();
    const historyRaw = localStorage.getItem(MATCH_HISTORY_KEY);
    const prefsRaw = localStorage.getItem(SETUP_PREFS_KEY);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/auth/google/id-token')) {
        return new Response(JSON.stringify(mockSession('acc-keep')), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/auth/account') && init?.method === 'DELETE') {
        return new Response(
          JSON.stringify({ deleted: true, status: 'pending_delete' }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 404 });
    });
    await signInWithGoogleCredential({
      idToken: 'tok',
      nonce: createGoogleSignInNonce()
    });
    expect(getLocalGuestIdentity().linkedAccountId).toBe('acc-keep');

    const result = await deleteAccount({ wipeLocalData: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wipedLocal).toBe(false);
    expect(result.state.status).toBe('guest');
    expect(getLocalGuestId()).toBe(guestId);
    expect(getLocalGuestIdentity().linkedAccountId).toBeNull();
    expect(loadLocalStats().gamesPlayed).toBe(7);
    expect(localStorage.getItem(MATCH_HISTORY_KEY)).toBe(historyRaw);
    expect(localStorage.getItem(SETUP_PREFS_KEY)).toBe(prefsRaw);
    expect(localStorage.getItem(LOCAL_GUEST_KEY)).toBeTruthy();
    expect(getAccessTokenMemory()).toBeNull();
    expect(readRefreshToken()).toBeNull();
  });

  it('delete account / wipe local: DATA gone, fresh LocalGuest next init', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    seedStats();
    const guestId = getLocalGuestId();
    const clearSpy = vi.spyOn(Storage.prototype, 'clear');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/auth/google/id-token')) {
        return new Response(JSON.stringify(mockSession('acc-wipe')), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/auth/account') && init?.method === 'DELETE') {
        return new Response(
          JSON.stringify({ deleted: true, status: 'pending_delete' }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 404 });
    });
    await signInWithGoogleCredential({
      idToken: 'tok',
      nonce: createGoogleSignInNonce()
    });

    const result = await deleteAccount({ wipeLocalData: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wipedLocal).toBe(true);
    expect(clearSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(STATS_KEY)).toBeNull();
    expect(localStorage.getItem(MATCH_HISTORY_KEY)).toBeNull();
    expect(localStorage.getItem(SETUP_PREFS_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_REFRESH_STORAGE_KEY)).toBeNull();
    // wipe remints LocalGuest on next auth read — must not keep the old id
    expect(getLocalGuestId()).not.toBe(guestId);
    expect(result.state.status).toBe('guest');

    __resetAuthStateForTests();
    __resetLocalGuestCacheForTests();
    // Simulate clean reopen: drop reminted guest key then re-init
    localStorage.removeItem(LOCAL_GUEST_KEY);
    ensureAuthInitialized();
    const fresh = getLocalGuestId();
    expect(fresh).toMatch(/^[0-9a-f-]{36}$/i);
    expect(fresh).not.toBe(guestId);
    expect(getAuthState().status).toBe('guest');
  });

  it('delete failure 500: DATA untouched, session kept', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    seedStats();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/auth/google/id-token')) {
        return new Response(JSON.stringify(mockSession('acc-fail')), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/auth/account') && init?.method === 'DELETE') {
        return new Response(JSON.stringify({ error: 'boom' }), { status: 500 });
      }
      return new Response('{}', { status: 404 });
    });
    await signInWithGoogleCredential({
      idToken: 'tok',
      nonce: createGoogleSignInNonce()
    });
    const result = await deleteAccount({ wipeLocalData: true });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('backend');
    expect(getAuthState().status).toBe('authenticated');
    expect(getAccessTokenMemory()).toBe('access-del-1');
    expect(readRefreshToken()).toBe('refresh-del-1');
    expect(getLocalGuestIdentity().linkedAccountId).toBe('acc-fail');
    expect(loadLocalStats().gamesPlayed).toBe(7);
  });

  it('pending_delete restore → Guest, DATA preserved', async () => {
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    seedStats();
    const { writeRefreshToken } = await import('./authSessionStorage');
    const { restoreAuthSession } = await import('./authState');
    writeRefreshToken('refresh-pending');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    const state = await restoreAuthSession();
    expect(state.status).toBe('guest');
    expect(loadLocalStats().gamesPlayed).toBe(7);
    expect(getAccessTokenMemory()).toBeNull();
  });

  it('UI delete keep-local path calls backend and returns Guest', async () => {
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    ensureAuthInitialized();
    __setAuthenticatedForTests(
      { id: 'acc-ui-del', displayName: 'Bea', email: 'bea@example.com' },
      'access-ui-del'
    );
    const { writeRefreshToken } = await import('./authSessionStorage');
    writeRefreshToken('refresh-ui-del');
    seedStats();

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/auth/account') && init?.method === 'DELETE') {
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer access-ui-del');
        expect(init.body).toBeUndefined();
        return new Response(
          JSON.stringify({ deleted: true, status: 'pending_delete' }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 404 });
    });

    render(<AccountScreen showBack onBack={() => undefined} />);
    fireEvent.click(screen.getByTestId('account-delete'));
    expect(screen.getByTestId('account-delete-dialog')).toBeTruthy();
    fireEvent.click(screen.getByTestId('account-delete-keep-local'));
    await waitFor(() => {
      expect(screen.getByTestId('account-status-guest')).toBeTruthy();
    });
    expect(loadLocalStats().gamesPlayed).toBe(7);
    expect(getLocalGuestIdentity().linkedAccountId).toBeNull();
  });

  it('UI wipe requires second confirmation', async () => {
    ensureAuthInitialized();
    __setAuthenticatedForTests(
      { id: 'acc-ui-wipe', displayName: 'Cia', email: 'cia@example.com' },
      'access-ui-wipe'
    );
    render(<AccountScreen showBack onBack={() => undefined} />);
    fireEvent.click(screen.getByTestId('account-delete'));
    fireEvent.click(screen.getByTestId('account-delete-wipe-local'));
    expect(screen.getByTestId('account-delete-dialog').getAttribute('data-step')).toBe(
      'wipe_confirm'
    );
    expect(screen.getByTestId('account-delete-wipe-confirm')).toBeTruthy();
    expect(getAuthState().status).toBe('authenticated');
  });
});
