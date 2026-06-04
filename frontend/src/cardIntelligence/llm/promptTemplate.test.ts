import { createTestLogEvent } from '../encoder/encodeDecisionState';
import { buildMiniLLMInput } from './buildMiniLLMInput';
import { buildPromptTemplate, sanitizeEncodedStateForPrompt } from './promptTemplate';
import { encodeDecisionState } from '../encoder/encodeDecisionState';

describe('promptTemplate', () => {
  it('sanitize excludes sensitive field names from JSON', () => {
    const event = createTestLogEvent({ variant: 'sueca' });
    const encoded = encodeDecisionState({ event, encodeMode: 'pre_decision' });
    const sanitized = sanitizeEncodedStateForPrompt(encoded);
    const json = JSON.stringify(sanitized);
    expect(json).not.toContain('opponentHands');
    expect(json).not.toContain('deckRemaining');
    expect(json).not.toContain('confirmedVoids');
  });

  it('prompt does not contain excluded field names', () => {
    const legalMoves = [{ suit: 'clubs', rank: '2', id: '2c' }];
    const event = createTestLogEvent({
      variant: 'hearts',
      handBefore: [...legalMoves],
      legalMoves,
      chosenCard: legalMoves[0],
    });
    const input = buildMiniLLMInput({
      event,
      legalMoves: event.legalMoves,
      fallbackMove: event.legalMoves[0],
    });
    const prompt = buildPromptTemplate(input);
    expect(prompt).not.toContain('"opponentHands"');
    expect(prompt).not.toContain('"deckRemaining"');
    expect(prompt).not.toContain('"confirmedVoids"');
    expect(prompt).toContain('Avoid points');
  });
});
