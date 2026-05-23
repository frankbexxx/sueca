import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player, Suit, AIDifficulty, Card } from '../../types/game';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';
import {
  KING_NEGATIVE_CONTRACTS,
  KING_NEGATIVE_GAMES,
  KING_TOTAL_GAMES,
  KingFestaChoice,
  KingFestaMode,
  KingNegativeContract,
  KingPhase
} from './king/kingContracts';
import {
  FESTA_POSITIVE_TRICK,
  negativeTrickPenalty,
  settleFourByThree,
  settleNegativeAuction,
  settleNegativeFesta,
  settlePositiveAuction
} from './king/kingScoring';

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
  festaChoice: KingFestaChoice | null;
  waitingForFestaChoice: boolean;
  waitingForAuction: boolean;
  auctionPositive: boolean;
  auctionBidderIndex: number | null;
  auctionOfferTricks: number;
  auctionResolved: boolean;
  showScorePopup: boolean;
}

function empty4(): number[] {
  return [0, 0, 0, 0];
}

export function getKingPtState(state: GameState): KingPtVariantState {
  const vs = state.variantState?.kingPt as KingPtVariantState | undefined;
  return (
    vs ?? {
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
      festaChoice: null,
      waitingForFestaChoice: false,
      waitingForAuction: false,
      auctionPositive: true,
      auctionBidderIndex: null,
      auctionOfferTricks: 0,
      auctionResolved: false,
      showScorePopup: false
    }
  );
}

function performKohDraw(): number {
  const deck = new Deck('standard52');
  let player = 0;
  while (deck.getRemaining() > 0) {
    const card = deck.deal(1)[0];
    if (card?.rank === 'K' && card.suit === 'hearts') return player;
    player = (player + 1) % 4;
  }
  return 0;
}

function festaOwner(koh: number, gameIndex: number): number {
  return (koh + (gameIndex - KING_NEGATIVE_GAMES)) % 4;
}

function gameLeader(koh: number, gameIndex: number): number {
  return ((koh + 2) % 4 + gameIndex) % 4;
}

function isMen(card: Card): boolean {
  return card.rank === 'K' || card.rank === 'J';
}

export class KingPtGame extends BaseGameAdapter {
  variant = 'king' as const;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    const koh = performKohDraw();
    this.state = this.buildState(playerNames, options, koh, empty4(), 0);
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('KingPtGame not initialized');
    return this.cloneState(this.state);
  }

  chooseFesta(choice: KingFestaChoice): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (!king.waitingForFestaChoice) return;
    king.festaChoice = choice;
    king.waitingForFestaChoice = false;

    if (choice === 'auction') {
      king.waitingForAuction = true;
      this.runAiAuction(king);
    } else if (choice === 'nulos') {
      king.festaMode = 'negative_festa';
      this.startPlay(king, null, true);
    } else if (choice === 'four_by_three') {
      const split = settleFourByThree();
      const deltas = empty4();
      deltas[king.festaOwnerIndex] = split.owner;
      for (let i = 0; i < 4; i++) {
        if (i !== king.festaOwnerIndex) deltas[i] = split.others;
      }
      this.applyDeltas(king, deltas);
      this.advanceOrFinish(king);
    } else {
      king.festaMode = 'positive';
      const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
      this.startPlay(king, choice === 'no_trump' ? null : suits[king.gameIndex % 4], choice === 'no_trump');
    }
    this.syncKing(king);
  }

  submitAuctionBid(playerIndex: number, tricks: number, positive = true): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    if (!king.waitingForAuction || playerIndex === king.festaOwnerIndex) return;
    king.auctionPositive = positive;
    const bid = Math.max(1, Math.min(8, tricks));
    if (bid >= king.auctionOfferTricks) {
      king.auctionOfferTricks = bid;
      king.auctionBidderIndex = playerIndex;
    }
    this.finalizeAuction(king);
  }

  dismissScorePopup(): void {
    if (!this.state) return;
    const king = getKingPtState(this.state);
    king.showScorePopup = false;
    this.syncKing(king);
  }

  private syncKing(king: KingPtVariantState): void {
    this.state!.variantState = { ...this.state!.variantState, kingPt: king, rulesPresetId: 'king-pt-normal' };
  }

  private runAiAuction(king: KingPtVariantState): void {
    const owner = king.festaOwnerIndex;
    let high = 0;
    let leader: number | null = null;
    for (const bidder of [(owner + 1) % 4, (owner + 2) % 4, (owner + 3) % 4]) {
      const bid = Math.min(8, high + 1);
      if (bid > high) {
        high = bid;
        leader = bidder;
      }
    }
    king.auctionOfferTricks = high || 3;
    king.auctionBidderIndex = leader;
    this.finalizeAuction(king);
  }

  private finalizeAuction(king: KingPtVariantState): void {
    king.waitingForAuction = false;
    king.auctionResolved = true;
    king.festaMode = king.auctionPositive ? 'positive' : 'negative_festa';
    const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
    this.startPlay(king, suits[king.gameIndex % 4], false, king.auctionBidderIndex ?? undefined);
    this.syncKing(king);
  }

  private buildState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    koh: number,
    scores: number[],
    gameIndex: number
  ): GameState {
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const isFesta = gameIndex >= KING_NEGATIVE_GAMES;
    const king: KingPtVariantState = {
      phase: isFesta ? 'festa_setup' : 'negative',
      gameIndex,
      kohPlayerIndex: koh,
      contract: isFesta ? null : KING_NEGATIVE_CONTRACTS[gameIndex].id,
      playerScores: [...scores],
      lastRoundDeltas: empty4(),
      trickNumber: 0,
      tricksWonThisGame: empty4(),
      festaOwnerIndex: isFesta ? festaOwner(koh, gameIndex) : koh,
      festaMode: null,
      festaChoice: null,
      waitingForFestaChoice: isFesta,
      waitingForAuction: false,
      auctionPositive: true,
      auctionBidderIndex: null,
      auctionOfferTricks: 0,
      auctionResolved: false,
      showScorePopup: false
    };

    const players = this.buildPlayers(playerNames, localPlayerIndex);
    const leader = gameLeader(koh, gameIndex);

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
      waitingForRoundStart: isFesta,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: (options?.aiDifficulty as AIDifficulty) || 'medium',
      partnerSignals: [],
      variantState: { kingPt: king, rulesPresetId: 'king-pt-normal' }
    };

    if (!isFesta) this.deal(state);
    return state;
  }

  private buildPlayers(names: string[], localPlayerIndex?: number): Player[] {
    return names.slice(0, 4).map((name, index) => {
      const isHuman = localPlayerIndex !== undefined ? index === localPlayerIndex : index === 0;
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
  }

  private startPlay(
    king: KingPtVariantState,
    trump: Suit | null,
    noTrump: boolean,
    leaderOverride?: number
  ): void {
    king.trickNumber = 0;
    king.tricksWonThisGame = empty4();
    king.lastRoundDeltas = empty4();
    this.deal(this.state!);
    const leader = leaderOverride ?? gameLeader(king.kohPlayerIndex, king.gameIndex);
    this.state!.trumpSuit = noTrump ? null : trump;
    this.state!.trickLeader = leader;
    this.state!.currentPlayerIndex = leader;
    this.state!.waitingForRoundStart = false;
    this.state!.currentTrick = [];
    this.syncKing(king);
  }

  canPlayCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    const s = this.state!;
    const king = getKingPtState(s);
    if (s.waitingForRoundStart || king.waitingForFestaChoice || king.waitingForAuction) return false;
    const player = s.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== s.currentPlayerIndex || s.waitingForTrickEnd || s.isPaused) return false;
    if (s.currentTrick.length === 0) return true;
    const led = s.currentTrick[0].suit;
    return !player.hand.some((c) => c.suit === led) || player.hand[cardIndex].suit === led;
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
      const penalty = negativeTrickPenalty(king.contract, s.currentTrick, king.trickNumber);
      if (penalty > 0) {
        king.lastRoundDeltas[winner] -= penalty;
        king.playerScores[winner] -= penalty;
      }
    } else if (
      king.festaMode === 'positive' &&
      !king.auctionResolved
    ) {
      king.lastRoundDeltas[winner] += FESTA_POSITIVE_TRICK;
      king.playerScores[winner] += FESTA_POSITIVE_TRICK;
    }

    s.waitingForTrickEnd = false;
    s.currentTrick = [];
    s.trickLeader = winner;
    s.currentPlayerIndex = winner;
    this.syncKing(king);

    if (s.players[0].hand.length === 0) this.endGame(king);
  }

  private endGame(king: KingPtVariantState): void {
    if (king.festaMode === 'negative_festa') {
      const settlements = settleNegativeFesta(king.tricksWonThisGame);
      for (let i = 0; i < 4; i++) {
        king.lastRoundDeltas[i] = settlements[i];
        king.playerScores[i] += settlements[i];
      }
    }

    if (king.auctionResolved && king.auctionBidderIndex !== null) {
      if (king.festaMode === 'positive') {
        const { ownerGain, bidderPenalty } = settlePositiveAuction(
          king.auctionOfferTricks,
          king.tricksWonThisGame[king.auctionBidderIndex]
        );
        king.lastRoundDeltas[king.festaOwnerIndex] += ownerGain;
        king.playerScores[king.festaOwnerIndex] += ownerGain;
        if (bidderPenalty > 0) {
          king.lastRoundDeltas[king.auctionBidderIndex] -= bidderPenalty;
          king.playerScores[king.auctionBidderIndex] -= bidderPenalty;
        }
      } else {
        const bonus = settleNegativeAuction(
          king.tricksWonThisGame[king.festaOwnerIndex],
          king.auctionOfferTricks
        );
        if (bonus > 0) {
          king.lastRoundDeltas[king.festaOwnerIndex] += bonus;
          king.playerScores[king.festaOwnerIndex] += bonus;
        }
      }
    }

    king.showScorePopup = true;
    this.state!.scores = {
      team1: king.playerScores[0] + king.playerScores[2],
      team2: king.playerScores[1] + king.playerScores[3]
    };
    this.advanceOrFinish(king);
  }

  private applyDeltas(king: KingPtVariantState, deltas: number[]): void {
    for (let i = 0; i < 4; i++) {
      king.lastRoundDeltas[i] = deltas[i];
      king.playerScores[i] += deltas[i];
    }
    king.showScorePopup = true;
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
    this.state = this.buildState(
      s.players.map((p) => p.name),
      { aiDifficulty: s.aiDifficulty },
      king.kohPlayerIndex,
      [...king.playerScores],
      king.gameIndex + 1
    );
  }

  startRound(_state: GameState): void {
    if (this.state) this.state.waitingForRoundStart = false;
  }

  restoreState(state: GameState): GameState {
    this.state = JSON.parse(JSON.stringify(state));
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
        return valid.reduce((best, i) => {
          const order = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
          return order.indexOf(player.hand[i].rank) < order.indexOf(player.hand[best].rank) ? i : best;
        }, valid[0]);
      }
      return valid[valid.length - 1];
    }

    if (avoid) {
      const led = state.currentTrick[0].suit;
      const inSuit = valid.filter((i) => player.hand[i].suit === led);
      if (inSuit.length) return inSuit[0];
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
