import { Card } from '../../types/game';
import { encodeDecisionState } from '../encoder/encodeDecisionState';
import { ENCODED_SCHEMA_VERSION } from '../encoder/types';
import {
  evaluateStoredPlay,
  findTrickEndForPlay,
} from '../debug/evaluateStoredEvents';
import { findPlayByEventId, loadAllLogEvents, splitLogEvents } from '../debug/readLogs';
import { listMemoryAggregates } from '../debug/readMemory';
import {
  DecisionEvaluationResult,
  MetricEvaluationResult,
} from '../evaluator/types';
import { cardsMatch } from '../shared/clone';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import { MemoryQuery } from '../memory/types';
import { buildRulesContext } from './buildRulesContext';
import {
  DEFAULT_MAX_REASON_LENGTH,
  DEFAULT_MINI_LLM_TIMEOUT_MS,
  EvaluatorHint,
  MemoryHint,
  METRIC_CATALOG_VERSION,
  MINI_LLM_SCHEMA_VERSION,
  MiniLLMDecisionInput,
} from './types';

function truncateReason(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function mapClassificationToRisk(
  classification: MetricEvaluationResult['classification']
): EvaluatorHint['riskLevel'] | null {
  switch (classification) {
    case 'bad':
      return 'high';
    case 'medium':
    case 'partial':
      return 'medium';
    case 'good':
      return 'low';
    default:
      return null;
  }
}

export function mapMetricResultsToEvaluatorHints(
  evaluation: DecisionEvaluationResult,
  maxReasonLength = DEFAULT_MAX_REASON_LENGTH
): EvaluatorHint[] {
  const hints: EvaluatorHint[] = [];

  for (const metric of evaluation.metricResults) {
    const riskLevel = mapClassificationToRisk(metric.classification);
    if (!riskLevel) continue;
    hints.push({
      metricId: metric.metricId,
      riskLevel,
      reasonShort: truncateReason(metric.reasonShort, maxReasonLength),
      source: 'prior_evaluation',
    });
  }

  return hints
    .sort((a, b) => {
      const score = (r: EvaluatorHint['riskLevel']) =>
        r === 'high' ? 0 : r === 'medium' ? 1 : 2;
      return score(a.riskLevel) - score(b.riskLevel);
    })
    .slice(0, 5);
}

function mapAggregatesToMemoryHints(
  aggregates: Awaited<ReturnType<typeof listMemoryAggregates>>
): MemoryHint[] {
  return aggregates.slice(0, 3).map((agg) => ({
    metricId: agg.metricId,
    badRate: agg.badRate,
    trend: agg.trend,
    reasonShort: `${agg.metricId}: badRate=${agg.badRate ?? 0}`,
    confidence: agg.evaluatedCount >= 10 ? 'high' : agg.evaluatedCount >= 3 ? 'medium' : 'low',
    subjectType: agg.subjectType === 'human' ? 'human' : agg.subjectType === 'global' ? 'global' : 'bot',
  }));
}

function createRequestId(): string {
  return `llm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildMiniLLMInput(params: {
  event: CardDecisionLogEvent;
  trickEndEvent?: TrickEndEvent;
  legalMoves: Card[];
  fallbackMove: Card;
  evaluatorHints?: EvaluatorHint[];
  memoryContext?: MemoryHint[];
  requestId?: string;
  timeoutMs?: number;
}): MiniLLMDecisionInput {
  const encodedState = encodeDecisionState({
    event: params.event,
    trickEndEvent: params.trickEndEvent,
    encodeMode: 'pre_decision',
    viewType: 'player',
  });

  let fallbackMove = params.fallbackMove;
  let fallbackMoveIndex = params.legalMoves.findIndex((c) =>
    cardsMatch(c, fallbackMove)
  );
  if (fallbackMoveIndex < 0 && params.legalMoves.length > 0) {
    fallbackMove = params.legalMoves[0];
    fallbackMoveIndex = 0;
  }

  return {
    schemaVersion: MINI_LLM_SCHEMA_VERSION,
    requestId: params.requestId ?? createRequestId(),
    variant: params.event.variant,
    playerIndex: params.event.playerIndex,
    difficulty: params.event.difficulty,
    playerType: params.event.playerType,
    encodedState,
    legalMoves: params.legalMoves,
    metricContext: encodedState.metricContext,
    evaluatorHints: params.evaluatorHints,
    memoryContext: params.memoryContext,
    rulesContext: buildRulesContext(params.event.variant, encodedState),
    fallbackMove,
    fallbackMoveIndex: fallbackMoveIndex >= 0 ? fallbackMoveIndex : 0,
    timeoutMs: params.timeoutMs ?? DEFAULT_MINI_LLM_TIMEOUT_MS,
    maxReasonLength: DEFAULT_MAX_REASON_LENGTH,
    viewType: 'player',
    hiddenInformationPolicy: encodedState.hiddenInformationPolicy,
    encoderVersion: ENCODED_SCHEMA_VERSION,
    metricCatalogVersion: METRIC_CATALOG_VERSION,
    memorySchemaVersion: '6.0.0',
  };
}

export async function buildMiniLLMInputFromStoredEvent(
  eventId: string,
  opts?: {
    fallbackMoveIndex?: number;
    memoryQuery?: MemoryQuery;
    includeEvaluatorHints?: boolean;
    includeMemoryHints?: boolean;
  }
): Promise<MiniLLMDecisionInput | null> {
  const play = await findPlayByEventId(eventId);
  if (!play) return null;

  const events = await loadAllLogEvents();
  const { trickEnds } = splitLogEvents(events);
  const trickEnd = findTrickEndForPlay(play, trickEnds);

  const legalMoves = play.legalMoves;
  if (legalMoves.length === 0) {
    return buildMiniLLMInput({
      event: play,
      trickEndEvent: trickEnd ?? undefined,
      legalMoves: play.chosenCard ? [play.chosenCard] : [],
      fallbackMove: play.chosenCard,
    });
  }

  const idx = opts?.fallbackMoveIndex ?? 0;
  const fallbackMove = legalMoves[idx] ?? legalMoves[0];

  let evaluatorHints: EvaluatorHint[] | undefined;
  if (opts?.includeEvaluatorHints !== false) {
    const evalResult = evaluateStoredPlay(play, trickEnds);
    if (evalResult.evaluation) {
      evaluatorHints = mapMetricResultsToEvaluatorHints(evalResult.evaluation);
    }
  }

  let memoryContext: MemoryHint[] | undefined;
  if (opts?.includeMemoryHints) {
    const aggregates = await listMemoryAggregates(
      opts.memoryQuery ?? { variant: play.variant }
    );
    memoryContext = mapAggregatesToMemoryHints(aggregates);
  }

  return buildMiniLLMInput({
    event: play,
    trickEndEvent: trickEnd ?? undefined,
    legalMoves,
    fallbackMove,
    evaluatorHints,
    memoryContext,
  });
}
