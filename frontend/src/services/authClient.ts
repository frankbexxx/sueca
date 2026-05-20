const API_BASE = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

export interface GuestAuthResponse {
  token: string;
  userId: string;
  displayName: string;
}

export async function authGuest(displayName: string): Promise<GuestAuthResponse> {
  const res = await fetch(`${API_BASE}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName })
  });
  if (!res.ok) throw new Error('Auth failed');
  return res.json();
}

export function wsUrlWithToken(token: string): string {
  const base = process.env.REACT_APP_MULTIPLAYER_URL || 'ws://127.0.0.1:8787/ws';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}token=${encodeURIComponent(token)}`;
}

export async function deleteAccount(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Delete account failed');
}
