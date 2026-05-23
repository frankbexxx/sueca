import { AIDifficulty, DealingMethod, GameVariant } from './game';
import { RulesPresetId } from '../constants/rulesPresets';

export interface GameConfig {
  playerNames: string[];
  aiDifficulty: AIDifficulty;
  dealingMethod: DealingMethod;
  multiplayerEnabled: boolean;
  multiplayerSessionId?: string;
  multiplayerJoinMode?: boolean;
  gameVariant: GameVariant;
  /** Rules preset (modo normal or regional variant). */
  rulesPresetId: RulesPresetId;
}
