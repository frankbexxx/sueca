import { BaseGameAdapter, RestoreStateOptions } from './GameAdapter';
import { Game } from '../Game';
import { AIDifficulty, DealingDirection, DealingMethod, GameState } from '../../types/game';
import { getLegalIndices } from '../../ai/core/LegalMoveFilter';
import { SuecaStrategyContext, chooseSuecaCard } from '../../ai/games/sueca/SuecaStrategy';

export class SuecaGame extends BaseGameAdapter {
  variant = 'sueca' as const;
  private game?: Game;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    const dealingMethod = (options?.dealingMethod as DealingMethod) || 'A';
    const aiDifficulty = (options?.aiDifficulty as AIDifficulty) || 'medium';
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const multiplayerSlots = options?.multiplayerSlots as Array<'human' | 'ai'> | undefined;

    this.game = new Game(playerNames, dealingMethod, aiDifficulty, localPlayerIndex, multiplayerSlots);
    const state = this.game.getState();
    state.variant = 'sueca';
    return state;
  }

  getCurrentState(): GameState {
    if (!this.game) {
      throw new Error('SuecaGame not initialized');
    }
    const state = this.game.getState();
    state.variant = 'sueca';
    return state;
  }

  /** Sueca SoT lives in Game; mutators call Game APIs (not snapshot args). */
  protected getMutableEngineState(): GameState | undefined {
    return undefined;
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

  chooseAICard(state: GameState, playerIndex: number): number {
    if (!this.game) return -1;
    const legalIndices = new Set(getLegalIndices(this, state, playerIndex));
    const ctx: SuecaStrategyContext = {
      getValidCards: (idx) => {
        const p = state.players[idx];
        return (p?.hand ?? [])
          .map((card, i) => ({ card, index: i }))
          .filter(({ index }) => legalIndices.has(index));
      },
    };
    return chooseSuecaCard(state, playerIndex, ctx);
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

  setDealingMethod(method: DealingMethod): void {
    this.game?.setDealingMethod(method);
  }

  setDealingDirection(direction: DealingDirection): void {
    this.game?.setDealingDirection(direction);
  }

  restoreState(state: GameState, options?: RestoreStateOptions): GameState {
    const names = state.players.map((p) => p.name);
    this.game = new Game(names, state.dealingMethod || 'A', state.aiDifficulty || 'medium');
    this.game.loadState(state);
    if (options?.localPlayerIndex !== undefined) {
      this.game.setLocalPlayerIndex(options.localPlayerIndex, options.multiplayerSlots);
    }
    return this.getCurrentState();
  }
}
