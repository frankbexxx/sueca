import { AIDifficulty, DealingMethod, GameVariant, PlayDirection } from './game';
import { RulesPresetId } from '../constants/rulesPresets';

export interface GameConfig {
  playerNames: string[];
  aiDifficulty: AIDifficulty;
  dealingMethod: DealingMethod;
  /**
   * Sueca session play direction. Optional bridge until setup UI exposes it (Phase 4+).
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
