import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player, Suit, AIDifficulty, Card } from '../../types/game';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';
import {
  auctionBidderOrder,
  bidAbsoluteValue,
  canBeatBid,
  canUseFourThreeThree,
  clampBid,
  minBidToBeat
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
  buildBreakdownLines,
  initBreakdownForRound,
  nullAuctionStartNote
} from './king/kingBreakdownHelpers';
import {
  KING_NEGATIVE_CONTRACTS,
  KING_NEGATIVE_GAMES,
  KING_TOTAL_GAMES,
  KingActiveContract,
  KingBid,
  KingBidType,
  KingFestaChoice,
  KingFestaMode,
  KingFestaPhase,
  KingNegativeContract,
  KingPhase,
  kingGameTitle
} from './king/kingContracts';
import {
  FESTA_POSITIVE_TRICK,
  negativeTrickPenalty,
  settleFourByThree,
  settleNegativeFesta,
  settleNullAuctionFesta,
  settlePositiveAuctionRound
} from './king/kingScoring';
import { applyHandSortToState } from '../../utils/handSort';
import { canKingEndRoundEarly } from '../../utils/earlyRoundEnd';

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
  bestBid: KingBid | null;
  requestedBid: KingBid | null;
  activeContract: KingActiveContract | null;
  benefitOwnerIndex: number | null;
  eightOrNullsPending: boolean;
  eightOrNullsTarget: number | null;
  waitingForFallback: boolean;
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
    bestBid: null,
    requestedBid: null,
    activeContract: null,
    benefitOwnerIndex: null,
    eightOrNullsPending: false,
    eightOrNullsTarget: null,
    waitingForFallback: false,
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
    auctionPlayerActions: {}
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
    showScorePopup
  };
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

function isMen(card: Card): boolean {
  return card.rank === 'K' || card.rank === 'J';
}

function heartsLeadForbidden(king: KingPtVariantState): boolean {
  if (king.gameIndex >= KING_NEGATIVE_GAMES) return false;
  return king.contract === 'no_hearts' || king.contract === 'no_king_hearts';
}

function mustPlayKingOfHearts(player: Player, ledSuit: Suit | null, king: KingPtVariantState): boolean {
  if (king.gameIndex >= KING_NEGATIVE_GAMES || king.contract !== 'no_king_hearts') return false;
  if (ledSuit && player.hand.some((c) => c.suit === ledSuit)) return false;
  return player.hand.some((c) => c.rank === 'K' && c.suit === 'hearts');
}

function hasNonHeart(player: Player): boolean {
  return player.hand.some((c) => c.suit !== 'hearts');
}

function isFestaFlowBlocking(king: KingPtVariantState): boolean {
  return (
    king.festaPhase === 'auction' ||
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

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.state = this.buildState(playerNames, options, empty4(), 0, true);
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('KingPtGame not initialized');
    return this.cloneState(this.state);
  }

  getCurrentAuctionPlayer(king: KingPtVariantState): number | null {
    if (king.festaPhase !== 'auction') return null;
    return king.auctionOrder[king.auctionTurnIndex] ?? null;
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
    if (this.getCurrentAuctionPlayer(king) !== playerIndex) return;
    king.auctionPlayerActions[playerIndex] = 'pass';
    this.advanceAuctionTurn(king);
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  submitAuctionBid(playerIndex: number, bidType: KingBidType, amount: number): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'auction') return;
    if (this.getCurrentAuctionPlayer(king) !== playerIndex) return;
    const bid: KingBid = {
      bidderIndex: playerIndex,
      bidType,
      amount: clampBid(bidType, amount)
    };
    king.auctionPlayerActions[playerIndex] = bid;
    if (canBeatBid(king.bestBid, bid, king.auctionOrder)) {
      king.bestBid = bid;
    }
    this.advanceAuctionTurn(king);
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  acceptContract(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation' || !king.bestBid) return;
    this.applyContractFromBid(king, king.bestBid);
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  rejectContract(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation') return;
    this.enterFallback(king);
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  requestHigherBid(bidType: KingBidType, amount: number): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation' || !king.bestBid) return;
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
        king.bestBid = newBid;
        king.requestedBid = null;
        king.festaPhase = 'negotiation';
      }
    } else {
      king.requestedBid = null;
      this.enterFallback(king);
    }
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  declareEightOrNulls(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (king.festaPhase !== 'negotiation' || !king.bestBid) return;
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
    if (offerEight) {
      const bid: KingBid = { bidderIndex, bidType: 'positive', amount: 8 };
      king.bestBid = bid;
      this.applyContractFromBid(king, bid);
    } else {
      king.benefitOwnerIndex = king.festaOwnerIndex;
      this.enterFallback(king);
    }
    this.syncKing(king);
    this.runAiFestaSteps();
  }

  chooseFallback(choice: KingFestaChoice): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (!king.waitingForFallback) return;
    king.waitingForFallback = false;
    king.benefitOwnerIndex = king.festaOwnerIndex;

    if (choice === 'four_by_three') {
      if (!canUseFourThreeThree(king.bestBid)) return;
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
      this.appendHistory(king);
      this.advanceOrFinish(king);
    } else if (choice === 'nulos') {
      king.festaMode = 'negative_festa';
      king.festaPhase = 'setup';
      king.waitingForFestaSetup = true;
      king.noTrumpChosen = true;
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
    king.chosenTrump = trump;
    king.noTrumpChosen = noTrump;
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
  }

  private syncKing(king: KingPtVariantState): void {
    this.state!.variantState = { ...this.state!.variantState, kingPt: king, rulesPresetId: 'king-pt-normal' };
  }

  private advanceAuctionTurn(king: KingPtVariantState): void {
    king.auctionTurnIndex += 1;
    if (king.auctionTurnIndex >= king.auctionOrder.length) {
      this.finishAuction(king);
    }
  }

  private finishAuction(king: KingPtVariantState): void {
    if (!king.bestBid) {
      this.enterFallback(king);
      return;
    }
    king.festaPhase = 'negotiation';
  }

  private enterFallback(king: KingPtVariantState): void {
    king.festaPhase = 'fallback';
    king.waitingForFallback = true;
    king.eightOrNullsPending = false;
    king.requestedBid = null;
  }

  private startAuction(king: KingPtVariantState): void {
    king.festaPhase = 'auction';
    king.auctionOrder = auctionBidderOrder(king.festaOwnerIndex);
    king.auctionTurnIndex = 0;
    king.bestBid = null;
    king.requestedBid = null;
    king.activeContract = null;
    king.benefitOwnerIndex = null;
    king.eightOrNullsPending = false;
    king.eightOrNullsTarget = null;
    king.waitingForFallback = false;
    king.waitingForFestaSetup = false;
    king.nullAuctionStartNote = null;
    king.auctionPlayerActions = {};
  }

  private runAiFestaSteps(): boolean {
    if (!this.state) return false;
    let guard = 0;
    let any = false;
    while (guard++ < 24) {
      const acted = this.runOneAiFestaStep(getKingPtState(this.state));
      if (!acted) break;
      any = true;
    }
    return any;
  }

  /** Runs AI festa steps until a human decision is required. */
  tickFestaAi(): boolean {
    return this.runAiFestaSteps();
  }

  private runOneAiFestaStep(king: KingPtVariantState): boolean {
    if (king.festaPhase === 'auction') {
      const current = this.getCurrentAuctionPlayer(king);
      if (current === null) return false;
      const player = this.state!.players[current];
      if (player?.type !== 'ai') return false;
      if (Math.random() < 0.35 && !king.bestBid) {
        this.submitAuctionPass(current);
      } else {
        const min = minBidToBeat(king.bestBid, king.auctionOrder, current);
        if (min) this.submitAuctionBid(current, min.bidType, min.amount);
        else this.submitAuctionPass(current);
      }
      return true;
    }

    if (king.festaPhase === 'negotiation_counter') {
      const bidder = king.bestBid?.bidderIndex;
      if (bidder === undefined) return false;
      const player = this.state!.players[bidder];
      if (player?.type !== 'ai') return false;
      if (king.requestedBid && Math.random() < 0.55) {
        this.respondToHigherBid(true, king.requestedBid.bidType, king.requestedBid.amount);
      } else {
        this.respondToHigherBid(false);
      }
      return true;
    }

    if (king.festaPhase === 'negotiation') {
      const owner = this.state!.players[king.festaOwnerIndex];
      if (king.eightOrNullsPending) {
        const target = king.eightOrNullsTarget;
        if (target !== null && this.state!.players[target]?.type === 'ai') {
          this.respondEightOrNulls(target, Math.random() < 0.25);
          return true;
        }
        return false;
      }
      if (owner?.type === 'ai') {
        this.acceptContract();
        return true;
      }
      return false;
    }

    if (king.waitingForFallback) {
      const owner = this.state!.players[king.festaOwnerIndex];
      if (owner?.type === 'ai') {
        if (canUseFourThreeThree(king.bestBid) && Math.random() < 0.3) {
          this.chooseFallback('four_by_three');
        } else if (Math.random() < 0.4) {
          this.chooseFallback('nulos');
        } else {
          this.chooseFallback('no_trump');
        }
        return true;
      }
      return false;
    }

    if (king.waitingForFestaSetup) {
      const ownerIdx = king.benefitOwnerIndex ?? king.festaOwnerIndex;
      const owner = this.state!.players[ownerIdx];
      if (owner?.type === 'ai') {
        this.confirmFestaSetup();
        return true;
      }
      return false;
    }

    return false;
  }

  private buildState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    scores: number[],
    gameIndex: number,
    withKohReveal: boolean
  ): GameState {
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const isFesta = gameIndex >= KING_NEGATIVE_GAMES;
    const kohReveal = withKohReveal ? simulateKohDraw() : null;

    const kohIndex = (options?.kohPlayerIndex as number | undefined) ?? kohReveal?.winnerIndex ?? 0;

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
      gameHistory: (options?.gameHistory as KingRoundSummary[]) ?? []
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

    const players = this.buildPlayers(playerNames, localPlayerIndex);
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

  private buildPlayers(names: string[], localPlayerIndex?: number): Player[] {
    const humanIndex =
      localPlayerIndex !== undefined && localPlayerIndex >= 0 ? localPlayerIndex : 0;
    return names.slice(0, 4).map((name, index) => {
      const isHuman = index === humanIndex;
      return {
        id: `player_${index}`,
        name,
        hand: [],
        team: (index % 2 === 0 ? 1 : 2) as 1 | 2,
        type: isHuman ? 'human' : 'ai'
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
    } else {
      king.nullAuctionStartNote = null;
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
    } else if (king.gameIndex >= KING_NEGATIVE_GAMES) {
      accumulateFestaTrickBreakdown(king.roundBreakdown, s.currentTrick, winner);
    }

    const scoreDuringPlay =
      !king.scoringFrozen &&
      (king.gameIndex < KING_NEGATIVE_GAMES ||
        (king.festaMode === 'positive' && !king.activeContract) ||
        (king.festaMode === 'negative_festa' && !king.activeContract));

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

    king.roundBreakdown.lines = buildBreakdownLines(
      king.roundBreakdown,
      king.contract,
      'pt'
    );
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
    const title = kingGameTitle(king.gameIndex, king.contract, king.gameIndex >= 6 ? ownerName : null, 'pt');
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
    this.state = this.buildState(
      s.players.map((p) => p.name),
      {
        aiDifficulty: s.aiDifficulty,
        localPlayerIndex: humanIndex >= 0 ? humanIndex : 0,
        gameHistory: king.gameHistory,
        kohPlayerIndex: king.kohPlayerIndex
      },
      [...king.playerScores],
      king.gameIndex + 1,
      false
    );
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
    const king = getKingPtState(this.state!);
    const player = state.players[playerIndex];
    if (!player) return -1;
    const valid: number[] = [];
    for (let i = 0; i < player.hand.length; i++) {
      if (this.canPlayCard(state, playerIndex, i)) valid.push(i);
    }
    if (valid.length === 0) return -1;

    const avoid =
      king.gameIndex < KING_NEGATIVE_GAMES || king.festaMode === 'negative_festa';

    if (state.currentTrick.length === 0) {
      if (avoid) {
        const nonHeart = valid.filter((i) => player.hand[i].suit !== 'hearts');
        const pool = nonHeart.length ? nonHeart : valid;
        return pool.reduce((best, i) => {
          const order = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
          return order.indexOf(player.hand[i].rank) < order.indexOf(player.hand[best].rank) ? i : best;
        }, pool[0]);
      }
      return valid[valid.length - 1];
    }

    if (avoid) {
      const led = state.currentTrick[0].suit;
      const inSuit = valid.filter((i) => player.hand[i].suit === led);
      if (inSuit.length) return inSuit[0];
      const kingIdx = valid.findIndex(
        (i) => player.hand[i].rank === 'K' && player.hand[i].suit === 'hearts'
      );
      if (kingIdx >= 0 && mustPlayKingOfHearts(player, led, king)) return kingIdx;
      const dump = valid.find((i) => {
        const c = player.hand[i];
        if (king.contract === 'no_hearts' && c.suit === 'hearts') return true;
        if (king.contract === 'no_queens' && c.rank === 'Q') return true;
        if (king.contract === 'no_men' && isMen(c)) return true;
        if (king.contract === 'no_king_hearts' && c.rank === 'K' && c.suit === 'hearts') return true;
        return false;
      });
      return dump ?? valid[0];
    }
    return valid[0];
  }
}
