import { AIDifficulty } from '../../types/game';

/**
 * Describes the behavioural parameters for each difficulty level.
 * Used by per-game strategies to adapt their decision logic.
 */
export interface DifficultyProfile {
  /** Probability of picking a random legal card instead of the strategic choice. */
  randomnessFactor: number;
  /** Whether the AI tracks which cards have been played when evaluating moves. */
  usesCardTracking: boolean;
  /** Whether the AI uses partner signals for coordination (Sueca only for now). */
  usesPartnerSignals: boolean;
}

export const DIFFICULTY_PROFILES: Record<AIDifficulty, DifficultyProfile> = {
  easy: {
    randomnessFactor: 0.5,
    usesCardTracking: false,
    usesPartnerSignals: false,
  },
  medium: {
    randomnessFactor: 0.0,
    usesCardTracking: false,
    usesPartnerSignals: false,
  },
  hard: {
    randomnessFactor: 0.0,
    usesCardTracking: true,
    usesPartnerSignals: true,
  },
};

export function getDifficultyProfile(difficulty: AIDifficulty): DifficultyProfile {
  return DIFFICULTY_PROFILES[difficulty];
}
