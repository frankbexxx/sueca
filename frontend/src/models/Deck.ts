import { Card, Suit, Rank } from '../types/game';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.initializeDeck();
    this.shuffle();
  }

  private initializeDeck(): void {
    const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push({
          suit,
          rank,
          id: `${suit}_${rank}_${Math.random().toString(36).substr(2, 9)}`
        });
      }
    }
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Cut the deck at a random point (or specified point)
   * According to Sueca rules: cut is performed by the partner of the shuffler
   * @param cutPoint Optional cut point (1 to length-1). If not provided, random cut.
   */
  cut(cutPoint?: number): void {
    if (this.cards.length <= 1) {
      return; // Can't cut a deck with 0 or 1 cards
    }
    
    // If no cut point specified, choose random point (between 1 and length-1)
    const point = cutPoint !== undefined 
      ? Math.max(1, Math.min(cutPoint, this.cards.length - 1))
      : Math.floor(Math.random() * (this.cards.length - 1)) + 1;
    
    // Perform the cut: move cards from beginning to end
    const top = this.cards.slice(0, point);
    const bottom = this.cards.slice(point);
    this.cards = [...bottom, ...top];
  }

  deal(numCards: number): Card[] {
    return this.cards.splice(0, numCards);
  }

  getRemaining(): number {
    return this.cards.length;
  }

  peekLast(): Card | null {
    return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
  }
}


