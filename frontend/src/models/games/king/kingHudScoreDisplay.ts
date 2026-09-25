import { KingPhase } from './kingContracts';
import { KING_NEGATIVE_GAMES } from './kingContracts';

export interface KingHudScoreLine {
  /** When true, show round delta as primary and match total as secondary. */
  roundPrimary: boolean;
  roundDelta: number;
  totalScore: number;
}

/**
 * King HUD scores — reads engine fields only (no recalculation).
 * Live round progress uses `lastRoundDeltas` (updated in finishTrick).
 * Match total stays at pre-round accumulation (`roundStartScores`) while live.
 * Applies to negatives and festa_play.
 */
export function resolveKingNegativeHudScore(input: {
  gameIndex: number;
  phase: KingPhase;
  lastRoundDeltas: number[];
  playerScores: number[];
  playerIndex: number;
  /** When provided during live play, Total shows this (not live-projected playerScores). */
  roundStartScores?: number[];
}): KingHudScoreLine {
  const { gameIndex, phase, lastRoundDeltas, playerScores, playerIndex, roundStartScores } =
    input;
  const roundDelta = lastRoundDeltas[playerIndex] ?? 0;
  const negativeLive =
    gameIndex >= 0 && gameIndex < KING_NEGATIVE_GAMES && phase === 'negative';
  const festaLive = gameIndex >= KING_NEGATIVE_GAMES && phase === 'festa_play';
  const roundPrimary = negativeLive || festaLive;

  // UX-KING-SCORE-LIVE-01 — keep accumulated previous-round total separate from live delta.
  const totalScore = roundPrimary
    ? (roundStartScores?.[playerIndex] ??
      (playerScores[playerIndex] ?? 0) - roundDelta)
    : (playerScores[playerIndex] ?? 0);

  return { roundPrimary, roundDelta, totalScore };
}

export function formatSignedScore(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function formatKingHudTotalLabel(total: number, locale: 'pt' | 'en'): string {
  const body = formatSignedScore(total);
  return locale === 'pt' ? `Total ${body}` : `Total ${body}`;
}
