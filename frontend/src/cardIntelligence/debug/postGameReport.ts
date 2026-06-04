import { DecisionEvaluationResult } from '../evaluator/types';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { MetricMemoryAggregate } from '../memory/types';

function countMetricClassifications(
  evaluations: DecisionEvaluationResult[]
): Map<string, Map<string, number>> {
  const counts = new Map<string, Map<string, number>>();

  for (const evaluation of evaluations) {
    for (const metric of evaluation.metricResults) {
      if (metric.classification === 'not_applicable') continue;
      const bucket = counts.get(metric.metricId) ?? new Map<string, number>();
      const key = metric.classification;
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
      counts.set(metric.metricId, bucket);
    }
    if (evaluation.partialEvaluation) {
      const bucket = counts.get('_global') ?? new Map<string, number>();
      bucket.set('partial', (bucket.get('partial') ?? 0) + 1);
      counts.set('_global', bucket);
    }
  }

  return counts;
}

export function buildPostGameReport(input: {
  evaluations?: DecisionEvaluationResult[];
  plays?: CardDecisionLogEvent[];
  aggregates?: MetricMemoryAggregate[];
  gameId?: string;
}): string {
  const lines: string[] = ['Card Intelligence — resumo offline'];

  const gameId = input.gameId ?? input.plays?.[0]?.gameId;
  const variant = input.plays?.[0]?.variant;
  const decisionCount = input.plays?.length ?? input.evaluations?.length ?? 0;

  if (gameId) lines.push(`Game: ${gameId}`);
  if (variant) lines.push(`Variant: ${variant}`);
  lines.push(`Decisões: ${decisionCount}`);

  if (input.evaluations && input.evaluations.length > 0) {
    const counts = countMetricClassifications(input.evaluations);
    for (const [metricId, bucket] of Array.from(counts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      if (metricId === '_global') continue;
      for (const [classification, n] of Array.from(bucket.entries())) {
        lines.push(`  ${n}× ${metricId} ${classification}`);
      }
    }
    const global = counts.get('_global');
    if (global?.get('partial')) {
      lines.push(`  ${global.get('partial')}× partial (global)`);
    }
  }

  if (input.aggregates && input.aggregates.length > 0) {
    lines.push(`Memory aggregates: ${input.aggregates.length} entradas`);
    for (const agg of input.aggregates.slice(0, 5)) {
      lines.push(
        `  ${agg.metricId}: good=${agg.goodCount} bad=${agg.badCount} evaluated=${agg.evaluatedCount}`
      );
    }
    if (input.aggregates.length > 5) {
      lines.push(`  … +${input.aggregates.length - 5} mais`);
    }
  }

  return lines.join('\n');
}
