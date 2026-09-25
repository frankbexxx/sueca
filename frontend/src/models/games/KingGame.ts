import { BaseGameAdapter } from './GameAdapter';
import { GameState, Suit, Card } from '../../types/game';
import { resolvePresetId } from '../../constants/rulesPresets';
import { KingPtGame, getKingPtState } from './KingPtGame';
import { KingBidType, KingFestaChoice } from './king/kingContracts';
import type { KingNegativeContract } from './king/kingContracts';
import { createKingVariantFlow, KingVariantFlow } from './variantFlowApi';

/** Routes King product presets to KingPtGame (normal + synthetic). */
export class KingGame extends BaseGameAdapter {
  variant = 'king' as const;
  private impl?: KingPtGame;

  getVariantFlow(): KingVariantFlow {
    return createKingVariantFlow(this, getKingPtState);
  }

  private ensureImpl(options?: Record<string, unknown>): KingPtGame {
    if (this.impl) return this.impl;
    // Resolve (and migrate obsolete ids) — always KingPtGame for live product.
    resolvePresetId('king', options?.rulesPresetId as string | undefined);
    this.impl = new KingPtGame();
    return this.impl;
  }

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.impl = undefined;
    const game = this.ensureImpl(options);
    const preset = resolvePresetId('king', options?.rulesPresetId as string | undefined);
    return game.initialize(playerNames, { ...options, rulesPresetId: preset });
  }

  getCurrentState(): GameState {
    if (!this.impl) throw new Error('KingGame not initialized');
    return this.impl.getCurrentState();
  }

  protected getMutableEngineState(): GameState | undefined {
    return this.impl?.resolveMutableEngineState();
  }

  pauseGame(state: GameState): void {
    this.impl?.pauseGame(state);
  }

  resumeGame(state: GameState): void {
    this.impl?.resumeGame(state);
  }

  quitGame(state: GameState): void {
    this.impl?.quitGame(state);
  }

  advanceKohRevealStep(): void {
    this.impl?.advanceKohRevealStep();
  }

  confirmKohReveal(): void {
    this.impl?.confirmKohReveal();
  }

  submitAuctionPass(playerIndex: number): void {
    this.impl?.submitAuctionPass(playerIndex);
  }

  submitAuctionBid(playerIndex: number, bidType: KingBidType, amount: number): void {
    this.impl?.submitAuctionBid(playerIndex, bidType, amount);
  }

  acceptContract(): void {
    this.impl?.acceptContract();
  }

  rejectContract(): void {
    this.impl?.rejectContract();
  }

  requestHigherBid(bidType: KingBidType, amount: number): void {
    this.impl?.requestHigherBid(bidType, amount);
  }

  respondToHigherBid(raise: boolean, bidType?: KingBidType, amount?: number): void {
    this.impl?.respondToHigherBid(raise, bidType, amount);
  }

  declareEightOrNulls(): void {
    this.impl?.declareEightOrNulls();
  }

  respondEightOrNulls(bidderIndex: number, offerEight: boolean): void {
    this.impl?.respondEightOrNulls(bidderIndex, offerEight);
  }

  chooseFallback(choice: KingFestaChoice): void {
    this.impl?.chooseFallback(choice);
  }

  setupFesta(trump: Suit | null, noTrump: boolean, firstPlayerIndex: number): void {
    this.impl?.setupFesta(trump, noTrump, firstPlayerIndex);
  }

  confirmFestaSetup(): void {
    this.impl?.confirmFestaSetup();
  }

  dismissScorePopup(): void {
    this.impl?.dismissScorePopup();
  }

  promoteSyntheticRoundComplete(): void {
    this.impl?.promoteSyntheticRoundComplete();
  }

  acceptEarlyEnd(): void {
    this.impl?.acceptEarlyEnd();
  }

  declineEarlyEnd(): void {
    this.impl?.declineEarlyEnd();
  }

  tickFestaAi(): boolean {
    return this.impl?.tickFestaAi() ?? false;
  }

  confirmAuctionContinue(): void {
    this.impl?.confirmAuctionContinue();
  }

  /** DEV ONLY — jump into festa 7–10. See `dev/kingFestaJump.ts`. */
  applyDevFestaFixture(
    playerNames: string[],
    jump: { festaGameNumber: number; festaPhase?: string | null; liveAuction?: boolean },
    options?: Record<string, unknown>
  ): GameState {
    this.impl = undefined;
    const game = this.ensureImpl({ ...options, rulesPresetId: 'king-pt-normal' });
    return game.applyDevFestaFixture(playerNames, jump, options);
  }

  /** DEV ONLY — mid-round negative with sample penalty cards. */
  applyDevNegativeFixture(
    playerNames: string[],
    contract: KingNegativeContract,
    options?: Record<string, unknown>
  ): GameState {
    this.impl = undefined;
    const game = this.ensureImpl({ ...options, rulesPresetId: 'king-pt-normal' });
    return game.applyDevNegativeFixture(playerNames, contract, options);
  }

  /** Enable King Sintético combined-all-negatives on current dealt round. */
  enableSyntheticCombinedRound(): GameState {
    this.ensureImpl({ rulesPresetId: 'king-pt-synthetic' });
    return this.impl!.enableSyntheticCombinedRound();
  }

  /** @deprecated Prefer enableSyntheticCombinedRound */
  enableDevSyntheticCombinedRound(): GameState {
    return this.enableSyntheticCombinedRound();
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
    const raw = (state.variantState?.rulesPresetId as string) ?? 'king-pt-normal';
    const preset = resolvePresetId('king', raw);
    this.impl = undefined;
    const game = this.ensureImpl({ rulesPresetId: preset });
    return game.restoreState(state);
  }

  chooseAICard(state: GameState, playerIndex: number): number {
    return this.impl?.chooseAICard(state, playerIndex) ?? -1;
  }
}
