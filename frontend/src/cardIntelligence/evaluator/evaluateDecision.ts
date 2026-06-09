import { cardsMatch } from '../shared/clone';
import { runMetricEvaluation } from './evaluateHypotheticalMove';
import {
  DecisionEvaluationInput,
  DecisionEvaluationResult,
  EvaluatorContext,
  EVALUATOR_SCHEMA_VERSION,
} from './types';

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
  return runMetricEvaluation({
    ctx,
    chosenCard: input.chosenCard,
    legalMoves: input.legalMoves,
    fixtureId: input.fixtureId,
    viewTypeUsed,
  });
}
