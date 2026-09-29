import {
  isAceSeenInSuit,
  isSevenLeadBlocked,
  suecaTrickWinnerIndex,
  cardWouldWinTrickSueca
} from './suecaTrickHelpers';
import { Card, GameState, Suit } from '../../../types/game';
import { suecaSeatAtTrickOffset } from '../../../models/games/suecaDeal';

function makeCard(rank: Card['rank'], suit: Suit): Card {
  return { rank, suit, id: `${suit}_${rank}` };
}

function makeState(playedCards: Card[] = []): GameState {
  return { playedCards } as GameState;
}

describe('suecaTrickHelpers', () => {
  it('isSevenLeadBlocked is true before ace seen', () => {
    const state = makeState();
    expect(isSevenLeadBlocked(state, makeCard('7', 'diamonds'))).toBe(true);
  });

  it('isSevenLeadBlocked is false after ace seen', () => {
    const state = makeState([makeCard('A', 'diamonds')]);
    expect(isAceSeenInSuit(state, 'diamonds')).toBe(true);
    expect(isSevenLeadBlocked(state, makeCard('7', 'diamonds'))).toBe(false);
  });

  it('suecaTrickWinnerIndex picks partner when they led high card', () => {
    const trick = [makeCard('A', 'hearts')];
    expect(suecaTrickWinnerIndex(trick, 2, 'clubs')).toBe(2);
  });

  describe('REL-SUECA-REG-03 ACW winner seat (trick array index → seat)', () => {
    it('leader 0 order 0→3→2→1: wi=1 → East (3), wi=3 → West (1)', () => {
      const trump: Suit = 'spades';
      // Ace of clubs at offset 1 (East)
      const trickEastWins = [
        makeCard('2', 'clubs'),
        makeCard('A', 'clubs'),
        makeCard('3', 'clubs'),
        makeCard('4', 'clubs')
      ];
      expect(suecaTrickWinnerIndex(trickEastWins, 0, trump)).toBe(3);
      expect(suecaSeatAtTrickOffset(0, 1)).toBe(3);

      // Ace at offset 3 (West)
      const trickWestWins = [
        makeCard('2', 'clubs'),
        makeCard('3', 'clubs'),
        makeCard('4', 'clubs'),
        makeCard('A', 'clubs')
      ];
      expect(suecaTrickWinnerIndex(trickWestWins, 0, trump)).toBe(1);
      expect(suecaSeatAtTrickOffset(0, 3)).toBe(1);
      // Clockwise would wrongly map wi=1→1 and wi=3→3
      expect((0 + 1) % 4).not.toBe(3);
      expect((0 + 3) % 4).not.toBe(1);
    });

    it.each([0, 1, 2, 3] as const)(
      'leader %s: Ace at each offset maps via suecaSeatAtTrickOffset',
      (leader) => {
        const trump: Suit = 'hearts';
        for (const wi of [0, 1, 2, 3] as const) {
          const ranks: Card['rank'][] = ['2', '3', '4', '5'];
          ranks[wi] = 'A';
          const trick = ranks.map((r) => makeCard(r, 'clubs'));
          expect(suecaTrickWinnerIndex(trick, leader, trump)).toBe(
            suecaSeatAtTrickOffset(leader, wi)
          );
        }
      }
    );

    it('cardWouldWinTrickSueca attributes win to ACW seat of the played card', () => {
      // Leader 0; one card played; seat 3 plays next (ACW).
      const before = [makeCard('2', 'clubs')];
      const ace = makeCard('A', 'clubs');
      expect(cardWouldWinTrickSueca(ace, before, 0, 'spades')).toBe(true);
      // Winner seat must be East (3), not West (1)
      expect(suecaTrickWinnerIndex([...before, ace], 0, 'spades')).toBe(3);
    });

    it('partner ownership: East winning is team2, not West', () => {
      const trick = [makeCard('2', 'clubs'), makeCard('A', 'clubs')];
      const winner = suecaTrickWinnerIndex(trick, 0, 'spades');
      expect(winner).toBe(3); // East = team 2 with West
      // Old clockwise wrongly returned 1 (also team2) — still check seats diverge
      expect(winner).not.toBe(1);
    });
  });
});
