import { CardDecisionLogEvent } from '../../shared/types/logEvents';
import { evaluateStoredGame } from '../evaluateStoredEvents';
import { loadAllLogEvents, splitLogEvents } from '../readLogs';
import { listMemoryAggregates } from '../readMemory';
import { DebugReportError } from './errors';
import {
  buildDebugReportDocument,
  formatCard,
  resolveReportOutput,
} from './documentHelpers';
import { DebugReportDocument, ReportFlowOptions } from './types';
import { EvaluationClassification } from '../../evaluator/types';

function countByClassification(
  results: Awaited<ReturnType<typeof evaluateStoredGame>>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of results) {
    const key = r.evaluation?.classification ?? 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function buildHighlights(
  results: Awaited<ReturnType<typeof evaluateStoredGame>>,
  max = 10
): string[] {
  const lines: string[] = [];
  for (const r of results) {
    const classification = r.evaluation?.classification;
    if (!classification || classification === 'good') continue;
    const failed = r.evaluation?.failedMetricIds?.[0] ?? classification;
    lines.push(
      `${failed} ${classification} @ ${r.play.eventId} — ${formatCard(r.play.chosenCard)}`
    );
    if (lines.length >= max) break;
  }
  return lines;
}

export async function buildGameDebugReport(
  gameId: string,
  options: ReportFlowOptions = {}
): Promise<DebugReportDocument> {
  const events = await loadAllLogEvents();
  const filtered = events.filter((e) => e.gameId === gameId);
  const { plays, trickEnds } = splitLogEvents(filtered);

  if (plays.length === 0) {
    throw new DebugReportError(`Game ${gameId} has no play events`);
  }

  const sortedPlays = [...plays].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const results = await evaluateStoredGame(gameId, { engineView: options.engineView });

  const allWarnings = results.flatMap((r) => r.warnings);
  const variant = sortedPlays[0]?.variant;

  let memorySection: DebugReportDocument['sections']['memory'];
  if (options.includeMemory) {
    const aggregates = await listMemoryAggregates(variant ? { variant } : {});
    memorySection = {
      aggregateCount: aggregates.length,
      highlights: aggregates.slice(0, 5).map(
        (a) => `${a.metricId}: good=${a.goodCount} bad=${a.badCount}`
      ),
    };
  }

  const representative = results[0];
  const worst = results.find(
    (r) =>
      r.evaluation &&
      (['bad', 'partial', 'medium'] as EvaluationClassification[]).includes(
        r.evaluation.classification
      )
  );

  return buildDebugReportDocument({
    kind: 'game',
    source: 'live_log',
    viewTypeUsed: representative?.evaluation?.viewTypeUsed ?? 'player',
    gameId,
    variant,
    play: worst?.play ?? representative?.play,
    trickEnd: worst?.trickEnd ?? representative?.trickEnd,
    encoded: worst?.encoded ?? representative?.encoded,
    evaluation: worst?.evaluation ?? representative?.evaluation,
    gameStats: {
      playCount: sortedPlays.length,
      trickEndCount: trickEnds.length,
      byClassification: countByClassification(results),
    },
    memory: memorySection,
    highlights: buildHighlights(results),
    rawWarnings: allWarnings,
    includeRawPayload: options.includeRawPayload,
  });
}

export async function buildGameDebugReportFromData(input: {
  gameId: string;
  plays: CardDecisionLogEvent[];
  results: Awaited<ReturnType<typeof evaluateStoredGame>>;
  trickEndCount: number;
  memory?: DebugReportDocument['sections']['memory'];
  options?: ReportFlowOptions;
}): Promise<DebugReportDocument> {
  return buildGameReportDocumentFromData(input);
}

export function buildGameReportDocumentFromData(input: {
  gameId: string;
  plays: CardDecisionLogEvent[];
  results: Awaited<ReturnType<typeof evaluateStoredGame>>;
  trickEndCount: number;
  memory?: DebugReportDocument['sections']['memory'];
  options?: ReportFlowOptions;
}): DebugReportDocument {
  const { gameId, plays, results, trickEndCount, memory, options = {} } = input;
  const representative = results[0];
  const worst = results.find(
    (r) =>
      r.evaluation &&
      (['bad', 'partial', 'medium'] as EvaluationClassification[]).includes(
        r.evaluation.classification
      )
  );

  return buildDebugReportDocument({
    kind: 'game',
    source: 'synthetic_test',
    viewTypeUsed: representative?.evaluation?.viewTypeUsed ?? 'player',
    gameId,
    variant: plays[0]?.variant,
    play: worst?.play ?? representative?.play,
    trickEnd: worst?.trickEnd ?? representative?.trickEnd,
    encoded: worst?.encoded ?? representative?.encoded,
    evaluation: worst?.evaluation ?? representative?.evaluation,
    gameStats: {
      playCount: plays.length,
      trickEndCount,
      byClassification: countByClassification(results),
    },
    memory,
    highlights: buildHighlights(results),
    rawWarnings: results.flatMap((r) => r.warnings),
    includeRawPayload: options.includeRawPayload,
  });
}

export async function ciGameReport(
  gameId: string,
  options: ReportFlowOptions = {}
): Promise<string | DebugReportDocument> {
  const doc = await buildGameDebugReport(gameId, options);
  return resolveReportOutput(doc, options);
}
