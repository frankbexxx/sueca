import { GameFactory } from './GameFactory';
import { KingGame } from './KingGame';

describe('GameSession', () => {
  const names = ['P1', 'P2', 'P3', 'P4'];

  it('sueca initialize returns 40-card hands (10 per player) after startRound', () => {
    const adapter = GameFactory.getAdapter('sueca');
    const state = adapter.initialize(names, { dealingMethod: 'A', aiDifficulty: 'medium' });
    expect(state.variant).toBe('sueca');
    adapter.startRound(state);
    const after = adapter.getCurrentState();
    after.players.forEach((p) => expect(p.hand).toHaveLength(10));
  });

  it('spades initialize deals 52 cards (13 per player)', () => {
    const adapter = GameFactory.getAdapter('spades');
    const state = adapter.initialize(names, { aiDifficulty: 'medium' });
    expect(state.variant).toBe('spades');
    const total = state.players.reduce((n, p) => n + p.hand.length, 0);
    expect(total).toBe(52);
    state.players.forEach((p) => expect(p.hand).toHaveLength(13));
  });

  it('hearts initialize deals 13 cards per player after pass', () => {
    const adapter = GameFactory.getAdapter('hearts');
    const state = adapter.initialize(names, { aiDifficulty: 'medium' });
    state.players.forEach((p) => expect(p.hand).toHaveLength(13));
  });

  it('king initialize deals 13 cards per player after KOH reveal', () => {
    const adapter = GameFactory.getAdapter('king') as KingGame;
    adapter.initialize(names, { aiDifficulty: 'medium' });
    adapter.confirmKohReveal();
    const state = adapter.getCurrentState();
    state.players.forEach((p) => expect(p.hand).toHaveLength(13));
  });
});
