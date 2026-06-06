import { classifyWarnings, formatWarningLine } from './warningTaxonomy';
import { EVALUATOR_SCHEMA_VERSION } from '../../evaluator/types';

describe('warningTaxonomy', () => {
  it('classifies trick_end missing as informational when evaluation ok', () => {
    const warnings = classifyWarnings(
      ['trick_end missing for trickIndex 2 (gameId g1)'],
      {
        schemaVersion: EVALUATOR_SCHEMA_VERSION,
        evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
        classification: 'good',
        confidence: 'high',
        reasonShort: 'ok',
        metricResults: [],
        activatedMetricIds: [],
        failedMetricIds: [],
        betterAlternatives: [],
        equivalentAlternatives: [],
        missingFields: [],
        evaluatorWarnings: [],
        viewTypeUsed: 'player',
        partialEvaluation: false,
        evaluatedAt: new Date().toISOString(),
      }
    );
    expect(warnings[0].code).toBe('trick_end_missing');
    expect(warnings[0].severity).toBe('informational');
    expect(formatWarningLine(warnings[0])).toContain('[info]');
  });

  it('classifies trick_end missing as degraded when partial', () => {
    const warnings = classifyWarnings(
      ['trick_end missing for trickIndex 2 (gameId g1)'],
      {
        schemaVersion: EVALUATOR_SCHEMA_VERSION,
        evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
        classification: 'unknown',
        confidence: 'low',
        reasonShort: 'partial',
        metricResults: [],
        activatedMetricIds: [],
        failedMetricIds: [],
        betterAlternatives: [],
        equivalentAlternatives: [],
        missingFields: [],
        evaluatorWarnings: [],
        viewTypeUsed: 'player',
        partialEvaluation: true,
        evaluatedAt: new Date().toISOString(),
      }
    );
    expect(warnings[0].severity).toBe('degraded');
    expect(formatWarningLine(warnings[0])).toContain('[warn]');
  });
});
