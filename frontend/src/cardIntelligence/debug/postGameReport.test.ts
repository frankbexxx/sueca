import { buildPostGameReport } from './postGameReport';
import { EVALUATOR_SCHEMA_VERSION } from '../evaluator/types';

describe('postGameReport', () => {
  it('builds readable summary with metric counts', () => {
    const text = buildPostGameReport({
      gameId: 'game-1',
      plays: [{ variant: 'spades' } as never],
      evaluations: [
        {
          schemaVersion: EVALUATOR_SCHEMA_VERSION,
          evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
          classification: 'bad',
          confidence: 'high',
          reasonShort: 'test',
          metricResults: [
            {
              metricId: 'SP09',
              classification: 'bad',
              reasonShort: 'bad play',
              betterAlternatives: [],
            },
            {
              metricId: 'SP09',
              classification: 'bad',
              reasonShort: 'bad play 2',
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
          partialEvaluation: false,
          evaluatedAt: new Date().toISOString(),
        },
      ],
    });
    expect(text).toContain('SP09');
    expect(text).toContain('2× SP09 bad');
  });
});
