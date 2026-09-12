import { createTestLogEvent } from '../../encoder/encodeDecisionState';
import { evaluateStoredPlay } from '../evaluateStoredEvents';
import { buildEventDebugReport } from './buildEventReport';
import { DEBUG_REPORT_SCHEMA_VERSION } from './types';
import { evaluateStoredPlayByEventId } from '../evaluateStoredEvents';
import { vi } from 'vitest';

vi.mock('../evaluateStoredEvents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../evaluateStoredEvents')>();
  return {
    ...actual,
    evaluateStoredPlayByEventId: vi.fn()
  };
});

describe('buildEventReport', () => {
  it('T3 builds readable event report from synthetic play', async () => {
    const play = createTestLogEvent({
      variant: 'sueca',
      eventId: 'evt-test-1',
      gameId: 'game-test-1'
    });
    const stored = evaluateStoredPlay(play, []);
    vi.mocked(evaluateStoredPlayByEventId).mockResolvedValue(stored);

    const doc = await buildEventDebugReport('evt-test-1');
    expect(doc.meta.schemaVersion).toBe(DEBUG_REPORT_SCHEMA_VERSION);
    expect(doc.meta.kind).toBe('event');
    expect(doc.text).toContain('evt-test-1');
    expect(doc.text).toContain('Card Intelligence — Debug Report');
    expect(doc.text).not.toMatch(/opponentHand|engineOnly/i);
  });

  it('throws when event not found', async () => {
    vi.mocked(evaluateStoredPlayByEventId).mockResolvedValue(null);
    await expect(buildEventDebugReport('missing')).rejects.toThrow(/not found/i);
  });
});