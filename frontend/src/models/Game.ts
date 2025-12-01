import { GameState, Player, Card, Suit, CARD_HIERARCHY, CARD_POINTS } from '../types/game';
import { Deck } from './Deck';

export class Game {
  private state: GameState;
  private deck: Deck;

  constructor(playerNames: string[] = ['You', 'AI 1', 'Partner', 'AI 2']) {
    this.deck = new Deck();
    this.state = this.initializeGame(playerNames);
  }

  private initializeGame(playerNames: string[]): GameState {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player_${index}`,
      name,
      hand: [],
      team: (index % 2 === 0 ? 1 : 2) as 1 | 2
    }));

    // Deal 10 cards to each player
    players.forEach(player => {
      player.hand = this.deck.deal(10);
    });

    // Last card determines trump suit
    const trumpCard = this.deck.peekLast();
    const trumpSuit: Suit | null = trumpCard ? trumpCard.suit : null;

    return {
      players,
      currentPlayerIndex: 0, // Dealer plays first
      trumpSuit,
      currentTrick: [],
      trickLeader: 0,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  playCard(playerIndex: number, cardIndex: number): boolean {
    // Do not allow any new cards while waiting for the user to close the trick
    if (this.state.waitingForTrickEnd) {
      return false;
    }
    if (playerIndex !== this.state.currentPlayerIndex) {
      return false;
    }

    const player = this.state.players[playerIndex];
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return false;
    }

    const card = player.hand[cardIndex];

    // Check if card is valid to play
    if (!this.isValidCard(card, playerIndex)) {
      return false;
    }

    // Remove card from hand and add to trick
    player.hand.splice(cardIndex, 1);
    this.state.currentTrick.push(card);

    // Move to next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % 4;

    // If trick is complete, evaluate it
    if (this.state.currentTrick.length === 4) {
      this.evaluateTrick();
    }

    return true;
  }

  private isValidCard(card: Card, playerIndex: number): boolean {
    const player = this.state.players[playerIndex];
    const trick = this.state.currentTrick;

    // First card of trick - always valid
    if (trick.length === 0) {
      return true;
    }

    const leadSuit = trick[0].suit;
    const hasLeadSuit = player.hand.some(c => c.suit === leadSuit);

    // Must follow suit if possible
    if (hasLeadSuit && card.suit !== leadSuit) {
      return false;
    }

    return true;
  }

  private evaluateTrick(): void {
    const trick = this.state.currentTrick;
    const leadSuit = trick[0].suit;
    const trumpSuit = this.state.trumpSuit!;

    let winningIndex = 0;
    let winningCard = trick[0];
    let isTrump = winningCard.suit === trumpSuit;

    for (let i = 1; i < trick.length; i++) {
      const card = trick[i];
      const isCardTrump = card.suit === trumpSuit;

      if (isCardTrump && !isTrump) {
        // Trump beats non-trump
        winningIndex = i;
        winningCard = card;
        isTrump = true;
      } else if (isCardTrump && isTrump) {
        // Compare trump cards
        if (CARD_HIERARCHY[card.rank] > CARD_HIERARCHY[winningCard.rank]) {
          winningIndex = i;
          winningCard = card;
        }
      } else if (!isCardTrump && !isTrump && card.suit === leadSuit) {
        // Compare same suit cards
        if (CARD_HIERARCHY[card.rank] > CARD_HIERARCHY[winningCard.rank]) {
          winningIndex = i;
          winningCard = card;
        }
      }
    }

    // Calculate points for this trick
    const points = trick.reduce((sum, card) => sum + CARD_POINTS[card.rank], 0);
    
    // Determine which team won
    const actualWinnerIndex = (this.state.trickLeader + winningIndex) % 4;
    const winningTeam = this.state.players[actualWinnerIndex].team;

    if (winningTeam === 1) {
      this.state.scores.team1 += points;
    } else {
      this.state.scores.team2 += points;
    }

    this.state.lastTrickWinner = actualWinnerIndex;

    // Store winner and freeze game until UI confirms moving to next trick
    this.state.waitingForTrickEnd = true;
    this.state.nextTrickLeader = actualWinnerIndex;
  }

  // Called from the UI when the player clicks "Next Trick"
  finishTrick(): void {
    if (!this.state.waitingForTrickEnd) {
      return;
    }

    const nextLeader =
      this.state.nextTrickLeader !== null ? this.state.nextTrickLeader : this.state.trickLeader;

    this.state.waitingForTrickEnd = false;
    this.state.nextTrickLeader = null;

    // If no cards left in hand, end the round after showing the last trick
    if (this.state.players[0].hand.length === 0) {
      this.endRound();
      // endRound will start the next round or finish the game
      return;
    }

    // Prepare for next trick
    this.state.trickLeader = nextLeader;
    this.state.currentPlayerIndex = nextLeader;
    this.state.currentTrick = [];
  }

  private endRound(): void {
    const { team1, team2 } = this.state.scores;
    let roundValue = 1;

    // Check for tie (60-60)
    if (team1 === 60 && team2 === 60) {
      roundValue = 2; // Next round worth 2 points
      // Don't add to game score yet, will be added in next round
    } else {
      // Determine winner
      if (team1 >= 61) {
        if (team1 >= 91) {
          roundValue = 2; // 91+ = 2 victories
        }
        if (team1 === 120) {
          roundValue = 4; // All tricks = 4 victories
        }
        this.state.gameScore.team1 += roundValue;
      } else if (team2 >= 61) {
        if (team2 >= 91) {
          roundValue = 2;
        }
        if (team2 === 120) {
          roundValue = 4;
        }
        this.state.gameScore.team2 += roundValue;
      }
    }

    // Check if game is over
    if (this.state.gameScore.team1 >= 4) {
      this.state.isGameOver = true;
      this.state.winner = 1;
    } else if (this.state.gameScore.team2 >= 4) {
      this.state.isGameOver = true;
      this.state.winner = 2;
    } else {
      // Start new round
      this.startNewRound(roundValue);
    }
  }

  private startNewRound(roundValue: number): void {
    this.deck = new Deck();
    this.state.round++;
    this.state.scores = { team1: 0, team2: 0 };
    this.state.currentTrick = [];
    
    // Deal new hands
    this.state.players.forEach(player => {
      player.hand = this.deck.deal(10);
    });

    const trumpCard = this.deck.peekLast();
    this.state.trumpSuit = trumpCard ? trumpCard.suit : null;
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % 4; // Rotate dealer
    this.state.trickLeader = this.state.currentPlayerIndex;
    this.state.lastTrickWinner = null;
  }

  challengeBluff(challengerTeam: 1 | 2): void {
    // Implement bluff challenge logic
    // This would require tracking if a player could follow suit but didn't
    // For now, this is a placeholder for future implementation
  }
}


