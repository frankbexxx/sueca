import { buildPostGameReport } from './postGameReport';
import { EVALUATOR_SCHEMA_VERSION } from '../evaluator/types';

describe('postGameReport', () => {
  it('builds debug report text with metric highlights', () => {
    const text = buildPostGameReport({
      gameId: 'game-1',
      plays: [
        {
          variant: 'spades',
          eventId: 'evt-1',
          gameId: 'game-1',
          legalMoves: [],
          trickIndex: null,
          chosenCard: null,
        } as never,
      ],
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
    expect(text).toContain('Card Intelligence — Debug Report');
    expect(text).toContain('SP09');
    expect(text).toContain('game-1');
  });
});
