import { evaluateStoredPlayByEventId } from '../evaluateStoredEvents';
import { DebugReportError } from './errors';
import {
  buildDebugReportDocument,
  resolveReportOutput,
} from './documentHelpers';
import { DebugReportDocument, ReportFlowOptions } from './types';

export async function buildEventDebugReport(
  eventId: string,
  options: ReportFlowOptions = {}
): Promise<DebugReportDocument> {
  const result = await evaluateStoredPlayByEventId(eventId, {
    engineView: options.engineView,
  });

  if (!result) {
    throw new DebugReportError(`Event ${eventId} not found`);
  }

  return buildDebugReportDocument({
    kind: 'event',
    source: result.play.source === 'test' ? 'synthetic_test' : 'live_log',
    viewTypeUsed: result.evaluation?.viewTypeUsed ?? 'player',
    eventId,
    play: result.play,
    trickEnd: result.trickEnd,
    encoded: result.encoded,
    evaluation: result.evaluation,
    rawWarnings: result.warnings,
    includeRawPayload: options.includeRawPayload,
  });
}

export async function ciEventReport(
  eventId: string,
  options: ReportFlowOptions = {}
): Promise<string | DebugReportDocument> {
  const doc = await buildEventDebugReport(eventId, options);
  return resolveReportOutput(doc, options);
}
