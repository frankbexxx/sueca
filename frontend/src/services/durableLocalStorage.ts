/**
 * REL-DATA-01 — durable localStorage helpers.
 *
 * Versioned envelopes, backup-before-migrate, quarantine on parse/schema failure.
 * localStorage is not transactional; these helpers reduce silent data destruction.
 */

import { BUILD_VERSION } from '../generated/buildInfo';

export const DURABLE_SCHEMA_VERSION = 1;

/** Registry of latest pre-migration backups (one slot per source key). */
export const DURABLE_BACKUP_REGISTRY_KEY = 'sueca-durable-backup-v1';

/** Quarantine ledger for corrupt payloads (bounded). */
export const DURABLE_QUARANTINE_KEY = 'sueca-durable-quarantine-v1';

const MAX_QUARANTINE_ENTRIES = 12;

export interface DurableEnvelope<T> {
  schemaVersion: number;
  updatedAt: number;
  buildVersion?: string;
  data: T;
}

export interface DurableBackupEntry {
  sourceKey: string;
  raw: string;
  savedAt: number;
  reason: string;
  buildVersion?: string;
}

export interface DurableQuarantineEntry {
  sourceKey: string;
  raw: string;
  reason: string;
  quarantinedAt: number;
  buildVersion?: string;
}

export interface DurableLoadOk<T> {
  ok: true;
  data: T;
  /** True when an old/unversioned payload was migrated this load. */
  migrated: boolean;
}

export interface DurableLoadFallback<T> {
  ok: false;
  data: T;
  reason: string;
  quarantined: boolean;
}

export type DurableLoadResult<T> = DurableLoadOk<T> | DurableLoadFallback<T>;

type BackupRegistry = Record<string, DurableBackupEntry>;

function now(): number {
  return Date.now();
}

export function getDurableBuildVersion(): string | undefined {
  try {
    return typeof BUILD_VERSION === 'string' && BUILD_VERSION.length > 0
      ? BUILD_VERSION
      : undefined;
  } catch {
    return undefined;
  }
}

export function isDurableEnvelope(value: unknown): value is DurableEnvelope<unknown> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.schemaVersion === 'number' &&
    typeof v.updatedAt === 'number' &&
    'data' in v
  );
}

export function wrapDurableEnvelope<T>(
  data: T,
  schemaVersion: number = DURABLE_SCHEMA_VERSION
): DurableEnvelope<T> {
  return {
    schemaVersion,
    updatedAt: now(),
    buildVersion: getDurableBuildVersion(),
    data
  };
}

/** Safe JSON.stringify + setItem. Returns false on quota / serialize failure. */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    if (
      name === 'QuotaExceededError' ||
      name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      (err instanceof Error && /quota/i.test(err.message))
    ) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[durableLocalStorage] QuotaExceeded writing ${key}`);
      }
      return false;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[durableLocalStorage] setItem failed for ${key}`, err);
    }
    return false;
  }
}

function readBackupRegistry(): BackupRegistry {
  const raw = localStorage.getItem(DURABLE_BACKUP_REGISTRY_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as BackupRegistry;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Store one backup slot per source key (overwrites previous backup for that key).
 * Does not create a backup if raw equals the existing backup for the same key.
 */
export function backupRawBeforeMigrate(
  sourceKey: string,
  raw: string,
  reason: string
): boolean {
  const registry = readBackupRegistry();
  const existing = registry[sourceKey];
  if (existing && existing.raw === raw) {
    return true;
  }
  registry[sourceKey] = {
    sourceKey,
    raw,
    savedAt: now(),
    reason,
    buildVersion: getDurableBuildVersion()
  };
  return safeSetItem(DURABLE_BACKUP_REGISTRY_KEY, JSON.stringify(registry));
}

export function getDurableBackup(sourceKey: string): DurableBackupEntry | null {
  return readBackupRegistry()[sourceKey] ?? null;
}

function readQuarantineList(): DurableQuarantineEntry[] {
  const raw = localStorage.getItem(DURABLE_QUARANTINE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as DurableQuarantineEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Preserve corrupt raw payload. Removes the source key only after quarantine
 * is successfully persisted (so the original is never destroyed without a copy).
 */
export function quarantineCorruptRaw(
  sourceKey: string,
  raw: string,
  reason: string
): boolean {
  const list = readQuarantineList().filter(
    (e) => !(e.sourceKey === sourceKey && e.raw === raw)
  );
  list.unshift({
    sourceKey,
    raw,
    reason,
    quarantinedAt: now(),
    buildVersion: getDurableBuildVersion()
  });
  const trimmed = list.slice(0, MAX_QUARANTINE_ENTRIES);
  const wrote = safeSetItem(DURABLE_QUARANTINE_KEY, JSON.stringify(trimmed));
  if (!wrote) {
    // Keep source key intact if we could not quarantine.
    return false;
  }
  try {
    localStorage.removeItem(sourceKey);
  } catch {
    /* ignore */
  }
  return true;
}

/** Diagnostic view — no full raw payloads. */
export function listDurableQuarantineDiagnostics(): Array<{
  sourceKey: string;
  reason: string;
  quarantinedAt: number;
  rawLength: number;
  buildVersion?: string;
}> {
  return readQuarantineList().map((e) => ({
    sourceKey: e.sourceKey,
    reason: e.reason,
    quarantinedAt: e.quarantinedAt,
    rawLength: e.raw.length,
    buildVersion: e.buildVersion
  }));
}

export function getQuarantineEntriesForKey(sourceKey: string): DurableQuarantineEntry[] {
  return readQuarantineList().filter((e) => e.sourceKey === sourceKey);
}

export function hasDurableQuarantine(sourceKey?: string): boolean {
  const list = readQuarantineList();
  if (!sourceKey) return list.length > 0;
  return list.some((e) => e.sourceKey === sourceKey);
}

/**
 * Write a versioned envelope. Serializes fully before replacing the key.
 */
export function writeDurableEnvelope<T>(
  key: string,
  data: T,
  schemaVersion: number = DURABLE_SCHEMA_VERSION
): boolean {
  const envelope = wrapDurableEnvelope(data, schemaVersion);
  let serialized: string;
  try {
    serialized = JSON.stringify(envelope);
  } catch {
    return false;
  }
  return safeSetItem(key, serialized);
}

/**
 * Load durable JSON with migration support.
 *
 * - Missing key → ok + emptyFallback (no quarantine)
 * - Valid envelope → ok
 * - Recognized legacy shape → backup once, migrate, write envelope, ok+migrated
 * - Malformed / invalid → quarantine (if possible), return fallback without
 *   writing empty defaults over an unrecoverable original
 */
export function loadDurableJson<T>(options: {
  key: string;
  schemaVersion?: number;
  emptyFallback: T;
  /** Return migrated data from a recognized pre-envelope payload, or null. */
  migrateLegacy: (parsed: unknown) => T | null;
  /** Optional extra validation of envelope data. */
  validateData?: (data: unknown) => data is T;
}): DurableLoadResult<T> {
  const schemaVersion = options.schemaVersion ?? DURABLE_SCHEMA_VERSION;
  const raw = localStorage.getItem(options.key);
  if (raw === null) {
    return { ok: true, data: options.emptyFallback, migrated: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const quarantined = quarantineCorruptRaw(options.key, raw, 'json_parse_error');
    return {
      ok: false,
      data: options.emptyFallback,
      reason: 'json_parse_error',
      quarantined
    };
  }

  if (isDurableEnvelope(parsed) && parsed.schemaVersion === schemaVersion) {
    const data = parsed.data;
    if (options.validateData && !options.validateData(data)) {
      const quarantined = quarantineCorruptRaw(
        options.key,
        raw,
        'envelope_data_invalid'
      );
      return {
        ok: false,
        data: options.emptyFallback,
        reason: 'envelope_data_invalid',
        quarantined
      };
    }
    return { ok: true, data: data as T, migrated: false };
  }

  // Unsupported future envelope — quarantine rather than guess.
  if (isDurableEnvelope(parsed) && parsed.schemaVersion !== schemaVersion) {
    const quarantined = quarantineCorruptRaw(
      options.key,
      raw,
      `unsupported_schema_${parsed.schemaVersion}`
    );
    return {
      ok: false,
      data: options.emptyFallback,
      reason: `unsupported_schema_${parsed.schemaVersion}`,
      quarantined
    };
  }

  const migrated = options.migrateLegacy(parsed);
  if (migrated === null) {
    const quarantined = quarantineCorruptRaw(options.key, raw, 'unrecognized_shape');
    return {
      ok: false,
      data: options.emptyFallback,
      reason: 'unrecognized_shape',
      quarantined
    };
  }

  const backedUp = backupRawBeforeMigrate(options.key, raw, 'migrate_to_envelope_v1');
  if (!backedUp) {
    // Do not replace the only durable copy if backup could not be persisted.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[durableLocalStorage] backup failed for ${options.key}; keeping original raw`
      );
    }
    return { ok: true, data: migrated, migrated: true };
  }
  const wrote = writeDurableEnvelope(options.key, migrated, schemaVersion);
  if (!wrote) {
    // Keep original raw in place; return migrated data in-memory only.
    return { ok: true, data: migrated, migrated: true };
  }
  return { ok: true, data: migrated, migrated: true };
}
