import { DecisionEvaluationResult } from '../evaluator/types';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { MetricMemoryAggregate } from '../memory/types';
import { createTestLogEvent } from '../encoder/encodeDecisionState';
import { EvaluateStoredResult } from './types';
import { buildGameReportDocumentFromData } from './reportFlow/buildGameReport';
function zipPlaysWithEvaluations(
  plays: CardDecisionLogEvent[],
  evaluations: DecisionEvaluationResult[]
): EvaluateStoredResult[] {
  if (plays.length > 0) {
    return plays.map((play, index) => ({
      play,
      trickEnd: null,
      evaluation: evaluations[index] ?? evaluations[0],
      warnings: [],
    }));
  }

  return evaluations.map((evaluation, index) => ({
    play: createTestLogEvent({
      eventId: `synthetic-${index}`,
      gameId: 'unknown',
      variant: 'sueca',
    }),
    trickEnd: null,
    evaluation,
    warnings: [],
  }));
}
export function buildPostGameReport(input: {
  evaluations?: DecisionEvaluationResult[];
  plays?: CardDecisionLogEvent[];
  aggregates?: MetricMemoryAggregate[];
  gameId?: string;
}): string {
  const plays = input.plays ?? [];
  const evaluations = input.evaluations ?? [];
  const gameId = input.gameId ?? plays[0]?.gameId ?? 'unknown';
  const results = zipPlaysWithEvaluations(plays, evaluations);
  const effectivePlays = plays.length > 0 ? plays : results.map((r) => r.play);

  const memory =
    input.aggregates && input.aggregates.length > 0
      ? {
          aggregateCount: input.aggregates.length,
          highlights: input.aggregates.slice(0, 5).map(
            (agg) =>
              `${agg.metricId}: good=${agg.goodCount} bad=${agg.badCount} evaluated=${agg.evaluatedCount}`
          ),
        }
      : undefined;

  const doc = buildGameReportDocumentFromData({
    gameId,
    plays: effectivePlays,
    results,
    trickEndCount: 0,
    memory,
  });

  return doc.text;
}
