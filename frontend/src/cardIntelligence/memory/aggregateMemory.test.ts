import {
  applyClassificationIncrement,
  computeTrend,
  createEmptyAggregate,
} from './aggregateMemory';

const BASE = {
  memoryId: 'test',
  subjectType: 'bot' as const,
  subjectId: 'bot:medium:seat-0',
  variant: 'spades' as const,
  metricId: 'SP09',
  difficulty: 'medium' as const,
  timestamp: '2026-01-01T00:00:00.000Z',
  loggerVersion: '3.0.0',
  encoderVersion: '4.0.0',
  evaluatorVersion: '5.0.0',
  viewTypeUsed: 'player' as const,
};

function emptyAgg() {
  return createEmptyAggregate(BASE);
}

describe('aggregateMemory counting §4.3', () => {
  it('A — good', () => {
    const agg = emptyAgg();
    applyClassificationIncrement(agg, 'good', false);
    expect(agg).toMatchObject({
      goodCount: 1,
      mediumCount: 0,
      badCount: 0,
      partialCount: 0,
      unknownCount: 0,
      evaluatedCount: 1,
      badRate: 0,
    });
  });

  it('B — partial Tier B', () => {
    const agg = emptyAgg();
    applyClassificationIncrement(agg, 'partial', true);
    expect(agg).toMatchObject({
      goodCount: 0,
      badCount: 0,
      partialCount: 1,
      evaluatedCount: 1,
      badRate: 0,
    });
  });

  it('C — bad + partialEvaluation', () => {
    const agg = emptyAgg();
    applyClassificationIncrement(agg, 'bad', true);
    expect(agg).toMatchObject({
      badCount: 1,
      partialCount: 1,
      evaluatedCount: 1,
      badRate: 1,
    });
  });

  it('D — unknown', () => {
    const agg = emptyAgg();
    applyClassificationIncrement(agg, 'unknown', false);
    expect(agg).toMatchObject({
      unknownCount: 1,
      evaluatedCount: 0,
      badRate: 0,
    });
  });

  it('E — medium', () => {
    const agg = emptyAgg();
    applyClassificationIncrement(agg, 'medium', false);
    expect(agg).toMatchObject({
      mediumCount: 1,
      evaluatedCount: 1,
      badRate: 0,
    });
  });
});

describe('aggregateMemory trend §5.2', () => {
  it('20 good + 20 bad → worsening', () => {
    const agg = emptyAgg();
    for (let i = 0; i < 20; i++) {
      applyClassificationIncrement(agg, 'good', false);
    }
    for (let i = 0; i < 20; i++) {
      applyClassificationIncrement(agg, 'bad', false);
    }
    expect(agg.trend).toBe('worsening');
  });

  it('fewer than 40 → unknown trend', () => {
    const outcomes = Array(20).fill(false);
    expect(computeTrend(outcomes)).toBe('unknown');
  });
});
