import { AIDifficulty, DealingMethod, GameVariant } from './game';

export interface GameConfig {
  playerNames: string[];
  aiDifficulty: AIDifficulty;
  dealingMethod: DealingMethod;
  multiplayerEnabled: boolean;
  multiplayerSessionId?: string;
  multiplayerJoinMode?: boolean;
  gameVariant: GameVariant;
}
