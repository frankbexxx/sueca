/**
 * DEV ONLY — jump directly into King festa games 7–10.
 * Production builds ignore all params (NODE_ENV !== 'development').
 */

import type { GameState } from '../types/game';
import type { KingFestaPhase } from '../models/games/king/kingContracts';
import { KING_NEGATIVE_GAMES } from '../models/games/king/kingContracts';
import { KingPtGame, festaOwner } from '../models/games/KingPtGame';
import { KingGame } from '../models/games/KingGame';

export const DEV_KING_FESTA_PHASES = [
  'auction',
  'negotiation',
  'negotiation_counter',
  'fallback',
  'setup'
] as const;

export type DevKingFestaPhase = (typeof DEV_KING_FESTA_PHASES)[number];

export interface DevKingFestaJump {
  /** Human-facing game number 7–10 (maps to gameIndex 6–9). */
  festaGameNumber: 7 | 8 | 9 | 10;
  festaPhase: DevKingFestaPhase;
}

/** Coherent dummy scores after six negatives — presentation only. */
export const DEV_FESTA_DUMMY_SCORES = [-180, 60, -120, 240];

export function isKingDevJumpEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function festaGameNumberToIndex(festaGameNumber: number): number {
  return festaGameNumber - 1;
}

export function expectedFestaOwnerForGame(
  festaGameNumber: 7 | 8 | 9 | 10,
  kohPlayerIndex = 0
): number {
  return festaOwner(kohPlayerIndex, festaGameNumberToIndex(festaGameNumber));
}

function isDevFestaPhase(value: string): value is DevKingFestaPhase {
  return (DEV_KING_FESTA_PHASES as readonly string[]).includes(value);
}

/**
 * Parse `?devKingFesta=7` and optional `&festaPhase=auction`.
 * Returns null outside DEV or for invalid params (silent ignore).
 */
export function parseDevKingFestaParams(search: string): DevKingFestaJump | null {
  if (!isKingDevJumpEnabled()) return null;

  const raw = search.startsWith('?') ? search.slice(1) : search;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return null;
  }

  const festaRaw = params.get('devKingFesta');
  if (festaRaw == null || festaRaw === '') return null;

  const n = Number(festaRaw);
  if (!Number.isInteger(n) || n < 7 || n > 10) return null;

  const phaseRaw = params.get('festaPhase');
  let festaPhase: DevKingFestaPhase = 'auction';
  if (phaseRaw != null && phaseRaw !== '') {
    if (!isDevFestaPhase(phaseRaw)) return null;
    festaPhase = phaseRaw;
  }

  return {
    festaGameNumber: n as 7 | 8 | 9 | 10,
    festaPhase
  };
}

export function formatDevKingFestaBadge(jump: DevKingFestaJump): string {
  return `DEV · King Festa ${jump.festaGameNumber} · ${jump.festaPhase}`;
}

/**
 * Apply a deterministic festa fixture on a King PT adapter.
 * No-ops outside development.
 */
export function applyDevFestaFixture(
  adapter: KingGame | KingPtGame,
  playerNames: string[],
  jump: DevKingFestaJump,
  options?: Record<string, unknown>
): GameState | null {
  if (!isKingDevJumpEnabled()) return null;

  if (adapter instanceof KingGame) {
    return adapter.applyDevFestaFixture(playerNames, jump, options);
  }
  return adapter.applyDevFestaFixture(playerNames, jump, options);
}

export function isFestaPhaseForJump(phase: KingFestaPhase | null | undefined): boolean {
  return phase != null && (DEV_KING_FESTA_PHASES as readonly string[]).includes(phase);
}

export function assertJumpTargetsFesta(jump: DevKingFestaJump): boolean {
  const gameIndex = festaGameNumberToIndex(jump.festaGameNumber);
  return gameIndex >= KING_NEGATIVE_GAMES && gameIndex < KING_NEGATIVE_GAMES + 4;
}
