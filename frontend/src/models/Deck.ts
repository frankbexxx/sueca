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


