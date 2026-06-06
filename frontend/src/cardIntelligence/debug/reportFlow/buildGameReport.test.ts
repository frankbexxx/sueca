import { createTestLogEvent } from '../../encoder/encodeDecisionState';
import { evaluateStoredPlay } from '../evaluateStoredEvents';
import { EVALUATOR_SCHEMA_VERSION } from '../../evaluator/types';
import { buildGameReportDocumentFromData } from './buildGameReport';
import { DEBUG_REPORT_SCHEMA_VERSION } from './types';

describe('buildGameReport', () => {
  it('T4 aggregates multiple plays with highlights', () => {
    const playGood = createTestLogEvent({
      variant: 'spades',
      eventId: 'evt-good',
      gameId: 'game-multi',
    });
    const playBad = createTestLogEvent({
      variant: 'spades',
      eventId: 'evt-bad',
      gameId: 'game-multi',
    });
    const good = evaluateStoredPlay(playGood, []);
    const bad = evaluateStoredPlay(playBad, []);
    bad.evaluation = {
      schemaVersion: EVALUATOR_SCHEMA_VERSION,
      evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
      classification: 'bad',
      confidence: 'high',
      reasonShort: 'overtrick risk',
      metricResults: [
        {
          metricId: 'SP09',
          classification: 'bad',
          reasonShort: 'overtrick risk',
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
    };

    const doc = buildGameReportDocumentFromData({
      gameId: 'game-multi',
      plays: [playGood, playBad],
      results: [good, bad],
      trickEndCount: 1,
    });

    expect(doc.meta.schemaVersion).toBe(DEBUG_REPORT_SCHEMA_VERSION);
    expect(doc.meta.kind).toBe('game');
    expect(doc.sections.gameStats?.playCount).toBe(2);
    expect(doc.text).toContain('SP09 bad');
    expect(doc.text).toContain('evt-bad');
  });
});
