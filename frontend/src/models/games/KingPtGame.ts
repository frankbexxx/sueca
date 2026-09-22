import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player, Suit, AIDifficulty, Card } from '../../types/game';
import { chooseKingPtCard } from '../../ai/games/king/KingPlayStrategy';
import { runOneAiFestaStep, KingAuctionController } from '../../ai/games/king/KingAuctionStrategy';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';
import {
  auctionBidderOrder,
  auctionTurnIndexForSeat,
  bidAbsoluteValue,
  bidEquivalentPositive,
  canUseFourThreeThree,
  clampBid,
  compareKingOffers,
  nextActiveBidder
} from './king/kingAuction';
import {
  emptyBreakdown,
  KingKohRevealState,
  KingRoundBreakdown,
  KingRoundSummary
} from './king/kingBreakdown';
import {
  accumulateFestaTrickBreakdown,
  accumulateTrickBreakdown,
  accumulateSyntheticAllNegativesBreakdown,
  buildBreakdownLines,
  buildSyntheticBreakdownLines,
  initBreakdownForRound,
  nullAuctionStartNote
} from './king/kingBreakdownHelpers';
import { nullFestaStartScores } from './king/kingFestaScoreDisplay';
import {
  KING_NEGATIVE_CONTRACTS,
  KING_NEGATIVE_GAMES,
  KING_TOTAL_GAMES,
  KingActiveContract,
  KingBid,
  KingBidType,
  KingFallbackReason,
  KingFestaChoice,
  KingFestaMode,
  KingFestaPhase,
  KingNegativeContract,
  KingPhase,
  kingGameTitle,
  kingSyntheticRoundLabel,
  KingAuctionHistoryEntry
} from './king/kingContracts';
import {
  appendKingAuctionHistory,
  buildDevAuctionHistoryFromActions
} from './king/kingAuctionHistory';
import {
  FESTA_POSITIVE_TRICK,
  negativeTrickPenalty,
  settleFourByThree,
  settleNegativeFesta,
  settleNullAuctionFesta,
  settlePositiveAuctionRound,
  syntheticAllNegativesTrickPenalty
} from './king/kingScoring';
import { applyHandSortToState } from '../../utils/handSort';
import { canKingEndRoundEarly } from '../../utils/earlyRoundEnd';
import { createKingVariantFlow } from './variantFlowApi';

export interface KingPtVariantState {
  phase: KingPhase;
  gameIndex: number;
  kohPlayerIndex: number;
  contract: KingNegativeContract | null;
  playerScores: number[];
  lastRoundDeltas: number[];
  trickNumber: number;
  tricksWonThisGame: number[];
  festaOwnerIndex: number;
  festaMode: KingFestaMode | null;
  festaPhase: KingFestaPhase;
  auctionOrder: number[];
  auctionTurnIndex: number;
  /** Seats still allowed to bid/pass this festa auction. */
  activeBidders: number[];
  /** Seats that passed permanently this auction. */
  passedBidders: number[];
  /** Seat whose turn it is (synced with auctionTurnIndex). */
  currentBidder: number | null;
  /** Standing offer — same reference as bestBid during auction/negotiation. */
  standingBid: KingBid | null;
  /** Historical max equivalent positives (≥4 permanently blocks 4×3×3). */
  highestEquivalentValue: number;
  bestBid: KingBid | null;
  requestedBid: KingBid | null;
  activeContract: KingActiveContract | null;
  benefitOwnerIndex: number | null;
  eightOrNullsPending: boolean;
  eightOrNullsTarget: number | null;
  waitingForFallback: boolean;
  /** Why fallback opened — UI copy only; does not change rules. */
  fallbackReason: KingFallbackReason | null;
  waitingForFestaSetup: boolean;
  chosenTrump: Suit | null;
  noTrumpChosen: boolean;
  firstPlayerIndex: number | null;
  roundStartScores: number[];
  roundBreakdown: KingRoundBreakdown;
  gameHistory: KingRoundSummary[];
  kohReveal: KingKohRevealState | null;
  nullAuctionStartNote: string | null;
  showScorePopup: string | null;
  waitingForEarlyEnd: boolean;
  scoringFrozen: boolean;
  earlyEndOffered: boolean;
  auctionPlayerActions: Partial<Record<number, KingBid | 'pass'>>;
  /** Chronological auction log for UI — reset each festa auction. */
  auctionHistory: KingAuctionHistoryEntry[];
  /**
   * DEV ONLY — when true, runAiFestaSteps / tickFestaAi are no-ops so auction
   * entry stays observable. Never set in production paths.
   */
  pauseFestaAiForDev?: boolean;
  /**
   * DEV ONLY — King Sintético: all six negative objectives active in one round.
   * Never persisted / never set outside development apply paths.
   */
  devSyntheticAllNegatives?: boolean;
  /**
   * After each auction voice (bid/pass) or on auction_result: block auto-advance
   * until the human confirms via confirmAuctionContinue.
   */
  waitingForAuctionContinue: boolean;
}

function empty4(): number[] {
  return [0, 0, 0, 0];
}

function defaultKingState(): KingPtVariantState {
  return {
    phase: 'negative',
    gameIndex: 0,
    kohPlayerIndex: 0,
    contract: 'no_tricks',
    playerScores: empty4(),
    lastRoundDeltas: empty4(),
    trickNumber: 0,
    tricksWonThisGame: empty4(),
    festaOwnerIndex: 0,
    festaMode: null,
    festaPhase: null,
    auctionOrder: [],
    auctionTurnIndex: 0,
    activeBidders: [],
    passedBidders: [],
    currentBidder: null,
    standingBid: null,
    highestEquivalentValue: 0,
    bestBid: null,
    requestedBid: null,
    activeContract: null,
    benefitOwnerIndex: null,
    eightOrNullsPending: false,
    eightOrNullsTarget: null,
    waitingForFallback: false,
    fallbackReason: null,
    waitingForFestaSetup: false,
    chosenTrump: null,
    noTrumpChosen: false,
    firstPlayerIndex: null,
    roundStartScores: empty4(),
    roundBreakdown: emptyBreakdown(),
    gameHistory: [],
    kohReveal: null,
    nullAuctionStartNote: null,
    showScorePopup: null,
    waitingForEarlyEnd: false,
    scoringFrozen: false,
    earlyEndOffered: false,
    auctionPlayerActions: {},
    auctionHistory: [],
    waitingForAuctionContinue: false
  };
}

export function getKingPtState(state: GameState): KingPtVariantState {
  const vs = state.variantState?.kingPt as KingPtVariantState | undefined;
  if (!vs) return defaultKingState();
  const legacyPopup = (vs as { showScorePopup?: string | boolean | null }).showScorePopup;
  const showScorePopup =
    legacyPopup === true || legacyPopup === 'round'
      ? 'round'
      : typeof legacyPopup === 'string'
        ? legacyPopup
        : null;
  return {
    ...defaultKingState(),
    ...vs,
    roundBreakdown: {
      ...emptyBreakdown(),
      ...vs.roundBreakdown,
      penaltyCardsTaken: vs.roundBreakdown?.penaltyCardsTaken ?? [[], [], [], []]
    },
    gameHistory: vs.gameHistory ?? [],
    auctionHistory: vs.auctionHistory ?? [],
    waitingForAuctionContinue: Boolean(vs.waitingForAuctionContinue),
    activeBidders: Array.isArray(vs.activeBidders)
      ? [...vs.activeBidders]
      : vs.festaPhase === 'auction' && Array.isArray(vs.auctionOrder)
        ? [...vs.auctionOrder]
        : [],
    passedBidders: Array.isArray(vs.passedBidders) ? [...vs.passedBidders] : [],
    currentBidder:
      typeof vs.currentBidder === 'number'
        ? vs.currentBidder
        : vs.festaPhase === 'auction' && Array.isArray(vs.auctionOrder)
          ? (vs.auctionOrder[vs.auctionTurnIndex ?? 0] ?? null)
          : null,
    standingBid: vs.standingBid ?? vs.bestBid ?? null,
    highestEquivalentValue: Math.max(
      typeof vs.highestEquivalentValue === 'number' ? vs.highestEquivalentValue : 0,
      vs.bestBid ? bidEquivalentPositive(vs.bestBid) : 0,
      vs.standingBid ? bidEquivalentPositive(vs.standingBid) : 0
    ),
    bestBid: vs.bestBid ?? vs.standingBid ?? null,
    showScorePopup,
    // Never expose synthetic flag outside development.
    devSyntheticAllNegatives:
      process.env.NODE_ENV === 'development' ? Boolean(vs.devSyntheticAllNegatives) : false
  };
}

/** DEV combined-negative round active (production always false via getKingPtState). */
export function isDevSyntheticAllNegatives(king: KingPtVariantState): boolean {
  return process.env.NODE_ENV === 'development' && Boolean(king.devSyntheticAllNegatives);
}

export function simulateKohDraw(startPlayerIndex?: number): KingKohRevealState {
  const deck = new Deck('standard52');
  const sequence: KingKohRevealState['sequence'] = [];
  const start = startPlayerIndex ?? Math.floor(Math.random() * 4);
  let player = start;
  while (deck.getRemaining() > 0) {
    const card = deck.deal(1)[0];
    if (!card) break;
    sequence.push({ card, playerIndex: player });
    if (card.rank === 'K' && card.suit === 'hearts') {
      return { sequence, winnerIndex: player, startPlayerIndex: start, step: 0 };
    }
    player = (player + 1) % 4;
  }
  return { sequence, winnerIndex: 0, startPlayerIndex: start, step: 0 };
}

export function festaOwner(koh: number, gameIndex: number): number {
  return (koh + (gameIndex - KING_NEGATIVE_GAMES)) % 4;
}

export function gameLeader(koh: number, gameIndex: number): number {
  return ((koh + 2) % 4 + gameIndex) % 4;
}

export function isMen(card: Card): boolean {
  return card.rank === 'K' || card.rank === 'J';
}

function heartsLeadForbidden(king: KingPtVariantState): boolean {
  if (king.gameIndex >= KING_NEGATIVE_GAMES) return false;
  if (isDevSyntheticAllNegatives(king)) return true;
  return king.contract === 'no_hearts' || king.contract === 'no_king_hearts';
}

export function mustPlayKingOfHearts(player: Player, ledSuit: Suit | null, king: KingPtVariantState): boolean {
  if (king.gameIndex >= KING_NEGATIVE_GAMES) return false;
  if (!isDevSyntheticAllNegatives(king) && king.contract !== 'no_king_hearts') return false;
  if (!player.hand.some((c) => c.rank === 'K' && c.suit === 'hearts')) return false;
  // Lead: first legal chance only when the hand is hearts-only (cannot open another suit).
  if (ledSuit === null) return !hasNonHeart(player);
  // Follow: dump when void in the led suit.
  if (player.hand.some((c) => c.suit === ledSuit)) return false;
  return true;
}

function hasNonHeart(player: Player): boolean {
  return player.hand.some((c) => c.suit !== 'hearts');
}

function isFestaFlowBlocking(king: KingPtVariantState): boolean {
  return (
    king.festaPhase === 'auction' ||
    king.festaPhase === 'auction_result' ||
    king.festaPhase === 'negotiation' ||
    king.festaPhase === 'negotiation_counter' ||
    king.waitingForFallback ||
    king.waitingForFestaSetup ||
    king.eightOrNullsPending
  );
}

export class KingPtGame extends BaseGameAdapter {
  variant = 'king' as const;
  private state?: GameState;

  getVariantFlow() {
    return createKingVariantFlow(this, getKingPtState);
  }

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.state = this.buildState(playerNames, options, empty4(), 0, true);
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('KingPtGame not initialized');
    return this.cloneState(this.state);
  }

  protected getMutableEngineState(): GameState | undefined {
    return this.state;
  }

  getCurrentAuctionPlayer(king: KingPtVariantState): number | null {
    if (king.festaPhase !== 'auction') return null;
    if (king.currentBidder !== null && king.activeBidders.includes(king.currentBidder)) {
      return king.currentBidder;
    }
    return king.auctionOrder[king.auctionTurnIndex] ?? null;
  }

  private setStandingBid(king: KingPtVariantState, bid: KingBid | null): void {
    king.standingBid = bid;
    king.bestBid = bid;
  }

  private bumpWatermark(king: KingPtVariantState, bid: KingBid): void {
    const eq = bidEquivalentPositive(bid);
    if (eq > king.highestEquivalentValue) {
      king.highestEquivalentValue = eq;
    }
  }

  private syncAuctionTurnPointer(king: KingPtVariantState, seat: number | null): void {
    king.currentBidder = seat;
    king.auctionTurnIndex = auctionTurnIndexForSeat(king.auctionOrder, seat);
  }

  advanceKohRevealStep(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.phase !== 'koh_reveal' || !king.kohReveal) return;
    if (king.kohReveal.step < king.kohReveal.sequence.length - 1) {
      king.kohReveal.step += 1;
    }
    this.syncKing(king);
  }

  confirmKohReveal(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.phase !== 'koh_reveal' || !king.kohReveal) return;
    king.phase = 'negative';
    king.kohReveal = null;
    king.roundBreakdown = initBreakdownForRound(
      king.gameIndex,
      king.contract,
      king.festaMode,
      king.activeContract
    );
    this.deal(this.state);
    this.state.waitingForRoundStart = false;
    this.syncKing(king);
  }

  submitAuctionPass(playerIndex: number): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'auction') return;
    if (king.waitingForAuctionContinue) return;
    if (this.getCurrentAuctionPlayer(king) !== playerIndex) return;
    if (!king.activeBidders.includes(playerIndex)) return;

    king.auctionPlayerActions[playerIndex] = 'pass';
    king.auctionHistory = appendKingAuctionHistory(king.auctionHistory, playerIndex, 'pass');
    king.activeBidders = king.activeBidders.filter((s) => s !== playerIndex);
    if (!king.passedBidders.includes(playerIndex)) {
      king.passedBidders = [...king.passedBidders, playerIndex];
    }
    // Leader forfeits standing offer; watermark kept.
    if (king.standingBid?.bidderIndex === playerIndex) {
      this.setStandingBid(king, null);
    }

    this.continueAuctionAfterVoice(king, playerIndex);
    king.waitingForAuctionContinue = true;
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  submitAuctionBid(playerIndex: number, bidType: KingBidType, amount: number): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'auction') return;
    if (king.waitingForAuctionContinue) return;
    if (this.getCurrentAuctionPlayer(king) !== playerIndex) return;
    if (!king.activeBidders.includes(playerIndex)) return;
    if (king.passedBidders.includes(playerIndex)) return;

    const bid: KingBid = {
      bidderIndex: playerIndex,
      bidType,
      amount: clampBid(bidType, amount)
    };

    king.auctionPlayerActions[playerIndex] = bid;
    king.auctionHistory = appendKingAuctionHistory(king.auctionHistory, playerIndex, 'bid', bid);
    this.bumpWatermark(king, bid);
    if (compareKingOffers(bid, king.standingBid ?? king.bestBid, king.auctionOrder) === 'beats') {
      this.setStandingBid(king, bid);
    }

    this.continueAuctionAfterVoice(king, playerIndex);
    king.waitingForAuctionContinue = true;
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  /**
   * Manual auction step: after a voice is shown (or auction_result), advance
   * exactly one step — next AI voice, or negotiation/fallback from result.
   */
  confirmAuctionContinue(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (!king.waitingForAuctionContinue) return;

    if (king.festaPhase === 'auction_result') {
      king.waitingForAuctionContinue = false;
      this.resolveAuctionResultPresentation(king);
      this.syncKing(king);
      this.runAiFestaSteps();
      return;
    }

    if (king.festaPhase !== 'auction') {
      king.waitingForAuctionContinue = false;
      this.syncKing(king);
      return;
    }

    king.waitingForAuctionContinue = false;
    this.syncKing(king);
    if (king.pauseFestaAiForDev) return;
    const current = this.getCurrentAuctionPlayer(king);
    if (current !== null && this.state.players[current]?.type === 'ai') {
      this.runOneAiFestaStep(getKingPtState(this.state));
    }
  }

  acceptContract(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation' || !king.bestBid || king.eightOrNullsPending) return;
    this.applyContractFromBid(king, king.bestBid);
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  rejectContract(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation' || king.eightOrNullsPending) return;
    this.enterFallback(king, 'negotiation_failed');
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  requestHigherBid(bidType: KingBidType, amount: number): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation' || !king.bestBid || king.eightOrNullsPending) return;
    const requested: KingBid = {
      bidderIndex: king.bestBid.bidderIndex,
      bidType,
      amount: clampBid(bidType, amount)
    };
    if (bidAbsoluteValue(requested) < bidAbsoluteValue(king.bestBid)) return;
    king.requestedBid = requested;
    king.festaPhase = 'negotiation_counter';
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  respondToHigherBid(raise: boolean, bidType?: KingBidType, amount?: number): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation_counter' || !king.requestedBid || !king.bestBid) return;
    if (raise && bidType !== undefined && amount !== undefined) {
      const newBid: KingBid = {
        bidderIndex: king.bestBid.bidderIndex,
        bidType,
        amount: clampBid(bidType, amount)
      };
      if (bidAbsoluteValue(newBid) >= bidAbsoluteValue(king.requestedBid)) {
        this.bumpWatermark(king, newBid);
        this.setStandingBid(king, newBid);
        king.requestedBid = null;
        king.festaPhase = 'negotiation';
      }
    } else {
      king.requestedBid = null;
      this.enterFallback(king, 'negotiation_failed');
    }
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  declareEightOrNulls(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation' || !king.bestBid || king.eightOrNullsPending) return;
    king.eightOrNullsPending = true;
    king.eightOrNullsTarget = king.bestBid.bidderIndex;
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  respondEightOrNulls(bidderIndex: number, offerEight: boolean): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (!king.eightOrNullsPending || king.eightOrNullsTarget !== bidderIndex) return;
    king.eightOrNullsPending = false;
    king.eightOrNullsTarget = null;
    if (offerEight) {
      const bid: KingBid = { bidderIndex, bidType: 'positive', amount: 8 };
      this.bumpWatermark(king, bid);
      this.setStandingBid(king, bid);
      this.applyContractFromBid(king, bid);
    } else {
      king.benefitOwnerIndex = king.festaOwnerIndex;
      this.enterFallback(king, 'eight_or_nulls_declined');
    }
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  chooseFallback(choice: KingFestaChoice): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (!king.waitingForFallback) return;

    if (choice === 'four_by_three') {
      if (!canUseFourThreeThree(king.bestBid, king.highestEquivalentValue)) return;
      king.waitingForFallback = false;
      king.fallbackReason = null;
      king.benefitOwnerIndex = king.festaOwnerIndex;
      const split = settleFourByThree();
      const deltas = empty4();
      deltas[king.festaOwnerIndex] = split.owner;
      for (let i = 0; i < 4; i++) {
        if (i !== king.festaOwnerIndex) deltas[i] = split.others;
      }
      king.roundBreakdown.lines = [
        '4×3×3',
        `Dono +${split.owner}`,
        `Outros +${split.others} cada`
      ];
      this.applyDeltas(king, deltas);
      this.advanceOrFinish(king);
      this.syncKing(king);
      this.runAiFestaSteps();
      return;
    }

    king.waitingForFallback = false;
    king.fallbackReason = null;
    king.benefitOwnerIndex = king.festaOwnerIndex;

    if (choice === 'nulos') {
      king.festaMode = 'negative_festa';
      king.festaPhase = 'setup';
      king.waitingForFestaSetup = true;
      king.noTrumpChosen = true;
      king.chosenTrump = null;
    } else {
      king.festaMode = 'positive';
      king.festaPhase = 'setup';
      king.waitingForFestaSetup = true;
      king.noTrumpChosen = choice === 'no_trump';
      if (choice === 'trump') {
        const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
        king.chosenTrump = suits[king.gameIndex % 4];
      }
    }
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  setupFesta(trump: Suit | null, noTrump: boolean, firstPlayerIndex: number): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (!king.waitingForFestaSetup) return;
    const forceNoTrump = king.festaMode === 'negative_festa';
    king.chosenTrump = forceNoTrump ? null : trump;
    king.noTrumpChosen = forceNoTrump || noTrump || trump === null;
    king.firstPlayerIndex = firstPlayerIndex;
    king.waitingForFestaSetup = false;
    this.startPlay(king);
    this.syncKing(king);
  }

  confirmFestaSetup(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (!king.waitingForFestaSetup) return;
    const owner = king.benefitOwnerIndex ?? king.festaOwnerIndex;
    if (king.festaMode === 'negative_festa') {
      king.noTrumpChosen = true;
      king.chosenTrump = null;
    }
    const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
    const trump = king.noTrumpChosen ? null : king.chosenTrump ?? suits[king.gameIndex % 4];
    const first = king.firstPlayerIndex ?? owner;
    this.setupFesta(trump, king.noTrumpChosen || trump === null, first);
  }

  dismissScorePopup(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    king.showScorePopup = null;
    this.syncKing(king);
  }

  private applyContractFromBid(king: KingPtVariantState, bid: KingBid): void {
    king.activeContract = {
      bidType: bid.bidType,
      amount: bid.amount,
      bidderIndex: bid.bidderIndex,
      beneficiaryIndex: king.festaOwnerIndex
    };
    king.benefitOwnerIndex = bid.bidderIndex;
    king.festaMode = bid.bidType === 'positive' ? 'positive' : 'negative_festa';
    king.festaPhase = 'setup';
    king.waitingForFestaSetup = true;
    king.requestedBid = null;
    if (bid.bidType === 'null') {
      king.noTrumpChosen = true;
      king.chosenTrump = null;
    }
  }

  private syncKing(king: KingPtVariantState): void {
    this.state!.variantState = { ...this.state!.variantState, kingPt: king, rulesPresetId: 'king-pt-normal' };
  }

  /**
   * After a bid/pass: finish if ≤1 active, else advance to next active seat (wrap).
   */
  private continueAuctionAfterVoice(king: KingPtVariantState, fromSeat: number): void {
    if (king.activeBidders.length === 0) {
      this.finishAuction(king);
      return;
    }
    if (king.activeBidders.length === 1) {
      const sole = king.activeBidders[0];
      // Sole remaining already holds standing offer → they win without another voice.
      if (king.standingBid?.bidderIndex === sole) {
        this.finishAuction(king);
        return;
      }
      // All others passed with no standing (or orphaned) — sole must bid or pass.
      this.syncAuctionTurnPointer(king, sole);
      return;
    }
    const standingLeader = king.standingBid?.bidderIndex ?? null;
    const next = nextActiveBidder(king.auctionOrder, king.activeBidders, fromSeat, {
      skipSeat: standingLeader
    });
    this.syncAuctionTurnPointer(king, next);
  }

  private finishAuction(king: KingPtVariantState): void {
    // Sole remaining bidder keeps standing offer if they hold it; else keep last standing.
    if (king.activeBidders.length === 1) {
      const winner = king.activeBidders[0];
      if (king.standingBid && king.standingBid.bidderIndex !== winner) {
        // Should not happen if leader-pass clears standing; keep watermark only.
        if (!king.passedBidders.includes(king.standingBid.bidderIndex)) {
          this.setStandingBid(king, king.standingBid);
        }
      }
      this.syncAuctionTurnPointer(king, winner);
    } else {
      this.syncAuctionTurnPointer(king, null);
    }
    // Presentation pause — negotiation / fallback only after confirmAuctionContinue.
    king.festaPhase = 'auction_result';
    king.waitingForAuctionContinue = true;
  }

  /** Advance from auction result presentation to negotiation or no-bids fallback. */
  private resolveAuctionResultPresentation(king: KingPtVariantState): void {
    if (king.festaPhase !== 'auction_result') return;
    // Prefer standingBid; keep bestBid in sync for negotiation APIs.
    if (king.standingBid && !king.bestBid) {
      king.bestBid = king.standingBid;
    }
    if (king.bestBid && !king.standingBid) {
      king.standingBid = king.bestBid;
    }
    if (!king.bestBid) {
      this.enterFallback(king, 'no_bids');
      return;
    }
    king.festaPhase = 'negotiation';
  }

  private enterFallback(king: KingPtVariantState, reason: KingFallbackReason): void {
    king.festaPhase = 'fallback';
    king.waitingForFallback = true;
    king.fallbackReason = reason;
    king.eightOrNullsPending = false;
    king.requestedBid = null;
  }

  private startAuction(king: KingPtVariantState): void {
    king.festaPhase = 'auction';
    king.auctionOrder = auctionBidderOrder(king.festaOwnerIndex);
    king.activeBidders = [...king.auctionOrder];
    king.passedBidders = [];
    king.highestEquivalentValue = 0;
    this.setStandingBid(king, null);
    king.requestedBid = null;
    king.activeContract = null;
    king.benefitOwnerIndex = null;
    king.eightOrNullsPending = false;
    king.eightOrNullsTarget = null;
    king.waitingForFallback = false;
    king.fallbackReason = null;
    king.waitingForFestaSetup = false;
    king.nullAuctionStartNote = null;
    king.auctionPlayerActions = {};
    king.auctionHistory = [];
    king.waitingForAuctionContinue = false;
    this.syncAuctionTurnPointer(king, king.auctionOrder[0] ?? null);
  }

  /**
   * Drain AI festa steps for non-auction phases (negotiation / fallback / setup).
   * Auction pacing is host-driven via tickFestaAi — never drain auction here.
   */
  private runAiFestaSteps(): boolean {
    if (!this.state) return false;
    const king = getKingPtState(this.state);
    if (king.pauseFestaAiForDev) return false;
    if (king.festaPhase === 'auction' || king.festaPhase === 'auction_result') {
      return false;
    }
    let guard = 0;
    let any = false;
    while (guard++ < 24) {
      const acted = this.runOneAiFestaStep(getKingPtState(this.state));
      if (!acted) break;
      any = true;
    }
    return any;
  }

  /**
   * Host scheduler entry: at most one auction AI action per call when not
   * waiting for Continuar. auction_result never auto-advances (manual confirm).
   * Other phases may drain.
   */
  tickFestaAi(): boolean {
    if (!this.state) return false;
    const king = getKingPtState(this.state);
    if (king.pauseFestaAiForDev) return false;
    if (king.waitingForAuctionContinue) return false;
    if (king.festaPhase === 'auction_result') return false;
    if (king.festaPhase === 'auction') {
      return this.runOneAiFestaStep(king);
    }
    return this.runAiFestaSteps();
  }

  private runOneAiFestaStep(king: KingPtVariantState): boolean {
    const controller: KingAuctionController = {
      getCurrentAuctionPlayer: (k) => this.getCurrentAuctionPlayer(k),
      submitAuctionPass: (p) => this.submitAuctionPass(p),
      submitAuctionBid: (p, bt, amt) => this.submitAuctionBid(p, bt, amt),
      respondToHigherBid: (accept, bt, amt) => this.respondToHigherBid(accept, bt, amt),
      respondEightOrNulls: (target, accept) => this.respondEightOrNulls(target, accept),
      acceptContract: () => this.acceptContract(),
      chooseFallback: (type) => this.chooseFallback(type as Parameters<typeof this.chooseFallback>[0]),
      confirmFestaSetup: () => this.confirmFestaSetup(),
    };
    return runOneAiFestaStep(king, this.state!.players, controller);
  }

  private buildState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    scores: number[],
    gameIndex: number,
    withKohReveal: boolean
  ): GameState {
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const multiplayerSlots = options?.multiplayerSlots as Array<'human' | 'ai'> | undefined;
    const isFesta = gameIndex >= KING_NEGATIVE_GAMES;
    const kohReveal = withKohReveal ? simulateKohDraw() : null;

    const kohIndex = (options?.kohPlayerIndex as number | undefined) ?? kohReveal?.winnerIndex ?? 0;
    const pauseFestaAiForDev =
      process.env.NODE_ENV === 'development' && Boolean(options?.pauseFestaAiForDev);

    const king: KingPtVariantState = {
      ...defaultKingState(),
      phase: withKohReveal ? 'koh_reveal' : isFesta ? 'festa_setup' : 'negative',
      gameIndex,
      kohPlayerIndex: kohIndex,
      contract: isFesta ? null : KING_NEGATIVE_CONTRACTS[gameIndex].id,
      playerScores: [...scores],
      festaOwnerIndex: isFesta ? festaOwner(kohIndex, gameIndex) : kohIndex,
      roundStartScores: [...scores],
      kohReveal,
      gameHistory: (options?.gameHistory as KingRoundSummary[]) ?? [],
      ...(pauseFestaAiForDev ? { pauseFestaAiForDev: true } : {})
    };

    if (isFesta) this.startAuction(king);
    if (!withKohReveal && !isFesta) {
      king.roundBreakdown = initBreakdownForRound(
        king.gameIndex,
        king.contract,
        king.festaMode,
        king.activeContract
      );
    }

    const players = this.buildPlayers(playerNames, localPlayerIndex, multiplayerSlots);
    const leader = gameLeader(king.kohPlayerIndex, gameIndex);

    const state: GameState = {
      variant: 'king',
      players,
      currentPlayerIndex: leader,
      dealerIndex: (leader + 3) % 4,
      trumpSuit: null,
      trumpCard: null,
      currentTrick: [],
      trickLeader: leader,
      scores: { team1: scores[0] + scores[2], team2: scores[1] + scores[3] },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: gameIndex + 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: 'A',
      dealingDirection: 'left',
      waitingForRoundStart: withKohReveal || isFesta,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: (options?.aiDifficulty as AIDifficulty) || 'medium',
      partnerSignals: [],
      variantState: { kingPt: king, rulesPresetId: 'king-pt-normal' }
    };

    this.state = state;

    if (!withKohReveal && !isFesta) this.deal(state);
    if (isFesta) {
      this.deal(state);
      this.runAiFestaSteps();
    }
    return state;
  }

  /**
   * DEV ONLY — deterministic jump into festa games 7–10.
   * Outside development, falls back to a normal initialize (KOH).
   */
  applyDevFestaFixture(
    playerNames: string[],
    jump: {
      festaGameNumber: number;
      festaPhase?: KingFestaPhase | string | null;
      liveAuction?: boolean;
    },
    options?: Record<string, unknown>
  ): GameState {
    if (process.env.NODE_ENV !== 'development') {
      return this.initialize(playerNames, options);
    }

    const n = jump.festaGameNumber;
    if (!Number.isInteger(n) || n < 7 || n > 10) {
      return this.initialize(playerNames, options);
    }

    const gameIndex = n - 1;
    const phaseRaw = jump.festaPhase ?? 'auction';
    const validPhases: KingFestaPhase[] = [
      'auction',
      'negotiation',
      'negotiation_counter',
      'fallback',
      'setup'
    ];
    const festaPhase: KingFestaPhase = validPhases.includes(phaseRaw as KingFestaPhase)
      ? (phaseRaw as KingFestaPhase)
      : 'auction';

    // Default auction jump stays paused for static observe; liveAuction enables pacing smoke.
    const pauseForAuction = festaPhase === 'auction' && !jump.liveAuction;
    const dummyScores = [-180, 60, -120, 240];
    this.state = this.buildState(
      playerNames,
      {
        ...options,
        kohPlayerIndex: (options?.kohPlayerIndex as number | undefined) ?? 0,
        pauseFestaAiForDev: pauseForAuction
      },
      [...dummyScores],
      gameIndex,
      false
    );

    const king = getKingPtState(this.state);
    this.applyDevFestaPhaseFixture(king, festaPhase);
    this.syncKing(king);
    return this.getCurrentState();
  }

  /**
   * DEV ONLY — mid-round negative contract with sample captured cards / deltas.
   * Outside development, falls back to normal initialize.
   */
  applyDevNegativeFixture(
    playerNames: string[],
    contract: KingNegativeContract,
    options?: Record<string, unknown>
  ): GameState {
    if (process.env.NODE_ENV !== 'development') {
      return this.initialize(playerNames, options);
    }

    const gameIndex = KING_NEGATIVE_CONTRACTS.findIndex((c) => c.id === contract);
    if (gameIndex < 0) {
      return this.initialize(playerNames, options);
    }

    const roundStartScores =
      (options?.roundStartScores as number[] | undefined) ?? [-50, 20, -30, 60];
    const lastRoundDeltas =
      (options?.lastRoundDeltas as number[] | undefined) ?? [0, 0, 0, 0];
    const playerScores =
      (options?.playerScores as number[] | undefined) ??
      roundStartScores.map((s, i) => s + (lastRoundDeltas[i] ?? 0));
    const penaltyCardsTaken =
      (options?.penaltyCardsTaken as Card[][] | undefined) ?? [[], [], [], []];

    this.state = this.buildState(
      playerNames,
      {
        ...options,
        kohPlayerIndex: (options?.kohPlayerIndex as number | undefined) ?? 0
      },
      [...playerScores],
      gameIndex,
      false
    );

    const king = getKingPtState(this.state);
    king.phase = 'negative';
    king.contract = contract;
    king.gameIndex = gameIndex;
    king.roundStartScores = [...roundStartScores];
    king.lastRoundDeltas = [...lastRoundDeltas];
    king.playerScores = [...playerScores];
    king.trickNumber = 5;
    king.roundBreakdown = initBreakdownForRound(
      king.gameIndex,
      king.contract,
      king.festaMode,
      king.activeContract
    );
    king.roundBreakdown.penaltyCardsTaken = penaltyCardsTaken.map((row) => [...row]);
    this.state!.waitingForRoundStart = false;
    this.state!.waitingForRoundEnd = false;
    this.syncKing(king);
    return this.getCurrentState();
  }

  /** Advance a post-auction festa fixture to a valid later phase (DEV). */
  private applyDevFestaPhaseFixture(king: KingPtVariantState, phase: KingFestaPhase): void {
    if (phase === 'auction' || phase == null) return;

    const owner = king.festaOwnerIndex;
    const bidder = (owner + 1) % 4;
    const bid: KingBid = { bidderIndex: bidder, bidType: 'positive', amount: 5 };
    king.auctionOrder = auctionBidderOrder(owner);
    king.auctionTurnIndex = king.auctionOrder.length;
    king.auctionPlayerActions = {
      [bidder]: bid,
      [(owner + 2) % 4]: 'pass',
      [(owner + 3) % 4]: 'pass'
    };
    king.auctionHistory = buildDevAuctionHistoryFromActions(
      king.auctionOrder,
      king.auctionPlayerActions
    );
    king.pauseFestaAiForDev = false;

    if (phase === 'fallback') {
      this.setStandingBid(king, null);
      king.activeBidders = [];
      king.passedBidders = [...king.auctionOrder];
      king.currentBidder = null;
      king.highestEquivalentValue = 0;
      king.auctionPlayerActions = {
        [(owner + 1) % 4]: 'pass',
        [(owner + 2) % 4]: 'pass',
        [(owner + 3) % 4]: 'pass'
      };
      king.auctionHistory = buildDevAuctionHistoryFromActions(
        king.auctionOrder,
        king.auctionPlayerActions
      );
      this.enterFallback(king, 'no_bids');
      return;
    }

    this.setStandingBid(king, bid);
    king.highestEquivalentValue = Math.max(king.highestEquivalentValue, bidEquivalentPositive(bid));
    king.activeBidders = [bidder];
    king.passedBidders = king.auctionOrder.filter((s) => s !== bidder);
    king.currentBidder = bidder;

    if (phase === 'negotiation') {
      king.festaPhase = 'negotiation';
      return;
    }

    if (phase === 'negotiation_counter') {
      king.festaPhase = 'negotiation_counter';
      king.requestedBid = { bidderIndex: bidder, bidType: 'positive', amount: 6 };
      return;
    }

    if (phase === 'setup') {
      // DEV: local seat (0) configures so jump is interactive for UX smoke.
      const setupBid: KingBid = { bidderIndex: 0, bidType: 'positive', amount: 5 };
      this.setStandingBid(king, setupBid);
      king.highestEquivalentValue = Math.max(
        king.highestEquivalentValue,
        bidEquivalentPositive(setupBid)
      );
      king.activeBidders = [0];
      king.passedBidders = [1, 2, 3];
      king.currentBidder = 0;
      king.auctionPlayerActions = {
        0: setupBid,
        1: 'pass',
        2: 'pass',
        3: 'pass'
      };
      king.auctionHistory = buildDevAuctionHistoryFromActions(
        king.auctionOrder,
        king.auctionPlayerActions
      );
      this.applyContractFromBid(king, setupBid);
    }
  }

  private buildPlayers(
    names: string[],
    localPlayerIndex?: number,
    multiplayerSlots?: Array<'human' | 'ai'>
  ): Player[] {
    const humanIndex =
      localPlayerIndex !== undefined && localPlayerIndex >= 0 ? localPlayerIndex : 0;
    return names.slice(0, 4).map((name, index) => {
      const isHuman = index === humanIndex;
      const type = isHuman
        ? 'human'
        : multiplayerSlots !== undefined
          ? (multiplayerSlots[index] === 'ai' ? 'ai' : 'remote')
          : 'ai';
      return {
        id: `player_${index}`,
        name,
        hand: [],
        team: (index % 2 === 0 ? 1 : 2) as 1 | 2,
        type
      };
    });
  }

  private deal(state: GameState): void {
    const deck = new Deck('standard52');
    state.players.forEach((p) => {
      p.hand = [];
    });
    for (let i = 0; i < 13; i++) {
      for (let p = 0; p < 4; p++) {
        const c = deck.deal(1)[0];
        if (c) state.players[p].hand.push(c);
      }
    }
    applyHandSortToState(state);
  }

  private startPlay(king: KingPtVariantState): void {
    king.trickNumber = 0;
    king.tricksWonThisGame = empty4();
    king.lastRoundDeltas = empty4();
    king.roundStartScores = [...king.playerScores];
    king.festaPhase = null;
    king.scoringFrozen = false;
    king.earlyEndOffered = false;
    king.waitingForEarlyEnd = false;
    king.phase = king.gameIndex >= KING_NEGATIVE_GAMES ? 'festa_play' : 'negative';
    king.roundBreakdown = initBreakdownForRound(
      king.gameIndex,
      king.contract,
      king.festaMode,
      king.activeContract
    );

    if (king.activeContract?.bidType === 'null') {
      const { beneficiaryIndex, bidderIndex, amount } = king.activeContract;
      king.roundBreakdown.nullTransfer = { beneficiary: beneficiaryIndex, bidder: bidderIndex, amount };
      king.nullAuctionStartNote = nullAuctionStartNote(beneficiaryIndex, bidderIndex, amount, 'pt');
    } else if (king.activeContract?.bidType === 'positive') {
      const { beneficiaryIndex, bidderIndex, amount } = king.activeContract;
      king.roundBreakdown.positiveTransfer = {
        beneficiary: beneficiaryIndex,
        bidder: bidderIndex,
        amount
      };
      king.nullAuctionStartNote = null;
    } else {
      king.nullAuctionStartNote = null;
    }

    if (king.festaMode === 'negative_festa') {
      const start = nullFestaStartScores(
        king.activeContract?.bidType === 'null' ? king.activeContract.beneficiaryIndex : null,
        king.activeContract?.bidType === 'null' ? king.activeContract.bidderIndex : null,
        king.activeContract?.bidType === 'null' ? king.activeContract.amount : null
      );
      for (let i = 0; i < 4; i++) {
        king.lastRoundDeltas[i] = start[i];
        king.playerScores[i] = king.roundStartScores[i] + start[i];
      }
    }

    const leader =
      king.firstPlayerIndex ??
      king.benefitOwnerIndex ??
      gameLeader(king.kohPlayerIndex, king.gameIndex);
    const trump = king.noTrumpChosen ? null : king.chosenTrump;
    this.state!.trumpSuit = trump;
    applyHandSortToState(this.state!);
    this.state!.trickLeader = leader;
    this.state!.currentPlayerIndex = leader;
    this.state!.waitingForRoundStart = false;
    this.state!.currentTrick = [];
  }

  canPlayCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    const s = this.state!;
    const king = getKingPtState(s);
    if (
      s.waitingForRoundStart ||
      king.phase === 'koh_reveal' ||
      king.waitingForEarlyEnd ||
      isFestaFlowBlocking(king)
    ) {
      return false;
    }
    const player = s.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== s.currentPlayerIndex || s.waitingForTrickEnd || s.isPaused) return false;

    const card = player.hand[cardIndex];

    if (s.currentTrick.length === 0) {
      if (heartsLeadForbidden(king) && card.suit === 'hearts' && hasNonHeart(player)) {
        return false;
      }
      if (mustPlayKingOfHearts(player, null, king)) {
        return card.rank === 'K' && card.suit === 'hearts';
      }
      return true;
    }

    const led = s.currentTrick[0].suit;
    const hasLed = player.hand.some((c) => c.suit === led);

    if (mustPlayKingOfHearts(player, led, king)) {
      return card.rank === 'K' && card.suit === 'hearts';
    }

    if (hasLed) return card.suit === led;
    return true;
  }

  playCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(_state, playerIndex, cardIndex)) return false;
    const s = this.state!;
    const card = s.players[playerIndex].hand.splice(cardIndex, 1)[0];
    s.currentTrick.push(card);
    const king = getKingPtState(s);
    const useTrump =
      king.gameIndex >= KING_NEGATIVE_GAMES && king.festaMode === 'positive' && s.trumpSuit;

    if (s.currentTrick.length === 4) {
      const winner = trickWinnerIndex(s.currentTrick, s.trickLeader, useTrump ? s.trumpSuit : null);
      s.lastTrickWinner = winner;
      s.waitingForTrickEnd = true;
      s.nextTrickLeader = winner;
    } else {
      s.currentPlayerIndex = (s.currentPlayerIndex + 1) % 4;
    }
    return true;
  }

  finishTrick(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForTrickEnd) return;
    const king = getKingPtState(s);
    const winner = s.nextTrickLeader ?? s.lastTrickWinner ?? 0;
    king.trickNumber += 1;
    king.tricksWonThisGame[winner] += 1;

    if (king.gameIndex < KING_NEGATIVE_GAMES && king.contract) {
      if (!king.scoringFrozen) {
        if (isDevSyntheticAllNegatives(king)) {
          accumulateSyntheticAllNegativesBreakdown(
            king.roundBreakdown,
            s.currentTrick,
            king.trickNumber,
            winner
          );
          const penalty = syntheticAllNegativesTrickPenalty(s.currentTrick, king.trickNumber);
          if (penalty > 0) {
            king.lastRoundDeltas[winner] -= penalty;
            king.playerScores[winner] -= penalty;
          }
        } else {
          accumulateTrickBreakdown(
            king.roundBreakdown,
            king.contract,
            s.currentTrick,
            king.trickNumber,
            winner
          );
          const penalty = negativeTrickPenalty(king.contract, s.currentTrick, king.trickNumber);
          if (penalty > 0) {
            king.lastRoundDeltas[winner] -= penalty;
            king.playerScores[winner] -= penalty;
          }
        }
      }
    } else if (king.gameIndex >= KING_NEGATIVE_GAMES) {
      accumulateFestaTrickBreakdown(king.roundBreakdown, s.currentTrick, winner);
    }

    const scoreDuringPlay =
      !king.scoringFrozen &&
      (king.gameIndex < KING_NEGATIVE_GAMES ||
        (king.festaMode === 'positive' && !king.activeContract) ||
        king.festaMode === 'negative_festa');

    if (scoreDuringPlay && king.festaMode === 'positive') {
      king.lastRoundDeltas[winner] += FESTA_POSITIVE_TRICK;
      king.playerScores[winner] += FESTA_POSITIVE_TRICK;
    } else if (scoreDuringPlay && king.festaMode === 'negative_festa') {
      king.lastRoundDeltas[winner] -= 75;
      king.playerScores[winner] -= 75;
    }

    s.waitingForTrickEnd = false;
    s.currentTrick = [];
    s.trickLeader = winner;
    s.currentPlayerIndex = winner;
    this.syncKing(king);

    if (s.players[0].hand.length === 0) {
      this.endGame(king);
      return;
    }

    if (
      !isDevSyntheticAllNegatives(king) &&
      !king.scoringFrozen &&
      !king.earlyEndOffered &&
      canKingEndRoundEarly(king.gameIndex, king.contract, king.roundBreakdown)
    ) {
      king.earlyEndOffered = true;
      king.waitingForEarlyEnd = true;
      this.syncKing(king);
    }
  }

  acceptEarlyEnd(): void {
    const king = getKingPtState(this.state!);
    if (!king.waitingForEarlyEnd) return;
    king.waitingForEarlyEnd = false;
    this.endGame(king);
  }

  declineEarlyEnd(): void {
    const king = getKingPtState(this.state!);
    if (!king.waitingForEarlyEnd) return;
    king.waitingForEarlyEnd = false;
    king.scoringFrozen = true;
    this.syncKing(king);
  }

  private endGame(king: KingPtVariantState): void {
    if (king.activeContract) {
      const { beneficiaryIndex, bidderIndex, bidType, amount } = king.activeContract;
      let deltas: number[];
      if (bidType === 'positive') {
        deltas = settlePositiveAuctionRound(amount, king.tricksWonThisGame, beneficiaryIndex, bidderIndex);
      } else {
        deltas = settleNullAuctionFesta(king.tricksWonThisGame, beneficiaryIndex, bidderIndex, amount);
      }
      for (let i = 0; i < 4; i++) {
        king.playerScores[i] = king.roundStartScores[i] + deltas[i];
      }
      king.lastRoundDeltas = deltas;
    } else if (king.festaMode === 'negative_festa') {
      const settlements = settleNegativeFesta(king.tricksWonThisGame);
      for (let i = 0; i < 4; i++) {
        king.playerScores[i] = king.roundStartScores[i] + settlements[i];
        king.lastRoundDeltas[i] = settlements[i];
      }
    } else if (king.festaMode === 'positive') {
      for (let i = 0; i < 4; i++) {
        king.lastRoundDeltas[i] = king.playerScores[i] - king.roundStartScores[i];
      }
    } else if (king.gameIndex < KING_NEGATIVE_GAMES) {
      for (let i = 0; i < 4; i++) {
        king.lastRoundDeltas[i] = king.playerScores[i] - king.roundStartScores[i];
      }
    }

    king.roundBreakdown.lines = isDevSyntheticAllNegatives(king)
      ? buildSyntheticBreakdownLines(king.roundBreakdown, 'pt')
      : buildBreakdownLines(king.roundBreakdown, king.contract, 'pt');
    this.appendHistory(king);

    king.showScorePopup = 'round';
    this.state!.scores = {
      team1: king.playerScores[0] + king.playerScores[2],
      team2: king.playerScores[1] + king.playerScores[3]
    };
    this.advanceOrFinish(king);
  }

  private appendHistory(king: KingPtVariantState): void {
    const ownerName = this.state!.players[king.festaOwnerIndex]?.name ?? '';
    const title = isDevSyntheticAllNegatives(king)
      ? kingSyntheticRoundLabel('pt')
      : kingGameTitle(king.gameIndex, king.contract, king.gameIndex >= 6 ? ownerName : null, 'pt');
    king.gameHistory.push({
      gameIndex: king.gameIndex,
      title,
      deltas: [...king.lastRoundDeltas],
      scoresAfter: [...king.playerScores],
      breakdownLines: [...king.roundBreakdown.lines]
    });
  }

  private applyDeltas(king: KingPtVariantState, deltas: number[]): void {
    for (let i = 0; i < 4; i++) {
      king.lastRoundDeltas[i] = deltas[i];
      king.playerScores[i] += deltas[i];
    }
    this.appendHistory(king);
    king.showScorePopup = 'round';
    this.state!.scores = {
      team1: king.playerScores[0] + king.playerScores[2],
      team2: king.playerScores[1] + king.playerScores[3]
    };
  }

  private advanceOrFinish(king: KingPtVariantState): void {
    if (king.gameIndex + 1 >= KING_TOTAL_GAMES) {
      const max = Math.max(...king.playerScores);
      const idx = king.playerScores.indexOf(max);
      this.state!.isGameOver = true;
      this.state!.winner = idx < 2 ? 1 : 2;
      this.state!.waitingForGameStart = true;
      king.phase = 'game_over';
    } else {
      this.state!.waitingForRoundEnd = true;
    }
    this.syncKing(king);
  }

  continueToNextRound(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForRoundEnd) return;
    const king = getKingPtState(s);
    const humanIndex = s.players.findIndex((p) => p.type === 'human');
    const nextIndex = isDevSyntheticAllNegatives(king)
      ? KING_NEGATIVE_GAMES
      : king.gameIndex + 1;
    this.state = this.buildState(
      s.players.map((p) => p.name),
      {
        aiDifficulty: s.aiDifficulty,
        localPlayerIndex: humanIndex >= 0 ? humanIndex : 0,
        gameHistory: king.gameHistory,
        kohPlayerIndex: king.kohPlayerIndex
      },
      [...king.playerScores],
      nextIndex,
      false
    );
    // Synthetic flag must not carry into Festa / later rounds.
    const nextKing = getKingPtState(this.state);
    if (nextKing.devSyntheticAllNegatives) {
      nextKing.devSyntheticAllNegatives = false;
      this.syncKing(nextKing);
    }
  }

  /**
   * DEV ONLY — enable combined-all-negatives on the current dealt negative round.
   * Outside development, no-op.
   */
  enableDevSyntheticCombinedRound(): GameState {
    if (process.env.NODE_ENV !== 'development' || !this.state) {
      return this.getCurrentState();
    }
    const king = getKingPtState(this.state);
    if (king.phase === 'koh_reveal' || king.gameIndex >= KING_NEGATIVE_GAMES) {
      return this.getCurrentState();
    }
    king.devSyntheticAllNegatives = true;
    king.gameIndex = 0;
    king.contract = 'no_tricks';
    king.phase = 'negative';
    king.roundBreakdown = initBreakdownForRound(
      king.gameIndex,
      king.contract,
      king.festaMode,
      king.activeContract,
      'pt'
    );
    king.roundBreakdown.contractLabel = kingSyntheticRoundLabel('pt');
    this.state.waitingForRoundStart = false;
    this.syncKing(king);
    return this.getCurrentState();
  }

  startRound(_state: GameState): void {
    if (this.state) this.state.waitingForRoundStart = false;
  }

  restoreState(state: GameState): GameState {
    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    this.state = restored;
    const king = getKingPtState(restored);
    if (restored.waitingForRoundStart && isFestaFlowBlocking(king)) {
      this.runAiFestaSteps();
    }
    return this.getCurrentState();
  }

  chooseAICard(state: GameState, playerIndex: number): number {
    return chooseKingPtCard(this, state, playerIndex, getKingPtState(this.state!), this.state!.aiDifficulty);
  }
}
