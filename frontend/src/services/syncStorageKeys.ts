/**
 * Leaf storage-key constants for sync Class A / outbox / first-link.
 *
 * No imports. Kept separate so wipe lists and storage modules cannot form
 * init cycles through authState / syncEnqueue / syncablePrefsRevision.
 */

export const SYNC_META_KEY = 'sueca-sync-meta-v1';
export const SYNCABLE_PREFS_META_KEY = 'sueca-syncable-prefs-v1';
export const LEGACY_STATS_SEED_KEY = 'sueca-legacy-stats-seed-v1';
export const SYNC_OUTBOX_KEY = 'sueca-sync-outbox-v1';
export const FIRST_LINK_SESSION_KEY = 'sueca-sync-first-link-v1';
export const ACCOUNT_SNAPSHOT_PREFIX = 'sueca-sync-account-snapshot-v1:';
