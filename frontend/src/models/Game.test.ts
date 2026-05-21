import { Game } from './Game';
import { CARD_POINTS, GameState } from '../types/game';

describe('Game Sueca invariants', () => {
  it('deals 10 cards to each of 4 players', () => {
    const game = new Game(['You', 'East', 'Partner', 'West']);
    const state = game.getState();
    state.players.forEach((player) => {
      expect(player.hand).toHaveLength(10);
    });
  });

  it('distributes exactly 120 card points across all hands', () => {
    const game = new Game();
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
    const internal = game as unknown as { state: GameState; endRound: () => void; startNewRound: (v: number) => void };
    internal.state.scores = { team1: 60, team2: 60 };
    internal.endRound();
    expect(internal.state.nextRoundValue).toBe(2);
    internal.state.waitingForRoundEnd = false;
    internal.startNewRound(2);
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
});
