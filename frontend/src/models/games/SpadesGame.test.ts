import { SpadesGame } from './SpadesGame';
import { trickWinnerIndex } from './trickUtils';
import { Card } from '../../types/game';

const names = ['A', 'B', 'C', 'D'];

describe('SpadesGame', () => {
  it('follows suit when possible', () => {
    const game = new SpadesGame();
    const state = game.initialize(names, {});
    const player = state.players[0];
    player.hand = [
      { id: '1', rank: '2', suit: 'hearts' },
      { id: '2', rank: '5', suit: 'clubs' }
    ];
    state.currentTrick = [{ id: '3', rank: 'A', suit: 'clubs' }];
    state.currentPlayerIndex = 0;
    (game as unknown as { state: typeof state }).state = state;

    expect(game.canPlayCard(state, 0, 0)).toBe(false);
    expect(game.canPlayCard(state, 0, 1)).toBe(true);
  });

  it('trick winner uses spades as trump', () => {
    const trick: Card[] = [
      { id: '1', rank: 'A', suit: 'clubs' },
      { id: '2', rank: 'K', suit: 'clubs' },
      { id: '3', rank: '2', suit: 'spades' },
      { id: '4', rank: 'A', suit: 'hearts' }
    ];
    expect(trickWinnerIndex(trick, 0, 'spades')).toBe(2);
  });

  it('records team trick on finishTrick', () => {
    const game = new SpadesGame();
    game.initialize(names, {});
    const internal = game as unknown as {
      state: ReturnType<SpadesGame['getCurrentState']>;
    };
    const s = internal.state;
    s.waitingForTrickEnd = true;
    s.nextTrickLeader = 0;
    s.currentTrick = [
      { id: '1', rank: '2', suit: 'clubs' },
      { id: '2', rank: '3', suit: 'clubs' },
      { id: '3', rank: '4', suit: 'clubs' },
      { id: '4', rank: '5', suit: 'clubs' }
    ];
    game.finishTrick(s);
    const spades = s.variantState?.spades as { team1Tricks: number };
    expect(spades.team1Tricks).toBe(1);
  });
});
