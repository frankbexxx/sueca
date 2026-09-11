/**
 * Compact global trick progress for the HUD (UX-P3.2).
 * Seat chrome no longer shows remaining card counts.
 */

import type { GameState, GameVariant } from '../types/game';

export function tricksPerHand(variant: GameVariant): number {
  return variant === 'sueca' ? 10 : 13;
}

/**
 * 1-based current trick index within the hand.
 * Uses playedCards when present; falls back to hand-size inference.
 */
export function resolveTrickProgress(
  gameState: GameState,
  variant: GameVariant
): { current: number; total: number } {
  const total = tricksPerHand(variant);
  const played = Array.isArray(gameState.playedCards) ? gameState.playedCards.length : 0;
  let completed = Math.floor(played / 4);

  if (played === 0 && gameState.players?.length) {
    const maxHand = Math.max(0, ...gameState.players.map((p) => p.hand?.length ?? 0));
    if (maxHand > 0 && maxHand <= total) {
      completed = Math.max(0, total - maxHand);
    }
  }

  // While resolving a completed trick, stay on that trick number.
  if (gameState.waitingForTrickEnd && completed > 0) {
    return { current: Math.min(total, completed), total };
  }

  const current = Math.min(total, Math.max(1, completed + 1));
  return { current, total };
}

export function formatTrickProgressLabel(
  progress: { current: number; total: number },
  locale: 'pt' | 'en' = 'pt'
): string {
  const word = locale === 'pt' ? 'Vaza' : 'Trick';
  return `${word} ${progress.current}/${progress.total}`;
}
