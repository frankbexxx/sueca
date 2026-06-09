import { Card } from '../../../types/game';
import { EVALUATOR_SCHEMA_VERSION } from '../../evaluator/types';
import { buildDebugReportDocument } from './documentHelpers';
import { formatHumanReport } from './formatHumanReport';
import { DEBUG_REPORT_SCHEMA_VERSION, DebugReportDocument } from './types';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

function minimalDoc(
  evaluation?: DebugReportDocument['sections']['evaluation']
): DebugReportDocument {
  return {
    meta: {
      schemaVersion: DEBUG_REPORT_SCHEMA_VERSION,
      kind: 'event',
      source: 'synthetic_test',
      generatedAt: '2026-06-06T00:00:00.000Z',
      offlineEvaluation: true,
      viewTypeUsed: 'player',
      eventId: 'evt-1',
    },
    summary: {
      classification: 'medium',
      reasonShort: 'test',
      activatedMetricIds: [],
      failedMetricIds: [],
      topIssues: [],
    },
    sections: {
      evaluation,
      metricResultsLine: '(none applicable)',
    },
    warnings: [],
    text: '',
  };
}

describe('formatHumanReport — alternatives', () => {
  it('shows better and equivalent alternatives when present', () => {
    const doc = minimalDoc({
      classification: 'medium',
      reasonShort: 'test',
      betterAlternatives: [makeCard('7', 'spades')],
      equivalentAlternatives: [makeCard('4', 'diamonds'), makeCard('5', 'diamonds')],
    });
    const text = formatHumanReport(doc);
    expect(text).toContain('--- Alternatives ---');
    expect(text).toContain('better: 7s');
    expect(text).toContain('equivalent: 4d, 5d');
  });

  it('shows only better line when no equivalent alternatives', () => {
    const doc = minimalDoc({
      classification: 'bad',
      reasonShort: 'test',
      betterAlternatives: [makeCard('2', 'clubs')],
      equivalentAlternatives: [],
    });
    const text = formatHumanReport(doc);
    expect(text).toContain('--- Alternatives ---');
    expect(text).toContain('better: 2c');
    expect(text).not.toMatch(/^equivalent:/m);
  });

  it('omits alternatives section when arrays are empty', () => {
    const doc = minimalDoc({
      classification: 'good',
      reasonShort: 'test',
      betterAlternatives: [],
      equivalentAlternatives: [],
    });
    const text = formatHumanReport(doc);
    expect(text).not.toContain('--- Alternatives ---');
  });

  it('omits alternatives section when evaluation section is absent', () => {
    const text = formatHumanReport(minimalDoc(undefined));
    expect(text).not.toContain('--- Alternatives ---');
  });
});

describe('buildDebugReportDocument — alternatives transport', () => {
  it('copies betterAlternatives and equivalentAlternatives into sections.evaluation', () => {
    const doc = buildDebugReportDocument({
      kind: 'event',
      source: 'synthetic_test',
      viewTypeUsed: 'player',
      evaluation: {
        schemaVersion: EVALUATOR_SCHEMA_VERSION,
        evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
        classification: 'medium',
        confidence: 'high',
        reasonShort: 'mock',
        metricResults: [],
        activatedMetricIds: [],
        failedMetricIds: [],
        betterAlternatives: [makeCard('A', 'hearts')],
        equivalentAlternatives: [makeCard('3', 'clubs')],
        missingFields: [],
        evaluatorWarnings: [],
        viewTypeUsed: 'player',
        evaluatedAt: '2026-06-06T00:00:00.000Z',
      },
      rawWarnings: [],
    });
    expect(doc.sections.evaluation?.betterAlternatives).toHaveLength(1);
    expect(doc.sections.evaluation?.equivalentAlternatives).toHaveLength(1);
    expect(doc.text).toContain('--- Alternatives ---');
    expect(doc.text).toContain('better: Ah');
    expect(doc.text).toContain('equivalent: 3c');
  });
});
