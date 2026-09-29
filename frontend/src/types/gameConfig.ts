import { AIDifficulty, DealingMethod, GameVariant, PlayDirection } from './game';
import { RulesPresetId } from '../constants/rulesPresets';

export interface GameConfig {
  playerNames: string[];
  aiDifficulty: AIDifficulty;
  /**
   * TEMPORARY bridge field — derived from playDirection + dealAlignment at the UI boundary.
   * Prefer `playDirection` as session SoT. Persistence schema migration is Phase 6.
   */
  dealingMethod: DealingMethod;
  /**
   * Sueca session play direction (ARCH-SUECA-06). Fixed for the match-to-4.
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
