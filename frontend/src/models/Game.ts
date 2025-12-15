import { GameState, Player, Card, Suit, CARD_HIERARCHY, CARD_POINTS, DealingMethod, AIDifficulty } from '../types/game';
import { Deck } from './Deck';

export class Game {
  private state: GameState;
  private deck: Deck;

  constructor(
    playerNames: string[] = ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    dealingMethod: DealingMethod = 'A',
    aiDifficulty: AIDifficulty = 'medium'
  ) {
    this.deck = new Deck();
    this.state = this.initializeGame(playerNames, dealingMethod, aiDifficulty);
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
    aiDifficulty: AIDifficulty = 'medium'
  ): GameState {
    // Choose dealer
    const dealerName = this.chooseDealer(playerNames);
    
    // Seat players (fixed positions)
    const seatedOrder = this.seatPlayers(playerNames);
    
    // Create players with fixed teams: indices 0/2 = team1 (US), 1/3 = team2 (THEM)
    const players: Player[] = seatedOrder.map((name, index) => {
      const isTeam1 = index === 0 || index === 2;
      return {
        id: `player_${index}`,
        name,
        hand: [],
        team: (isTeam1 ? 1 : 2) as 1 | 2
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
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [], // Initialize empty - will track cards as they're played
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: aiDifficulty,
      partnerSignals: [] // Initialize empty - will track partner coordination signals
    };
  }

  getState(): GameState {
    return { ...this.state };
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
   * AI strategy: Choose the best card to play based on game state
   * Uses card tracking to make smarter decisions
   * Returns the index of the card to play, or -1 if no valid card
   */
  chooseAICard(playerIndex: number): number {
    const player = this.state.players[playerIndex];
    const trick = this.state.currentTrick;
    const trumpSuit = this.state.trumpSuit!;
    const difficulty = this.state.aiDifficulty;
    
    // Get valid cards (cards that can be played)
    const validCards: Array<{ card: Card; index: number }> = [];
    for (let i = 0; i < player.hand.length; i++) {
      if (this.isValidCard(player.hand[i], playerIndex)) {
        validCards.push({ card: player.hand[i], index: i });
      }
    }

    if (validCards.length === 0) {
      return -1; // No valid cards (shouldn't happen)
    }

    // Easy: Random with slight preference for lower cards
    if (difficulty === 'easy') {
      // 70% chance to play a random lower card, 30% random
      if (Math.random() < 0.7) {
        validCards.sort((a, b) => CARD_HIERARCHY[a.card.rank] - CARD_HIERARCHY[b.card.rank]);
        return validCards[Math.floor(Math.random() * Math.min(3, validCards.length))].index;
      } else {
        return validCards[Math.floor(Math.random() * validCards.length)].index;
      }
    }

    // Medium and Hard: Use strategic logic
    // Helper: Check if a card is likely to win (considering played cards)
    const isCardLikelyToWin = (card: Card, suit: Suit): boolean => {
      if (difficulty === 'hard') {
        // Use advanced probability calculation
        return this.calculateWinProbability(card, suit, trumpSuit) > 0.5;
      } else {
        // Medium: Simple check
        if (card.suit === trumpSuit) {
          const higherTrumpsPlayed = this.state.playedCards.filter(c => 
            c.suit === trumpSuit && CARD_HIERARCHY[c.rank] > CARD_HIERARCHY[card.rank]
          ).length;
          return higherTrumpsPlayed < 2;
        } else {
          const higherCardsPlayed = this.state.playedCards.filter(c => 
            c.suit === suit && CARD_HIERARCHY[c.rank] > CARD_HIERARCHY[card.rank]
          ).length;
          return higherCardsPlayed < 2;
        }
      }
    };

    // If leading (first card of trick)
    if (trick.length === 0) {
      // Count remaining cards of each suit in hand
      const suitCounts: Record<Suit, number> = {
        clubs: 0, diamonds: 0, hearts: 0, spades: 0
      };
      player.hand.forEach(card => {
        suitCounts[card.suit]++;
      });

      // Hard difficulty: Check partner signals for coordination
      if (difficulty === 'hard') {
        const partnerSignal = this.getPartnerSignal(playerIndex);
        if (partnerSignal === 'need_trump' && validCards.some(v => v.card.suit === trumpSuit)) {
          // Partner needs trumps, lead with a trump if possible
          const trumpCards = validCards.filter(v => v.card.suit === trumpSuit);
          if (trumpCards.length > 0) {
            // Send signal that we're helping
            this.sendPartnerSignal(playerIndex, 'helping_trump');
            return trumpCards[0].index;
          }
        }
      }

      // Prefer leading with suit we have many cards of
      // Also consider if we have high cards in that suit
      let bestCard = validCards[0];
      let bestScore = 0;

      for (const valid of validCards) {
        const suit = valid.card.suit;
        const rankValue = CARD_HIERARCHY[valid.card.rank];
        const suitCount = suitCounts[suit];
        
        // Score: higher rank + more cards of that suit
        // Bonus for trumps if we have many
        let score = rankValue * 2 + suitCount;
        if (suit === trumpSuit && suitCount > 3) {
          score += 5; // Bonus for leading with trumps when we have many
        }
        
        // Hard: Bonus for leading with strong suit (signal to partner)
        if (difficulty === 'hard' && suitCount >= 4 && rankValue >= CARD_HIERARCHY['K']) {
          score += 3; // Signal we have strong suit
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestCard = valid;
        }
      }
      
      // Hard: Send signal about what we're leading
      if (difficulty === 'hard' && bestCard.card.suit === trumpSuit && suitCounts[trumpSuit] > 3) {
        this.sendPartnerSignal(playerIndex, 'leading_trumps');
      }
      
      return bestCard.index;
    }

    // Following suit - need to determine best strategy
    const leadSuit = trick[0].suit;
    const leadCard = trick[0];
    const leadValue = CARD_HIERARCHY[leadCard.rank];
    const isLeadTrump = leadCard.suit === trumpSuit;
    const trickLeader = this.state.trickLeader;
    const partnerIndex = this.getPartnerIndex(playerIndex);
    const isPartnerLeading = partnerIndex !== null && trickLeader === partnerIndex;

    // Check if there are any trumps already played
    const trumpsInTrick = trick.filter(c => c.suit === trumpSuit);
    const highestTrumpInTrick = trumpsInTrick.length > 0
      ? Math.max(...trumpsInTrick.map(c => CARD_HIERARCHY[c.rank]))
      : 0;

    // Separate cards by type
    const cardsOfLeadSuit = validCards.filter(v => v.card.suit === leadSuit);
    const trumpCards = validCards.filter(v => v.card.suit === trumpSuit);
    const otherCards = validCards.filter(v => v.card.suit !== leadSuit && v.card.suit !== trumpSuit);

    // Hard: Partner coordination - if partner is leading, try to support
    if (difficulty === 'hard' && isPartnerLeading && cardsOfLeadSuit.length > 0) {
      // Partner is leading, try to win if we can, or play high to support
      const winningCards = cardsOfLeadSuit.filter(v => 
        CARD_HIERARCHY[v.card.rank] > leadValue && !isLeadTrump
      );
      
      if (winningCards.length > 0) {
        // We can win - check if it's beneficial
        const bestWinning = winningCards.reduce((best, current) => 
          CARD_HIERARCHY[current.card.rank] < CARD_HIERARCHY[best.card.rank] ? current : best
        );
        
        // If we have multiple winning cards, play the lowest to save higher ones
        // But if partner needs help, play higher
        const partnerSignal = this.getPartnerSignal(playerIndex);
        if (partnerSignal === 'need_help') {
          // Play highest winning card to help partner
          const highestWinning = winningCards.reduce((best, current) => 
            CARD_HIERARCHY[current.card.rank] > CARD_HIERARCHY[best.card.rank] ? current : best
          );
          return highestWinning.index;
        }
        
        return bestWinning.index;
      } else {
        // Can't win, but can support partner by playing high card of lead suit
        const highestSupport = cardsOfLeadSuit.reduce((best, current) => 
          CARD_HIERARCHY[current.card.rank] > CARD_HIERARCHY[best.card.rank] ? current : best
        );
        // Only support if it's not too valuable
        if (CARD_HIERARCHY[highestSupport.card.rank] < CARD_HIERARCHY['7']) {
          return highestSupport.index;
        }
      }
    }

    // Strategy: Try to win if possible, otherwise play lowest
    // If we have cards of lead suit
    if (cardsOfLeadSuit.length > 0) {
      // Check if we can win with lead suit
      const winningLeadCards = cardsOfLeadSuit.filter(v => 
        CARD_HIERARCHY[v.card.rank] > leadValue && !isLeadTrump
      );
      
      if (winningLeadCards.length > 0) {
        // Use card tracking: prefer cards that are likely to win
        const likelyWinners = winningLeadCards.filter(v => 
          isCardLikelyToWin(v.card, leadSuit)
        );
        
        const cardsToChoose = likelyWinners.length > 0 ? likelyWinners : winningLeadCards;
        
        // Play lowest winning card to save higher cards
        let best = cardsToChoose[0];
        for (const card of cardsToChoose) {
          if (CARD_HIERARCHY[card.card.rank] < CARD_HIERARCHY[best.card.rank]) {
            best = card;
          }
        }
        return best.index;
      } else {
        // Can't win with lead suit, play lowest
        let lowest = cardsOfLeadSuit[0];
        for (const card of cardsOfLeadSuit) {
          if (CARD_HIERARCHY[card.card.rank] < CARD_HIERARCHY[lowest.card.rank]) {
            lowest = card;
          }
        }
        return lowest.index;
      }
    }

    // Don't have lead suit - can play trump or other
    // If there are trumps in trick, try to win with higher trump
    if (trumpCards.length > 0 && highestTrumpInTrick > 0) {
      const winningTrumps = trumpCards.filter(v => 
        CARD_HIERARCHY[v.card.rank] > highestTrumpInTrick
      );
      
      if (winningTrumps.length > 0) {
        // Play lowest winning trump
        let best = winningTrumps[0];
        for (const card of winningTrumps) {
          if (CARD_HIERARCHY[card.card.rank] < CARD_HIERARCHY[best.card.rank]) {
            best = card;
          }
        }
        return best.index;
      }
    }

    // If no trumps in trick yet, save high trumps for later
    // Play low trumps or other cards
    if (trumpCards.length > 0 && highestTrumpInTrick === 0) {
      // Separate high trumps (A, 7, K) from low trumps
      const lowTrumps = trumpCards.filter(v => 
        CARD_HIERARCHY[v.card.rank] < CARD_HIERARCHY['K']
      );

      // If we have low trumps, play one of those (save high trumps)
      if (lowTrumps.length > 0) {
        // Play lowest low trump
        let lowest = lowTrumps[0];
        for (const card of lowTrumps) {
          if (CARD_HIERARCHY[card.card.rank] < CARD_HIERARCHY[lowest.card.rank]) {
            lowest = card;
          }
        }
        return lowest.index;
      }

      // Only high trumps left - play lowest if we have many trumps, otherwise save
      if (trumpCards.length > 3) {
        let lowest = trumpCards[0];
        for (const card of trumpCards) {
          if (CARD_HIERARCHY[card.card.rank] < CARD_HIERARCHY[lowest.card.rank]) {
            lowest = card;
          }
        }
        return lowest.index;
      }
    }

    // Play other cards (not lead suit, not trump) - play lowest
    if (otherCards.length > 0) {
      let lowest = otherCards[0];
      for (const card of otherCards) {
        if (CARD_HIERARCHY[card.card.rank] < CARD_HIERARCHY[lowest.card.rank]) {
          lowest = card;
        }
      }
      return lowest.index;
    }

    // Fallback: play first valid card
    return validCards[0].index;
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
      this.state.waitingForRoundEnd = false;
    } else if (this.state.gameScore.team2 >= 4) {
      this.state.isGameOver = true;
      this.state.winner = 2;
      this.state.waitingForGameStart = true; // Pause before allowing new game
      this.state.waitingForRoundEnd = false;
    } else {
      // Show round results before starting new round
      this.state.waitingForRoundEnd = true;
      // Store round value for next round
      (this.state as any).nextRoundValue = roundValue;
    }
  }

  // Called from UI to continue after showing round results
  continueToNextRound(): void {
    if (this.state.waitingForRoundEnd) {
      const roundValue = (this.state as any).nextRoundValue || 1;
      this.state.waitingForRoundEnd = false;
      this.startNewRound(roundValue);
    }
  }

  private startNewRound(roundValue: number): void {
    this.state.round++;
    this.state.scores = { team1: 0, team2: 0 };
    this.state.currentTrick = [];
    this.state.playedCards = []; // Reset played cards for new round
    
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
    this.state.waitingForRoundEnd = false;
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

  /**
   * Get count of cards of a specific suit that have been played
   */
  getPlayedCardsCount(suit: Suit): number {
    return this.state.playedCards.filter(c => c.suit === suit).length;
  }

  /**
   * Get count of trumps that have been played
   */
  getPlayedTrumpsCount(): number {
    if (!this.state.trumpSuit) return 0;
    return this.getPlayedCardsCount(this.state.trumpSuit);
  }

  /**
   * Advanced card counting: Calculate probability that a card will win
   * Returns a value between 0 and 1
   */
  private calculateWinProbability(card: Card, suit: Suit, trumpSuit: Suit): number {
    const cardValue = CARD_HIERARCHY[card.rank];
    const isTrump = card.suit === trumpSuit;
    const totalCards = 40;
    const cardsPlayed = this.state.playedCards.length;
    const cardsRemaining = totalCards - cardsPlayed - this.state.currentTrick.length;
    
    if (cardsRemaining <= 0) return 0.5; // Fallback
    
    if (isTrump) {
      // Count how many higher trumps have been played
      const higherTrumpsPlayed = this.state.playedCards.filter(c => 
        c.suit === trumpSuit && CARD_HIERARCHY[c.rank] > cardValue
      ).length;
      
      // Count how many higher trumps are in current trick
      const higherTrumpsInTrick = this.state.currentTrick.filter(c => 
        c.suit === trumpSuit && CARD_HIERARCHY[c.rank] > cardValue
      ).length;
      
      // Estimate remaining higher trumps (10 total trumps, 4 suits)
      const totalTrumps = 10;
      const trumpsPlayed = this.getPlayedTrumpsCount();
      const trumpsInTrick = this.state.currentTrick.filter(c => c.suit === trumpSuit).length;
      const trumpsRemaining = totalTrumps - trumpsPlayed - trumpsInTrick;
      
      // Probability that remaining trumps are lower
      const higherTrumpsRemaining = Math.max(0, (totalTrumps - cardValue) - higherTrumpsPlayed - higherTrumpsInTrick);
      const probability = 1 - (higherTrumpsRemaining / Math.max(1, trumpsRemaining));
      
      return Math.max(0, Math.min(1, probability));
    } else {
      // For non-trumps, check if trumps are in trick
      const trumpsInTrick = this.state.currentTrick.filter(c => c.suit === trumpSuit).length;
      if (trumpsInTrick > 0) {
        return 0; // Can't win if trumps are in trick
      }
      
      // Count higher cards of same suit
      const higherCardsPlayed = this.state.playedCards.filter(c => 
        c.suit === suit && CARD_HIERARCHY[c.rank] > cardValue
      ).length;
      
      const higherCardsInTrick = this.state.currentTrick.filter(c => 
        c.suit === suit && CARD_HIERARCHY[c.rank] > cardValue
      ).length;
      
      // Estimate remaining higher cards (10 cards per suit)
      const totalSuitCards = 10;
      const suitCardsPlayed = this.getPlayedCardsCount(suit);
      const suitCardsInTrick = this.state.currentTrick.filter(c => c.suit === suit).length;
      const suitCardsRemaining = totalSuitCards - suitCardsPlayed - suitCardsInTrick;
      
      const higherCardsRemaining = Math.max(0, (totalSuitCards - cardValue) - higherCardsPlayed - higherCardsInTrick);
      const probability = 1 - (higherCardsRemaining / Math.max(1, suitCardsRemaining));
      
      return Math.max(0, Math.min(1, probability));
    }
  }

  /**
   * Get partner index for a player
   */
  private getPartnerIndex(playerIndex: number): number | null {
    const player = this.state.players[playerIndex];
    const partner = this.state.players.find(p => p.team === player.team && p.id !== player.id);
    if (!partner) return null;
    return this.state.players.findIndex(p => p.id === partner.id);
  }

  /**
   * Send a signal to partner (for coordination)
   */
  private sendPartnerSignal(playerIndex: number, signal: string): void {
    const partnerIndex = this.getPartnerIndex(playerIndex);
    if (partnerIndex === null) return;
    
    this.state.partnerSignals.push({
      playerIndex: partnerIndex,
      signal,
      trick: this.state.round * 10 - (10 - this.state.players[0].hand.length) // Estimate trick number
    });
    
    // Keep only last 5 signals
    if (this.state.partnerSignals.length > 5) {
      this.state.partnerSignals.shift();
    }
  }

  /**
   * Get latest signal from partner
   */
  private getPartnerSignal(playerIndex: number): string | null {
    const partnerIndex = this.getPartnerIndex(playerIndex);
    if (partnerIndex === null) return null;
    
    const signals = this.state.partnerSignals.filter(s => s.playerIndex === playerIndex);
    return signals.length > 0 ? signals[signals.length - 1].signal : null;
  }
}

