import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player, AIDifficulty } from '../../types/game';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';

const WINNING_SCORE = 500;
const DEFAULT_BID = 4;

interface SpadesVariantState {
  team1Bid: number;
  team2Bid: number;
  team1Tricks: number;
  team2Tricks: number;
}

function getSpadesState(state: GameState): SpadesVariantState {
  const vs = state.variantState?.spades as SpadesVariantState | undefined;
  return vs ?? { team1Bid: DEFAULT_BID, team2Bid: DEFAULT_BID, team1Tricks: 0, team2Tricks: 0 };
}

export class SpadesGame extends BaseGameAdapter {
  variant = 'spades' as const;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.state = this.createRoundState(playerNames, options, 1, { team1: 0, team2: 0 });
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('SpadesGame not initialized');
    return this.cloneState(this.state);
  }

  private createRoundState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    round: number,
    gameScore: { team1: number; team2: number }
  ): GameState {
    const deck = new Deck('standard52');
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;

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

    return {
      variant: 'spades',
      players,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trumpSuit: 'spades',
      trumpCard: null,
      currentTrick: [],
      trickLeader: 0,
      scores: { team1: 0, team2: 0 },
      gameScore,
      completedPentes: [],
      round,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: 'A',
      waitingForRoundStart: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: (options?.aiDifficulty as AIDifficulty) || 'medium',
      partnerSignals: [],
      variantState: {
        spades: {
          team1Bid: DEFAULT_BID,
          team2Bid: DEFAULT_BID,
          team1Tricks: 0,
          team2Tricks: 0
        }
      }
    };
  }

  canPlayCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    const s = this.state!;
    const player = s.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== s.currentPlayerIndex) return false;
    if (s.waitingForTrickEnd || s.isPaused) return false;

    const card = player.hand[cardIndex];
    if (s.currentTrick.length === 0) {
      const hasNonSpades = player.hand.some((c) => c.suit !== 'spades');
      if (card.suit === 'spades' && hasNonSpades) return false;
      return true;
    }

    const ledSuit = s.currentTrick[0].suit;
    const canFollowSuit = player.hand.some((c) => c.suit === ledSuit);
    return !canFollowSuit || card.suit === ledSuit;
  }

  playCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(_state, playerIndex, cardIndex)) return false;
    const s = this.state!;
    const player = s.players[playerIndex];
    const card = player.hand.splice(cardIndex, 1)[0];
    s.currentTrick.push(card);

    if (s.currentTrick.length === 4) {
      const winner = trickWinnerIndex(s.currentTrick, s.trickLeader, 'spades');
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
    const spades = getSpadesState(s);
    const team = s.players[winner]?.team ?? 1;
    if (team === 1) spades.team1Tricks++;
    else spades.team2Tricks++;
    s.variantState = { ...s.variantState, spades };

    s.waitingForTrickEnd = false;
    s.currentTrick = [];
    s.trickLeader = winner;
    s.currentPlayerIndex = winner;

    if (s.players[0].hand.length === 0) {
      this.endRound(s);
    }
  }

  private endRound(s: GameState): void {
    const spades = getSpadesState(s);
    let team1Round = 0;
    let team2Round = 0;

    if (spades.team1Tricks >= spades.team1Bid) {
      team1Round = 10 + spades.team1Tricks;
    }
    if (spades.team2Tricks >= spades.team2Bid) {
      team2Round = 10 + spades.team2Tricks;
    }

    s.scores = { team1: team1Round, team2: team2Round };
    s.gameScore.team1 += team1Round;
    s.gameScore.team2 += team2Round;

    if (s.gameScore.team1 >= WINNING_SCORE) {
      s.isGameOver = true;
      s.winner = 1;
      s.waitingForGameStart = true;
      s.waitingForRoundEnd = false;
      return;
    }
    if (s.gameScore.team2 >= WINNING_SCORE) {
      s.isGameOver = true;
      s.winner = 2;
      s.waitingForGameStart = true;
      s.waitingForRoundEnd = false;
      return;
    }

    s.waitingForRoundEnd = true;
  }

  continueToNextRound(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForRoundEnd) return;

    const names = s.players.map((p) => p.name);
    const gameScore = { ...s.gameScore };
    this.state = this.createRoundState(
      names,
      { aiDifficulty: s.aiDifficulty },
      s.round + 1,
      gameScore
    );
  }

  startRound(_state: GameState): void {
    if (this.state) this.state.waitingForRoundStart = false;
  }
}
