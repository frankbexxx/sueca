import { ref, set, get, push, onValue, onChildAdded, off, runTransaction } from 'firebase/database';
import { getFirebaseDatabase } from './firebaseConfig';
import { ensureAnonymousAuth } from './firebaseAuth';
import { GameState, GameVariant } from '../types/game';
import { GameAction } from '../types/multiplayerActions';
import { normalizeGameState } from '../multiplayer/normalizeGameState';

const LOCAL_PLAYER_KEY = 'sueca-mp-local-index';

/** Lazy RTDB handle — initializes Firebase only when a multiplayer API is called. */
function db() {
  return getFirebaseDatabase();
}

/** RTDB rejects undefined anywhere in the payload. */
function sanitizeForRtdb<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export interface SessionSlot {
  type: 'human' | 'ai';
  name: string;
  joined: boolean;
  /** Firebase Auth uid for claimed human seats. Omitted on AI / unclaimed humans. */
  uid?: string;
}

export interface SessionMeta {
  variant: GameVariant;
  slots: SessionSlot[];
  status: 'waiting' | 'playing' | 'ended';
  /** Creator Firebase Auth uid (seat 0). */
  hostUid: string;
}

export type SeatClaimResult =
  | { readonly ok: true; readonly seatIndex: number; readonly slots: SessionSlot[] }
  | { readonly ok: false; readonly reason: 'full' | 'invalid_slots' };

/**
 * Pure seat↔uid claim (Security Step 1B).
 * - Same uid already on a human seat → reuse that seat (joined=true).
 * - Else claim first human seat with no uid and not joined.
 * - Never overwrite another uid; never claim AI seats.
 */
export function claimSeatForUid(slots: SessionSlot[], uid: string): SeatClaimResult {
  if (!Array.isArray(slots) || slots.length === 0 || !uid) {
    return { ok: false, reason: 'invalid_slots' };
  }

  const existing = slots.findIndex((s) => s.type === 'human' && s.uid === uid);
  if (existing >= 0) {
    const next = slots.map((s, i) =>
      i === existing ? { ...s, type: 'human' as const, joined: true, uid } : s
    );
    return { ok: true, seatIndex: existing, slots: next };
  }

  const free = slots.findIndex((s) => s.type === 'human' && !s.uid && !s.joined);
  if (free < 0) {
    return { ok: false, reason: 'full' };
  }

  const next = slots.map((s, i) =>
    i === free ? { ...s, type: 'human' as const, joined: true, uid } : s
  );
  return { ok: true, seatIndex: free, slots: next };
}

function bindHostSlots(slots: SessionSlot[], hostUid: string): SessionSlot[] {
  return slots.map((s, i) => {
    if (i === 0) {
      return {
        type: 'human' as const,
        name: s.name,
        joined: true,
        uid: hostUid
      };
    }
    if (s.type === 'ai') {
      return { type: 'ai' as const, name: s.name, joined: true };
    }
    return { type: 'human' as const, name: s.name, joined: false };
  });
}

/**
 * Creates a new multiplayer session. Returns the 5-character session code.
 * Requires Anonymous Auth. Host seat 0 is bound to creator uid.
 */
export async function createSession(
  variant: GameVariant,
  slots: SessionSlot[]
): Promise<string> {
  const user = await ensureAnonymousAuth();
  const hostUid = user.uid;
  const code = generateCode();
  const boundSlots = bindHostSlots(slots, hostUid);
  const meta: SessionMeta = {
    variant,
    slots: boundSlots,
    status: 'waiting',
    hostUid
  };
  await set(ref(db(), `sessions/${code}`), sanitizeForRtdb(meta));
  localStorage.setItem(`${LOCAL_PLAYER_KEY}-${code}`, '0');
  return code;
}

/**
 * Joins an existing session atomically (seat↔uid binding).
 * localStorage is updated only after a successful server transaction.
 */
export async function joinSession(
  code: string
): Promise<{ localPlayerIndex: number; variant: GameVariant; slots: SessionSlot[] }> {
  const user = await ensureAnonymousAuth();
  const uid = user.uid;
  const sessionRef = ref(db(), `sessions/${code}`);
  const snapshot = await get(sessionRef);
  if (!snapshot.exists()) throw new Error(`Session "${code}" not found`);

  let assignedIndex = -1;
  const tx = await runTransaction(sessionRef, (current) => {
    if (!current || typeof current !== 'object') return current;
    const data = current as SessionMeta;
    const claim = claimSeatForUid(data.slots ?? [], uid);
    if (!claim.ok) return;
    assignedIndex = claim.seatIndex;
    return { ...data, slots: claim.slots };
  });

  if (!tx.committed || assignedIndex === -1) {
    throw new Error('Session is full — no open human slots');
  }

  const data = tx.snapshot.val() as SessionMeta;
  localStorage.setItem(`${LOCAL_PLAYER_KEY}-${code}`, String(assignedIndex));

  return {
    localPlayerIndex: assignedIndex,
    variant: data.variant,
    slots: data.slots
  };
}

/** Marks the session as playing (called by host when starting the game). */
export async function startSession(code: string): Promise<void> {
  await set(ref(db(), `sessions/${code}/status`), 'playing');
}

/** Marks session ended and clears runtime nodes (host should call when leaving). */
export async function endSession(code: string): Promise<void> {
  await set(ref(db(), `sessions/${code}/status`), 'ended');
  await set(ref(db(), `sessions/${code}/state`), null);
  await set(ref(db(), `sessions/${code}/actions`), null);
}

export async function fetchSessionMeta(code: string): Promise<SessionMeta | null> {
  const snapshot = await get(ref(db(), `sessions/${code}`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as SessionMeta;
}

/** Publishes the full game state to Firebase (host only). */
export async function publishState(code: string, state: GameState): Promise<void> {
  await set(ref(db(), `sessions/${code}/state`), sanitizeForRtdb(normalizeGameState(state)));
}

export async function fetchSessionState(code: string): Promise<GameState | null> {
  const snapshot = await get(ref(db(), `sessions/${code}/state`));
  if (!snapshot.exists()) return null;
  return normalizeGameState(snapshot.val() as Partial<GameState>);
}

export function subscribeToState(
  code: string,
  callback: (state: GameState) => void
): () => void {
  const stateRef = ref(db(), `sessions/${code}/state`);
  const listener = onValue(stateRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(normalizeGameState(snapshot.val() as Partial<GameState>));
    }
  });
  return () => off(stateRef, 'value', listener);
}

export function subscribeToSessionStatus(
  code: string,
  callback: (status: SessionMeta['status']) => void
): () => void {
  const statusRef = ref(db(), `sessions/${code}/status`);
  const listener = onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val() as SessionMeta['status']);
  });
  return () => off(statusRef, 'value', listener);
}

export function subscribeToSlots(
  code: string,
  callback: (slots: SessionSlot[]) => void
): () => void {
  const slotsRef = ref(db(), `sessions/${code}/slots`);
  const listener = onValue(slotsRef, (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val() as SessionSlot[]);
  });
  return () => off(slotsRef, 'value', listener);
}

/** Push a player intent (joiners; host may use for symmetry). */
export async function pushAction(code: string, action: GameAction): Promise<void> {
  await push(ref(db(), `sessions/${code}/actions`), action);
}

/** Host listens for new intents. */
export function subscribeToActions(
  code: string,
  callback: (action: GameAction, actionId: string) => void
): () => void {
  const actionsRef = ref(db(), `sessions/${code}/actions`);
  const listener = onChildAdded(actionsRef, (snapshot) => {
    if (!snapshot.exists()) return;
    callback(snapshot.val() as GameAction, snapshot.key ?? '');
  });
  return () => off(actionsRef, 'child_added', listener);
}
