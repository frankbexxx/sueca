import {
  kingHudMatchProgress,
  resolveKingMatchDisplay
} from './kingContracts';

describe('resolveKingMatchDisplay', () => {
  it('normal King uses 1/10 … 10/10', () => {
    expect(resolveKingMatchDisplay(0)).toEqual({ current: 1, total: 10 });
    expect(resolveKingMatchDisplay(5)).toEqual({ current: 6, total: 10 });
    expect(resolveKingMatchDisplay(6)).toEqual({ current: 7, total: 10 });
    expect(resolveKingMatchDisplay(9)).toEqual({ current: 10, total: 10 });
    expect(kingHudMatchProgress(0, 'pt')).toBe('Jogo 1/10');
    expect(kingHudMatchProgress(6, 'pt')).toBe('Jogo 7/10');
    expect(kingHudMatchProgress(9, 'en')).toBe('Game 10/10');
  });

  it('synthetic session uses 1/5 … 5/5', () => {
    const syn = { syntheticSession: true };
    expect(resolveKingMatchDisplay(0, syn)).toEqual({ current: 1, total: 5 });
    expect(resolveKingMatchDisplay(5, syn)).toEqual({ current: 1, total: 5 });
    expect(resolveKingMatchDisplay(6, syn)).toEqual({ current: 2, total: 5 });
    expect(resolveKingMatchDisplay(7, syn)).toEqual({ current: 3, total: 5 });
    expect(resolveKingMatchDisplay(8, syn)).toEqual({ current: 4, total: 5 });
    expect(resolveKingMatchDisplay(9, syn)).toEqual({ current: 5, total: 5 });
    expect(kingHudMatchProgress(0, 'pt', syn)).toBe('Jogo 1/5');
    expect(kingHudMatchProgress(6, 'pt', syn)).toBe('Jogo 2/5');
    expect(kingHudMatchProgress(9, 'en', syn)).toBe('Game 5/5');
  });
});
