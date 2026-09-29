import { Game } from './Game';
import { CARD_HIERARCHY, CARD_POINTS, Card, GameState, Suit } from '../types/game';
import { suecaSeatAtTrickOffset } from './games/suecaDeal';

/** Canonical seats: 0 South, 1 West, 2 North, 3 East */
const SEAT_NAMES = ['South', 'West', 'North', 'East'] as const;

describe('Game Sueca invariants', () => {
  it('deals 10 cards to each of 4 players after startRound', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const state = game.getState();
    state.players.forEach((player) => {
      expect(player.hand).toHaveLength(10);
    });
  });

  it('distributes exactly 120 card points across all hands', () => {
    const game = new Game();
    game.startRound();
    const state = game.getState();
    const totalPoints = state.players
      .flatMap((p) => p.hand)
      .reduce((sum, card) => sum + CARD_POINTS[card.rank], 0);
    expect(totalPoints).toBe(120);
  });

  it('requires following suit when the player has the lead suit', () => {
    let tested = false;
    for (let attempt = 0; attempt < 40 && !tested; attempt++) {
      const game = new Game();
      game.startRound();
      const leader = game.getState().currentPlayerIndex;
      const leaderHand = game.getState().players[leader].hand;
      if (leaderHand.length === 0) continue;

      game.playCard(leader, 0);
      const trick = game.getState().currentTrick;
      if (trick.length !== 1) continue;

      const leadSuit = trick[0].suit;
      const nextPlayer = game.getState().currentPlayerIndex;
      const hand = game.getState().players[nextPlayer].hand;
      const onSuitIdx = hand.findIndex((c) => c.suit === leadSuit);
      const offSuitIdx = hand.findIndex((c) => c.suit !== leadSuit);

      if (onSuitIdx >= 0 && offSuitIdx >= 0) {
        expect(game.canPlayCard(nextPlayer, offSuitIdx)).toBe(false);
        expect(game.canPlayCard(nextPlayer, onSuitIdx)).toBe(true);
        tested = true;
      }
    }
    expect(tested).toBe(true);
  });

  it('awards trick points to the winning team after finishTrick', () => {
    const game = new Game();
    game.startRound();

    for (let step = 0; step < 4; step++) {
      const state = game.getState();
      const playerIndex = state.currentPlayerIndex;
      let played = false;
      for (let i = 0; i < state.players[playerIndex].hand.length; i++) {
        if (game.playCard(playerIndex, i)) {
          played = true;
          break;
        }
      }
      expect(played).toBe(true);
    }

    expect(game.getState().waitingForTrickEnd).toBe(true);
    game.finishTrick();
    const after = game.getState();
    expect(after.waitingForTrickEnd).toBe(false);
    expect(after.currentTrick).toHaveLength(0);
    expect(after.lastTrickWinner).not.toBeNull();
  });

  it('awards 2 games after 60-60 carry on next round win', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as {
      state: GameState;
      endRound: () => void;
      startNewRound: () => void;
    };
    internal.state.scores = { team1: 60, team2: 60 };
    internal.endRound();
    expect(internal.state.pendingRoundMultiplier).toBe(2);
    internal.state.waitingForRoundEnd = false;
    internal.startNewRound();
    game.startRound();
    internal.state.scores = { team1: 65, team2: 55 };
    internal.endRound();
    expect(internal.state.gameScore.team1).toBe(2);
  });

  it('ends game when a team reaches 4 games', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.gameScore = { team1: 3, team2: 0 };
    internal.state.scores = { team1: 65, team2: 55 };
    internal.endRound();
    expect(internal.state.isGameOver).toBe(true);
    expect(internal.state.winner).toBe(1);
  });

  it('awards 4 game wins on capote (120) and ends the match', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.gameScore = { team1: 0, team2: 0 };
    internal.state.scores = { team1: 120, team2: 0 };
    internal.endRound();
    expect(internal.state.gameScore.team1).toBe(4);
    expect(internal.state.gameScore.team2).toBe(0);
    expect(internal.state.isGameOver).toBe(true);
    expect(internal.state.winner).toBe(1);
    expect(internal.state.completedPentes).toContainEqual({ team1: 4, team2: 0 });
  });

  it('awards 4 game wins on capote for team2', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.scores = { team1: 0, team2: 120 };
    internal.endRound();
    expect(internal.state.gameScore.team2).toBe(4);
    expect(internal.state.isGameOver).toBe(true);
    expect(internal.state.winner).toBe(2);
  });

  it('awards 2 game wins for 91–119 points', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.scores = { team1: 91, team2: 29 };
    internal.endRound();
    expect(internal.state.gameScore.team1).toBe(2);
    expect(internal.state.isGameOver).toBe(false);
    expect(internal.state.waitingForRoundEnd).toBe(true);
  });

  it('awards 1 game win for 61–90 points', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.scores = { team1: 61, team2: 59 };
    internal.endRound();
    expect(internal.state.gameScore.team1).toBe(1);
    expect(internal.state.isGameOver).toBe(false);
    expect(internal.state.waitingForRoundEnd).toBe(true);
  });

  it('60-60 does not award games and sets pending multiplier', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.scores = { team1: 60, team2: 60 };
    internal.endRound();
    expect(internal.state.gameScore).toEqual({ team1: 0, team2: 0 });
    expect(internal.state.pendingRoundMultiplier).toBe(2);
    expect(internal.state.isGameOver).toBe(false);
  });

  it('Sueca hierarchy: A > 7 > K > J > Q > 6 > 2', () => {
    expect(CARD_HIERARCHY['A']).toBeGreaterThan(CARD_HIERARCHY['7']);
    expect(CARD_HIERARCHY['7']).toBeGreaterThan(CARD_HIERARCHY['K']);
    expect(CARD_HIERARCHY['K']).toBeGreaterThan(CARD_HIERARCHY['J']);
    expect(CARD_HIERARCHY['J']).toBeGreaterThan(CARD_HIERARCHY['Q']);
    expect(CARD_HIERARCHY['Q']).toBeGreaterThan(CARD_HIERARCHY['6']);
    expect(CARD_HIERARCHY['6']).toBeGreaterThan(CARD_HIERARCHY['2']);
  });
});

describe('REL-SUECA-REG-02 anti-clockwise winner → seat mapping', () => {
  const makeCard = (suit: Suit, rank: Card['rank']): Card => ({
    suit,
    rank,
    id: `${rank}-${suit}`
  });

  it.each(
    [0, 1, 2, 3].flatMap((leader) =>
      [0, 1, 2, 3].map((winningIndex) => ({
        leader,
        winningIndex,
        expected: (leader + 3 * winningIndex) % 4
      }))
    )
  )(
    'leader=$leader winningIndex=$winningIndex → seat $expected (ACW, not clockwise)',
    ({ leader, winningIndex, expected }) => {
      expect(suecaSeatAtTrickOffset(leader, winningIndex)).toBe(expected);
      // Clockwise formula must diverge for wi 1 and 3
      if (winningIndex === 1 || winningIndex === 3) {
        expect((leader + winningIndex) % 4).not.toBe(expected);
      }

      const game = new Game([...SEAT_NAMES]);
      game.startRound();
      const internal = game as unknown as {
        state: GameState;
        evaluateTrick: () => void;
      };

      // Non-trump lead suit; Ace at winningIndex wins among clubs.
      const clubs: Card['rank'][] = ['2', '3', '4', '5'];
      clubs[winningIndex] = 'A';
      internal.state.currentTrick = clubs.map((r) => makeCard('clubs', r));
      internal.state.trickLeader = leader;
      internal.state.trumpSuit = 'spades';
      internal.state.scores = { team1: 0, team2: 0 };
      internal.evaluateTrick();

      expect(internal.state.lastTrickWinner).toBe(expected);
      expect(internal.state.nextTrickLeader).toBe(expected);

      const winnerTeam = internal.state.players[expected].team;
      if (winnerTeam === 1) {
        expect(internal.state.scores.team1).toBeGreaterThan(0);
        expect(internal.state.scores.team2).toBe(0);
      } else {
        expect(internal.state.scores.team2).toBeGreaterThan(0);
        expect(internal.state.scores.team1).toBe(0);
      }

      game.finishTrick();
      const after = game.getState();
      expect(after.trickLeader).toBe(expected);
      expect(after.currentPlayerIndex).toBe(expected);
      expect(after.waitingForTrickEnd).toBe(false);
    }
  );

  it('7 beats K and J — third card (wi=2) maps to opposite seat under ACW', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as {
      state: GameState;
      evaluateTrick: () => void;
    };

    const suit: Suit = 'clubs';
    const trumpSuit: Suit = 'spades';
    // Leader 0 → seats 0,3,2,1; wi=2 → seat 2 (North / team 1)
    internal.state.currentTrick = [
      makeCard(suit, 'K'),
      makeCard(suit, 'J'),
      makeCard(suit, '7'),
      makeCard(suit, '2')
    ];
    internal.state.trickLeader = 0;
    internal.state.trumpSuit = trumpSuit;
    internal.evaluateTrick();

    expect(internal.state.lastTrickWinner).toBe(2);
    expect(suecaSeatAtTrickOffset(0, 2)).toBe(2);
  });

  it('full trick play: leader 0, East (3) wins trump → next leader 3', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as { state: GameState };

    // Force hands so play order 0→3→2→1 and seat 3 wins with trump Ace.
    // Lead suit clubs; trump hearts.
    internal.state.trumpSuit = 'hearts';
    internal.state.trumpCard = makeCard('hearts', 'A');
    internal.state.trickLeader = 0;
    internal.state.currentPlayerIndex = 0;
    internal.state.currentTrick = [];
    internal.state.waitingForTrickEnd = false;
    internal.state.waitingForRoundStart = false;
    internal.state.isPaused = false;
    internal.state.scores = { team1: 0, team2: 0 };

    internal.state.players[0].hand = [makeCard('clubs', '2'), makeCard('diamonds', '3')];
    internal.state.players[3].hand = [makeCard('hearts', 'A'), makeCard('diamonds', '4')];
    internal.state.players[2].hand = [makeCard('clubs', '3'), makeCard('diamonds', '5')];
    internal.state.players[1].hand = [makeCard('clubs', '4'), makeCard('diamonds', '6')];

    expect(game.playCard(0, 0)).toBe(true); // clubs 2
    expect(game.getState().currentPlayerIndex).toBe(3);
    expect(game.playCard(3, 0)).toBe(true); // hearts A (trump)
    expect(game.getState().currentPlayerIndex).toBe(2);
    expect(game.playCard(2, 0)).toBe(true); // clubs 3
    expect(game.getState().currentPlayerIndex).toBe(1);
    expect(game.playCard(1, 0)).toBe(true); // clubs 4

    const mid = game.getState();
    expect(mid.waitingForTrickEnd).toBe(true);
    expect(mid.lastTrickWinner).toBe(3);
    expect(mid.nextTrickLeader).toBe(3);
    // Ace of hearts = 11 points in Sueca
    expect(mid.scores.team2).toBe(CARD_POINTS['A']); // seats 1+3 = team 2
    expect(mid.scores.team1).toBe(0);

    game.finishTrick();
    const after = game.getState();
    expect(after.trickLeader).toBe(3);
    expect(after.currentPlayerIndex).toBe(3);
    expect(after.currentTrick).toHaveLength(0);
  });

  it('full trick play: leader 0, West (1) wins 4th card → next leader 1', () => {
    const game = new Game([...SEAT_NAMES]);
    game.startRound();
    const internal = game as unknown as { state: GameState };

    internal.state.trumpSuit = 'spades';
    internal.state.trickLeader = 0;
    internal.state.currentPlayerIndex = 0;
    internal.state.currentTrick = [];
    internal.state.waitingForTrickEnd = false;
    internal.state.waitingForRoundStart = false;
    internal.state.isPaused = false;
    internal.state.scores = { team1: 0, team2: 0 };

    // Extra cards so finishTrick advances to next trick (not endRound).
    internal.state.players[0].hand = [makeCard('clubs', '2'), makeCard('diamonds', '3')];
    internal.state.players[3].hand = [makeCard('clubs', '3'), makeCard('diamonds', '4')];
    internal.state.players[2].hand = [makeCard('clubs', '4'), makeCard('diamonds', '5')];
    internal.state.players[1].hand = [makeCard('clubs', 'A'), makeCard('diamonds', '6')];

    expect(game.playCard(0, 0)).toBe(true);
    expect(game.playCard(3, 0)).toBe(true);
    expect(game.playCard(2, 0)).toBe(true);
    expect(game.playCard(1, 0)).toBe(true);

    const mid = game.getState();
    expect(mid.lastTrickWinner).toBe(1);
    expect(mid.nextTrickLeader).toBe(1);
    // Clockwise formula would wrongly give seat 3
    expect((0 + 3) % 4).toBe(3);
    expect(mid.lastTrickWinner).not.toBe(3);

    game.finishTrick();
    expect(game.getState().currentPlayerIndex).toBe(1);
    expect(game.getState().trickLeader).toBe(1);
  });
});
