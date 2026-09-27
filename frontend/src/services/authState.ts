/**
 * AUTH-01C/D — client auth-state facade (guest + authenticated).
 *
 * Google ID token is never stored. Access token stays in memory.
 * Refresh token: Web localStorage · Android Keystore secure storage.
 * Logout clears session only — keeps localGuestId and local game DATA.
 * linkedAccountId is kept after logout as historical link metadata.
 * AUTH-01E: account delete clears linkedAccountId; optional keyed local wipe.
 */

import {
  ensureLocalGuestIdentity,
  getLocalGuestId as readLocalGuestId,
  getLocalGuestIdentity,
  setLinkedAccountId,
  clearLinkedAccountId
} from './localGuestIdentity';
import {
  signInWithGoogleIdToken,
  logoutSession,
  deleteAccountOnServer,
  AccountAuthApiError,
  type AccountSummary
} from './accountAuthApi';
import {
  clearAccessTokenMemory,
  clearAuthSessionStorage,
  clearAuthSessionStorageDurable,
  getAccessTokenMemory,
  hydrateRefreshToken,
  readRefreshToken,
  setAccessTokenMemory,
  writeRefreshTokenDurable
} from './authSessionStorage';
import {
  fetchMeWithSession,
  refreshAccessTokenOnce,
  ensureValidAccessToken
} from './accountAuthFetch';
import {
  isAndroidGoogleAuthConfigured,
  isWebGoogleAuthConfigured,
  getAuthApiBaseUrl
} from '../config/authConfig';
import { isAndroidAuthPlatform } from '../platform/authPlatform';
import { requestAndroidGoogleIdToken } from './googleAndroidSignIn';
import { clearLocalUserDataAsync } from './clearLocalUserData';

export type AuthAccountInfo = {
  id: string;
  displayName?: string | null;
  email?: string | null;
};

export type AuthState =
  | { status: 'guest'; localGuestId: string }
  | {
      status: 'authenticated';
      localGuestId: string;
      accountId: string;
      account: AuthAccountInfo;
    };

export type AuthStateListener = (state: AuthState) => void;

export type SignInResult =
  | { ok: true; state: AuthState }
  | {
      ok: false;
      reason:
        | 'cancelled'
        | 'unavailable'
        | 'misconfigured'
        | 'backend'
        | 'network'
        | 'storage'
        | 'error';
      message?: string;
    };

const listeners = new Set<AuthStateListener>();

let initialized = false;
let accountMemory: AuthAccountInfo | null = null;
let restorePromise: Promise<AuthState> | null = null;

function notify(): void {
  const state = getAuthState();
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[authState] listener error', err);
      }
    }
  });
}

function toAccountInfo(
  account: AccountSummary,
  email?: string | null
): AuthAccountInfo {
  return {
    id: account.id,
    displayName: account.displayName ?? null,
    email: email ?? account.email ?? null
  };
}

async function applySession(session: {
  account: AccountSummary;
  accessToken: string;
  refreshToken: string;
  email?: string | null;
}): Promise<AuthState> {
  setAccessTokenMemory(session.accessToken);
  try {
    await writeRefreshTokenDurable(session.refreshToken);
  } catch (err) {
    clearAccessTokenMemory();
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[authState] refresh persist failed', err);
    }
    throw Object.assign(new Error('Secure refresh storage failed'), { code: 'storage' });
  }
  accountMemory = toAccountInfo(session.account, session.email);
  // Keep localGuestId stable; record Account link metadata without rewriting DATA stores.
  setLinkedAccountId(session.account.id);
  const state = getAuthState();
  notify();
  // SYNC-01C — only runs when already READY_INCREMENTAL (no first-link push).
  void import('./syncEngine')
    .then((m) => m.maybeSyncOnAuthenticatedStart())
    .catch(() => undefined);
  return state;
}

export function getAuthState(): AuthState {
  try {
    const guest = ensureLocalGuestIdentity();
    if (accountMemory && getAccessTokenMemory()) {
      return {
        status: 'authenticated',
        localGuestId: guest.localGuestId,
        accountId: accountMemory.id,
        account: accountMemory
      };
    }
    return { status: 'guest', localGuestId: guest.localGuestId };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[authState] getAuthState failed; ephemeral guest', err);
    }
    return { status: 'guest', localGuestId: 'ephemeral-unavailable' };
  }
}

export function getLocalGuestId(): string {
  return readLocalGuestId();
}

export function getLocalGuest(): ReturnType<typeof getLocalGuestIdentity> {
  return getLocalGuestIdentity();
}

export function subscribeAuthState(listener: AuthStateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Sync guest bootstrap. Session restore is async via restoreAuthSession().
 */
export function ensureAuthInitialized(): AuthState {
  try {
    ensureLocalGuestIdentity();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[authState] ensureAuthInitialized failed', err);
    }
  }
  initialized = true;
  const state = getAuthState();
  notify();
  return state;
}

export function isAuthInitialized(): boolean {
  return initialized;
}

/**
 * Attempt refresh + /me. On failure → guest; preserve LocalGuest + game DATA.
 * Android: hydrates refresh from Keystore first.
 */
export async function restoreAuthSession(): Promise<AuthState> {
  if (restorePromise) return restorePromise;
  restorePromise = (async () => {
    ensureAuthInitialized();
    try {
      await hydrateRefreshToken();
    } catch {
      /* remain guest */
    }

    const hasApi = Boolean(getAuthApiBaseUrl());
    if (!hasApi && !readRefreshToken()) {
      return getAuthState();
    }
    if (!readRefreshToken() && !getAccessTokenMemory()) {
      return getAuthState();
    }
    try {
      if (!getAccessTokenMemory()) {
        const access = await refreshAccessTokenOnce();
        if (!access) {
          accountMemory = null;
          notify();
          return getAuthState();
        }
      }
      const me = await fetchMeWithSession();
      accountMemory = {
        id: me.id,
        displayName: me.displayName ?? null,
        email: me.email ?? null
      };
      setLinkedAccountId(me.id);
      notify();
      // SYNC-01C — startup sync only if already READY_INCREMENTAL.
      void import('./syncEngine')
        .then((m) => m.maybeSyncOnAuthenticatedStart())
        .catch(() => undefined);
      return getAuthState();
    } catch {
      accountMemory = null;
      try {
        await clearAuthSessionStorageDurable();
      } catch {
        clearAuthSessionStorage();
      }
      notify();
      return getAuthState();
    } finally {
      restorePromise = null;
    }
  })();
  return restorePromise;
}

/**
 * Complete Google → Suecão session after GIS or native credential returns.
 * Google ID token is sent to backend only — never written to storage.
 * No history/stats upload.
 */
export async function signInWithGoogleCredential(input: {
  idToken: string;
  nonce: string;
}): Promise<SignInResult> {
  ensureAuthInitialized();
  if (isAndroidAuthPlatform()) {
    if (!isAndroidGoogleAuthConfigured()) {
      return { ok: false, reason: 'misconfigured' };
    }
  } else if (!isWebGoogleAuthConfigured()) {
    return { ok: false, reason: 'misconfigured' };
  }
  if (!input.idToken || !input.nonce) {
    return { ok: false, reason: 'error', message: 'Missing Google credential' };
  }

  try {
    const session = await signInWithGoogleIdToken({
      idToken: input.idToken,
      nonce: input.nonce
    });
    const state = await applySession(session);
    return { ok: true, state };
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'storage') {
      return { ok: false, reason: 'storage', message: 'Secure refresh storage failed' };
    }
    if (err instanceof AccountAuthApiError) {
      if (err.code === 'network') return { ok: false, reason: 'network', message: err.message };
      if (err.code === 'misconfigured') return { ok: false, reason: 'misconfigured' };
      return { ok: false, reason: 'backend', message: err.message };
    }
    return { ok: false, reason: 'error' };
  }
}

/**
 * AUTH-01D — Android native Google chooser → ID token → Suecão session.
 */
export async function signInWithAndroidGoogle(): Promise<SignInResult> {
  ensureAuthInitialized();
  if (!isAndroidAuthPlatform()) {
    return { ok: false, reason: 'error', message: 'Native Google only on Android' };
  }
  if (!isAndroidGoogleAuthConfigured()) {
    return { ok: false, reason: 'misconfigured' };
  }

  const native = await requestAndroidGoogleIdToken();
  if (!native.ok) {
    return { ok: false, reason: native.reason, message: native.message };
  }
  return signInWithGoogleCredential({
    idToken: native.idToken,
    nonce: native.nonce
  });
}

/**
 * Map a GIS / native mount/provider failure into a SignInResult.
 */
export function mapGoogleProviderFailure(reason: string, message?: string): SignInResult {
  if (reason === 'cancelled') return { ok: false, reason: 'cancelled', message };
  if (reason === 'misconfigured') return { ok: false, reason: 'misconfigured', message };
  if (reason === 'unavailable') return { ok: false, reason: 'unavailable', message };
  if (reason === 'storage') return { ok: false, reason: 'storage', message };
  return { ok: false, reason: 'error', message };
}

/**
 * Revoke refresh when possible; clear Suecão session; stay guest.
 * Keeps localGuestId, game DATA, linkedAccountId, and syncBoundAccountId (SYNC-01A).
 * Android also clears Keystore refresh token.
 */
export async function signOut(): Promise<AuthState> {
  // SYNC-01C — cancel in-flight sync; keep outbox + binding for same Account resume.
  try {
    const { stopSyncEngine } = await import('./syncEngine');
    stopSyncEngine();
  } catch {
    /* ignore */
  }
  const refresh = readRefreshToken();
  if (refresh) {
    try {
      await logoutSession(refresh);
    } catch {
      /* still clear local session */
    }
  }
  accountMemory = null;
  try {
    await clearAuthSessionStorageDurable();
  } catch {
    clearAuthSessionStorage();
  }
  notify();
  return getAuthState();
}

export type DeleteAccountResult =
  | { ok: true; state: AuthState; wipedLocal: boolean }
  | {
      ok: false;
      reason: 'unauthorized' | 'backend' | 'network' | 'misconfigured' | 'error';
      message?: string;
    };

/**
 * AUTH-01E — soft-delete Suecão Account, then clear client session.
 *
 * - On success: Guest · clear linkedAccountId · keep localGuestId + DATA unless wipeLocalData
 * - On backend failure: do NOT wipe local DATA; keep session if still valid
 * - Local wipe runs only after successful server delete when requested
 *
 * pending_delete Google re-login is rejected server-side (no duplicate Account).
 */
export async function deleteAccount(options: {
  wipeLocalData: boolean;
}): Promise<DeleteAccountResult> {
  ensureAuthInitialized();
  if (!getAuthApiBaseUrl()) {
    return { ok: false, reason: 'misconfigured' };
  }

  let access: string | null = null;
  try {
    access = await ensureValidAccessToken();
  } catch {
    access = null;
  }
  if (!access) {
    return { ok: false, reason: 'unauthorized' };
  }

  try {
    await deleteAccountOnServer(access);
  } catch (err) {
    if (err instanceof AccountAuthApiError) {
      if (err.code === 'network') return { ok: false, reason: 'network', message: err.message };
      if (err.code === 'misconfigured') return { ok: false, reason: 'misconfigured' };
      if (err.code === 'unauthorized') {
        // Session already dead (e.g. pending_delete) — drop to guest, keep DATA.
        accountMemory = null;
        try {
          await clearAuthSessionStorageDurable();
        } catch {
          clearAuthSessionStorage();
        }
        clearLinkedAccountId();
        const { clearAllSyncLocalState } = await import('./clearSyncLocalState');
        clearAllSyncLocalState();
        notify();
        return { ok: false, reason: 'unauthorized', message: err.message };
      }
      return { ok: false, reason: 'backend', message: err.message };
    }
    return { ok: false, reason: 'error' };
  }

  accountMemory = null;
  try {
    await clearAuthSessionStorageDurable();
  } catch {
    clearAuthSessionStorage();
  }
  // Account is pending_delete — drop historical link metadata + sync binding.
  clearLinkedAccountId();
  const { clearAllSyncLocalState } = await import('./clearSyncLocalState');
  clearAllSyncLocalState();

  let wipedLocal = false;
  if (options.wipeLocalData) {
    await clearLocalUserDataAsync();
    wipedLocal = true;
  }

  notify();
  return { ok: true, state: getAuthState(), wipedLocal };
}

export { getLocalGuestIdentity, setLinkedAccountId, clearLinkedAccountId };

/** Test-only */
export function __resetAuthStateForTests(): void {
  initialized = false;
  accountMemory = null;
  restorePromise = null;
  listeners.clear();
}

/** Test-only: inject authenticated memory without Google */
export function __setAuthenticatedForTests(account: AuthAccountInfo, accessToken: string): void {
  accountMemory = account;
  setAccessTokenMemory(accessToken);
  notify();
}
