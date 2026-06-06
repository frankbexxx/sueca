import { EXPORT_SCHEMA_VERSION } from '../types';
import { DEBUG_REPORT_SOURCE } from './types';
import { buildEventDebugReport } from './buildEventReport';
import { buildGameDebugReport } from './buildGameReport';
import { buildScenarioDebugReport } from './buildScenarioReport';
import { formatJsonReport } from './formatJsonReport';
import { ExportReportResult, ReportExportOptions } from './types';

function exportFilename(kind: string, id: string, format: string): string {
  const safe = id.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 48);
  return `ci-report-${kind}-${safe}.${format === 'jsonl' ? 'jsonl' : format === 'json' ? 'json' : 'txt'}`;
}

export async function exportDebugReport(
  options: ReportExportOptions
): Promise<ExportReportResult> {
  let doc;
  const flowOpts = {
    includeMemory: options.includeMemory,
    engineView: options.engineView,
    includeRawPayload: options.includeRawPayload,
    as: 'document' as const,
  };

  if (options.kind === 'scenario') {
    if (!options.scenarioId) throw new Error('scenarioId required');
    doc = await buildScenarioDebugReport(options.scenarioId, flowOpts);
  } else if (options.kind === 'event') {
    if (!options.eventId) throw new Error('eventId required');
    doc = await buildEventDebugReport(options.eventId, flowOpts);
  } else {
    if (!options.gameId) throw new Error('gameId required');
    doc = await buildGameDebugReport(options.gameId, flowOpts);
  }

  const id =
    options.scenarioId ?? options.eventId ?? options.gameId ?? 'unknown';
  const filename = exportFilename(options.kind, id, options.format);
  const warnings = doc.warnings;

  if (options.format === 'text') {
    return { text: doc.text, filename, warnings };
  }

  if (options.format === 'json') {
    return { json: doc, text: formatJsonReport(doc), filename, warnings };
  }

  const envelope = {
    exportRecordType: 'debug_report' as const,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    source: DEBUG_REPORT_SOURCE,
    payload: doc,
  };
  const jsonl = JSON.stringify(envelope);
  return {
    json: doc,
    blob: new Blob([jsonl], { type: 'application/x-ndjson' }),
    filename,
    warnings,
  };
}

export async function ciExportReport(
  options: ReportExportOptions
): Promise<ExportReportResult> {
  return exportDebugReport(options);
}
