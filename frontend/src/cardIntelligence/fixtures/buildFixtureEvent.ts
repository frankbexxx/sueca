import { createTestLogEvent } from '../encoder/encodeDecisionState';
import { CardDecisionLogEvent } from '../shared/types/logEvents';

export function buildFixtureEvent(
  overrides: Partial<CardDecisionLogEvent> & Pick<CardDecisionLogEvent, 'variant'>
): CardDecisionLogEvent {
  return createTestLogEvent({
    source: 'fixture',
    schemaVersion: '3.0.0',
    classification: 'unknown',
    reason: null,
    fixtureCandidateIds: [overrides.variant],
    ...overrides,
  });
}
