import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player, Suit, AIDifficulty } from '../../types/game';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';

/** 6 negative hands, then 4 positive (simplified King — see docs/rules/king-simplified.md) */
const NEGATIVE_HANDS = 6;
const POSITIVE_HANDS = 4;
const TOTAL_HANDS = NEGATIVE_HANDS + POSITIVE_HANDS;

function handTypeForIndex(handIndex: number): 'negative' | 'positive' {
  return handIndex < NEGATIVE_HANDS ? 'negative' : 'positive';
}

interface KingVariantState {
  handIndex: number;
  handType: 'negative' | 'positive';
  trumpSuit: Suit;
  playerScores: number[];
}

function getKingState(state: GameState): KingVariantState {
  const vs = state.variantState?.king as KingVariantState | undefined;
  return (
    vs ?? {
      handIndex: 0,
      handType: 'negative',
      trumpSuit: 'clubs',
      playerScores: [0, 0, 0, 0]
    }
  );
}

export class KingGame extends BaseGameAdapter {
  variant = 'king' as const;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.state = this.createHandState(playerNames, options, 0, [0, 0, 0, 0]);
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('KingGame not initialized');
    return this.cloneState(this.state);
  }

  private createHandState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    handIndex: number,
    playerScores: number[]
  ): GameState {
    const deck = new Deck('standard52');
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const handType = handTypeForIndex(handIndex);
    const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
    const trumpSuit = suits[handIndex % 4];

    const players: Player[] = playerNames.slice(0, 4).map((name, index) => {
      const isTeam1 = index === 0 || index === 2;
      const isLocalHuman = localPlayerIndex !== undefined ? index === localPlayerIndex : index === 0;
      const playerType =
        localPlayerIndex !== undefined
          ? isLocalHuman
            ? 'human'
            : 'ai'
          : isLocalHuman
            ? 'human'
            : 'ai';

      return {
        id: `player_${index}`,
        name,
        hand: [],
        team: (isTeam1 ? 1 : 2) as 1 | 2,
        type: playerType
      };
    });

    for (let i = 0; i < 13; i++) {
      for (let p = 0; p < 4; p++) {
        const card = deck.deal(1)[0];
        if (card) players[p].hand.push(card);
      }
    }

    const trumpCard = players[0].hand[0] ? { ...players[0].hand[0], id: `trump_${handIndex}` } : null;
    const dealerIndex = handIndex % 4;
    const leader = (dealerIndex + 1) % 4;

    return {
      variant: 'king',
      players,
      currentPlayerIndex: leader,
      dealerIndex,
      trumpSuit,
      trumpCard,
      currentTrick: [],
      trickLeader: leader,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: handIndex + 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: 'A',
      waitingForRoundStart: true,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: (options?.aiDifficulty as AIDifficulty) || 'medium',
      partnerSignals: [],
      variantState: {
        king: {
          handIndex,
          handType,
          trumpSuit,
          playerScores,
          totalHands: TOTAL_HANDS,
          negativeHands: NEGATIVE_HANDS,
          positiveHands: POSITIVE_HANDS
        }
      }
    };
  }

  canPlayCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    const s = this.state!;
    if (s.waitingForRoundStart) return false;
    const player = s.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== s.currentPlayerIndex) return false;
    if (s.waitingForTrickEnd || s.isPaused) return false;

    const card = player.hand[cardIndex];
    if (s.currentTrick.length === 0) return true;

    const ledSuit = s.currentTrick[0].suit;
    const canFollow = player.hand.some((c) => c.suit === ledSuit);
    return !canFollow || card.suit === ledSuit;
  }

  playCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(_state, playerIndex, cardIndex)) return false;
    const s = this.state!;
    const king = getKingState(s);
    const player = s.players[playerIndex];
    const card = player.hand.splice(cardIndex, 1)[0];
    s.currentTrick.push(card);

    if (s.currentTrick.length === 4) {
      const winner = trickWinnerIndex(s.currentTrick, s.trickLeader, king.trumpSuit);
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

    const winner = s.nextTrickLeader ?? s.lastTrickWinner ?? 0;
    const king = getKingState(s);
    const delta = king.handType === 'negative' ? -5 : 5;
    king.playerScores[winner] += delta;
    s.variantState = { ...s.variantState, king };

    s.waitingForTrickEnd = false;
    s.currentTrick = [];
    s.trickLeader = winner;
    s.currentPlayerIndex = winner;

    if (s.players[0].hand.length === 0) {
      this.endHand(s);
    }
  }

  private endHand(s: GameState): void {
    const king = getKingState(s);
    if (king.handIndex + 1 >= TOTAL_HANDS) {
      const max = Math.max(...king.playerScores);
      s.isGameOver = true;
      s.winner = king.playerScores.indexOf(max) < 2 ? 1 : 2;
      s.waitingForGameStart = true;
      return;
    }
    s.waitingForRoundEnd = true;
    s.scores = {
      team1: king.playerScores[0] + king.playerScores[2],
      team2: king.playerScores[1] + king.playerScores[3]
    };
  }

  continueToNextRound(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForRoundEnd) return;
    const king = getKingState(s);
    const names = s.players.map((p) => p.name);
    this.state = this.createHandState(
      names,
      { aiDifficulty: s.aiDifficulty },
      king.handIndex + 1,
      [...king.playerScores]
    );
  }

  startRound(_state: GameState): void {
    if (this.state) {
      this.state.waitingForRoundStart = false;
    }
  }

  restoreState(state: GameState): GameState {
    this.state = JSON.parse(JSON.stringify(state));
    return this.getCurrentState();
  }

  chooseAICard(state: GameState, playerIndex: number): number {
    if (!this.state) return -1;
    const king = getKingState(this.state);
    const player = state.players[playerIndex];
    if (!player) return -1;
    const valid: number[] = [];
    for (let i = 0; i < player.hand.length; i++) {
      if (this.canPlayCard(state, playerIndex, i)) valid.push(i);
    }
    if (valid.length === 0) return -1;

    if (king.handType === 'negative') {
      if (state.currentTrick.length === 0) {
        return valid.reduce((best, i) => {
          const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
          const a = rankOrder.indexOf(player.hand[best].rank);
          const b = rankOrder.indexOf(player.hand[i].rank);
          return a < b ? best : i;
        }, valid[0]);
      }
      return valid[0];
    }

    if (state.currentTrick.length === 0) {
      return valid[valid.length - 1];
    }
    return valid[0];
  }
}
