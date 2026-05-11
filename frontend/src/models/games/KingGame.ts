import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player } from '../../types/game';
import { Deck } from '../Deck';

export class KingGame extends BaseGameAdapter {
  variant = 'king' as const;
  private deck?: Deck;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.deck = new Deck('standard52');

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
      variant: 'king',
      players,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trumpSuit: null, // Will be decided per hand
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
    // King placeholder: allow any card for now
    const player = state.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== state.currentPlayerIndex) return false;
    return true;
  }

  playCard(state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(state, playerIndex, cardIndex)) return false;

    const player = state.players[playerIndex];
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    state.currentTrick.push(card);

    if (state.currentTrick.length === 4) {
      // TODO: Implement King-specific trick winner calculation
      const winner = this.calculateTrickWinner(state);
      state.lastTrickWinner = winner;
      state.waitingForTrickEnd = true;
    } else {
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 4;
    }

    return true;
  }

  private calculateTrickWinner(state: GameState): number {
    // King placeholder: first card always wins (will be replaced with actual logic)
    return state.trickLeader;
  }
}
