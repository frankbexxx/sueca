import { TrickIndexTracker } from './resolveTrickIndex';

describe('TrickIndexTracker', () => {
  it('starts tricks at 0 and increments on turnIndex 0', () => {
    const tracker = new TrickIndexTracker();
    expect(tracker.resolve(0, 0)).toBe(0);
    expect(tracker.resolve(0, 1)).toBe(0);
    expect(tracker.resolve(0, 2)).toBe(0);
    expect(tracker.resolve(0, 0)).toBe(1);
  });

  it('resets when round changes', () => {
    const tracker = new TrickIndexTracker();
    tracker.resolve(0, 0);
    tracker.resolve(0, 1);
    expect(tracker.resolve(1, 0)).toBe(0);
  });
});
