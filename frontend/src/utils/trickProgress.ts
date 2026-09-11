/**
 * Canonical trick-progress helper for the live HUD (UX-P3.2 / P3.4a).
 *
 * Single source of truth for `Vaza N/M` / `Trick N/M` across Sueca / Spades /
 * Hearts / King. React ScoreStrip / UnifiedGameStatusPanel consume this;
 * Phaser must not invent a parallel counter.
 *
 * Meaning:
 * - `total` = tricks in the current hand (Sueca 10, others 13)
 * - `current` = 1-based trick in progress (or just completed while waiting)
 * - never returns current > total
 *
 * Note (King): match progress `Jogo N/10` is a different axis (10 games per
 * match). That must be labeled explicitly — never bare `N/10` next to Vaza.
 */

import type { GameState, GameVariant } from '../types/game';

export interface TrickProgress {
  current: number;
  total: number;
}

/** Tricks per deal/hand from variant rules (not King match length). */
export function tricksPerHand(variant: GameVariant): number {
  return variant === 'sueca' ? 10 : 13;
}

function completedTricksFromPlayedCards(gameState: GameState): number {
  const played = Array.isArray(gameState.playedCards) ? gameState.playedCards.length : 0;
  return Math.max(0, Math.floor(played / 4));
}

function completedTricksFromHands(gameState: GameState, total: number): number | null {
  if (!gameState.players?.length) return null;
  const maxHand = Math.max(0, ...gameState.players.map((p) => p.hand?.length ?? 0));
  if (maxHand <= 0 || maxHand > total) return null;
  // During a trick some seats already discarded — use max remaining.
  return Math.max(0, total - maxHand);
}

/** Prefer engine King counter when present (completed tricks after finishTrick). */
function completedTricksFromKing(gameState: GameState): number | null {
  const kingPt = gameState.variantState?.kingPt as { trickNumber?: number } | undefined;
  if (kingPt && typeof kingPt.trickNumber === 'number' && kingPt.trickNumber >= 0) {
    return kingPt.trickNumber;
  }
  return null;
}

/**
 * 1-based current trick index within the hand.
 */
export function resolveTrickProgress(
  gameState: GameState,
  variant: GameVariant
): TrickProgress {
  const total = tricksPerHand(variant);
  const fromPlayed = completedTricksFromPlayedCards(gameState);
  const fromKing = variant === 'king' ? completedTricksFromKing(gameState) : null;
  const fromHands =
    fromPlayed === 0 && fromKing == null
      ? completedTricksFromHands(gameState, total)
      : null;

  // Prefer the higher completed count among reliable signals (guards stale fields).
  let completed = fromPlayed;
  if (fromKing != null) completed = Math.max(completed, fromKing);
  if (fromHands != null) completed = Math.max(completed, fromHands);

  completed = Math.min(total, completed);

  // While resolving a completed trick, stay on that trick number (not total+1).
  if (gameState.waitingForTrickEnd) {
    const current = Math.min(total, Math.max(1, completed || 1));
    return { current, total };
  }

  if (completed >= total) {
    return { current: total, total };
  }

  const current = Math.min(total, Math.max(1, completed + 1));
  return { current, total };
}

export function formatTrickProgressLabel(
  progress: TrickProgress,
  locale: 'pt' | 'en' = 'pt'
): string {
  const word = locale === 'pt' ? 'Vaza' : 'Trick';
  return `${word} ${progress.current}/${progress.total}`;
}
