import { Card, GameState, GameVariant, Player, AIDifficulty, DealingMethod } from '../../types/game';

export interface GameInitOptions {
  dealingMethod?: DealingMethod;
  aiDifficulty?: AIDifficulty;
  localPlayerIndex?: number;
}

export interface GameAdapter {
  variant: GameVariant;
  initialize(playerNames: string[], options?: Record<string, unknown>): GameState;
  getCurrentState(): GameState;
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
  restoreState(state: GameState): GameState;
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export abstract class BaseGameAdapter implements GameAdapter {
  abstract variant: GameVariant;

  abstract initialize(playerNames: string[], options?: Record<string, unknown>): GameState;

  abstract getCurrentState(): GameState;

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

  pauseGame(state: GameState): void {
    state.isPaused = true;
  }

  resumeGame(state: GameState): void {
    state.isPaused = false;
  }

  quitGame(state: GameState): void {
    state.isGameOver = true;
    state.isPaused = false;
  }

  updatePlayerNames(state: GameState, names: string[]): void {
    state.players = state.players.map((player, index) => ({
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
    return cloneState(state);
  }

  restoreState(state: GameState): GameState {
    return cloneState(state);
  }

  protected cloneState = cloneState;
}
