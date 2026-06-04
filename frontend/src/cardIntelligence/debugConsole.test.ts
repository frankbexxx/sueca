import { ciEncode, splitLogEvents, summarizeLogEvents } from './debugConsole';
import { createTestLogEvent } from './encoder/encodeDecisionState';

describe('debugConsole', () => {
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
