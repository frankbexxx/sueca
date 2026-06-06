import { aggregateMetricResults } from './aggregateResults';
import { MetricEvaluationResult } from './types';

function mr(
  metricId: string,
  classification: MetricEvaluationResult['classification']
): MetricEvaluationResult {
  return {
    metricId,
    classification,
    reasonShort: `${metricId}-${classification}`,
    betterAlternatives: [],
  };
}

describe('aggregateResults', () => {
  it('L2: K02 bad + S19 good → bad', () => {
    const out = aggregateMetricResults({
      metricResults: [mr('K02', 'bad'), mr('S19', 'good')],
      hasIncompleteContext: false,
    });
    expect(out.classification).toBe('bad');
  });

  it('L3: K02 good + incomplete → partial', () => {
    const out = aggregateMetricResults({
      metricResults: [mr('K02', 'good'), mr('S08', 'partial')],
      hasIncompleteContext: true,
    });
    expect(out.classification).toBe('partial');
  });

  it('L4: no actionable → unknown', () => {
    const out = aggregateMetricResults({
      metricResults: [mr('S08', 'not_applicable')],
      hasIncompleteContext: false,
    });
    expect(out.classification).toBe('unknown');
  });

  it('L5: Tier B metric partial without force-partial hack', () => {
    const out = aggregateMetricResults({
      metricResults: [mr('K10', 'good'), mr('S25', 'partial')],
      hasIncompleteContext: false,
    });
    expect(out.classification).toBe('partial');
  });

  it('T13: Tier B bad propagates — not forced partial', () => {
    const out = aggregateMetricResults({
      metricResults: [mr('SP14', 'bad'), mr('T01', 'good')],
      hasIncompleteContext: false,
    });
    expect(out.classification).toBe('bad');
  });

  it('medium beats good', () => {
    const out = aggregateMetricResults({
      metricResults: [mr('S08', 'medium'), mr('S19', 'good')],
      hasIncompleteContext: false,
    });
    expect(out.classification).toBe('medium');
  });
});
