import { Card } from '../../../types/game';
import { EncodedDecisionState } from '../../encoder/types';
import { DecisionEvaluationResult } from '../../evaluator/types';
import { CardDecisionLogEvent } from '../../shared/types/logEvents';
import { TrickEndEvent } from '../../shared/types/trickEndEvent';
import { summarizeEncodedState } from './encodeSummary';
import { formatHumanReport } from './formatHumanReport';
import {
  DebugReportDocument,
  DebugReportSummary,
  ReportKind,
  ReportSource,
  ReportWarning,
} from './types';
import { classifyWarnings } from './warningTaxonomy';
export function formatCard(card: Card | null | undefined): string {
  if (!card) return '(none)';
  return card.id || `${card.rank}${card.suit[0]}`;
}

export function buildSummaryFromEvaluation(
  evaluation?: DecisionEvaluationResult
): DebugReportSummary {
  const topIssues =
    evaluation?.metricResults
      .filter((m) => m.classification !== 'not_applicable' && m.classification !== 'good')
      .slice(0, 5)
      .map((m) => ({
        metricId: m.metricId,
        classification: m.classification,
        reasonShort: m.reasonShort,
      })) ?? [];

  return {
    classification: evaluation?.classification,
    reasonShort: evaluation?.reasonShort,
    activatedMetricIds: evaluation?.activatedMetricIds ?? [],
    failedMetricIds: evaluation?.failedMetricIds ?? [],
    topIssues,
  };
}

export function formatMetricResultsLine(evaluation?: DecisionEvaluationResult): string {
  if (!evaluation) return '(none)';
  const parts = evaluation.metricResults
    .filter((m) => m.classification !== 'not_applicable')
    .map((m) => `${m.metricId} ${m.classification}`);
  return parts.length > 0 ? parts.join(', ') : '(none applicable)';
}

export interface BuildDocumentInput {
  kind: ReportKind;
  source: ReportSource;
  viewTypeUsed: 'player' | 'engine';
  scenarioId?: string;
  eventId?: string;
  gameId?: string;
  variant?: CardDecisionLogEvent['variant'];
  scenarioSection?: DebugReportDocument['sections']['scenario'];
  play?: CardDecisionLogEvent;
  trickEnd?: TrickEndEvent | null;
  encoded?: EncodedDecisionState;
  evaluation?: DecisionEvaluationResult;
  gameStats?: DebugReportDocument['sections']['gameStats'];
  memory?: DebugReportDocument['sections']['memory'];
  highlights?: string[];
  rawWarnings: string[];
  includeRawPayload?: boolean;
}

export function buildDebugReportDocument(input: BuildDocumentInput): DebugReportDocument {
  const warnings: ReportWarning[] = classifyWarnings(input.rawWarnings, input.evaluation);
  const summary = buildSummaryFromEvaluation(input.evaluation);

  const doc: DebugReportDocument = {
    meta: {
      schemaVersion: '10.0.0',
      kind: input.kind,
      source: input.source,
      generatedAt: new Date().toISOString(),
      offlineEvaluation: true,
      viewTypeUsed: input.viewTypeUsed,
      scenarioId: input.scenarioId,
      eventId: input.eventId ?? input.play?.eventId,
      gameId: input.gameId ?? input.play?.gameId,
      variant: input.variant ?? input.play?.variant,
    },
    summary,
    sections: {
      scenario: input.scenarioSection,
      play: input.play
        ? {
            chosenCard: formatCard(input.play.chosenCard),
            legalMovesCount: input.play.legalMoves.length,
            trickIndex: input.play.trickIndex,
            eventId: input.play.eventId,
          }
        : undefined,
      encode: summarizeEncodedState(input.encoded),
      evaluation: input.evaluation
        ? {
            classification: input.evaluation.classification,
            reasonShort: input.evaluation.reasonShort,
            partialEvaluation: input.evaluation.partialEvaluation,
          }
        : undefined,
      gameStats: input.gameStats,
      memory: input.memory,
      highlights: input.highlights,
      metricResultsLine: formatMetricResultsLine(input.evaluation),
    },
    warnings,
    text: '',
  };

  if (input.includeRawPayload) {
    doc.rawPayload = {
      play: input.play,
      trickEnd: input.trickEnd,
      encoded: input.encoded,
      evaluation: input.evaluation,
    };
  }

  doc.text = formatHumanReport(doc);
  return doc;
}

export function resolveReportOutput(
  doc: DebugReportDocument,
  options?: { as?: 'text' | 'document' }
): string | DebugReportDocument {
  return options?.as === 'document' ? doc : doc.text;
}
