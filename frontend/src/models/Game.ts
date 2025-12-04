import { GameState, Player, Card, Suit, CARD_HIERARCHY, CARD_POINTS, DealingMethod } from '../types/game';
import { Deck } from './Deck';

export class Game {
  private state: GameState;
  private deck: Deck;

  constructor(playerNames: string[] = ['You', 'AI 1', 'Partner', 'AI 2'], dealingMethod: DealingMethod = 'A') {
    this.deck = new Deck();
    this.state = this.initializeGame(playerNames, dealingMethod);
  }

  /**
   * Choose teams: each player draws one card
   * Highest card teams with lowest card
   * Remaining two players form the second team
   */
  private chooseTeams(playerNames: string[]): { team1: string[], team2: string[] } {
    const setupDeck = new Deck();
    const drawnCards: Array<{ player: string, card: Card }> = [];
    
    // Each player draws one card
    for (const name of playerNames) {
      const card = setupDeck.deal(1)[0];
      drawnCards.push({ player: name, card });
    }
    
    // Sort by card hierarchy (lowest to highest)
    drawnCards.sort((a, b) => {
      const valueA = CARD_HIERARCHY[a.card.rank];
      const valueB = CARD_HIERARCHY[b.card.rank];
      if (valueA !== valueB) {
        return valueA - valueB;
      }
      // If same rank, compare suits (arbitrary order for tie-breaking)
      const suitOrder: Record<Suit, number> = { clubs: 0, diamonds: 1, hearts: 2, spades: 3 };
      return suitOrder[a.card.suit] - suitOrder[b.card.suit];
    });
    
    // Highest (last) teams with lowest (first)
    // Middle two form second team
    return {
      team1: [drawnCards[0].player, drawnCards[3].player],
      team2: [drawnCards[1].player, drawnCards[2].player]
    };
  }

  /**
   * Choose dealer: each player draws a card
   * Lowest card becomes dealer
   * In case of tie, repeat with tied players only
   */
  private chooseDealer(playerNames: string[]): string {
    const setupDeck = new Deck();
    const drawnCards: Array<{ player: string, card: Card }> = [];
    
    // Each player draws one card
    for (const name of playerNames) {
      const card = setupDeck.deal(1)[0];
      drawnCards.push({ player: name, card });
    }
    
    // Sort by card hierarchy (lowest to highest)
    drawnCards.sort((a, b) => {
      const valueA = CARD_HIERARCHY[a.card.rank];
      const valueB = CARD_HIERARCHY[b.card.rank];
      if (valueA !== valueB) {
        return valueA - valueB;
      }
      // If same rank, compare suits (arbitrary order for tie-breaking)
      const suitOrder: Record<Suit, number> = { clubs: 0, diamonds: 1, hearts: 2, spades: 3 };
      return suitOrder[a.card.suit] - suitOrder[b.card.suit];
    });
    
    // Find lowest value
    const lowestValue = CARD_HIERARCHY[drawnCards[0].card.rank];
    const tiedPlayers = drawnCards.filter(d => CARD_HIERARCHY[d.card.rank] === lowestValue);
    
    if (tiedPlayers.length === 1) {
      return tiedPlayers[0].player;
    } else {
      // Recursive call with only tied players
      return this.chooseDealer(tiedPlayers.map(t => t.player));
    }
  }

  /**
   * Seat players: partners must sit opposite one another
   * IMPORTANT: "You" must always be at index 0, "Partner" at index 2
   * Order: [You, AI1, Partner, AI2] - ensuring You and Partner are opposite
   * You and Partner are always on the same team (US), AIs on the other team (THEM)
   */
  private seatPlayers(
    playerNames: string[],
    teams: { team1: string[], team2: string[] }
  ): string[] {
    // Force You and Partner to be on the same team (US)
    // The two AIs will be on the other team (THEM)
    // Get the AI players (they will be on the opposite team)
    const aiPlayers = playerNames.filter(name => name !== 'You' && name !== 'Partner');
    
    // Always seat: You (0), AI1 (1), Partner (2), AI2 (3)
    // This ensures You and Partner are opposite (0 ↔ 2) and on the same team
    return ['You', aiPlayers[0] || 'AI 1', 'Partner', aiPlayers[1] || 'AI 2'];
  }

  /**
   * Deal cards using Method A (standard) or Method B (dealer gets first card)
   * Returns: { suit: Suit | null, card: Card | null }
   */
  private dealCards(players: Player[], dealerIndex: number, method: DealingMethod): { suit: Suit | null, card: Card | null } {
    this.deck = new Deck();
    
    if (method === 'A') {
      // Method A: Standard dealing - one card at a time, counterclockwise
      // The last card dealt (40th card) determines trump suit
      let lastCardDealt: Card | null = null;
      
      for (let round = 0; round < 10; round++) {
        for (let i = 0; i < 4; i++) {
          const playerIndex = (dealerIndex + 1 + i) % 4; // Start to the right of dealer, counterclockwise
          const card = this.deck.deal(1)[0];
          players[playerIndex].hand.push(card);
          // Track the last card dealt (this will be the 40th card)
          lastCardDealt = card;
        }
      }
      
      // Last card dealt determines trump suit
      // Create a copy for display (since original is in a player's hand)
      const trumpCard: Card | null = lastCardDealt ? {
        suit: lastCardDealt.suit,
        rank: lastCardDealt.rank,
        id: `trump_${lastCardDealt.suit}_${lastCardDealt.rank}_${Date.now()}`
      } : null;
      
      return {
        suit: trumpCard ? trumpCard.suit : null,
        card: trumpCard
      };
    } else {
      // Method B: Dealer receives first card (trump), then 9 more, rest dealt clockwise
      const dealer = players[dealerIndex];
      
      // Dealer gets first card (this becomes trump)
      const trumpCard = this.deck.deal(1)[0];
      dealer.hand.push(trumpCard);
      const trumpSuit = trumpCard.suit;
      
      // Create a copy of the trump card for display (since original is in dealer's hand)
      const trumpCardForDisplay: Card = {
        suit: trumpCard.suit,
        rank: trumpCard.rank,
        id: `trump_${trumpCard.suit}_${trumpCard.rank}_${Date.now()}`
      };
      
      // Dealer gets 9 more cards
      for (let i = 0; i < 9; i++) {
        const card = this.deck.deal(1)[0];
        dealer.hand.push(card);
      }
      
      // Rest of cards dealt clockwise (to the left) to remaining players
      // Following the pseudocode pattern: distribute to players in order after dealer
      // Clockwise order: dealer+1, dealer+2, dealer+3 (in sequence)
      for (let round = 0; round < 10; round++) {
        // Deal clockwise: go in order after dealer (dealer+1, dealer+2, dealer+3)
        for (let i = 1; i <= 3; i++) {
          const playerIndex = (dealerIndex + i) % 4;
          const card = this.deck.deal(1)[0];
          players[playerIndex].hand.push(card);
        }
      }
      
      return { suit: trumpSuit, card: trumpCardForDisplay };
    }
  }

  private initializeGame(playerNames: string[], dealingMethod: DealingMethod = 'A'): GameState {
    // Step 1: Choose teams
    const teams = this.chooseTeams(playerNames);
    
    // Step 2: Choose dealer
    const dealerName = this.chooseDealer(playerNames);
    
    // Step 3: Seat players (partners opposite)
    const seatedOrder = this.seatPlayers(playerNames, teams);
    
    // Step 4: Create players with correct teams and seating
    // IMPORTANT: You and Partner (indices 0 and 2) must be on the same team (US)
    // AI 1 and AI 2 (indices 1 and 3) must be on the other team (THEM)
    const players: Player[] = seatedOrder.map((name, index) => {
      // You (index 0) and Partner (index 2) are always on team 1 (US)
      // AI 1 (index 1) and AI 2 (index 3) are always on team 2 (THEM)
      const isUS = (name === 'You' || name === 'Partner');
      return {
        id: `player_${index}`,
        name,
        hand: [],
        team: (isUS ? 1 : 2) as 1 | 2
      };
    });
    
    // Find dealer index in seated order
    const dealerIndex = seatedOrder.indexOf(dealerName);
    
    // Step 5: Deal 10 cards to each player using selected method
    const trumpResult = this.dealCards(players, dealerIndex, dealingMethod);

    // First trick: player to the right of dealer starts (counterclockwise)
    const firstTrickStarter = (dealerIndex + 1) % 4;

    return {
      players,
      currentPlayerIndex: firstTrickStarter, // Player to the right of dealer starts first trick
      dealerIndex: dealerIndex,
      trumpSuit: trumpResult.suit,
      trumpCard: trumpResult.card, // The actual trump card for display
      currentTrick: [],
      trickLeader: firstTrickStarter,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: dealingMethod,
      waitingForRoundStart: true, // Pause before starting (show trump card)
      waitingForGameStart: false
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

    // Calculate next player
    let nextPlayerIndex: number;
    
    if (this.state.isFirstTrick) {
      // Special rule for first trick: dealer plays last
      // Order: (dealer+1), (dealer+2), (dealer+3), dealer
      const dealerIndex = this.state.dealerIndex;
      const cardsPlayed = this.state.currentTrick.length;
      
      if (cardsPlayed < 3) {
        // First three players: dealer+1, dealer+2, dealer+3
        nextPlayerIndex = (dealerIndex + cardsPlayed + 1) % 4;
      } else {
        // Last player is always the dealer
        nextPlayerIndex = dealerIndex;
      }
    } else {
      // Standard counterclockwise rotation (to the right)
      nextPlayerIndex = (this.state.currentPlayerIndex + 1) % 4;
    }

    this.state.currentPlayerIndex = nextPlayerIndex;

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
    // After first trick, all subsequent tricks follow standard rotation
    this.state.isFirstTrick = false;
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
      this.state.waitingForGameStart = true; // Pause before allowing new game
    } else if (this.state.gameScore.team2 >= 4) {
      this.state.isGameOver = true;
      this.state.winner = 2;
      this.state.waitingForGameStart = true; // Pause before allowing new game
    } else {
      // Start new round (will pause to show trump)
      this.startNewRound(roundValue);
    }
  }

  private startNewRound(roundValue: number): void {
    this.state.round++;
    this.state.scores = { team1: 0, team2: 0 };
    this.state.currentTrick = [];
    
    // Rotate dealer counterclockwise (to the right)
    this.state.dealerIndex = (this.state.dealerIndex + 1) % 4;
    
    // Deal new hands using the same method
    const trumpResult = this.dealCards(this.state.players, this.state.dealerIndex, this.state.dealingMethod);
    this.state.trumpSuit = trumpResult.suit;
    this.state.trumpCard = trumpResult.card;
    
    // First trick: player to the right of dealer starts
    const firstTrickStarter = (this.state.dealerIndex + 1) % 4;
    this.state.currentPlayerIndex = firstTrickStarter;
    this.state.trickLeader = firstTrickStarter;
    this.state.lastTrickWinner = null;
    this.state.isFirstTrick = true;
    // Only pause on first round of the game (round 1)
    this.state.waitingForRoundStart = (this.state.round === 1);
  }

  // Called from UI when user is ready to start the round
  startRound(): void {
    if (this.state.waitingForRoundStart) {
      this.state.waitingForRoundStart = false;
    }
  }

  // Called from UI when user is ready to start a new game
  startNewGame(): void {
    if (this.state.waitingForGameStart) {
      this.state.waitingForGameStart = false;
    }
  }

  challengeBluff(challengerTeam: 1 | 2): void {
    // Implement bluff challenge logic
    // This would require tracking if a player could follow suit but didn't
    // For now, this is a placeholder for future implementation
  }
}

