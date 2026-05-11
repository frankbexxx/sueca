import { BaseGameAdapter } from './GameAdapter';
import { Game } from '../Game';
import { GameState } from '../../types/game';

export class SuecaGame extends BaseGameAdapter {
  variant = 'sueca' as const;
  private game?: Game;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.game = new Game(playerNames, 'A', (options?.aiDifficulty as any) || 'medium');
    return this.game.getState();
  }

  canPlayCard(state: GameState, playerIndex: number, cardIndex: number): boolean {
    return this.game?.canPlayCard(playerIndex, cardIndex) ?? false;
  }

  playCard(state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.game) return false;
    const result = this.game.playCard(playerIndex, cardIndex);
    return result;
  }
}
