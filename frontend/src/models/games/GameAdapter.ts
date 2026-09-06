/**
 * Adapter state contract (C1)
 * ---------------------------
 * Engine/adapter private state is the only mutable source of truth.
 * getCurrentState() always returns a deep snapshot for UI / callers.
 * Mutators (playCard, pauseGame, finishTrick, …) operate on engine state;
 * the GameState argument on legacy signatures is ignored when SoT exists.
 *
 * Per variant SoT:
 * - Sueca: Game.private state (via SuecaGame)
 * - Spades / Hearts / King simplified / King PT: adapter.private state
 * - KingGame facade: delegates to KingPtGame | KingSimplifiedGame
 *
 * Divergence risks (mitigated):
 * - Mutating a getCurrentState() snapshot must not affect the engine
 * - pause/resume/quit/updatePlayerNames must not write only to a discarded clone
 */

import { Card, GameState, GameVariant, Player, AIDifficulty, DealingMethod } from '../../types/game';
import { cloneGameState } from './cloneGameState';
import { VariantFlowApi } from './variantFlowApi';

export interface GameInitOptions {
  dealingMethod?: DealingMethod;
  aiDifficulty?: AIDifficulty;
  localPlayerIndex?: number;
}

export interface RestoreStateOptions {
  localPlayerIndex?: number;
  multiplayerSlots?: Array<'human' | 'ai'>;
}

export interface GameAdapter {
  variant: GameVariant;
  initialize(playerNames: string[], options?: Record<string, unknown>): GameState;
  /** Deep snapshot — safe for UI; do not mutate expecting engine updates. */
  getCurrentState(): GameState;
  /**
   * Typed variant flow boundary for the shared board shell (C3).
   * Prefer this over casting adapters to SuecaGame / SpadesGame / …
   */
  getVariantFlow(): VariantFlowApi;
  canPlayCard(state: GameState, playerIndex: number, cardIndex: number): boolean;
  playCard(state: GameState, playerIndex: number, cardIndex: number): boolean;
  finishTrick(state: GameState): void;
  continueToNextRound(state: GameState): void;
  startRound(state: GameState): void;
  chooseAICard(state: GameState, playerIndex: number): number;
  pauseGame(state: GameState): void;
  resumeGame(state: GameState): void;
  quitGame(state: GameState): void;
  updatePlayerNames(state: GameState, names: string[]): void;
  getPlayerHand(state: GameState, playerIndex: number): Card[];
  getPlayers(state: GameState): Player[];
  getState(state: GameState): GameState;
  restoreState(state: GameState, options?: RestoreStateOptions): GameState;
}

export abstract class BaseGameAdapter implements GameAdapter {
  abstract variant: GameVariant;

  abstract initialize(playerNames: string[], options?: Record<string, unknown>): GameState;

  abstract getCurrentState(): GameState;

  abstract getVariantFlow(): VariantFlowApi;

  abstract canPlayCard(state: GameState, playerIndex: number, cardIndex: number): boolean;

  abstract playCard(state: GameState, playerIndex: number, cardIndex: number): boolean;

  finishTrick(_state: GameState): void {
    /* variant override */
  }

  continueToNextRound(_state: GameState): void {
    /* variant override */
  }

  startRound(_state: GameState): void {
    /* variant override */
  }

  chooseAICard(state: GameState, playerIndex: number): number {
    const player = state.players[playerIndex];
    if (!player) return -1;
    for (let i = 0; i < player.hand.length; i++) {
      if (this.canPlayCard(state, playerIndex, i)) return i;
    }
    return -1;
  }

  /**
   * Adapters that clone in getCurrentState() must return their mutable engine state.
   * Sueca overrides pause/resume/quit/updatePlayerNames on the Game engine instead.
   */
  protected getMutableEngineState(): GameState | undefined {
    return undefined;
  }

  /**
   * Public facade hook (e.g. KingGame → impl) without exposing mutators.
   * @internal
   */
  resolveMutableEngineState(): GameState | undefined {
    return this.getMutableEngineState();
  }

  /** Prefer engine SoT; ignore snapshot argument when SoT is available. */
  pauseGame(state: GameState): void {
    const target = this.getMutableEngineState() ?? state;
    target.isPaused = true;
  }

  resumeGame(state: GameState): void {
    const target = this.getMutableEngineState() ?? state;
    target.isPaused = false;
  }

  quitGame(state: GameState): void {
    const target = this.getMutableEngineState() ?? state;
    target.isGameOver = true;
    target.isPaused = false;
  }

  updatePlayerNames(state: GameState, names: string[]): void {
    const target = this.getMutableEngineState() ?? state;
    target.players = target.players.map((player, index) => ({
      ...player,
      name: names[index] || `Player ${index + 1}`
    }));
  }

  getPlayerHand(state: GameState, playerIndex: number): Card[] {
    return state.players[playerIndex]?.hand || [];
  }

  getPlayers(state: GameState): Player[] {
    return state.players;
  }

  getState(state: GameState): GameState {
    return cloneGameState(state);
  }

  restoreState(state: GameState, _options?: RestoreStateOptions): GameState {
    return cloneGameState(state);
  }

  protected cloneState = cloneGameState;
}
