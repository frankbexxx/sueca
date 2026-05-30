import { GameState, Player, Card, Suit, CARD_HIERARCHY, CARD_POINTS, DealingMethod, AIDifficulty } from '../types/game';
import { applyHandSortToState } from '../utils/handSort';
import { Deck } from './Deck';
import { chooseSuecaCard, SuecaStrategyContext } from '../ai/games/sueca/SuecaStrategy';

export class Game {
  private state: GameState;
  private deck: Deck;

  constructor(
    playerNames: string[] = ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    dealingMethod: DealingMethod = 'A',
    aiDifficulty: AIDifficulty = 'medium',
    localPlayerIndex?: number
  ) {
    this.deck = new Deck();
    this.state = this.initializeGame(playerNames, dealingMethod, aiDifficulty, localPlayerIndex);
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
   * Seat players in fixed positions:
   * Index 0 = South (humano), 1 = East (AI), 2 = North (AI), 3 = West (AI)
   * Teams: South+North (team 1), East+West (team 2)
   */
  private seatPlayers(playerNames: string[]): string[] {
    const defaults = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
    return defaults.map((def, idx) => playerNames[idx] || def);
  }

  /**
   * Deal cards using Method A (standard) or Method B (dealer gets first card)
   * Returns: { suit: Suit | null, card: Card | null }
   */
  private dealCards(players: Player[], dealerIndex: number, method: DealingMethod): { suit: Suit | null, card: Card | null } {
    this.deck = new Deck();
    // According to Sueca rules: after shuffling, the deck is cut by the partner of the shuffler
    // The shuffler is the player to the right of the dealer
    // For simplicity, we apply a random cut before dealing
    this.deck.cut();
    
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

  private initializeGame(
    playerNames: string[],
    dealingMethod: DealingMethod = 'A',
    aiDifficulty: AIDifficulty = 'medium',
    localPlayerIndex?: number
  ): GameState {
    // Choose dealer
    const dealerName = this.chooseDealer(playerNames);
    
    // Seat players (fixed positions)
    const seatedOrder = this.seatPlayers(playerNames);
    
    // Step 5: Deal after dealing modal (startRound)
    const players: Player[] = seatedOrder.map((name, index) => {
      const isTeam1 = index === 0 || index === 2;
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
    
    // Find dealer index in seated order
    const dealerIndex = seatedOrder.indexOf(dealerName);
    const firstTrickStarter = (dealerIndex + 1) % 4;

    return {
      players,
      currentPlayerIndex: firstTrickStarter,
      dealerIndex: dealerIndex,
      trumpSuit: null,
      trumpCard: null,
      currentTrick: [],
      trickLeader: firstTrickStarter,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [], // Array of completed pentes (stand alone pentes from 120 points)
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: dealingMethod,
      waitingForRoundStart: true, // Pause before starting (show trump card)
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [], // Initialize empty - will track cards as they're played
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: aiDifficulty,
      partnerSignals: [], // Initialize empty - will track partner coordination signals
      nextRoundValue: undefined
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  loadState(state: GameState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  setLocalPlayerIndex(localPlayerIndex: number): void {
    this.state.players = this.state.players.map((player, index) => ({
      ...player,
      type: index === localPlayerIndex ? 'human' : 'remote'
    }));
  }

  /**
   * Updates player names in the current game state without restarting
   * Useful for changing names during an active game
   */
  updatePlayerNames(playerNames: string[]): void {
    this.state.players = this.state.players.map((player, index) => ({
      ...player,
      name: playerNames[index] || `Player ${index + 1}`
    }));
  }

  /**
   * Check if a card can be played (public method for UI)
   */
  canPlayCard(playerIndex: number, cardIndex: number): boolean {
    if (playerIndex !== this.state.currentPlayerIndex) {
      return false;
    }
    const player = this.state.players[playerIndex];
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return false;
    }
    const card = player.hand[cardIndex];
    return this.isValidCard(card, playerIndex);
  }

  playCard(playerIndex: number, cardIndex: number): boolean {
    // Do not allow any new cards while waiting for the user to close the trick or if paused
    if (this.state.waitingForTrickEnd || this.state.isPaused) {
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
    // Track this card as played
    this.state.playedCards.push(card);

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

  /**
   * AI strategy: delegates to SuecaStrategy.chooseSuecaCard.
   * Private helpers stay here for now (moved in later refactor steps).
   */
  chooseAICard(playerIndex: number): number {
    const ctx: SuecaStrategyContext = {
      getValidCards: (idx) => {
        const p = this.state.players[idx];
        const result: Array<{ card: Card; index: number }> = [];
        for (let i = 0; i < p.hand.length; i++) {
          if (this.isValidCard(p.hand[i], idx)) result.push({ card: p.hand[i], index: i });
        }
        return result;
      },
    };
    return chooseSuecaCard(this.state, playerIndex, ctx);
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
    let isStandAlonePente = false; // Track if this is a 120-point stand alone pente

    // Check for tie (60-60) — carry doubles next hand's game award
    if (team1 === 60 && team2 === 60) {
      this.state.pendingRoundMultiplier = 2;
      roundValue = 0;
    } else {
      const multiplier = this.state.pendingRoundMultiplier ?? 1;
      const award = (team: 'team1' | 'team2', base: number) => {
        if (base > 0) {
          this.state.gameScore[team] += base * multiplier;
        }
      };

      // Determine winner
      if (team1 >= 61) {
        if (team1 === 120) {
          this.state.completedPentes.push({ team1: 4, team2: 0 });
          isStandAlonePente = true;
          roundValue = 0;
        } else if (team1 >= 91) {
          roundValue = 2;
          award('team1', roundValue);
        } else {
          roundValue = 1;
          award('team1', roundValue);
        }
      } else if (team2 >= 61) {
        if (team2 === 120) {
          this.state.completedPentes.push({ team1: 0, team2: 4 });
          isStandAlonePente = true;
          roundValue = 0;
        } else if (team2 >= 91) {
          roundValue = 2;
          award('team2', roundValue);
        } else {
          roundValue = 1;
          award('team2', roundValue);
        }
      }

      if (multiplier > 1) {
        this.state.pendingRoundMultiplier = undefined;
      }
    }

    // Check if game is over (current pente completed)
    if (this.state.gameScore.team1 >= 4) {
      this.state.isGameOver = true;
      this.state.winner = 1;
      this.state.waitingForGameStart = true; // Pause before allowing new game
      this.state.waitingForRoundEnd = false;
    } else if (this.state.gameScore.team2 >= 4) {
      this.state.isGameOver = true;
      this.state.winner = 2;
      this.state.waitingForGameStart = true; // Pause before allowing new game
      this.state.waitingForRoundEnd = false;
    } else {
      // Show round results before starting new round
      this.state.waitingForRoundEnd = true;
      // Store round value for next round (only if not stand alone pente)
      if (!isStandAlonePente) {
        this.state.nextRoundValue = roundValue;
      } else {
        // For stand alone pente, next round is worth 1 (normal)
        this.state.nextRoundValue = 1;
      }
    }
  }

  // Called from UI to continue after showing round results
  continueToNextRound(): void {
    if (this.state.waitingForRoundEnd) {
      this.state.waitingForRoundEnd = false;
      this.startNewRound();
    }
  }

  setDealingMethod(method: DealingMethod): void {
    this.state.dealingMethod = method;
  }

  private startNewRound(): void {
    this.state.nextRoundValue = undefined;
    this.state.round++;
    this.state.scores = { team1: 0, team2: 0 };
    this.state.currentTrick = [];
    this.state.playedCards = [];

    this.state.dealerIndex = (this.state.dealerIndex + 1) % 4;

    this.state.players.forEach((p) => {
      p.hand = [];
    });
    this.state.trumpSuit = null;
    this.state.trumpCard = null;

    const firstTrickStarter = (this.state.dealerIndex + 1) % 4;
    this.state.currentPlayerIndex = firstTrickStarter;
    this.state.trickLeader = firstTrickStarter;
    this.state.lastTrickWinner = null;
    this.state.isFirstTrick = true;
    this.state.waitingForRoundEnd = false;
    this.state.waitingForRoundStart = true;
  }

  // Called from UI when user is ready to start the round
  startRound(): void {
    if (this.state.waitingForRoundStart) {
      if (this.state.players[0].hand.length === 0) {
        const trumpResult = this.dealCards(
          this.state.players,
          this.state.dealerIndex,
          this.state.dealingMethod
        );
        this.state.trumpSuit = trumpResult.suit;
        this.state.trumpCard = trumpResult.card;
        applyHandSortToState(this.state);
      }
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

  pauseGame(): void {
    this.state.isPaused = true;
  }

  resumeGame(): void {
    this.state.isPaused = false;
  }

  quitGame(): void {
    // Reset game state - can be used to start fresh
    this.state.isGameOver = true;
    this.state.isPaused = false;
  }

  /**
   * Check if a specific card has been played in this round
   */
  hasCardBeenPlayed(card: Card): boolean {
    return this.state.playedCards.some(c => 
      c.suit === card.suit && c.rank === card.rank
    );
  }

}

