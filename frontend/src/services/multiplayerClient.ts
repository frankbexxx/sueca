import { ref, set, get, onValue, off } from 'firebase/database';
import { db } from './firebaseConfig';
import { GameState, GameVariant } from '../types/game';

const LOCAL_PLAYER_KEY = 'sueca-mp-local-index';

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
  status: 'waiting' | 'playing';
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
 * Joins an existing session. Takes the first available human slot (joined:false).
 * Returns the slot index assigned, the variant, and the full slots array.
 */
export async function joinSession(
  code: string
): Promise<{ localPlayerIndex: number; variant: GameVariant; slots: SessionSlot[] }> {
  const snapshot = await get(ref(db, `sessions/${code}`));
  if (!snapshot.exists()) throw new Error(`Session "${code}" not found`);

  const data = snapshot.val() as SessionMeta;
  const slotIndex = data.slots.findIndex((s) => s.type === 'human' && !s.joined);
  if (slotIndex === -1) throw new Error('Session is full — no open human slots');

  // Mark slot as joined
  await set(ref(db, `sessions/${code}/slots/${slotIndex}/joined`), true);
  localStorage.setItem(`${LOCAL_PLAYER_KEY}-${code}`, String(slotIndex));

  return {
    localPlayerIndex: slotIndex,
    variant: data.variant,
    slots: data.slots,
  };
}

/**
 * Marks the session as playing (called by host when starting the game).
 */
export async function startSession(code: string): Promise<void> {
  await set(ref(db, `sessions/${code}/status`), 'playing');
}

/**
 * Retrieves the local player index for a session code (from localStorage).
 */
export function getLocalPlayerIndex(code: string): number {
  return Number(localStorage.getItem(`${LOCAL_PLAYER_KEY}-${code}`) ?? '0');
}

/**
 * Publishes the full game state to Firebase after a local play.
 */
export async function publishState(code: string, state: GameState): Promise<void> {
  await set(ref(db, `sessions/${code}/state`), state);
}

/**
 * Reads the current game state snapshot once (for joiners that mount after host published).
 */
export async function fetchSessionState(code: string): Promise<GameState | null> {
  const snapshot = await get(ref(db, `sessions/${code}/state`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as GameState;
}

/**
 * Subscribes to real-time state updates for a session.
 * Returns an unsubscribe function.
 */
export function subscribeToState(
  code: string,
  callback: (state: GameState) => void
): () => void {
  const stateRef = ref(db, `sessions/${code}/state`);
  onValue(stateRef, (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val() as GameState);
  });
  return () => off(stateRef);
}

/**
 * Subscribes to real-time slot updates (for the lobby).
 * Returns an unsubscribe function.
 */
export function subscribeToSlots(
  code: string,
  callback: (slots: SessionSlot[]) => void
): () => void {
  const slotsRef = ref(db, `sessions/${code}/slots`);
  onValue(slotsRef, (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val() as SessionSlot[]);
  });
  return () => off(slotsRef);
}
