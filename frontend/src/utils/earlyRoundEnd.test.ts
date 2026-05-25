import { emptyBreakdown } from '../models/games/king/kingBreakdown';
import {
  canHeartsEndRoundEarly,
  canKingEndRoundEarly,
  countHeartsInTrick,
  trickHasQueenSpades
} from './earlyRoundEnd';

describe('earlyRoundEnd', () => {
  it('detects King no_king_hearts trigger', () => {
    const breakdown = emptyBreakdown();
    breakdown.kingTakenBy = 2;
    expect(canKingEndRoundEarly(0, 'no_king_hearts', breakdown)).toBe(true);
  });

  it('detects King no_hearts trigger at 13 hearts', () => {
    const breakdown = emptyBreakdown();
    breakdown.heartsTaken = [5, 4, 4, 0];
    expect(canKingEndRoundEarly(1, 'no_hearts', breakdown)).toBe(true);
  });

  it('detects Hearts trigger when Q spades and 13 hearts taken', () => {
    expect(canHeartsEndRoundEarly(13, true)).toBe(true);
    expect(canHeartsEndRoundEarly(12, true)).toBe(false);
  });

  it('counts hearts and queen of spades in trick', () => {
    expect(countHeartsInTrick([{ suit: 'hearts' }, { suit: 'clubs' }])).toBe(1);
    expect(trickHasQueenSpades([{ rank: 'Q', suit: 'spades' }])).toBe(true);
  });
});
