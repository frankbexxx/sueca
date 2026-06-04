import { createTestLogEvent } from './encoder/encodeDecisionState';
import { LOG_SCHEMA_VERSION } from './shared/types/logEvents';
import { TrickEndEvent } from './shared/types/trickEndEvent';
import { findTrickEndForPlay } from './debug/evaluateStoredEvents';
import { ciEncode, splitLogEvents, summarizeLogEvents } from './debugConsole';

describe('debugConsole (H3 compat re-export)', () => {
  it('summarize counts play events', () => {
    const play = createTestLogEvent({ variant: 'sueca' });
    const summary = summarizeLogEvents([play]);
    expect(summary.plays).toBe(1);
    expect(summary.trickEnds).toBe(0);
    expect(summary.maxTrickAfter).toBe(0);
  });

  it('ciEncode returns schema 4.0.0', () => {
    const event = createTestLogEvent({ variant: 'sueca' });
    expect(ciEncode(event).schemaVersion).toBe('4.0.0');
  });

  it('splitLogEvents separates types', () => {
    const play = createTestLogEvent({ variant: 'hearts' });
    const { plays, trickEnds } = splitLogEvents([play]);
    expect(plays).toHaveLength(1);
    expect(trickEnds).toHaveLength(0);
  });
});

describe('findTrickEndForPlay', () => {
  function makeTrickEnd(overrides: Partial<TrickEndEvent>): TrickEndEvent {
    return {
      eventType: 'trick_end',
      eventId: 'te-1',
      gameId: 'game-1',
      sessionId: 'sess-1',
      timestamp: '2026-01-01T00:00:10.000Z',
      schemaVersion: LOG_SCHEMA_VERSION,
      variant: 'sueca',
      roundIndex: 0,
      trickIndex: 1,
      trickLeader: 0,
      trickCards: [],
      plays: [],
      winnerIndex: 0,
      ledSuit: null,
      trumpSuit: null,
      pointsInTrick: 0,
      penaltiesInTrick: null,
      contractId: null,
      contractType: null,
      roundPlayHistory: [],
      variantFields: {},
      source: 'test',
      ...overrides,
    };
  }

  it('returns single candidate', () => {
    const play = createTestLogEvent({
      variant: 'sueca',
      gameId: 'game-1',
      trickIndex: 1,
      timestamp: '2026-01-01T00:00:05.000Z',
    });
    const trickEnd = makeTrickEnd({ trickIndex: 1 });
    expect(findTrickEndForPlay(play, [trickEnd])?.eventId).toBe('te-1');
  });

  it('returns null when no candidate', () => {
    const play = createTestLogEvent({
      variant: 'sueca',
      gameId: 'game-1',
      trickIndex: 2,
    });
    expect(findTrickEndForPlay(play, [])).toBeNull();
  });

  it('picks earliest timestamp >= play when multiple candidates', () => {
    const play = createTestLogEvent({
      variant: 'sueca',
      gameId: 'game-1',
      trickIndex: 1,
      timestamp: '2026-01-01T00:00:05.000Z',
    });
    const late = makeTrickEnd({
      eventId: 'te-late',
      timestamp: '2026-01-01T00:00:12.000Z',
    });
    const early = makeTrickEnd({
      eventId: 'te-early',
      timestamp: '2026-01-01T00:00:08.000Z',
    });
    expect(findTrickEndForPlay(play, [late, early])?.eventId).toBe('te-early');
  });
});
