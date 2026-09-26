/**
 * AUTH-01A — client auth-state facade.
 *
 * Guest-only in this phase. Authenticated shape is typed for AUTH-01C/D
 * but never faked without a real Suecão session.
 */

import {
  clearLinkedAccountId,
  ensureLocalGuestIdentity,
  getLocalGuestId as readLocalGuestId,
  getLocalGuestIdentity,
  setLinkedAccountId
} from './localGuestIdentity';

export type AuthState =
  | { status: 'guest'; localGuestId: string }
  | {
      status: 'authenticated';
      localGuestId: string;
      accountId: string;
      accessToken?: string;
    };

export type AuthStateListener = (state: AuthState) => void;

const listeners = new Set<AuthStateListener>();

let initialized = false;

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

/**
 * AUTH-01A: always guest. `linkedAccountId` may be stored for future phases
 * but does not imply an authenticated Suecão session yet.
 */
export function getAuthState(): AuthState {
  try {
    const guest = ensureLocalGuestIdentity();
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
 * Create/reuse durable LocalGuest. No network. Safe if storage fails
 * (in-memory guest for the session when possible).
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

/** AUTH-01B+ placeholders — typed, unused in AUTH-01A. */
export function linkAccountIdForFutureAuth(accountId: string): void {
  setLinkedAccountId(accountId);
  notify();
}

export function clearLinkedAccountIdForFutureAuth(): void {
  clearLinkedAccountId();
  notify();
}

export {
  clearLinkedAccountId,
  getLocalGuestIdentity,
  setLinkedAccountId
} from './localGuestIdentity';

/** Test-only */
export function __resetAuthStateForTests(): void {
  initialized = false;
  listeners.clear();
}
