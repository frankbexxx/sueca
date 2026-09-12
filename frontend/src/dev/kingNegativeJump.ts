/**
 * DEV ONLY — jump into a King negative contract with sample penalty cards.
 * Query: `?devKingNeg=no_hearts` (also queens / men / koh / tricks / last_two).
 */

import type { Card, GameState } from '../types/game';
import { KingGame } from '../models/games/KingGame';
import { KingPtGame } from '../models/games/KingPtGame';
import {
  KING_NEGATIVE_CONTRACTS,
  KingNegativeContract
} from '../models/games/king/kingContracts';

const ALIASES: Record<string, KingNegativeContract> = {
  no_hearts: 'no_hearts',
  hearts: 'no_hearts',
  copas: 'no_hearts',
  no_queens: 'no_queens',
  queens: 'no_queens',
  damas: 'no_queens',
  no_men: 'no_men',
  men: 'no_men',
  homens: 'no_men',
  no_king_hearts: 'no_king_hearts',
  koh: 'no_king_hearts',
  king_hearts: 'no_king_hearts',
  no_tricks: 'no_tricks',
  tricks: 'no_tricks',
  vazas: 'no_tricks',
  no_last_two: 'no_last_two',
  last_two: 'no_last_two'
};

function card(id: string, rank: Card['rank'], suit: Card['suit']): Card {
  return { id, rank, suit };
}

/** Deterministic sample mosaics for visual smoke (not a rules path). */
export function samplePenaltyCardsForContract(
  contract: KingNegativeContract
): Card[][] {
  const empty: Card[][] = [[], [], [], []];
  if (contract === 'no_hearts') {
    empty[0] = [card('h1', 'A', 'hearts'), card('h2', '10', 'hearts')];
    empty[2] = [card('h3', '7', 'hearts'), card('h4', '3', 'hearts')];
    return empty;
  }
  if (contract === 'no_queens') {
    empty[1] = [card('q1', 'Q', 'hearts')];
    empty[3] = [card('q2', 'Q', 'spades')];
    return empty;
  }
  if (contract === 'no_men') {
    empty[0] = [card('m1', 'K', 'clubs'), card('m2', 'J', 'diamonds')];
    empty[2] = [card('m3', 'K', 'hearts')];
    return empty;
  }
  if (contract === 'no_king_hearts') {
    empty[1] = [card('kh', 'K', 'hearts')];
    return empty;
  }
  return empty;
}

export function sampleRoundDeltasForContract(contract: KingNegativeContract): number[] {
  if (contract === 'no_hearts') return [-40, 0, -40, 0];
  if (contract === 'no_queens') return [0, -50, 0, -50];
  if (contract === 'no_men') return [-40, 0, -20, 0];
  if (contract === 'no_king_hearts') return [0, -160, 0, 0];
  if (contract === 'no_tricks') return [-20, -40, 0, -20];
  return [0, -90, 0, -90];
}

export const DEV_NEG_ROUND_START_SCORES = [-50, 20, -30, 60];

export function isKingDevNegJumpEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function parseDevKingNegParams(search: string): KingNegativeContract | null {
  if (!isKingDevNegJumpEnabled()) return null;
  const raw = search.startsWith('?') ? search.slice(1) : search;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return null;
  }
  const value = params.get('devKingNeg');
  if (!value) return null;
  return ALIASES[value.toLowerCase()] ?? null;
}

export function contractToGameIndex(contract: KingNegativeContract): number {
  const idx = KING_NEGATIVE_CONTRACTS.findIndex((c) => c.id === contract);
  return idx >= 0 ? idx : 0;
}

export function formatDevKingNegBadge(contract: KingNegativeContract): string {
  return `DEV · King Neg · ${contract}`;
}

export function applyDevNegativeFixture(
  adapter: KingGame | KingPtGame,
  playerNames: string[],
  contract: KingNegativeContract,
  options?: Record<string, unknown>
): GameState | null {
  if (!isKingDevNegJumpEnabled()) return null;
  const startScores = DEV_NEG_ROUND_START_SCORES;
  const deltas = sampleRoundDeltasForContract(contract);
  const totals = startScores.map((s, i) => s + deltas[i]);
  return adapter.applyDevNegativeFixture(playerNames, contract, {
    ...options,
    roundStartScores: startScores,
    lastRoundDeltas: deltas,
    playerScores: totals,
    penaltyCardsTaken: samplePenaltyCardsForContract(contract)
  });
}
