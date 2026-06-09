import { Card } from '../../types/game';
import { cardsMatch } from '../shared/clone';
import { aggregateMetricResults } from './aggregateResults';
import { detectIncompleteContext } from './evalHelpers';
import {
  evaluateMetric,
  METRIC_EVALUATORS,
  P0_EVALUATION_ORDER,
} from './metricEvaluators';
import {
  DecisionEvaluationResult,
  EvaluatorContext,
  EVALUATOR_SCHEMA_VERSION,
  HypotheticalEvaluationInput,
  MetricEvaluationResult,
} from './types';

const PROXY_WARNING_METRICS: Record<string, string> = {
  SP01: 'Avaliação de bid conservador — proxy play-phase; bid real fora v0.',
  H05: 'Avaliação de pass — proxy play; pass real fora v0.',
};

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
        reasonShort: 'Carta hipotética não está nas jogadas legais.',
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
    reasonShort: 'Dados insuficientes para avaliar hipótese.',
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

function buildContext(
  input: HypotheticalEvaluationInput,
  chosenCard: Card
): EvaluatorContext {
  return {
    state: input.encodedState,
    chosenCard,
    legalMoves: input.legalMoves,
    metricContext:
      input.metricContext ?? input.encodedState.metricContext,
    fixtureId: input.fixtureId,
    evaluatorMode: input.evaluatorMode ?? 'strict',
    rawLogEvent: input.rawLogEvent,
    tierBTestContext: input.tierBTestContext,
  };
}

export function runMetricEvaluation(params: {
  ctx: EvaluatorContext;
  chosenCard: Card;
  legalMoves: Card[];
  fixtureId?: string;
  viewTypeUsed: 'player' | 'engine';
}): DecisionEvaluationResult {
  const { ctx, chosenCard, legalMoves, fixtureId, viewTypeUsed } = params;
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
    fixtureId,
    hasIncompleteContext: incomplete,
  });

  const equivalentAlternatives = legalMoves.filter(
    (m) =>
      !cardsMatch(m, chosenCard) &&
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

/**
 * Evaluates an explicit legal card hypothesis against a pre_decision encoded state.
 * Not a relaxation of evaluateDecision — separate entry point with its own gates.
 */
export function evaluateHypotheticalMove(
  input: HypotheticalEvaluationInput
): DecisionEvaluationResult {
  const viewType = input.viewType ?? 'player';
  const viewTypeUsed =
    input.evaluatorMode === 'debug' && viewType === 'engine'
      ? 'engine'
      : 'player';

  if (input.encodedState.encodeMode !== 'pre_decision') {
    return unknownResult(['encodeMode']);
  }

  const hypotheticalCard = input.hypotheticalCard;
  if (!hypotheticalCard) {
    return unknownResult(['hypotheticalCard']);
  }

  const legal = input.legalMoves.some((m) => cardsMatch(m, hypotheticalCard));
  if (!legal) {
    return illegalResult();
  }

  const ctx = buildContext(input, hypotheticalCard);
  return runMetricEvaluation({
    ctx,
    chosenCard: hypotheticalCard,
    legalMoves: input.legalMoves,
    fixtureId: input.fixtureId,
    viewTypeUsed,
  });
}
