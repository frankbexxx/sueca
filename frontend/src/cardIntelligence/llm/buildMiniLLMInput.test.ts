import { createTestLogEvent } from '../encoder/encodeDecisionState';
import { EVALUATOR_SCHEMA_VERSION } from '../evaluator/types';
import {
  buildMiniLLMInput,
  mapMetricResultsToEvaluatorHints,
} from './buildMiniLLMInput';
import { buildRulesContext } from './buildRulesContext';
import { encodeDecisionState } from '../encoder/encodeDecisionState';

describe('buildMiniLLMInput', () => {
  it('uses pre_decision encode with null chosenCard', () => {
    const event = createTestLogEvent({
      variant: 'sueca',
      legalMoves: [{ suit: 'clubs', rank: '2', id: '2c' }],
      chosenCard: { suit: 'clubs', rank: '2', id: '2c' },
    });
    const input = buildMiniLLMInput({
      event,
      legalMoves: event.legalMoves,
      fallbackMove: event.legalMoves[0],
    });
    expect(input.encodedState.encodeMode).toBe('pre_decision');
    expect(input.encodedState.chosenCard).toBeNull();
    expect(input.viewType).toBe('player');
  });
});

describe('mapMetricResultsToEvaluatorHints', () => {
  it('maps bad to high risk', () => {
    const hints = mapMetricResultsToEvaluatorHints({
      schemaVersion: EVALUATOR_SCHEMA_VERSION,
      evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
      classification: 'bad',
      confidence: 'high',
      reasonShort: 'test',
      metricResults: [
        {
          metricId: 'SP09',
          classification: 'bad',
          reasonShort: 'Bags risk',
          betterAlternatives: [],
        },
      ],
      activatedMetricIds: ['SP09'],
      failedMetricIds: ['SP09'],
      betterAlternatives: [],
      equivalentAlternatives: [],
      missingFields: [],
      evaluatorWarnings: [],
      viewTypeUsed: 'player',
      evaluatedAt: new Date().toISOString(),
    });
    expect(hints).toHaveLength(1);
    expect(hints[0].riskLevel).toBe('high');
    expect(hints[0].source).toBe('prior_evaluation');
  });
});

describe('buildRulesContext', () => {
  it('hearts avoids sueca win-cheap objective', () => {
    const event = createTestLogEvent({ variant: 'hearts' });
    const encoded = encodeDecisionState({ event, encodeMode: 'pre_decision' });
    const rules = buildRulesContext('hearts', encoded);
    expect(rules.objectiveShort.toLowerCase()).toContain('avoid points');
    expect(rules.objectiveShort.toLowerCase()).not.toContain('win tricks cheap');
  });

  it('king is contract-first', () => {
    const event = createTestLogEvent({ variant: 'king' });
    const encoded = encodeDecisionState({ event, encodeMode: 'pre_decision' });
    const rules = buildRulesContext('king', encoded);
    expect(rules.objectiveShort.toLowerCase()).toContain('contract');
  });
});
