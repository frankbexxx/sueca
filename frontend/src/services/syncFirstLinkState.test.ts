/**
 * @vitest-environment jsdom
 * SYNC-01A — first-link state derivation + no-network login
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canUploadForAccount,
  deriveSyncLinkState
} from './syncFirstLinkState';
import {
  __resetSyncMetadataForTests,
  bindSyncToAccount,
  markFirstLinkCompleted
} from './syncMetadata';
import {
  __resetAuthStateForTests,
  ensureAuthInitialized,
  getAuthState,
  signInWithGoogleCredential
} from './authState';
import { __resetAuthSessionStorageForTests } from './authSessionStorage';
import { __resetLocalGuestCacheForTests } from './localGuestIdentity';
import { setAuthPlatformForTests } from '../platform/authPlatform';
import { createGoogleSignInNonce } from './googleWebSignIn';

describe('SYNC-01A first-link state', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetSyncMetadataForTests();
    __resetLocalGuestCacheForTests();
    __resetAuthSessionStorageForTests();
    __resetAuthStateForTests();
    setAuthPlatformForTests('web');
    delete process.env.VITE_GOOGLE_WEB_CLIENT_ID;
    delete process.env.VITE_AUTH_API_BASE_URL;
    vi.restoreAllMocks();
  });

  it('derives UNBOUND / FIRST_LINK / BOUND_* / READY', () => {
    expect(deriveSyncLinkState({ authenticatedAccountId: null })).toBe('UNBOUND');
    expect(deriveSyncLinkState({ authenticatedAccountId: 'acc-a' })).toBe('FIRST_LINK_REQUIRED');

    bindSyncToAccount('acc-a');
    expect(deriveSyncLinkState({ authenticatedAccountId: 'acc-a' })).toBe('BOUND_SAME_ACCOUNT');
    expect(deriveSyncLinkState({ authenticatedAccountId: 'acc-b' })).toBe(
      'BOUND_DIFFERENT_ACCOUNT'
    );

    markFirstLinkCompleted('acc-a');
    expect(deriveSyncLinkState({ authenticatedAccountId: 'acc-a' })).toBe('READY_INCREMENTAL');
    expect(canUploadForAccount('acc-a')).toBe(true);
    expect(canUploadForAccount('acc-b')).toBe(false);
    expect(canUploadForAccount(null)).toBe(false);
  });

  it('login does not trigger sync HTTP (only auth)', async () => {
    process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
    process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client.apps.googleusercontent.com';
    ensureAuthInitialized();
    expect(getAuthState().status).toBe('guest');

    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/google/id-token')) {
        return new Response(
          JSON.stringify({
            account: { id: 'acc-login', displayName: 'L', status: 'active' },
            accessToken: 'access-1',
            refreshToken: 'refresh-1',
            linkResult: 'created'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await signInWithGoogleCredential({
      idToken: 'tok',
      nonce: createGoogleSignInNonce()
    });

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((u) => u.includes('/auth/'))).toBe(true);
    expect(urls.every((u) => !u.includes('/sync'))).toBe(true);
    expect(getAuthState().status).toBe('authenticated');
  });

  it('guest remains unbound with no sync fetch', () => {
    ensureAuthInitialized();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(getAuthState().status).toBe('guest');
    expect(deriveSyncLinkState({ authenticatedAccountId: null })).toBe('UNBOUND');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
