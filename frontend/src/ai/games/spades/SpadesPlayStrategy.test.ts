import { chooseSpadesCard } from './SpadesPlayStrategy';
import { GameAdapter } from '../../../models/games/GameAdapter';
import { Card, GameState } from '../../../types/game';
import { SpadesVariantState } from '../../../models/games/SpadesGame';
import { trickWinnerIndex } from '../../../models/games/trickUtils';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

function makeAdapter(allLegal = true): GameAdapter {
  return {
    canPlayCard: () => allLegal,
  } as unknown as GameAdapter;
}

function makeState(hand: Card[], trick: Card[] = [], team = 1, trickLeader = 0): GameState {
  return {
    players: [
      { hand, name: 'P0', score: 0, team },
      { hand: [], name: 'P1', score: 0, team: 2 },
      { hand: [], name: 'P2', score: 0, team: 1 },
      { hand: [], name: 'P3', score: 0, team: 2 },
    ],
    currentTrick: trick,
    trickLeader,
  } as unknown as GameState;
}

function makeSpades(team1Bid = 3, team1Tricks = 0, team2Bid = 3, team2Tricks = 0): SpadesVariantState {
  return {
    team1Bid,
    team1Tricks,
    team2Bid,
    team2Tricks,
    playerBids: [null, null, null, null],
    playerBidTypes: ['normal', 'normal', 'normal', 'normal'],
    bidLeaderIndex: 0,
    currentBidderIndex: 0,
    playerTricks: [0, 0, 0, 0],
    team1Bags: 0,
    team2Bags: 0,
    waitingForBids: false,
    spadesbroken: false,
    nilEnabled: false,
    blindNilEnabled: false,
  } as unknown as SpadesVariantState;
}

describe('SpadesPlayStrategy', () => {
  describe('T7 — easy returns a valid index', () => {
    it('returns an index present in the hand', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'spades'), makeCard('K', 'hearts')];
      const state = makeState(hand);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, makeSpades(), 'easy');
      expect(hand[idx]).toBeDefined();
    });
  });

  describe('T8 — lead with bid met: lowest non-spade (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s leads lowest non-spade when bid fulfilled', (difficulty) => {
      const hand = [makeCard('A', 'spades'), makeCard('2', 'clubs')];
      const state = makeState(hand, [], 1);
      const spades = makeSpades(2, 2);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, difficulty);
      expect(hand[idx].rank).toBe('2');
      expect(hand[idx].suit).toBe('clubs');
    });
  });

  describe('medium — leading without needing tricks: does not lead ♠ when other suits available', () => {
    it('prefers non-spade when leading and team has enough tricks', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'spades')];
      const state = makeState(hand, [], 1);
      const spades = makeSpades(2, 2);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, 'medium');
      expect(hand[idx].suit).toBe('clubs');
    });
  });

  describe('rank agreement with the Spades motor', () => {
    it('K beats a led 7, and Q beats a led J', () => {
      const kingOverSeven = [makeCard('2', 'hearts'), makeCard('K', 'hearts')];
      const queenOverJack = [makeCard('2', 'clubs'), makeCard('Q', 'clubs')];
      const needTricks = makeSpades(3, 0);
      const kingIdx = chooseSpadesCard(
        makeAdapter(),
        makeState(kingOverSeven, [makeCard('7', 'hearts')], 1, 1),
        0,
        needTricks,
        'hard'
      );
      const queenIdx = chooseSpadesCard(
        makeAdapter(),
        makeState(queenOverJack, [makeCard('J', 'clubs')], 1, 1),
        0,
        needTricks,
        'hard'
      );
      expect(kingOverSeven[kingIdx].rank).toBe('K');
      expect(queenOverJack[queenIdx].rank).toBe('Q');
    });
  });

  describe('T6 — hard following in-suit: minimum winning card', () => {
    it('picks the lowest card that beats current trick', () => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('5', 'spades')];
      const state = makeState(hand, trick, 1);
      const spades = makeSpades(3, 0);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, 'hard');
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('T9 — returns -1 when no legal moves', () => {
    it('returns -1 if adapter allows no cards', () => {
      const hand = [makeCard('2', 'clubs')];
      const state = makeState(hand);
      const idx = chooseSpadesCard(makeAdapter(false), state, 0, makeSpades(), 'medium');
      expect(idx).toBe(-1);
    });
  });

  describe('medium — winning detection: plays lowest when cannot beat trick', () => {
    it('plays lowest in-suit when no card can beat the current trick', () => {
      const hand = [makeCard('5', 'hearts'), makeCard('4', 'hearts')];
      const trick = [makeCard('8', 'hearts')];
      const state = makeState(hand, trick, 1, 1);
      const spades = makeSpades(3, 0);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, 'medium');
      expect(hand[idx].rank).toBe('4');
    });
  });

  describe('T1 — SP06 partner winning: play low (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s plays lowest when partner is winning', (difficulty) => {
      const hand = [makeCard('K', 'hearts'), makeCard('2', 'hearts')];
      const trick = [makeCard('A', 'hearts')];
      const state = makeState(hand, trick, 1, 2);
      const spades = makeSpades(3, 0);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, difficulty);
      expect(hand[idx].rank).toBe('2');
    });
  });

  describe('T2 — SP06 forced min winner when only winning cards remain', () => {
    it.each(['medium', 'hard'] as const)('%s plays lowest winning spade when forced', (difficulty) => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('A', 'hearts')];
      const state = makeState(hand, trick, 1, 2);
      const spades = makeSpades(3, 0);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, difficulty);
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('T3 — SP09 bid met: slough instead of winning (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s avoids winning when bid fulfilled', (difficulty) => {
      const hand = [makeCard('A', 'spades'), makeCard('2', 'clubs')];
      const trick = [makeCard('K', 'hearts')];
      const state = makeState(hand, trick, 1, 1);
      const spades = makeSpades(2, 2);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, difficulty);
      expect(hand[idx].rank).toBe('2');
    });
  });

  describe('T4 — SP09 bid met with trump on trick: slough when possible (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s sloughs off-suit when bid fulfilled', (difficulty) => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades'), makeCard('2', 'clubs')];
      const trick = [makeCard('A', 'hearts'), makeCard('K', 'spades')];
      const state = makeState(hand, trick, 1, 0);
      const spades = makeSpades(2, 2);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, difficulty);
      expect(hand[idx].rank).toBe('2');
    });
  });

  describe('T5 — SP08 void cut with minimum winning spade (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s cuts with lowest winning spade when need tricks', (difficulty) => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('K', 'hearts')];
      const state = makeState(hand, trick, 1, 1);
      const spades = makeSpades(3, 0);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, difficulty);
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('trump already on the trick', () => {
    it.each(['medium', 'hard'] as const)(
      '%s does not spend A♣ after 4♠ has trumped the club lead',
      (difficulty) => {
        const hand = [makeCard('A', 'clubs'), makeCard('2', 'clubs')];
        const trick = [makeCard('5', 'clubs'), makeCard('4', 'spades')];
        const leader = 0;
        const state = makeState(hand, trick, 1, leader);
        const idx = chooseSpadesCard(makeAdapter(), state, 0, makeSpades(3, 0), difficulty);
        expect(hand[idx].rank).toBe('2');
        expect(hand[idx].suit).toBe('clubs');
        expect(trickWinnerIndex([...trick, hand[idx]], leader, 'spades')).toBe(1);
        expect(trickWinnerIndex([...trick, makeCard('A', 'clubs')], leader, 'spades')).toBe(1);
      }
    );

    it.each(['medium', 'hard'] as const)(
      '%s cuts with the lowest spade that beats the spade already played',
      (difficulty) => {
        const hand = [makeCard('K', 'spades'), makeCard('9', 'spades')];
        const trick = [makeCard('A', 'hearts'), makeCard('4', 'spades')];
        const state = makeState(hand, trick, 1, 0);
        const idx = chooseSpadesCard(makeAdapter(), state, 0, makeSpades(3, 0), difficulty);
        expect(hand[idx].rank).toBe('9');
        expect(trickWinnerIndex([...trick, hand[idx]], 0, 'spades')).toBe(2);
      }
    );

    it.each(['medium', 'hard'] as const)(
      '%s does not play a spade that loses to a higher spade',
      (difficulty) => {
        const hand = [makeCard('4', 'spades'), makeCard('2', 'clubs')];
        const trick = [makeCard('A', 'hearts'), makeCard('K', 'spades')];
        const state = makeState(hand, trick, 1, 0);
        const idx = chooseSpadesCard(makeAdapter(), state, 0, makeSpades(3, 0), difficulty);
        expect(hand[idx].rank).toBe('2');
        expect(hand[idx].suit).toBe('clubs');
        expect(trickWinnerIndex([...trick, hand[idx]], 0, 'spades')).toBe(1);
      }
    );
  });

  describe('partner nil — take the trick away when partner is winning', () => {
    const partnerSeat = 2;
    const leader = partnerSeat;

    function bidsWith(seat: number, bidType: 'normal' | 'nil' | 'blindNil'): SpadesVariantState {
      const spades = makeSpades(3, 0);
      const playerBidTypes = [...spades.playerBidTypes];
      playerBidTypes[seat] = bidType;
      return { ...spades, playerBidTypes };
    }

    it.each(['medium', 'hard'] as const)(
      '%s overtakes a nil partner who is winning',
      (difficulty) => {
        const hand = [makeCard('A', 'hearts'), makeCard('2', 'hearts')];
        const trick = [makeCard('K', 'hearts')];
        const state = makeState(hand, trick, 1, leader);
        const idx = chooseSpadesCard(makeAdapter(), state, 0, bidsWith(partnerSeat, 'nil'), difficulty);
        expect(hand[idx].rank).toBe('A');
        expect(trickWinnerIndex([...trick, hand[idx]], leader, 'spades')).toBe((leader + 1) % 4);
      }
    );

    it.each(['medium', 'hard'] as const)(
      '%s still ducks when the winning partner bid is normal',
      (difficulty) => {
        const hand = [makeCard('A', 'hearts'), makeCard('2', 'hearts')];
        const trick = [makeCard('K', 'hearts')];
        const state = makeState(hand, trick, 1, leader);
        const idx = chooseSpadesCard(makeAdapter(), state, 0, bidsWith(partnerSeat, 'normal'), difficulty);
        expect(hand[idx].rank).toBe('2');
        expect(trickWinnerIndex([...trick, hand[idx]], leader, 'spades')).toBe(partnerSeat);
      }
    );

    it.each(['medium', 'hard'] as const)(
      '%s overtakes a blind-nil partner the same way',
      (difficulty) => {
        const hand = [makeCard('A', 'hearts'), makeCard('2', 'hearts')];
        const trick = [makeCard('K', 'hearts')];
        const state = makeState(hand, trick, 1, leader);
        const idx = chooseSpadesCard(
          makeAdapter(),
          state,
          0,
          bidsWith(partnerSeat, 'blindNil'),
          difficulty
        );
        expect(hand[idx].rank).toBe('A');
        expect(trickWinnerIndex([...trick, hand[idx]], leader, 'spades')).toBe((leader + 1) % 4);
      }
    );

    it.each(['medium', 'hard'] as const)(
      '%s plays a legal loser when it cannot take the trick from a nil partner',
      (difficulty) => {
        const hand = [makeCard('K', 'hearts'), makeCard('2', 'hearts')];
        const trick = [makeCard('A', 'hearts')];
        const state = makeState(hand, trick, 1, leader);
        const idx = chooseSpadesCard(makeAdapter(), state, 0, bidsWith(partnerSeat, 'nil'), difficulty);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(hand.length);
        expect(hand[idx].rank).toBe('2');
        expect(trickWinnerIndex([...trick, hand[idx]], leader, 'spades')).toBe(partnerSeat);
      }
    );

    it.each(['medium', 'hard'] as const)(
      '%s does not cover an opponent nil while the partner bid is normal',
      (difficulty) => {
        const hand = [makeCard('A', 'hearts'), makeCard('2', 'hearts')];
        const trick = [makeCard('K', 'hearts')];
        const state = makeState(hand, trick, 1, leader);
        const idx = chooseSpadesCard(makeAdapter(), state, 0, bidsWith(1, 'nil'), difficulty);
        expect(hand[idx].rank).toBe('2');
      }
    );

    it.each(['medium', 'hard'] as const)(
      '%s covers a nil partner with the cheapest card that actually wins',
      (difficulty) => {
        const hand = [makeCard('A', 'hearts'), makeCard('Q', 'hearts'), makeCard('2', 'hearts')];
        const trick = [makeCard('J', 'hearts')];
        const state = makeState(hand, trick, 1, leader);
        const idx = chooseSpadesCard(makeAdapter(), state, 0, bidsWith(partnerSeat, 'nil'), difficulty);
        expect(hand[idx].rank).toBe('Q');
        expect(trickWinnerIndex([...trick, hand[idx]], leader, 'spades')).toBe((leader + 1) % 4);
      }
    );
  });

  describe('T10 — medium/hard always return legal index', () => {
    it.each(['medium', 'hard'] as const)('%s picks from valid indices', (difficulty) => {
      const hand = [
        makeCard('2', 'clubs'),
        makeCard('5', 'hearts'),
        makeCard('9', 'diamonds'),
        makeCard('J', 'spades'),
      ];
      const state = makeState(hand, [makeCard('3', 'clubs')], 1, 0);
      const spades = makeSpades(3, 1);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, difficulty);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(hand.length);
      expect(hand[idx]).toBeDefined();
    });
  });
});