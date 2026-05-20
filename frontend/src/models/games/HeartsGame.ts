import { BaseGameAdapter } from './GameAdapter';
import { GameState, Card, Player, AIDifficulty } from '../../types/game';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';

const TARGET_SCORE = 100;

interface HeartsVariantState {
  heartsBroken: boolean;
  playerScores: number[];
}

function getHeartsState(state: GameState): HeartsVariantState {
  const vs = state.variantState?.hearts as HeartsVariantState | undefined;
  return vs ?? { heartsBroken: false, playerScores: [0, 0, 0, 0] };
}

function trickPoints(trick: Card[]): number {
  return trick.reduce((sum, card) => {
    if (card.suit === 'hearts') return sum + 1;
    if (card.rank === 'Q' && card.suit === 'spades') return sum + 13;
    return sum;
  }, 0);
}

export class HeartsGame extends BaseGameAdapter {
  variant = 'hearts' as const;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.state = this.createRoundState(playerNames, options, 1, [0, 0, 0, 0]);
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('HeartsGame not initialized');
    return this.cloneState(this.state);
  }

  private autoPass(players: Player[]): void {
    for (let i = 0; i < 4; i++) {
      const to = (i + 1) % 4;
      const pass = players[i].hand.splice(0, 3);
      players[to].hand.push(...pass);
    }
  }

  private createRoundState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    round: number,
    playerScores: number[]
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

    this.autoPass(players);

    const twoClubs = players.findIndex((p) =>
      p.hand.some((c) => c.rank === '2' && c.suit === 'clubs')
    );
    const leader = twoClubs >= 0 ? twoClubs : 0;

    return {
      variant: 'hearts',
      players,
      currentPlayerIndex: leader,
      dealerIndex: 0,
      trumpSuit: null,
      trumpCard: null,
      currentTrick: [],
      trickLeader: leader,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
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
        hearts: { heartsBroken: false, playerScores }
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
    const hearts = getHeartsState(s);

    if (s.isFirstTrick && s.currentTrick.length === 0) {
      const must2c = player.hand.some((c) => c.rank === '2' && c.suit === 'clubs');
      if (must2c && !(card.rank === '2' && card.suit === 'clubs')) return false;
    }

    if (s.currentTrick.length === 0 && card.suit === 'hearts' && !hearts.heartsBroken) {
      const hasOther = player.hand.some((c) => c.suit !== 'hearts');
      if (hasOther) return false;
    }

    if (s.currentTrick.length > 0) {
      const ledSuit = s.currentTrick[0].suit;
      const canFollow = player.hand.some((c) => c.suit === ledSuit);
      return !canFollow || card.suit === ledSuit;
    }

    return true;
  }

  playCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(_state, playerIndex, cardIndex)) return false;
    const s = this.state!;
    const player = s.players[playerIndex];
    const card = player.hand.splice(cardIndex, 1)[0];
    s.currentTrick.push(card);

    const hearts = getHeartsState(s);
    if (card.suit === 'hearts') hearts.heartsBroken = true;
    s.variantState = { ...s.variantState, hearts };

    if (s.currentTrick.length === 4) {
      const winner = trickWinnerIndex(s.currentTrick, s.trickLeader, null);
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
    const points = trickPoints(s.currentTrick);
    const hearts = getHeartsState(s);
    hearts.playerScores[winner] += points;
    s.variantState = { ...s.variantState, hearts };

    s.waitingForTrickEnd = false;
    s.currentTrick = [];
    s.isFirstTrick = false;
    s.trickLeader = winner;
    s.currentPlayerIndex = winner;

    if (s.players[0].hand.length === 0) {
      this.endRound(s);
    }
  }

  private endRound(s: GameState): void {
    const hearts = getHeartsState(s);
    const max = Math.max(...hearts.playerScores);
    if (max >= TARGET_SCORE) {
      s.isGameOver = true;
      s.winner = hearts.playerScores.indexOf(max) < 2 ? 1 : 2;
      s.waitingForGameStart = true;
      return;
    }
    s.waitingForRoundEnd = true;
    s.scores = {
      team1: hearts.playerScores[0] + hearts.playerScores[2],
      team2: hearts.playerScores[1] + hearts.playerScores[3]
    };
  }

  continueToNextRound(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForRoundEnd) return;
    const hearts = getHeartsState(s);
    const names = s.players.map((p) => p.name);
    this.state = this.createRoundState(
      names,
      { aiDifficulty: s.aiDifficulty },
      s.round + 1,
      [...hearts.playerScores]
    );
  }

  startRound(_state: GameState): void {
    if (this.state) this.state.waitingForRoundStart = false;
  }
}
