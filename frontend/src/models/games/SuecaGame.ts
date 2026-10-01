import { BaseGameAdapter, RestoreStateOptions } from './GameAdapter';
import { Game } from '../Game';
import { AIDifficulty, GameState } from '../../types/game';
import { SuecaVariantFlow } from './variantFlowApi';
import { migrateSuecaPersistedState } from './migrateSuecaPersistedState';

export class SuecaGame extends BaseGameAdapter {
  variant = 'sueca' as const;
  private game?: Game;

  getVariantFlow(): SuecaVariantFlow {
    return {
      kind: 'sueca',
      setDealAlignment: (alignment) => this.setDealAlignment(alignment)
    };
  }

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    const aiDifficulty = (options?.aiDifficulty as AIDifficulty) || 'medium';
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const multiplayerSlots = options?.multiplayerSlots as Array<'human' | 'ai'> | undefined;
    const playDirection =
      options?.playDirection === 'left' || options?.playDirection === 'right'
        ? options.playDirection
        : 'right';

    this.game = new Game(
      playerNames,
      aiDifficulty,
      localPlayerIndex,
      multiplayerSlots,
      playDirection
    );
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

  /**
   * Card choice runs on Game state, the same object playCard mutates.
   * The snapshot argument is ignored so partnerSignals are not written
   * onto a clone that getCurrentState() will never return.
   */
  chooseAICard(_state: GameState, playerIndex: number): number {
    if (!this.game) return -1;
    return this.game.chooseAICard(playerIndex);
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

  setPlayDirection(direction: 'left' | 'right'): void {
    this.game?.setPlayDirection(direction);
  }

  setDealAlignment(alignment: 'same' | 'opposite'): void {
    this.game?.setDealAlignment(alignment);
  }

  restoreState(state: GameState, options?: RestoreStateOptions): GameState {
    const migrated = migrateSuecaPersistedState({ ...state, variant: 'sueca' });
    if (!migrated.ok || !migrated.state) {
      throw new Error(`Sueca restoreState rejected: ${migrated.reason}`);
    }
    const restored = migrated.state;
    const names = restored.players.map((p) => p.name);
    const playDirection = restored.playDirection === 'left' ? 'left' : 'right';
    this.game = new Game(
      names,
      restored.aiDifficulty || 'medium',
      undefined,
      undefined,
      playDirection
    );
    this.game.loadState(restored);
    if (options?.localPlayerIndex !== undefined) {
      this.game.setLocalPlayerIndex(options.localPlayerIndex, options.multiplayerSlots);
    }
    return this.getCurrentState();
  }
}
