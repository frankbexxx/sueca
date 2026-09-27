/**
 * SYNC-01A — first-link / binding state derivation (no network, no UI).
 */

import { getSyncMetadata } from './syncMetadata';

export type SyncLinkState =
  | 'UNBOUND'
  | 'BOUND_SAME_ACCOUNT'
  | 'BOUND_DIFFERENT_ACCOUNT'
  | 'FIRST_LINK_REQUIRED'
  | 'READY_INCREMENTAL';

export type DeriveSyncLinkStateInput = {
  /** Currently authenticated Suecão Account id, or null when guest. */
  authenticatedAccountId: string | null;
  /**
   * Placeholder for future cloud probe (SYNC-01B+).
   * When unknown, pass null — does not invent network.
   */
  cloudHasAccountData?: boolean | null;
};

/**
 * Derive local sync readiness from binding + optional cloud-presence hint.
 *
 * - Guest → UNBOUND
 * - Auth + no bind → FIRST_LINK_REQUIRED
 * - Auth + bind mismatch → BOUND_DIFFERENT_ACCOUNT (also implies first-link/switch)
 * - Auth + bind match + firstLink done → READY_INCREMENTAL
 * - Auth + bind match + firstLink not done → FIRST_LINK_REQUIRED
 * - Auth + bind match → BOUND_SAME_ACCOUNT (superset label; READY when first-link done)
 */
export function deriveSyncLinkState(input: DeriveSyncLinkStateInput): SyncLinkState {
  const accountId = input.authenticatedAccountId?.trim() || null;
  if (!accountId) return 'UNBOUND';

  const meta = getSyncMetadata();
  const bound = meta.syncBoundAccountId;

  if (!bound) return 'FIRST_LINK_REQUIRED';
  if (bound !== accountId) return 'BOUND_DIFFERENT_ACCOUNT';

  // Bound to the authenticated Account.
  if (meta.firstLinkCompletedForAccountId === accountId) {
    return 'READY_INCREMENTAL';
  }
  // Bound same Account but first-link prefs/history resolution not finished.
  return 'BOUND_SAME_ACCOUNT';
}

/** True when a future sync engine may upload for this Account. */
export function canUploadForAccount(authenticatedAccountId: string | null): boolean {
  const state = deriveSyncLinkState({ authenticatedAccountId });
  return state === 'READY_INCREMENTAL';
}
