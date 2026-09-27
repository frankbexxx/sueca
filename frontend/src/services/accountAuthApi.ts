/**
 * AUTH-01C — Suecão Account API client (NOT multiplayer).
 *
 * Talks only to VITE_AUTH_API_BASE_URL Account endpoints.
 */
import { getAuthApiBaseUrl } from '../config/authConfig';
import { getLocalGuestId } from './localGuestIdentity';

export class AccountAuthApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = 'request_failed') {
    super(message);
    this.name = 'AccountAuthApiError';
    this.status = status;
    this.code = code;
  }
}

export interface AccountSummary {
  id: string;
  displayName?: string | null;
  status?: string;
  email?: string | null;
}

export interface AuthSessionResponse {
  account: AccountSummary;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt?: string;
  linkResult?: 'created' | 'existing';
  email?: string | null;
}

export interface MeResponse {
  id: string;
  displayName?: string | null;
  status?: string;
  email?: string | null;
}

type FetchFn = typeof fetch;

function baseUrlOrThrow(): string {
  const base = getAuthApiBaseUrl();
  if (!base) {
    throw new AccountAuthApiError('Account API not configured', 503, 'misconfigured');
  }
  return base;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new AccountAuthApiError('Malformed response', res.status, 'malformed');
  }
}

function errorCodeFromBody(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.code === 'string' && d.code.trim()) return d.code.trim();
  if (typeof d.error === 'string') {
    const e = d.error.trim().toLowerCase();
    if (e === 'pending_delete' || e === 'account_pending_delete') return 'pending_delete';
    if (e === 'unauthorized') return fallback;
  }
  return fallback;
}

function authApiDebug(event: string, detail?: Record<string, unknown>): void {
  if (typeof console === 'undefined' || typeof console.info !== 'function') return;
  try {
    console.info(`[auth-api] ${event}`, detail ?? {});
  } catch {
    // ignore
  }
}

function asSession(data: unknown): AuthSessionResponse {
  if (!data || typeof data !== 'object') {
    throw new AccountAuthApiError('Malformed session', 500, 'malformed');
  }
  const d = data as Record<string, unknown>;
  const account = d.account as Record<string, unknown> | undefined;
  if (!account || typeof account.id !== 'string') {
    throw new AccountAuthApiError('Malformed session account', 500, 'malformed');
  }
  if (typeof d.accessToken !== 'string' || typeof d.refreshToken !== 'string') {
    throw new AccountAuthApiError('Malformed session tokens', 500, 'malformed');
  }
  return {
    account: {
      id: account.id,
      displayName: (account.displayName as string | null | undefined) ?? null,
      status: (account.status as string | undefined) ?? undefined,
      email: (d.email as string | null | undefined) ?? null
    },
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
    refreshExpiresAt: typeof d.refreshExpiresAt === 'string' ? d.refreshExpiresAt : undefined,
    linkResult: d.linkResult === 'created' || d.linkResult === 'existing' ? d.linkResult : undefined,
    email: (d.email as string | null | undefined) ?? null
  };
}

export async function signInWithGoogleIdToken(
  input: { idToken: string; nonce?: string },
  fetchFn: FetchFn = fetch
): Promise<AuthSessionResponse> {
  const base = baseUrlOrThrow();
  const url = `${base}/auth/google/id-token`;
  authApiDebug('post_start', { path: '/auth/google/id-token', baseHost: (() => {
    try {
      return new URL(base).host;
    } catch {
      return 'invalid';
    }
  })() });
  let res: Response;
  try {
    res = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        idToken: input.idToken,
        nonce: input.nonce,
        localGuestId: getLocalGuestId()
      })
    });
  } catch (err) {
    authApiDebug('post_transport_fail', {
      path: '/auth/google/id-token',
      name: err instanceof Error ? err.name : 'unknown'
    });
    throw new AccountAuthApiError('Network error', 0, 'network');
  }
  const data = await parseJson(res);
  if (!res.ok) {
    const fallback =
      res.status === 401
        ? 'unauthorized'
        : res.status === 503
          ? 'misconfigured'
          : 'request_failed';
    const code = errorCodeFromBody(data, fallback);
    authApiDebug('post_http_fail', { path: '/auth/google/id-token', status: res.status, code });
    throw new AccountAuthApiError('Sign-in failed', res.status, code);
  }
  authApiDebug('post_ok', { path: '/auth/google/id-token', status: res.status });
  return asSession(data);
}

export async function refreshSession(
  refreshToken: string,
  fetchFn: FetchFn = fetch
): Promise<AuthSessionResponse> {
  const base = baseUrlOrThrow();
  let res: Response;
  try {
    res = await fetchFn(`${base}/auth/session/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  } catch {
    throw new AccountAuthApiError('Network error', 0, 'network');
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AccountAuthApiError('Refresh failed', res.status, res.status === 401 ? 'unauthorized' : 'request_failed');
  }
  return asSession(data);
}

export async function getMe(accessToken: string, fetchFn: FetchFn = fetch): Promise<MeResponse> {
  const base = baseUrlOrThrow();
  let res: Response;
  try {
    res = await fetchFn(`${base}/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch {
    throw new AccountAuthApiError('Network error', 0, 'network');
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AccountAuthApiError('Unauthorized', res.status, 'unauthorized');
  }
  if (!data || typeof data !== 'object' || typeof (data as { id?: unknown }).id !== 'string') {
    throw new AccountAuthApiError('Malformed /me', 500, 'malformed');
  }
  const d = data as MeResponse;
  return {
    id: d.id,
    displayName: d.displayName ?? null,
    status: d.status,
    email: d.email ?? null
  };
}

export async function logoutSession(
  refreshToken: string,
  fetchFn: FetchFn = fetch
): Promise<{ ok: boolean; revoked?: boolean }> {
  const base = baseUrlOrThrow();
  let res: Response;
  try {
    res = await fetchFn(`${base}/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  } catch {
    throw new AccountAuthApiError('Network error', 0, 'network');
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AccountAuthApiError('Logout failed', res.status, 'request_failed');
  }
  const d = (data || {}) as { ok?: boolean; revoked?: boolean };
  return { ok: d.ok !== false, revoked: d.revoked };
}

export type DeleteAccountResponse = {
  deleted: boolean;
  status?: string;
  note?: string;
};

/**
 * Soft-delete the authenticated Suecão Account.
 * Uses access Bearer only — no client-supplied account id.
 */
export async function deleteAccountOnServer(
  accessToken: string,
  fetchFn: FetchFn = fetch
): Promise<DeleteAccountResponse> {
  const base = baseUrlOrThrow();
  let res: Response;
  try {
    res = await fetchFn(`${base}/auth/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch {
    throw new AccountAuthApiError('Network error', 0, 'network');
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AccountAuthApiError(
      'Delete failed',
      res.status,
      res.status === 401 ? 'unauthorized' : 'request_failed'
    );
  }
  const d = (data || {}) as DeleteAccountResponse;
  return {
    deleted: d.deleted !== false,
    status: typeof d.status === 'string' ? d.status : undefined,
    note: typeof d.note === 'string' ? d.note : undefined
  };
}
