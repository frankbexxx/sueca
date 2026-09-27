/**
 * @vitest-environment jsdom
 * SYNC-01A — sync metadata + binding guards
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SYNC_META_KEY,
  __resetSyncMetadataForTests,
  assertCanSyncAccount,
  bindSyncToAccount,
  clearSyncBinding,
  getSyncMetadata,
  isSyncBoundToAccount,
  markFirstLinkCompleted,
  markSyncError,
  markSyncSuccess,
  writeSyncMetadata
} from './syncMetadata';
import { clearAllSyncLocalState } from './clearSyncLocalState';
import { clearLocalUserData, LOCAL_USER_DATA_KEYS } from './clearLocalUserData';
import {
  __resetAuthStateForTests,
  deleteAccount,
  getAuthState,
  signInWithGoogleCredential,
  signOut
} from './authState';
import { __resetAuthSessionStorageForTests } from './authSessionStorage';
import { __resetLocalGuestCacheForTests } from './localGuestIdentity';
import { setAuthPlatformForTests } from '../platform/authPlatform';
import { createGoogleSignInNonce } from './googleWebSignIn';
import { writeDurableEnvelope, DURABLE_SCHEMA_VERSION } from './durableLocalStorage';

function mockSession(accountId: string) {
  return {
    account: { id: accountId, displayName: 'Sync User', status: 'active' },
    accessToken: 'access-sync-1',
    refreshToken: 'refresh-sync-1',
    linkResult: 'created' as const,
    email: 'sync@example.com'
  };
}

async function signInAs(accountId: string) {
  process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
  process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes('/auth/google/id-token')) {
      return new Response(JSON.stringify(mockSession(accountId)), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url.includes('/auth/logout')) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url.includes('/auth/account') && init?.method === 'DELETE') {
      return new Response(JSON.stringify({ deleted: true, status: 'pending_delete' }), {
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
}

describe('SYNC-01A sync metadata', () => {
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

  it('creates empty metadata and round-trips patches', () => {
    const empty = getSyncMetadata();
    expect(empty.schemaVersion).toBe(1);
    expect(empty.syncBoundAccountId).toBeNull();
    expect(empty.historyRevision).toBeNull();

    const next = writeSyncMetadata({
      historyRevision: 3,
      prefsRevision: 7,
      lastSyncError: { code: 'test', at: '2026-01-01T00:00:00.000Z' }
    });
    expect(next.historyRevision).toBe(3);
    expect(next.prefsRevision).toBe(7);
    expect(getSyncMetadata().historyRevision).toBe(3);
  });

  it('uses durable envelope and recovers legacy bare object', () => {
    localStorage.setItem(
      SYNC_META_KEY,
      JSON.stringify({
        schemaVersion: 1,
        syncBoundAccountId: 'acc-legacy',
        firstLinkCompletedForAccountId: null
      })
    );
    expect(getSyncMetadata().syncBoundAccountId).toBe('acc-legacy');
  });

  it('falls back on corrupt payload', () => {
    localStorage.setItem(SYNC_META_KEY, '{not-json');
    const meta = getSyncMetadata();
    expect(meta.syncBoundAccountId).toBeNull();
    expect(meta.schemaVersion).toBe(1);
  });

  it('bind / assert / mismatch guards', () => {
    expect(assertCanSyncAccount('acc-a')).toEqual({ ok: false, reason: 'unbound' });
    expect(assertCanSyncAccount(null)).toEqual({ ok: false, reason: 'missing_account' });

    bindSyncToAccount('acc-a');
    expect(isSyncBoundToAccount('acc-a')).toBe(true);
    expect(assertCanSyncAccount('acc-a')).toEqual({ ok: true });
    expect(assertCanSyncAccount('acc-b')).toEqual({ ok: false, reason: 'account_mismatch' });
  });

  it('markSyncSuccess / markSyncError / firstLink', () => {
    markFirstLinkCompleted('acc-a');
    expect(getSyncMetadata().firstLinkCompletedForAccountId).toBe('acc-a');
    expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');

    markSyncSuccess({ accountId: 'acc-a', historyRevision: 2, prefsRevision: 4 });
    expect(getSyncMetadata().lastSuccessfulSyncAt).toBeTruthy();
    expect(getSyncMetadata().historyRevision).toBe(2);

    markSyncError('network', 'timeout');
    expect(getSyncMetadata().lastSyncError?.code).toBe('network');
  });

  it('logout keeps syncBoundAccountId', async () => {
    await signInAs('acc-a');
    bindSyncToAccount('acc-a');
    markFirstLinkCompleted('acc-a');

    await signOut();
    expect(getAuthState().status).toBe('guest');
    expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');
    expect(getSyncMetadata().firstLinkCompletedForAccountId).toBe('acc-a');
  });

  it('Account A bound → logout → Account B login → assertCanSyncAccount(B) blocks', async () => {
    await signInAs('acc-a');
    bindSyncToAccount('acc-a');
    markFirstLinkCompleted('acc-a');
    expect(assertCanSyncAccount('acc-a')).toEqual({ ok: true });

    await signOut();
    expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');

    // Fresh sign-in as B must not clear binding; upload for B is blocked.
    vi.restoreAllMocks();
    await signInAs('acc-b');
    expect(getAuthState().status).toBe('authenticated');
    expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');
    expect(assertCanSyncAccount('acc-b')).toEqual({
      ok: false,
      reason: 'account_mismatch'
    });
    expect(assertCanSyncAccount('acc-a')).toEqual({ ok: true });
  });

  it('account delete clears sync binding (keep-local)', async () => {
    await signInAs('acc-a');
    bindSyncToAccount('acc-a');
    markFirstLinkCompleted('acc-a');
    localStorage.setItem('sueca-language', 'pt');

    const result = await deleteAccount({ wipeLocalData: false });
    expect(result.ok).toBe(true);
    expect(localStorage.getItem(SYNC_META_KEY)).toBeNull();
    expect(getSyncMetadata().syncBoundAccountId).toBeNull();
    expect(localStorage.getItem('sueca-language')).toBe('pt');
  });

  it('local wipe clears sync keys', () => {
    bindSyncToAccount('acc-a');
    writeDurableEnvelope(
      'sueca-syncable-prefs-v1',
      { schemaVersion: 1, localPrefsRevision: 5, localUpdatedAt: 1 },
      DURABLE_SCHEMA_VERSION
    );
    expect(LOCAL_USER_DATA_KEYS).toContain(SYNC_META_KEY);
    clearLocalUserData();
    expect(localStorage.getItem(SYNC_META_KEY)).toBeNull();
    expect(getSyncMetadata().syncBoundAccountId).toBeNull();
  });

  it('clearAllSyncLocalState removes meta without rewrite for wipe path', () => {
    bindSyncToAccount('acc-x');
    clearAllSyncLocalState();
    expect(localStorage.getItem(SYNC_META_KEY)).toBeNull();
  });

  it('clearSyncBinding resets to empty envelope', () => {
    bindSyncToAccount('acc-x');
    clearSyncBinding();
    expect(getSyncMetadata().syncBoundAccountId).toBeNull();
    expect(localStorage.getItem(SYNC_META_KEY)).toBeTruthy();
  });
});
