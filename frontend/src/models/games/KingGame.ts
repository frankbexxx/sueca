import { BaseGameAdapter } from './GameAdapter';
import { GameState } from '../../types/game';
import { resolvePresetId } from '../../constants/rulesPresets';
import { KingPtGame } from './KingPtGame';
import { KingSimplifiedGame } from './KingSimplifiedGame';
import { KingFestaChoice } from './king/kingContracts';

type KingImpl = KingPtGame | KingSimplifiedGame;

function isPtGame(game: KingImpl): game is KingPtGame {
  return game instanceof KingPtGame;
}

/** Routes King to PT normal or simplified preset implementation. */
export class KingGame extends BaseGameAdapter {
  variant = 'king' as const;
  private impl?: KingImpl;

  private ensureImpl(options?: Record<string, unknown>): KingImpl {
    if (this.impl) return this.impl;
    const preset = resolvePresetId('king', options?.rulesPresetId as string | undefined);
    this.impl = preset === 'king-simplified' ? new KingSimplifiedGame() : new KingPtGame();
    return this.impl;
  }

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.impl = undefined;
    const game = this.ensureImpl(options);
    return game.initialize(playerNames, options);
  }

  getCurrentState(): GameState {
    if (!this.impl) throw new Error('KingGame not initialized');
    return this.impl.getCurrentState();
  }

  chooseFesta(choice: KingFestaChoice): void {
    if (this.impl && isPtGame(this.impl)) this.impl.chooseFesta(choice);
  }

  submitAuctionBid(playerIndex: number, tricks: number, positive?: boolean): void {
    if (this.impl && isPtGame(this.impl)) this.impl.submitAuctionBid(playerIndex, tricks, positive);
  }

  dismissScorePopup(): void {
    if (this.impl && isPtGame(this.impl)) this.impl.dismissScorePopup();
  }

  canPlayCard(state: GameState, playerIndex: number, cardIndex: number): boolean {
    return this.impl?.canPlayCard(state, playerIndex, cardIndex) ?? false;
  }

  playCard(state: GameState, playerIndex: number, cardIndex: number): boolean {
    return this.impl?.playCard(state, playerIndex, cardIndex) ?? false;
  }

  finishTrick(state: GameState): void {
    this.impl?.finishTrick(state);
  }

  continueToNextRound(state: GameState): void {
    this.impl?.continueToNextRound(state);
  }

  startRound(state: GameState): void {
    this.impl?.startRound(state);
  }

  restoreState(state: GameState): GameState {
    const preset = (state.variantState?.rulesPresetId as string) ?? 'king-pt-normal';
    this.impl = undefined;
    const game = this.ensureImpl({ rulesPresetId: preset });
    return game.restoreState(state);
  }

  chooseAICard(state: GameState, playerIndex: number): number {
    return this.impl?.chooseAICard(state, playerIndex) ?? -1;
  }
}
