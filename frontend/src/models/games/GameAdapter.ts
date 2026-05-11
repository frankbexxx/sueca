import { Card, GameState, GameVariant, Player } from '../../types/game';

export interface GameAdapter {
  variant: GameVariant;
  initialize(playerNames: string[], options?: Record<string, unknown>): GameState;
  canPlayCard(state: GameState, playerIndex: number, cardIndex: number): boolean;
  playCard(state: GameState, playerIndex: number, cardIndex: number): boolean;
  getPlayerHand(state: GameState, playerIndex: number): Card[];
  getPlayers(state: GameState): Player[];
  getState(state: GameState): GameState;
}

export abstract class BaseGameAdapter implements GameAdapter {
  abstract variant: GameVariant;

  abstract initialize(playerNames: string[], options?: Record<string, unknown>): GameState;

  abstract canPlayCard(state: GameState, playerIndex: number, cardIndex: number): boolean;

  abstract playCard(state: GameState, playerIndex: number, cardIndex: number): boolean;

  getPlayerHand(state: GameState, playerIndex: number): Card[] {
    return state.players[playerIndex]?.hand || [];
  }

  getPlayers(state: GameState): Player[] {
    return state.players;
  }

  getState(state: GameState): GameState {
    return { ...state };
  }
}
