import { Game } from './Game';
import { CARD_HIERARCHY, CARD_POINTS, Card, GameState, Suit } from '../types/game';

describe('Game Sueca invariants', () => {
  it('deals 10 cards to each of 4 players after startRound', () => {
    const game = new Game(['You', 'East', 'Partner', 'West']);
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
    const game = new Game(['You', 'East', 'Partner', 'West']);
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
    const game = new Game(['You', 'East', 'Partner', 'West']);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.gameScore = { team1: 3, team2: 0 };
    internal.state.scores = { team1: 65, team2: 55 };
    internal.endRound();
    expect(internal.state.isGameOver).toBe(true);
    expect(internal.state.winner).toBe(1);
  });

  it('awards 4 game wins on capote (120) and ends the match', () => {
    const game = new Game(['You', 'East', 'Partner', 'West']);
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
    const game = new Game(['You', 'East', 'Partner', 'West']);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.scores = { team1: 0, team2: 120 };
    internal.endRound();
    expect(internal.state.gameScore.team2).toBe(4);
    expect(internal.state.isGameOver).toBe(true);
    expect(internal.state.winner).toBe(2);
  });

  it('awards 2 game wins for 91–119 points', () => {
    const game = new Game(['You', 'East', 'Partner', 'West']);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.scores = { team1: 91, team2: 29 };
    internal.endRound();
    expect(internal.state.gameScore.team1).toBe(2);
    expect(internal.state.isGameOver).toBe(false);
    expect(internal.state.waitingForRoundEnd).toBe(true);
  });

  it('awards 1 game win for 61–90 points', () => {
    const game = new Game(['You', 'East', 'Partner', 'West']);
    game.startRound();
    const internal = game as unknown as { state: GameState; endRound: () => void };
    internal.state.scores = { team1: 61, team2: 59 };
    internal.endRound();
    expect(internal.state.gameScore.team1).toBe(1);
    expect(internal.state.isGameOver).toBe(false);
    expect(internal.state.waitingForRoundEnd).toBe(true);
  });

  it('60-60 does not award games and sets pending multiplier', () => {
    const game = new Game(['You', 'East', 'Partner', 'West']);
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

  it('7 beats K and J in a trick via evaluateTrick', () => {
    const game = new Game(['You', 'East', 'Partner', 'West']);
    game.startRound();
    const internal = game as unknown as {
      state: GameState;
      evaluateTrick: () => void;
    };

    const suit: Suit = 'clubs';
    const trumpSuit: Suit = 'spades'; // non-clubs trump so suit comparisons apply
    const makeCard = (rank: Card['rank']): Card => ({ suit, rank, id: `${rank}-${suit}` });

    // Trick: leader plays K, player 1 plays J, player 2 plays 7 — 7 must win
    internal.state.currentTrick = [makeCard('K'), makeCard('J'), makeCard('7'), makeCard('2')];
    internal.state.trickLeader = 0;
    internal.state.trumpSuit = trumpSuit;
    internal.evaluateTrick();

    // Winner is player at (trickLeader + winningIndex) % 4 = (0 + 2) % 4 = 2
    expect(internal.state.lastTrickWinner).toBe(2);
  });
});
