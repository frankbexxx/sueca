import { Deck } from './Deck';
import { CARD_POINTS } from '../types/game';

describe('Deck', () => {
  it('creates a 40-card Sueca deck by default', () => {
    const deck = new Deck('sueca40');
    expect(deck.getRemaining()).toBe(40);
  });

  it('creates a 52-card standard deck when requested', () => {
    const deck = new Deck('standard52');
    expect(deck.getRemaining()).toBe(52);
  });

  it('deals all 40 Sueca cards with 120 total points', () => {
    const deck = new Deck('sueca40');
    const cards = deck.deal(40);
    expect(cards).toHaveLength(40);
    expect(deck.getRemaining()).toBe(0);
    const totalPoints = cards.reduce((sum, card) => sum + CARD_POINTS[card.rank], 0);
    expect(totalPoints).toBe(120);
  });
});
