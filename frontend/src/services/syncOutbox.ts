/**
 * SYNC-01C — durable account-bound sync outbox.
 * Key: sueca-sync-outbox-v1
 */
import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';
import { writeSyncMetadata, getSyncMetadata } from './syncMetadata';
import { SYNC_OUTBOX_KEY } from './syncStorageKeys';

export { SYNC_OUTBOX_KEY };

export type SyncOutboxDomain = 'history' | 'prefs' | 'legacy_seed';
export type SyncOutboxOperation =
  | 'APPEND_MATCH'
  | 'PUT_PREFS'
  | 'PUT_LEGACY_STATS_SEED';

export type SyncOutboxItem = {
  id: string;
  domain: SyncOutboxDomain;
  operation: SyncOutboxOperation;
  /** History: matchId ref. Prefs: unused (built at send). Seed: payload snapshot. */
  payload: Record<string, unknown>;
  localRevision?: number;
  createdAt: string;
  attemptCount: number;
  nextAttemptAt: number;
  boundAccountId: string;
  lastErrorCode?: string;
};

export type SyncOutboxStore = {
  schemaVersion: 1;
  items: SyncOutboxItem[];
};

const emptyStore = (): SyncOutboxStore => ({ schemaVersion: 1, items: [] });

function isItem(v: unknown): v is SyncOutboxItem {
  if (!v || typeof v !== 'object') return false;
  const i = v as SyncOutboxItem;
  return (
    typeof i.id === 'string' &&
    typeof i.domain === 'string' &&
    typeof i.operation === 'string' &&
    typeof i.boundAccountId === 'string' &&
    i.boundAccountId.length > 0 &&
    typeof i.createdAt === 'string' &&
    typeof i.attemptCount === 'number' &&
    typeof i.nextAttemptAt === 'number' &&
    i.payload != null &&
    typeof i.payload === 'object'
  );
}

function isStore(data: unknown): data is SyncOutboxStore {
  if (!data || typeof data !== 'object') return false;
  const s = data as SyncOutboxStore;
  return s.schemaVersion === 1 && Array.isArray(s.items) && s.items.every(isItem);
}

function persist(store: SyncOutboxStore): SyncOutboxStore {
  writeDurableEnvelope(SYNC_OUTBOX_KEY, store, DURABLE_SCHEMA_VERSION);
  const count = store.items.length;
  if (getSyncMetadata().pendingOutboxCount !== count) {
    writeSyncMetadata({ pendingOutboxCount: count });
  }
  return store;
}

export function loadSyncOutbox(): SyncOutboxStore {
  const result = loadDurableJson<SyncOutboxStore>({
    key: SYNC_OUTBOX_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: emptyStore(),
    validateData: isStore,
    migrateLegacy: (raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const s = raw as Partial<SyncOutboxStore>;
      if (!Array.isArray(s.items)) return null;
      return { schemaVersion: 1 as const, items: s.items.filter(isItem) };
    }
  });
  return isStore(result.data) ? result.data : emptyStore();
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `ob-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function listOutboxItems(accountId?: string): SyncOutboxItem[] {
  const items = loadSyncOutbox().items;
  if (!accountId) return [...items];
  return items.filter((i) => i.boundAccountId === accountId);
}

export function enqueueOutboxItem(
  input: Omit<SyncOutboxItem, 'id' | 'createdAt' | 'attemptCount' | 'nextAttemptAt'> & {
    id?: string;
    createdAt?: string;
    attemptCount?: number;
    nextAttemptAt?: number;
  }
): SyncOutboxItem {
  const store = loadSyncOutbox();
  const item: SyncOutboxItem = {
    id: input.id || newId(),
    domain: input.domain,
    operation: input.operation,
    payload: input.payload,
    localRevision: input.localRevision,
    createdAt: input.createdAt || new Date().toISOString(),
    attemptCount: input.attemptCount ?? 0,
    nextAttemptAt: input.nextAttemptAt ?? Date.now(),
    boundAccountId: input.boundAccountId.trim(),
    lastErrorCode: input.lastErrorCode
  };
  if (!item.boundAccountId) {
    throw new Error('boundAccountId required');
  }
  store.items.push(item);
  persist(store);
  return item;
}

/** Coalesce PUT_PREFS to a single pending item per Account. */
export function enqueueOrCoalescePrefs(accountId: string, localRevision: number): SyncOutboxItem {
  const store = loadSyncOutbox();
  const id = accountId.trim();
  const existing = store.items.find(
    (i) => i.boundAccountId === id && i.operation === 'PUT_PREFS'
  );
  if (existing) {
    existing.localRevision = localRevision;
    existing.payload = { localRevision };
    existing.nextAttemptAt = Date.now();
    existing.lastErrorCode = undefined;
    persist(store);
    return existing;
  }
  return enqueueOutboxItem({
    domain: 'prefs',
    operation: 'PUT_PREFS',
    boundAccountId: id,
    localRevision,
    payload: { localRevision }
  });
}

export function enqueueHistoryMatch(accountId: string, matchId: string): SyncOutboxItem {
  const store = loadSyncOutbox();
  const id = accountId.trim();
  const dup = store.items.find(
    (i) =>
      i.boundAccountId === id &&
      i.operation === 'APPEND_MATCH' &&
      i.payload.matchId === matchId
  );
  if (dup) return dup;
  return enqueueOutboxItem({
    domain: 'history',
    operation: 'APPEND_MATCH',
    boundAccountId: id,
    payload: { matchId }
  });
}

export function enqueueLegacySeed(
  accountId: string,
  seedPayload: Record<string, unknown>
): SyncOutboxItem {
  const store = loadSyncOutbox();
  const id = accountId.trim();
  const existing = store.items.find(
    (i) => i.boundAccountId === id && i.operation === 'PUT_LEGACY_STATS_SEED'
  );
  if (existing) return existing;
  return enqueueOutboxItem({
    domain: 'legacy_seed',
    operation: 'PUT_LEGACY_STATS_SEED',
    boundAccountId: id,
    payload: seedPayload
  });
}

export function removeOutboxItems(ids: string[]): void {
  if (ids.length === 0) return;
  const set = new Set(ids);
  const store = loadSyncOutbox();
  store.items = store.items.filter((i) => !set.has(i.id));
  persist(store);
}

export function updateOutboxItem(id: string, patch: Partial<SyncOutboxItem>): void {
  const store = loadSyncOutbox();
  const item = store.items.find((i) => i.id === id);
  if (!item) return;
  Object.assign(item, patch);
  persist(store);
}

export function clearOutboxForAccount(accountId: string): void {
  const store = loadSyncOutbox();
  store.items = store.items.filter((i) => i.boundAccountId !== accountId.trim());
  persist(store);
}

export function clearAllOutbox(): void {
  try {
    localStorage.removeItem(SYNC_OUTBOX_KEY);
  } catch {
    /* ignore */
  }
  try {
    // Best-effort; wipe paths may remove sync meta immediately after.
    writeSyncMetadata({ pendingOutboxCount: 0 });
  } catch {
    /* ignore */
  }
}

/** Test-only */
export function __resetSyncOutboxForTests(): void {
  try {
    localStorage.removeItem(SYNC_OUTBOX_KEY);
  } catch {
    /* ignore */
  }
}
