import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { cardsMatch } from '../shared/clone';

export function validateCardDecisionEvent(event: CardDecisionLogEvent): void {
  if (event.schemaVersion !== '3.0.0') {
    throw new Error(`Invalid schemaVersion: ${event.schemaVersion}`);
  }
  if (event.classification !== 'unknown') {
    throw new Error('Logger v0 must use classification "unknown"');
  }
  if (event.reason !== null) {
    throw new Error('Logger v0 must use reason null');
  }
  if (event.aiSource !== null) {
    throw new Error('Logger v0 must use aiSource null');
  }

  const legal = event.legalMoves.some((move) => cardsMatch(move, event.chosenCard));
  if (!legal) {
    throw new Error('chosenCard must be in legalMoves');
  }
}
