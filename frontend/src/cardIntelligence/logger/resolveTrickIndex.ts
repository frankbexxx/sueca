import { GameState } from '../../types/game';

export class TrickIndexTracker {
  private lastRoundIndex = -1;
  private tricksStartedInRound = 0;

  reset(): void {
    this.lastRoundIndex = -1;
    this.tricksStartedInRound = 0;
  }

  /**
   * trickIndex = number of tricks already started in the current round (0-based).
   * Increments when turnIndex === 0 (new trick lead).
   */
  resolve(roundIndex: number, turnIndex: number): number | null {
    if (roundIndex !== this.lastRoundIndex) {
      this.lastRoundIndex = roundIndex;
      this.tricksStartedInRound = 0;
    }

    if (turnIndex === 0) {
      const trickIndex = this.tricksStartedInRound;
      this.tricksStartedInRound += 1;
      return trickIndex;
    }

    if (this.tricksStartedInRound === 0) {
      return null;
    }

    return this.tricksStartedInRound - 1;
  }
}

export const trickIndexTracker = new TrickIndexTracker();

export function resetTrickIndexTrackerForTests(): void {
  trickIndexTracker.reset();
}

export function normalizeRoundIndex(state: GameState): number {
  const round = state.round ?? 1;
  return Math.max(0, round - 1);
}

export function resolveTurnIndex(stateBefore: GameState): number {
  return stateBefore.currentTrick.length;
}
