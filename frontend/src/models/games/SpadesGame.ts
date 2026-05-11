import { BaseGameAdapter } from './GameAdapter';
import { GameState, Card, Suit, Player } from '../../types/game';
import { Deck } from '../Deck';

export class SpadesGame extends BaseGameAdapter {
  variant = 'spades' as const;
  private deck?: Deck;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.deck = new Deck('standard52');
    
    // Fixed 4-player seating
    const players: Player[] = playerNames.slice(0, 4).map((name, index) => {
      const isTeam1 = index === 0 || index === 2;
      const localPlayerIndex = options?.localPlayerIndex as number | undefined;
      const isLocalHuman = localPlayerIndex !== undefined ? index === localPlayerIndex : index === 0;
      const playerType = localPlayerIndex !== undefined
        ? (isLocalHuman ? 'human' : 'remote')
        : (isLocalHuman ? 'human' : 'ai');
      
      return {
        id: `player_${index}`,
        name,
        hand: [],
        team: (isTeam1 ? 1 : 2) as 1 | 2,
        type: playerType
      };
    });

    // Deal 13 cards to each player
    for (let i = 0; i < 13; i++) {
      for (let p = 0; p < 4; p++) {
        const card = this.deck.deal(1)[0];
        if (card) players[p].hand.push(card);
      }
    }

    this.state = {
      variant: 'spades',
      players,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trumpSuit: 'spades', // Spades is always trump
      trumpCard: null,
      currentTrick: [],
      trickLeader: 0,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
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
      aiDifficulty: (options?.aiDifficulty as any) || 'medium',
      partnerSignals: [],
      nextRoundValue: undefined
    };

    return this.state;
  }

  canPlayCard(state: GameState, playerIndex: number, cardIndex: number): boolean {
    const player = state.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== state.currentPlayerIndex) return false;

    const card = player.hand[cardIndex];
    
    // If no trick started, check spades rule
    if (state.currentTrick.length === 0) {
      const hasNonSpades = player.hand.some(c => c.suit !== 'spades');
      if (card.suit === 'spades' && hasNonSpades) {
        return false; // Can't lead spades unless it's the only suit
      }
      return true;
    }

    // Must follow suit if possible
    const ledSuit = state.currentTrick[0].suit;
    const canFollowSuit = player.hand.some(c => c.suit === ledSuit);
    return !canFollowSuit || card.suit === ledSuit;
  }

  playCard(state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(state, playerIndex, cardIndex)) return false;

    const player = state.players[playerIndex];
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    state.currentTrick.push(card);

    // Check if trick is complete
    if (state.currentTrick.length === 4) {
      const winner = this.calculateTrickWinner(state);
      state.lastTrickWinner = winner;
      state.waitingForTrickEnd = true;
    } else {
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 4;
    }

    return true;
  }

  private calculateTrickWinner(state: GameState): number {
    const ledSuit = state.currentTrick[0].suit;
    let highestCard = state.currentTrick[0];
    let highestIndex = 0;

    for (let i = 1; i < state.currentTrick.length; i++) {
      const card = state.currentTrick[i];
      const compareResult = this.compareCards(card, highestCard, ledSuit, 'spades');
      if (compareResult > 0) {
        highestCard = card;
        highestIndex = i;
      }
    }

    return (state.trickLeader + highestIndex) % 4;
  }

  private compareCards(card1: Card, card2: Card, ledSuit: Suit, trump: Suit): number {
    const HIERARCHY: Record<string, number> = {
      '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8,
      '10': 9, 'J': 10, 'Q': 11, 'K': 12, 'A': 13
    };

    if (card1.suit === trump && card2.suit !== trump) return 1;
    if (card1.suit !== trump && card2.suit === trump) return -1;
    if (card1.suit !== card2.suit) return card1.suit === ledSuit ? 1 : -1;
    return (HIERARCHY[card1.rank] || 0) - (HIERARCHY[card2.rank] || 0);
  }
}
