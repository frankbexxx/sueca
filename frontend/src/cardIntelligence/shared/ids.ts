const SESSION_STORAGE_KEY = 'card-intelligence-session-id';

export function createEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createGameId(): string {
  return createEventId();
}

export function getOrCreateSessionId(): string {
  if (typeof sessionStorage !== 'undefined') {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = createEventId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  }
  return createEventId();
}

export function resetSessionIdForTests(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
