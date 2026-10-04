/**
 * Firebase Anonymous Auth for online multiplayer (Security Step 1B).
 *
 * Separate from the product Google/account sign-in stack.
 * Lazy — only initializes when multiplayer needs a UID.
 */

import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getFirebaseApp } from './firebaseConfig';

let cachedAuth: Auth | undefined;

/** Firebase Auth singleton bound to the multiplayer Firebase app. */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(getFirebaseApp());
  }
  return cachedAuth;
}

/**
 * Ensure an anonymous Firebase user exists.
 * Reuses `auth.currentUser` when present (persists across normal navigation).
 */
export async function ensureAnonymousAuth(): Promise<User> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const credential = await signInAnonymously(auth);
  if (!credential.user?.uid) {
    throw new Error('Anonymous authentication failed');
  }
  return credential.user;
}

/** Synchronous UID when already signed in; otherwise null. */
export function getCurrentFirebaseUid(): string | null {
  try {
    return getFirebaseAuth().currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

/** @internal Vitest only — clear Auth singleton between cases. */
export function resetFirebaseAuthForTests(): void {
  cachedAuth = undefined;
}
