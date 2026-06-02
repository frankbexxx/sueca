import { GameFactory } from '../models/games/GameFactory';
import { applyHostAction, canJoinerSubmitAction } from './applyHostAction';
import { GameActionInput } from '../types/multiplayerActions';

describe('applyHostAction', () => {
  it('rejects illegal playCard', () => {
    const adapter = GameFactory.getAdapter('sueca');
    adapter.initialize(['P1', 'P2', 'P3', 'P4'], { dealingMethod: 'A', aiDifficulty: 'medium' });
    const action: GameActionInput = { type: 'playCard', playerIndex: 99, cardIndex: 0 };
    expect(applyHostAction(adapter, { ...action, clientId: 'c1', at: 1 })).toBe(false);
  });

  it('applies legal playCard', () => {
    const adapter = GameFactory.getAdapter('sueca');
    adapter.initialize(['P1', 'P2', 'P3', 'P4'], { dealingMethod: 'A', aiDifficulty: 'medium' });
    adapter.startRound(adapter.getCurrentState());
    const state = adapter.getCurrentState();
    const playerIndex = state.currentPlayerIndex;
    const cardIndex = 0;
    const action = {
      type: 'playCard' as const,
      playerIndex,
      cardIndex,
      clientId: 'c1',
      at: Date.now(),
    };
    expect(adapter.canPlayCard(state, playerIndex, cardIndex)).toBe(true);
    expect(applyHostAction(adapter, action)).toBe(true);
  });

  it('applies finishTrick', () => {
    const adapter = GameFactory.getAdapter('sueca');
    adapter.initialize(['P1', 'P2', 'P3', 'P4'], { dealingMethod: 'A', aiDifficulty: 'medium' });
    adapter.startRound(adapter.getCurrentState());
    expect(
      applyHostAction(adapter, {
        type: 'finishTrick',
        playerIndex: 0,
        clientId: 'c1',
        at: 1,
      })
    ).toBe(true);
  });

  it('blocks king startRound for PT preset joiners', () => {
    const adapter = GameFactory.getAdapter('king');
    expect(
      canJoinerSubmitAction(
        adapter,
        { type: 'startRound', dealingMethod: 'A' },
        'king-pt-normal'
      )
    ).toBe(false);
  });
});
