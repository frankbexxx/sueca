import { cardsMatch } from '../shared/clone';
import { aggregateMetricResults } from './aggregateResults';
import { detectIncompleteContext } from './evalHelpers';
import {
  evaluateMetric,
  METRIC_EVALUATORS,
  P0_EVALUATION_ORDER,
} from './metricEvaluators';
import {
  DecisionEvaluationInput,
  DecisionEvaluationResult,
  EvaluatorContext,
  EVALUATOR_SCHEMA_VERSION,
  MetricEvaluationResult,
} from './types';

const PROXY_WARNING_METRICS: Record<string, string> = {
  SP01: 'Avaliação de bid conservador — proxy play-phase; bid real fora v0.',
  H05: 'Avaliação de pass — proxy play; pass real fora v0.',
};

function buildContext(input: DecisionEvaluationInput): EvaluatorContext {
  return {
    state: input.encodedState,
    chosenCard: input.chosenCard!,
    legalMoves: input.legalMoves,
    metricContext:
      input.metricContext ?? input.encodedState.metricContext,
    fixtureId: input.fixtureId,
    evaluatorMode: input.evaluatorMode ?? 'strict',
    rawLogEvent: input.rawLogEvent,
    tierBTestContext: input.tierBTestContext,
  };
}

function illegalResult(): DecisionEvaluationResult {
  return {
    schemaVersion: EVALUATOR_SCHEMA_VERSION,
    evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
    classification: 'bad',
    confidence: 'high',
    reasonShort: 'Jogada ilegal — carta fora das jogadas permitidas.',
    metricResults: [
      {
        metricId: 'T01',
        classification: 'bad',
        reasonShort: 'Carta escolhida não está nas jogadas legais.',
        betterAlternatives: [],
      },
    ],
    activatedMetricIds: ['T01'],
    failedMetricIds: ['T01'],
    betterAlternatives: [],
    equivalentAlternatives: [],
    missingFields: [],
    evaluatorWarnings: [],
    viewTypeUsed: 'player',
    partialEvaluation: false,
    evaluatedAt: new Date().toISOString(),
  };
}

function unknownResult(missingFields: string[]): DecisionEvaluationResult {
  return {
    schemaVersion: EVALUATOR_SCHEMA_VERSION,
    evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
    classification: 'unknown',
    confidence: 'low',
    reasonShort: 'Dados insuficientes para avaliar.',
    metricResults: [],
    activatedMetricIds: [],
    failedMetricIds: [],
    betterAlternatives: [],
    equivalentAlternatives: [],
    missingFields,
    evaluatorWarnings: [],
    viewTypeUsed: 'player',
    partialEvaluation: false,
    evaluatedAt: new Date().toISOString(),
  };
}

export function evaluateDecision(
  input: DecisionEvaluationInput
): DecisionEvaluationResult {
  const viewType = input.viewType ?? 'player';
  const viewTypeUsed =
    input.evaluatorMode === 'debug' && viewType === 'engine'
      ? 'engine'
      : 'player';

  if (input.encodedState.encodeMode !== 'post_decision') {
    return unknownResult(['encodeMode']);
  }

  if (input.chosenCard === null) {
    return unknownResult(['chosenCard']);
  }

  const legal = input.legalMoves.some((m) =>
    cardsMatch(m, input.chosenCard!)
  );
  if (!legal) {
    return illegalResult();
  }

  const ctx = buildContext(input);
  const metricResults: MetricEvaluationResult[] = [];
  const warnings: string[] = [];

  for (const metricId of P0_EVALUATION_ORDER) {
    if (!METRIC_EVALUATORS[metricId]) continue;
    const entry = ctx.metricContext.find((m) => m.metricId === metricId);
    if (!entry) continue;

    const evaluated = evaluateMetric(ctx, metricId);
    if (evaluated) {
      metricResults.push(evaluated);
    }

    if (PROXY_WARNING_METRICS[metricId] && entry.applicable) {
      warnings.push(PROXY_WARNING_METRICS[metricId]);
    }
  }

  const incomplete = detectIncompleteContext(ctx, metricResults);
  const aggregated = aggregateMetricResults({
    metricResults,
    fixtureId: input.fixtureId,
    hasIncompleteContext: incomplete,
  });

  const equivalentAlternatives = input.legalMoves.filter(
    (m) =>
      !cardsMatch(m, input.chosenCard!) &&
      !aggregated.betterAlternatives.some((b) => cardsMatch(b, m))
  );

  const allMissing = ctx.metricContext.flatMap((m) => m.missingFields);

  return {
    schemaVersion: EVALUATOR_SCHEMA_VERSION,
    evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
    classification: aggregated.classification,
    confidence: aggregated.confidence,
    reasonShort: aggregated.reasonShort,
    metricResults,
    activatedMetricIds: aggregated.activatedMetricIds,
    failedMetricIds: aggregated.failedMetricIds,
    betterAlternatives: aggregated.betterAlternatives,
    equivalentAlternatives,
    missingFields: Array.from(new Set(allMissing)),
    evaluatorWarnings: warnings,
    viewTypeUsed,
    partialEvaluation: aggregated.partialEvaluation,
    evaluatedAt: new Date().toISOString(),
  };
}
