/**
 * AUTH-01A — durable LocalGuest identity (device-local, offline).
 *
 * Independent of P1 display name. No PII. No network.
 * Does not rewrite match history / stats / sessions / prefs.
 */

import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';

export const LOCAL_GUEST_KEY = 'sueca-local-guest-v1';

export const LOCAL_GUEST_SCHEMA_VERSION = DURABLE_SCHEMA_VERSION;

export interface LocalGuestIdentity {
  localGuestId: string;
  createdAt: string;
  updatedAt?: string;
  /** Set by later AUTH phases after Account link; never invent accounts here. */
  linkedAccountId?: string | null;
}

/** In-memory cache so parallel/repeated startup access cannot mint competing IDs. */
let cachedIdentity: LocalGuestIdentity | null = null;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createLocalGuestId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  // RFC4122-ish fallback without relying on device/P1/email identifiers.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidLocalGuestIdentity(data: unknown): data is LocalGuestIdentity {
  if (!data || typeof data !== 'object') return false;
  const g = data as Record<string, unknown>;
  if (!isNonEmptyString(g.localGuestId) || !UUID_RE.test(g.localGuestId)) return false;
  if (!isNonEmptyString(g.createdAt)) return false;
  if (g.updatedAt !== undefined && typeof g.updatedAt !== 'string') return false;
  if (
    g.linkedAccountId !== undefined &&
    g.linkedAccountId !== null &&
    typeof g.linkedAccountId !== 'string'
  ) {
    return false;
  }
  return true;
}

function nowIso(): string {
  return new Date().toISOString();
}

function mintIdentity(): LocalGuestIdentity {
  const createdAt = nowIso();
  return {
    localGuestId: createLocalGuestId(),
    createdAt,
    updatedAt: createdAt,
    linkedAccountId: null
  };
}

function persistIdentity(identity: LocalGuestIdentity): boolean {
  return writeDurableEnvelope(LOCAL_GUEST_KEY, identity, LOCAL_GUEST_SCHEMA_VERSION);
}

function loadStoredGuest(): {
  identity: LocalGuestIdentity | null;
  /** Corrupt payload was preserved; safe to write a replacement. */
  mayPersistReplacement: boolean;
  reason?: string;
} {
  const result = loadDurableJson<LocalGuestIdentity | null>({
    key: LOCAL_GUEST_KEY,
    schemaVersion: LOCAL_GUEST_SCHEMA_VERSION,
    emptyFallback: null,
    migrateLegacy: () => null,
    validateData: (data): data is LocalGuestIdentity | null => {
      if (data === null) return true;
      return isValidLocalGuestIdentity(data);
    }
  });

  if (result.ok && result.data && isValidLocalGuestIdentity(result.data)) {
    return { identity: result.data, mayPersistReplacement: true };
  }

  // Missing key → ok + null → may persist.
  if (result.ok) {
    return { identity: null, mayPersistReplacement: true };
  }

  // Corrupt: only overwrite after successful quarantine (DATA-01 rule).
  if (result.quarantined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[localGuestIdentity] corrupt store quarantined (${result.reason}); minting replacement`
      );
    }
    return {
      identity: null,
      mayPersistReplacement: true,
      reason: result.reason
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[localGuestIdentity] corrupt store could not be quarantined (${result.reason}); using session-only guest`
    );
  }
  return {
    identity: null,
    mayPersistReplacement: false,
    reason: result.reason
  };
}

/**
 * Ensure a durable LocalGuest exists. Idempotent; safe to call repeatedly at startup.
 */
export function ensureLocalGuestIdentity(): LocalGuestIdentity {
  if (cachedIdentity && isValidLocalGuestIdentity(cachedIdentity)) {
    return cachedIdentity;
  }

  const loaded = loadStoredGuest();
  if (loaded.identity) {
    cachedIdentity = loaded.identity;
    return cachedIdentity;
  }

  const minted = mintIdentity();
  cachedIdentity = minted;
  if (loaded.mayPersistReplacement) {
    const wrote = persistIdentity(minted);
    if (!wrote && process.env.NODE_ENV !== 'production') {
      console.warn(
        '[localGuestIdentity] persist failed; in-memory guest id remains stable for this session'
      );
    }
  }
  return minted;
}

export function getLocalGuestIdentity(): LocalGuestIdentity {
  return ensureLocalGuestIdentity();
}

export function getLocalGuestId(): string {
  return ensureLocalGuestIdentity().localGuestId;
}

export function setLinkedAccountId(accountId: string): LocalGuestIdentity {
  const current = ensureLocalGuestIdentity();
  const trimmed = accountId.trim();
  if (!trimmed) {
    return clearLinkedAccountId();
  }
  const next: LocalGuestIdentity = {
    ...current,
    linkedAccountId: trimmed,
    updatedAt: nowIso()
  };
  cachedIdentity = next;
  persistIdentity(next);
  return next;
}

export function clearLinkedAccountId(): LocalGuestIdentity {
  const current = ensureLocalGuestIdentity();
  const next: LocalGuestIdentity = {
    ...current,
    linkedAccountId: null,
    updatedAt: nowIso()
  };
  cachedIdentity = next;
  persistIdentity(next);
  return next;
}

/** Test-only: drop in-memory cache so the next read hits storage. */
export function __resetLocalGuestCacheForTests(): void {
  cachedIdentity = null;
}
