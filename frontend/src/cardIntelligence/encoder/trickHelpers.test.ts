import { describe, expect, it } from 'vitest';
import { Card, Suit } from '../../types/game';
import {
  cardWouldWinTrickSueca,
  cardWouldWinTrickStandard,
  inferSuecaTrickLeader,
  inferTrickLeader,
  suecaTrickWinnerIndex,
  standardTrickWinnerIndex
} from './trickHelpers';
import { seatAtOffset } from '../../models/games/suecaRules';

function makeCard(rank: Card['rank'], suit: Suit): Card {
  return { rank, suit, id: `${rank}-${suit}` };
}

describe('cardIntelligence trickHelpers — REL-SUECA-REG-03', () => {
  describe('inferSuecaTrickLeader (ACW)', () => {
    it('leader 0 play order 0→3→2→1', () => {
      expect(inferSuecaTrickLeader(0, 0)).toBe(0);
      expect(inferSuecaTrickLeader(3, 1)).toBe(0);
      expect(inferSuecaTrickLeader(2, 2)).toBe(0);
      expect(inferSuecaTrickLeader(1, 3)).toBe(0);
    });

    it('leader 1 play order 1→0→3→2', () => {
      expect(inferSuecaTrickLeader(1, 0)).toBe(1);
      expect(inferSuecaTrickLeader(0, 1)).toBe(1);
      expect(inferSuecaTrickLeader(3, 2)).toBe(1);
      expect(inferSuecaTrickLeader(2, 3)).toBe(1);
    });

    it('diverges from clockwise inferTrickLeader for turnIndex 1 and 3', () => {
      expect(inferSuecaTrickLeader(3, 1)).toBe(0);
      expect(inferTrickLeader(3, 1)).toBe(2); // clockwise: wrong for Sueca
      expect(inferSuecaTrickLeader(1, 3)).toBe(0);
      expect(inferTrickLeader(1, 3)).toBe(2);
    });
  });

  describe('suecaTrickWinnerIndex ACW', () => {
    it('leader 0: Ace at offset 1 → seat 3; offset 3 → seat 1', () => {
      const trump: Suit = 'spades';
      expect(
        suecaTrickWinnerIndex(
          [
            makeCard('2', 'clubs'),
            makeCard('A', 'clubs'),
            makeCard('3', 'clubs'),
            makeCard('4', 'clubs')
          ],
          0,
          trump
        )
      ).toBe(3);
      expect(
        suecaTrickWinnerIndex(
          [
            makeCard('2', 'clubs'),
            makeCard('3', 'clubs'),
            makeCard('4', 'clubs'),
            makeCard('A', 'clubs')
          ],
          0,
          trump
        )
      ).toBe(1);
    });

    it.each([0, 1, 2, 3] as const)('leader %s full offset table', (leader) => {
      const trump: Suit = 'hearts';
      for (const wi of [0, 1, 2, 3]) {
        const ranks: Card['rank'][] = ['2', '3', '4', '5'];
        ranks[wi] = 'A';
        const trick = ranks.map((r) => makeCard(r, 'clubs'));
        expect(suecaTrickWinnerIndex(trick, leader, trump)).toBe(
          seatAtOffset(leader as 0 | 1 | 2 | 3, wi, 'right')
        );
      }
    });

    it('cardWouldWinTrickSueca uses ACW seat of the played card', () => {
      expect(
        cardWouldWinTrickSueca(makeCard('A', 'clubs'), [makeCard('2', 'clubs')], 0, 'spades')
      ).toBe(true);
      expect(suecaTrickWinnerIndex([makeCard('2', 'clubs'), makeCard('A', 'clubs')], 0, 'spades')).toBe(
        3
      );
    });
  });

  describe('standard / clockwise helpers unchanged', () => {
    it('inferTrickLeader stays clockwise', () => {
      expect(inferTrickLeader(1, 1)).toBe(0);
      expect(inferTrickLeader(2, 2)).toBe(0);
      expect(inferTrickLeader(3, 3)).toBe(0);
    });

    it('standardTrickWinnerIndex maps wi=1 to leader+1', () => {
      const trick = [
        makeCard('2', 'clubs'),
        makeCard('A', 'clubs'),
        makeCard('3', 'clubs'),
        makeCard('4', 'clubs')
      ];
      expect(standardTrickWinnerIndex(trick, 0, null)).toBe(1);
      expect(
        cardWouldWinTrickStandard(makeCard('A', 'clubs'), [makeCard('2', 'clubs')], 0, null)
      ).toBe(true);
    });
  });
});
