import { acesSeenFromPlays, heartsTrickPoints, suecaTrickPoints } from './historySelectors';
import { TrickPlayRecord } from './types';

describe('historySelectors', () => {
  it('acesSeenFromPlays tracks aces by suit', () => {
    const plays: TrickPlayRecord[] = [
      {
        roundIndex: 0,
        trickIndex: 0,
        turnIndex: 0,
        playerIndex: 0,
        card: { suit: 'clubs', rank: 'A', id: 'A-c' },
      },
      {
        roundIndex: 0,
        trickIndex: 0,
        turnIndex: 1,
        playerIndex: 1,
        card: { suit: 'hearts', rank: '2', id: '2-h' },
      },
    ];
    expect(acesSeenFromPlays(plays)).toEqual({
      clubs: true,
      diamonds: false,
      hearts: false,
      spades: false,
    });
  });

  it('heartsTrickPoints counts hearts and Q spades', () => {
    const trick = [
      { suit: 'hearts' as const, rank: '2' as const, id: '1' },
      { suit: 'hearts' as const, rank: '3' as const, id: '2' },
      { suit: 'spades' as const, rank: 'Q' as const, id: '3' },
      { suit: 'clubs' as const, rank: '2' as const, id: '4' },
    ];
    expect(heartsTrickPoints(trick)).toBe(15);
  });

  it('suecaTrickPoints sums CARD_POINTS', () => {
    const trick = [
      { suit: 'clubs' as const, rank: 'A' as const, id: '1' },
      { suit: 'clubs' as const, rank: '7' as const, id: '2' },
    ];
    expect(suecaTrickPoints(trick)).toBe(21);
  });
});
