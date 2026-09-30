import { AIDifficulty, DealingMethod, GameVariant, PlayDirection } from './game';
import { RulesPresetId } from '../constants/rulesPresets';

export interface GameConfig {
  playerNames: string[];
  aiDifficulty: AIDifficulty;
  /**
   * @deprecated Obsolete Method A/B — ignored by Sueca runtime.
   * Retained optional for old session configs / non-Sueca fixtures.
   */
  dealingMethod?: DealingMethod;
  /**
   * Sueca session play direction. Fixed for the match-to-4.
   * Omitted → engine defaults to `'right'`.
   */
  playDirection?: PlayDirection;
  multiplayerEnabled: boolean;
  multiplayerSessionId?: string;
  /** Index of the local human player in multiplayer sessions (0 = host). */
  localPlayerIndex?: number;
  /** Slot types for each player position in multiplayer sessions. */
  multiplayerSlots?: Array<'human' | 'ai'>;
  gameVariant: GameVariant;
  /** Rules preset (modo normal or regional variant). */
  rulesPresetId: RulesPresetId;
}
