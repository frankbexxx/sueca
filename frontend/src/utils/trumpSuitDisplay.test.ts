import { resolveTrumpSuitBadge, getSuitSymbol, isRedSuit } from './trumpSuitDisplay';

describe('trumpSuitDisplay', () => {
  it('maps all four suits to symbols', () => {
    expect(getSuitSymbol('clubs')).toBe('♣');
    expect(getSuitSymbol('diamonds')).toBe('♦');
    expect(getSuitSymbol('hearts')).toBe('♥');
    expect(getSuitSymbol('spades')).toBe('♠');
  });

  it('returns null for missing trump', () => {
    expect(getSuitSymbol(null)).toBeNull();
    expect(getSuitSymbol(undefined)).toBeNull();
    expect(resolveTrumpSuitBadge(null)).toBeNull();
    expect(resolveTrumpSuitBadge(undefined)).toBeNull();
  });

  it('builds badge models with red/black tone (not colour-only meaning)', () => {
    expect(resolveTrumpSuitBadge('hearts')).toEqual({
      suit: 'hearts',
      symbol: '♥',
      tone: 'red'
    });
    expect(resolveTrumpSuitBadge('diamonds')).toEqual({
      suit: 'diamonds',
      symbol: '♦',
      tone: 'red'
    });
    expect(resolveTrumpSuitBadge('clubs')).toEqual({
      suit: 'clubs',
      symbol: '♣',
      tone: 'black'
    });
    expect(resolveTrumpSuitBadge('spades')).toEqual({
      suit: 'spades',
      symbol: '♠',
      tone: 'black'
    });
    expect(isRedSuit('hearts')).toBe(true);
    expect(isRedSuit('clubs')).toBe(false);
  });
});
