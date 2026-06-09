import {
  EvaluationClassification,
  MetricClassification,
  MetricEvaluationResult,
} from './types';

const PRIORITY: Record<EvaluationClassification, number> = {
  bad: 5,
  partial: 4,
  medium: 3,
  good: 2,
  unknown: 1,
};

export function getClassificationRiskRank(
  classification: EvaluationClassification
): number {
  return PRIORITY[classification];
}

const ACTIONABLE: MetricClassification[] = ['good', 'medium', 'bad', 'partial'];

export const TIER_B_FIXTURE_IDS = ['S25', 'H10', 'SP14', 'K10'] as const;

export const CRITICAL_METRIC_IDS = new Set([
  'T01',
  'K02',
  'K03',
  'K00',
  'K01',
  'K08',
  'SP09',
]);

function worstClassification(
  classes: EvaluationClassification[]
): EvaluationClassification {
  if (classes.length === 0) return 'unknown';
  return classes.reduce((worst, cur) =>
    PRIORITY[cur] > PRIORITY[worst] ? cur : worst
  );
}

function pickReason(
  metricResults: MetricEvaluationResult[],
  classification: EvaluationClassification
): string {
  const priority = ['bad', 'partial', 'medium', 'good'] as const;
  for (const tier of priority) {
    if (tier === classification || PRIORITY[tier] >= PRIORITY[classification]) {
      const match = metricResults.find(
        (r) => r.classification === tier && ACTIONABLE.includes(r.classification)
      );
      if (match) return match.reasonShort;
    }
  }
  const any = metricResults.find((r) => ACTIONABLE.includes(r.classification));
  return any?.reasonShort ?? 'Jogada legal.';
}

export interface AggregateInput {
  metricResults: MetricEvaluationResult[];
  fixtureId?: string;
  hasIncompleteContext: boolean;
}

export interface AggregateOutput {
  classification: EvaluationClassification;
  confidence: 'high' | 'medium' | 'low';
  reasonShort: string;
  activatedMetricIds: string[];
  failedMetricIds: string[];
  betterAlternatives: import('../../types/game').Card[];
  partialEvaluation: boolean;
}

export function aggregateMetricResults(input: AggregateInput): AggregateOutput {
  const { metricResults, hasIncompleteContext } = input;

  const actionable = metricResults.filter((r) =>
    ACTIONABLE.includes(r.classification)
  );

  if (actionable.length === 0) {
    return {
      classification: 'unknown',
      confidence: 'low',
      reasonShort: 'Dados insuficientes para avaliar.',
      activatedMetricIds: [],
      failedMetricIds: [],
      betterAlternatives: [],
      partialEvaluation: false,
    };
  }

  const classes = actionable.map(
    (r) => r.classification as EvaluationClassification
  );
  let classification = worstClassification(classes);

  const failedMetricIds = actionable
    .filter((r) => r.classification === 'bad')
    .map((r) => r.metricId);

  const activatedMetricIds = actionable
    .filter((r) => r.classification !== 'not_applicable')
    .map((r) => r.metricId);

  const betterAlternatives = actionable.flatMap((r) => r.betterAlternatives);

  if (
    hasIncompleteContext &&
    classification !== 'bad' &&
    classification !== 'partial'
  ) {
    classification = 'partial';
  }

  const confidence: 'high' | 'medium' | 'low' =
    classification === 'bad' && failedMetricIds.some((id) => CRITICAL_METRIC_IDS.has(id))
      ? 'high'
      : classification === 'unknown'
        ? 'low'
        : classification === 'partial'
          ? 'medium'
          : 'high';

  return {
    classification,
    confidence,
    reasonShort: pickReason(metricResults, classification),
    activatedMetricIds,
    failedMetricIds,
    betterAlternatives,
    partialEvaluation: classification === 'partial',
  };
}
