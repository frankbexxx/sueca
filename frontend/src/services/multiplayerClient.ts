import { ref, set, get, push, onValue, onChildAdded, off, runTransaction } from 'firebase/database';
import { db } from './firebaseConfig';
import { GameState, GameVariant } from '../types/game';
import { GameAction } from '../types/multiplayerActions';

const LOCAL_PLAYER_KEY = 'sueca-mp-local-index';

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
}

export interface SessionMeta {
  variant: GameVariant;
  slots: SessionSlot[];
  status: 'waiting' | 'playing' | 'ended';
}

/**
 * Creates a new multiplayer session. Returns the 5-character session code.
 * Host is always slot 0 (human, joined:true). AI slots are pre-marked joined:true.
 */
export async function createSession(
  variant: GameVariant,
  slots: SessionSlot[]
): Promise<string> {
  const code = generateCode();
  const meta: SessionMeta = { variant, slots, status: 'waiting' };
  await set(ref(db, `sessions/${code}`), meta);
  localStorage.setItem(`${LOCAL_PLAYER_KEY}-${code}`, '0');
  return code;
}

/**
 * Joins an existing session atomically (first free human slot).
 */
export async function joinSession(
  code: string
): Promise<{ localPlayerIndex: number; variant: GameVariant; slots: SessionSlot[] }> {
  const sessionRef = ref(db, `sessions/${code}`);
  const snapshot = await get(sessionRef);
  if (!snapshot.exists()) throw new Error(`Session "${code}" not found`);

  let assignedIndex = -1;
  const tx = await runTransaction(sessionRef, (current) => {
    if (!current || typeof current !== 'object') return current;
    const data = current as SessionMeta;
    const slotIndex = data.slots?.findIndex((s) => s.type === 'human' && !s.joined) ?? -1;
    if (slotIndex === -1) return;
    assignedIndex = slotIndex;
    const slots = data.slots.map((s, i) =>
      i === slotIndex ? { ...s, joined: true } : s
    );
    return { ...data, slots };
  });

  if (!tx.committed || assignedIndex === -1) {
    throw new Error('Session is full — no open human slots');
  }

  const data = tx.snapshot.val() as SessionMeta;
  localStorage.setItem(`${LOCAL_PLAYER_KEY}-${code}`, String(assignedIndex));

  return {
    localPlayerIndex: assignedIndex,
    variant: data.variant,
    slots: data.slots,
  };
}

/** Marks the session as playing (called by host when starting the game). */
export async function startSession(code: string): Promise<void> {
  await set(ref(db, `sessions/${code}/status`), 'playing');
}

/** Marks session ended and clears runtime nodes (host should call when leaving). */
export async function endSession(code: string): Promise<void> {
  await set(ref(db, `sessions/${code}/status`), 'ended');
  await set(ref(db, `sessions/${code}/state`), null);
  await set(ref(db, `sessions/${code}/actions`), null);
}

export async function fetchSessionMeta(code: string): Promise<SessionMeta | null> {
  const snapshot = await get(ref(db, `sessions/${code}`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as SessionMeta;
}

/** Publishes the full game state to Firebase (host only). */
export async function publishState(code: string, state: GameState): Promise<void> {
  await set(ref(db, `sessions/${code}/state`), sanitizeForRtdb(state));
}

export async function fetchSessionState(code: string): Promise<GameState | null> {
  const snapshot = await get(ref(db, `sessions/${code}/state`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as GameState;
}

export function subscribeToState(
  code: string,
  callback: (state: GameState) => void
): () => void {
  const stateRef = ref(db, `sessions/${code}/state`);
  const listener = onValue(stateRef, (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val() as GameState);
  });
  return () => off(stateRef, 'value', listener);
}

export function subscribeToSessionStatus(
  code: string,
  callback: (status: SessionMeta['status']) => void
): () => void {
  const statusRef = ref(db, `sessions/${code}/status`);
  const listener = onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val() as SessionMeta['status']);
  });
  return () => off(statusRef, 'value', listener);
}

export function subscribeToSlots(
  code: string,
  callback: (slots: SessionSlot[]) => void
): () => void {
  const slotsRef = ref(db, `sessions/${code}/slots`);
  const listener = onValue(slotsRef, (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val() as SessionSlot[]);
  });
  return () => off(slotsRef, 'value', listener);
}

/** Push a player intent (joiners; host may use for symmetry). */
export async function pushAction(code: string, action: GameAction): Promise<void> {
  await push(ref(db, `sessions/${code}/actions`), action);
}

/** Host listens for new intents. */
export function subscribeToActions(
  code: string,
  callback: (action: GameAction, actionId: string) => void
): () => void {
  const actionsRef = ref(db, `sessions/${code}/actions`);
  const listener = onChildAdded(actionsRef, (snapshot) => {
    if (!snapshot.exists()) return;
    callback(snapshot.val() as GameAction, snapshot.key ?? '');
  });
  return () => off(actionsRef, 'child_added', listener);
}
