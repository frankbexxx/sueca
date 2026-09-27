/**
 * SYNC-01D — first-link / account-switch case resolver (pure).
 */

import { getSyncMetadata } from './syncMetadata';
import {
  hasMeaningfulCloudSyncData,
  hasMeaningfulLocalSyncData
} from './syncMeaningfulData';
import type { SyncSnapshotResponse, SyncStatusResponse } from './syncApiClient';

export type FirstLinkCase =
  | 'CLOUD_EMPTY_LOCAL_HAS_DATA' // A
  | 'CLOUD_HAS_DATA_LOCAL_EMPTY' // B
  | 'BOTH_HAVE_DATA' // C
  | 'SAME_ACCOUNT_RESUME' // D
  | 'ACCOUNT_SWITCH'; // E

export type ResolveFirstLinkInput = {
  authenticatedAccountId: string | null;
  /** When null, cloud presence unknown — only D/E from local meta; A/B/C need cloud probe. */
  cloudStatus?: SyncStatusResponse | null;
  cloudSnapshot?: SyncSnapshotResponse | null;
  cloudPresenceKnown?: boolean;
};

/**
 * Deterministic case selection.
 * Cloud presence must be known (status+snapshot fetched) for A/B/C.
 */
export function resolveFirstLinkCase(input: ResolveFirstLinkInput): FirstLinkCase | 'UNBOUND' | 'NEEDS_CLOUD_PROBE' {
  const accountId = input.authenticatedAccountId?.trim() || null;
  if (!accountId) return 'UNBOUND';

  const meta = getSyncMetadata();
  const bound = meta.syncBoundAccountId;

  if (bound && bound !== accountId) {
    return 'ACCOUNT_SWITCH';
  }

  if (bound === accountId && meta.firstLinkCompletedForAccountId === accountId) {
    return 'SAME_ACCOUNT_RESUME';
  }

  // Unbound or same-account first-link incomplete → need cloud presence for A/B/C.
  if (!input.cloudPresenceKnown) {
    return 'NEEDS_CLOUD_PROBE';
  }

  const local = hasMeaningfulLocalSyncData();
  const cloud = hasMeaningfulCloudSyncData(input.cloudStatus, input.cloudSnapshot);

  if (local && !cloud) return 'CLOUD_EMPTY_LOCAL_HAS_DATA';
  if (!local && cloud) return 'CLOUD_HAS_DATA_LOCAL_EMPTY';
  if (local && cloud) return 'BOTH_HAVE_DATA';

  // Both empty/trivial — treat as B-like auto bind + empty sync (no chooser).
  return 'CLOUD_HAS_DATA_LOCAL_EMPTY';
}
