import { ref, set, get, onValue, off } from 'firebase/database';
import { db } from './firebaseConfig';
import { GameState, GameVariant } from '../types/game';

const LOCAL_PLAYER_KEY = 'sueca-mp-local-index';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export interface SessionMeta {
  variant: GameVariant;
  playerNames: string[];
  playerCount: number;
  joinedCount: number;
}

/**
 * Creates a new multiplayer session. Returns the 5-character session code.
 * The host is always localPlayerIndex 0. State is published separately by GameBoard after init.
 */
export async function createSession(
  variant: GameVariant,
  playerNames: string[]
): Promise<string> {
  const code = generateCode();
  const sessionRef = ref(db, `sessions/${code}`);
  const meta: SessionMeta = {
    variant,
    playerNames,
    playerCount: playerNames.length,
    joinedCount: 1,
  };
  await set(sessionRef, meta);
  localStorage.setItem(`${LOCAL_PLAYER_KEY}-${code}`, '0');
  return code;
}

/**
 * Joins an existing session. Returns the localPlayerIndex assigned to this device,
 * game variant, and player names. State arrives via the Firebase listener.
 */
export async function joinSession(
  code: string
): Promise<{ localPlayerIndex: number; variant: GameVariant; playerNames: string[] }> {
  const sessionRef = ref(db, `sessions/${code}`);
  const snapshot = await get(sessionRef);
  if (!snapshot.exists()) {
    throw new Error(`Session ${code} not found`);
  }
  const data = snapshot.val() as SessionMeta;
  const localPlayerIndex = data.joinedCount;
  if (localPlayerIndex >= data.playerCount) {
    throw new Error('Session is full');
  }

  await set(ref(db, `sessions/${code}/joinedCount`), localPlayerIndex + 1);
  localStorage.setItem(`${LOCAL_PLAYER_KEY}-${code}`, String(localPlayerIndex));

  return {
    localPlayerIndex,
    variant: data.variant,
    playerNames: data.playerNames,
  };
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
 * Subscribes to real-time state updates for a session.
 * Returns an unsubscribe function.
 */
export function subscribeToState(
  code: string,
  callback: (state: GameState) => void
): () => void {
  const stateRef = ref(db, `sessions/${code}/state`);
  onValue(stateRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as GameState);
    }
  });
  return () => off(stateRef);
}

/**
 * Subscribes to the joinedCount field (for lobby waiting).
 * Returns an unsubscribe function.
 */
export function subscribeToJoinedCount(
  code: string,
  callback: (count: number) => void
): () => void {
  const countRef = ref(db, `sessions/${code}/joinedCount`);
  onValue(countRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as number);
    }
  });
  return () => off(countRef);
}
