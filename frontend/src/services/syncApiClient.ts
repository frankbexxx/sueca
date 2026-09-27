/**
 * SYNC-01C — typed Account sync API client.
 * Never sends accountId / LocalGuest / Google / MP guest tokens.
 */
import { getAuthApiBaseUrl } from '../config/authConfig';
import { ensureValidAccessToken } from './accountAuthFetch';

export class SyncApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'SyncApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type FetchFn = typeof fetch;

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new SyncApiError('Malformed response', res.status, 'malformed');
  }
}

function baseUrlOrThrow(): string {
  const base = getAuthApiBaseUrl();
  if (!base) {
    throw new SyncApiError('Sync API not configured', 503, 'misconfigured');
  }
  return base;
}

async function authedFetch(
  path: string,
  init: RequestInit,
  fetchFn: FetchFn
): Promise<Response> {
  const access = await ensureValidAccessToken(fetchFn);
  if (!access) {
    throw new SyncApiError('Unauthenticated', 401, 'unauthorized');
  }
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${access}`);
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  try {
    return await fetchFn(`${baseUrlOrThrow()}${path}`, { ...init, headers });
  } catch {
    throw new SyncApiError('Network error', 0, 'network');
  }
}

async function readError(res: Response): Promise<SyncApiError> {
  const data = await parseJson(res);
  const code =
    data && typeof data === 'object' && typeof (data as { code?: unknown }).code === 'string'
      ? (data as { code: string }).code
      : res.status === 401
        ? 'unauthorized'
        : res.status === 409
          ? 'conflict'
          : res.status === 503
            ? 'db_unavailable'
            : 'request_failed';
  const message =
    data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
      ? (data as { error: string }).error
      : `Sync request failed (${res.status})`;
  return new SyncApiError(message, res.status, code, data);
}

export type SyncStatusResponse = {
  eligible: boolean;
  globalRevision: number;
  historyRevision: number;
  prefsRevision: number;
  hasLegacyStatsSeed: boolean;
  updatedAt: string | null;
};

export type SyncHistoryRecordWire = {
  id: string;
  idempotencyKey?: string | null;
  schemaVersion: number;
  payload: Record<string, unknown>;
  serverRevision?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SyncSnapshotResponse = {
  eligible: boolean;
  globalRevision: number;
  historyRevision: number;
  prefsRevision: number;
  updatedAt: string | null;
  prefs?: {
    schemaVersion: number;
    payload: Record<string, unknown>;
    serverRevision: number;
    updatedAt: string;
  } | null;
  prefsUnchanged?: boolean;
  legacyStatsSeed?: {
    schemaVersion: number;
    payload: Record<string, unknown>;
    createdAt: string;
  } | null;
  history: SyncHistoryRecordWire[];
  historyIncremental?: boolean;
};

export type HistoryPushResponse = {
  accepted: string[];
  deduped: string[];
  conflicts: Array<{ id: string; code: string; message?: string }>;
  historyRevision: number;
  prefsRevision: number;
  globalRevision: number;
};

export async function syncGetStatus(fetchFn: FetchFn = fetch): Promise<SyncStatusResponse> {
  const res = await authedFetch('/sync/status', { method: 'GET' }, fetchFn);
  if (!res.ok) throw await readError(res);
  return (await parseJson(res)) as SyncStatusResponse;
}

export async function syncGetSnapshot(
  opts: { sinceHistoryRevision?: number | null; sincePrefsRevision?: number | null } = {},
  fetchFn: FetchFn = fetch
): Promise<SyncSnapshotResponse> {
  const params = new URLSearchParams();
  if (opts.sinceHistoryRevision != null) {
    params.set('sinceHistoryRevision', String(opts.sinceHistoryRevision));
  }
  if (opts.sincePrefsRevision != null) {
    params.set('sincePrefsRevision', String(opts.sincePrefsRevision));
  }
  const q = params.toString();
  const res = await authedFetch(`/sync/snapshot${q ? `?${q}` : ''}`, { method: 'GET' }, fetchFn);
  if (!res.ok) throw await readError(res);
  return (await parseJson(res)) as SyncSnapshotResponse;
}

export async function syncPostHistory(
  records: Array<{
    id: string;
    idempotencyKey?: string;
    schemaVersion: number;
    payload: Record<string, unknown>;
  }>,
  fetchFn: FetchFn = fetch
): Promise<HistoryPushResponse> {
  const res = await authedFetch(
    '/sync/history',
    { method: 'POST', body: JSON.stringify({ records }) },
    fetchFn
  );
  if (!res.ok && res.status !== 409) throw await readError(res);
  const data = (await parseJson(res)) as HistoryPushResponse;
  if (res.status === 409 && (!data.accepted?.length && !data.deduped?.length)) {
    throw new SyncApiError('History conflict', 409, 'history_record_conflict', data);
  }
  return data;
}

export async function syncPutPrefs(
  body: { schemaVersion: number; baseRevision: number | null; payload: Record<string, unknown> },
  fetchFn: FetchFn = fetch
): Promise<{ ok: boolean; prefsRevision: number; historyRevision: number; globalRevision: number }> {
  const res = await authedFetch(
    '/sync/prefs',
    { method: 'PUT', body: JSON.stringify(body) },
    fetchFn
  );
  if (!res.ok) throw await readError(res);
  return (await parseJson(res)) as {
    ok: boolean;
    prefsRevision: number;
    historyRevision: number;
    globalRevision: number;
  };
}

export async function syncPutLegacyStatsSeed(
  body: { schemaVersion: number; payload: Record<string, unknown> },
  fetchFn: FetchFn = fetch
): Promise<{ ok: boolean; created: boolean; idempotent: boolean }> {
  const res = await authedFetch(
    '/sync/legacy-stats-seed',
    { method: 'PUT', body: JSON.stringify(body) },
    fetchFn
  );
  if (!res.ok) throw await readError(res);
  return (await parseJson(res)) as { ok: boolean; created: boolean; idempotent: boolean };
}
