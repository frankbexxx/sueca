import { createEventId, getOrCreateSessionId, resetSessionIdForTests } from './ids';

describe('cardIntelligence ids', () => {
  afterEach(() => {
    resetSessionIdForTests();
  });

  it('createEventId returns non-empty string', () => {
    expect(createEventId()).toMatch(
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|evt-)/
    );
  });

  it('getOrCreateSessionId is stable within session', () => {
    const a = getOrCreateSessionId();
    const b = getOrCreateSessionId();
    expect(a).toBe(b);
  });
});
