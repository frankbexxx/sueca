import { resolveSuitBrokenVisual } from './suitBrokenStatus';

describe('suitBrokenStatus', () => {
  it('maps false → closed (♥ Fechadas) and true → broken (♥ Quebradas)', () => {
    expect(resolveSuitBrokenVisual(false)).toBe('closed');
    expect(resolveSuitBrokenVisual(true)).toBe('broken');
  });

  it('reflects A11 engine heartsBroken flag without re-deriving rules', () => {
    // Engine marks heartsBroken after legal escape heart / Q♠ (HeartsGame tests).
    // UI mapping must stay a pure reflection of that boolean.
    expect(resolveSuitBrokenVisual(false)).toBe('closed');
    expect(resolveSuitBrokenVisual(true)).toBe('broken');
  });
});
