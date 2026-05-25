import { Card } from '../types/game';
import { DEFAULT_SUIT_ORDER } from '../constants/handPreferences';
import { sortHand } from './handSort';

const c = (rank: Card['rank'], suit: Card['suit'], id: string): Card => ({
  rank,
  suit,
  id
});

describe('handSort', () => {
  it('returns original order when disabled', () => {
    const hand = [c('K', 'hearts', '1'), c('2', 'clubs', '2')];
    expect(sortHand(hand, {
      enabled: false,
      suitOrder: DEFAULT_SUIT_ORDER,
      trumpPosition: 'left',
      variant: 'sueca',
      trumpSuit: 'clubs'
    })).toEqual(hand);
  });

  it('places trump suit first for Sueca when configured left', () => {
    const hand = [
      c('7', 'hearts', 'h7'),
      c('A', 'clubs', 'ca'),
      c('K', 'diamonds', 'dk')
    ];
    const sorted = sortHand(hand, {
      enabled: true,
      suitOrder: DEFAULT_SUIT_ORDER,
      trumpPosition: 'left',
      variant: 'sueca',
      trumpSuit: 'clubs'
    });
    expect(sorted.map((card) => card.id)).toEqual(['ca', 'h7', 'dk']);
  });

  it('sorts Sueca hand with J before Q within suit', () => {
    const hand = [c('Q', 'clubs', 'cq'), c('J', 'clubs', 'cj'), c('K', 'clubs', 'ck')];
    const sorted = sortHand(hand, {
      enabled: true,
      suitOrder: DEFAULT_SUIT_ORDER,
      trumpPosition: 'natural',
      variant: 'sueca',
      trumpSuit: null
    });
    expect(sorted.map((card) => card.rank)).toEqual(['K', 'J', 'Q']);
  });

  it('sorts 52-card hands by preset suit order', () => {
    const hand = [
      c('A', 'spades', '1'),
      c('K', 'hearts', '2'),
      c('Q', 'clubs', '3')
    ];
    const sorted = sortHand(hand, {
      enabled: true,
      suitOrder: DEFAULT_SUIT_ORDER,
      trumpPosition: 'natural',
      variant: 'hearts',
      trumpSuit: null
    });
    expect(sorted.map((card) => card.suit)).toEqual(['hearts', 'clubs', 'spades']);
  });
});
