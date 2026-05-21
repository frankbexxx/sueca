import { BaseGameAdapter } from './GameAdapter';
import { Game } from '../Game';
import { AIDifficulty, DealingMethod, GameState } from '../../types/game';

export class SuecaGame extends BaseGameAdapter {
  variant = 'sueca' as const;
  private game?: Game;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    const dealingMethod = (options?.dealingMethod as DealingMethod) || 'A';
    const aiDifficulty = (options?.aiDifficulty as AIDifficulty) || 'medium';
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;

    this.game = new Game(playerNames, dealingMethod, aiDifficulty, localPlayerIndex);
    const state = this.game.getState();
    state.variant = 'sueca';
    return state;
  }

  getCurrentState(): GameState {
    if (!this.game) {
      throw new Error('SuecaGame not initialized');
    }
    return this.game.getState();
  }

  canPlayCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    return this.game?.canPlayCard(playerIndex, cardIndex) ?? false;
  }

  playCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    return this.game?.playCard(playerIndex, cardIndex) ?? false;
  }

  finishTrick(_state: GameState): void {
    this.game?.finishTrick();
  }

  continueToNextRound(_state: GameState): void {
    this.game?.continueToNextRound();
  }

  startRound(_state: GameState): void {
    this.game?.startRound();
  }

  chooseAICard(_state: GameState, playerIndex: number): number {
    return this.game?.chooseAICard(playerIndex) ?? -1;
  }

  pauseGame(_state: GameState): void {
    this.game?.pauseGame();
  }

  resumeGame(_state: GameState): void {
    this.game?.resumeGame();
  }

  quitGame(_state: GameState): void {
    this.game?.quitGame();
  }

  updatePlayerNames(_state: GameState, names: string[]): void {
    this.game?.updatePlayerNames(names);
  }

  restoreState(state: GameState): GameState {
    const names = state.players.map((p) => p.name);
    this.game = new Game(names, state.dealingMethod || 'A', state.aiDifficulty || 'medium');
    this.game.loadState(state);
    return this.getCurrentState();
  }
}
