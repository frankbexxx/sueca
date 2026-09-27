/**
 * SYNC-01C — synchronous outbox enqueue helpers (schedule stays async).
 */
import { getAuthState } from './authState';
import type { MatchHistoryRecord } from './matchHistoryStorage';
import { canUploadForAccount } from './syncFirstLinkState';
import { assertCanSyncAccount } from './syncMetadata';
import { enqueueHistoryMatch, enqueueOrCoalescePrefs } from './syncOutbox';

function currentAccountId(): string | null {
  const s = getAuthState();
  return s.status === 'authenticated' ? s.accountId : null;
}

function schedule(reason: string): void {
  void import('./syncEngine')
    .then((m) => m.scheduleSync(reason))
    .catch(() => undefined);
}

export function tryEnqueueMatchAfterLocalWrite(record: MatchHistoryRecord): void {
  const accountId = currentAccountId();
  if (!accountId || !canUploadForAccount(accountId)) return;
  if (!assertCanSyncAccount(accountId).ok) return;
  enqueueHistoryMatch(accountId, record.id);
  schedule('match');
}

export function tryEnqueuePrefsAfterLocalMutation(localRevision: number): void {
  const accountId = currentAccountId();
  if (!accountId || !canUploadForAccount(accountId)) return;
  if (!assertCanSyncAccount(accountId).ok) return;
  enqueueOrCoalescePrefs(accountId, localRevision);
  schedule('prefs');
}
