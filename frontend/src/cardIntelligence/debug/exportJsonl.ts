import { MetricMemoryAggregate } from '../memory/types';
import { LogEvent } from '../shared/types/logEvents';
import { evaluateStoredPlay } from './evaluateStoredEvents';
import { listMemoryAggregates } from './readMemory';
import {
  filterLogEvents,
  loadAllLogEvents,
  sortEventsByTimestamp,
  splitLogEvents,
} from './readLogs';
import {
  CardIntelligenceExportEnvelope,
  EXPORT_SCHEMA_VERSION,
  EXPORT_SOURCE,
  ExportOptions,
  ExportRecordType,
  ExportResult,
} from './types';

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 64);
}

export function buildExportFilename(gameId?: string): string {
  const id = sanitizeFilenamePart(gameId ?? 'all');
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  return `ci-export-${id}-${iso}.jsonl`;
}

function wrapEnvelope(
  exportRecordType: ExportRecordType,
  payload: unknown,
  exportedAt: string,
  source = EXPORT_SOURCE
): CardIntelligenceExportEnvelope {
  return {
    exportRecordType,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt,
    source,
    payload,
  };
}

function toLine(value: unknown): string {
  return JSON.stringify(value);
}

function buildExportMetaLine(
  lineCount: number,
  warnings: string[],
  options: ExportOptions,
  exportedAt: string
): string {
  return toLine(
    wrapEnvelope(
      'export_meta',
      { lineCount, warnings, options },
      exportedAt
    )
  );
}

export function buildJsonlLines(
  events: LogEvent[],
  memoryAggregates: MetricMemoryAggregate[],
  options: ExportOptions = {}
): { lines: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const format = options.format ?? 'envelope';
  const exportedAt = new Date().toISOString();
  const filtered = sortEventsByTimestamp(
    filterLogEvents(events, {
      gameId: options.gameId,
      variant: options.variant,
      playerType: options.playerType,
    })
  );
  const { plays, trickEnds } = splitLogEvents(filtered);
  const scopedTrickEnds = trickEnds.filter((t) => {
    if (options.gameId && t.gameId !== options.gameId) return false;
    if (options.variant && t.variant !== options.variant) return false;
    return true;
  });

  if (format === 'raw') {
    if (options.includeEncoded || options.includeEvaluations || options.includeMemory) {
      warnings.push('raw format ignores includeEncoded/includeEvaluations/includeMemory');
    }
    const rawLines = sortEventsByTimestamp([...plays, ...scopedTrickEnds]).map((e) =>
      toLine(e)
    );
    if (rawLines.length === 0) {
      return {
        lines: [
          buildExportMetaLine(0, warnings, { ...options, format: 'raw' }, exportedAt),
        ],
        warnings,
      };
    }
    return { lines: rawLines, warnings };
  }

  const lines: string[] = [];
  const engineView = options.engineView === true;

  for (const play of plays) {
    lines.push(toLine(wrapEnvelope('card_decision_log', play, exportedAt)));

    if (options.includeEncoded || options.includeEvaluations) {
      const playTrickEnds = scopedTrickEnds.filter((t) => t.gameId === play.gameId);
      try {
        const result = evaluateStoredPlay(play, playTrickEnds, { engineView });
        if (result.warnings.length > 0) {
          warnings.push(...result.warnings.map((w) => `${play.eventId}: ${w}`));
        }
        if (options.includeEncoded && result.encoded) {
          lines.push(toLine(wrapEnvelope('encoded_state', result.encoded, exportedAt)));
        }
        if (options.includeEvaluations && result.evaluation) {
          lines.push(toLine(wrapEnvelope('evaluation', result.evaluation, exportedAt)));
        }
      } catch (error) {
        warnings.push(
          `${play.eventId}: evaluate failed — ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  for (const trickEnd of scopedTrickEnds) {
    lines.push(toLine(wrapEnvelope('trick_end', trickEnd, exportedAt)));
  }

  if (options.includeMemory) {
    for (const aggregate of memoryAggregates) {
      lines.push(toLine(wrapEnvelope('memory_aggregate', aggregate, exportedAt)));
    }
  }

  if (lines.length === 0) {
    return {
      lines: [buildExportMetaLine(0, warnings, options, exportedAt)],
      warnings,
    };
  }

  return { lines, warnings };
}

export function downloadJsonl(content: string, filename: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'application/x-ndjson' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportCardIntelligenceJsonl(
  options: ExportOptions = {}
): Promise<ExportResult> {
  const filename = buildExportFilename(options.gameId);
  const warnings: string[] = [];

  try {
    const events = await loadAllLogEvents();
    let memoryAggregates: MetricMemoryAggregate[] = [];
    if (options.includeMemory) {
      try {
        memoryAggregates = await listMemoryAggregates({
          variant: options.variant,
        });
      } catch (error) {
        warnings.push(
          `memory read failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const { lines, warnings: buildWarnings } = buildJsonlLines(
      events,
      memoryAggregates,
      options
    );
    warnings.push(...buildWarnings);

    const content = lines.join('\n') + '\n';
    downloadJsonl(content, filename);

    return { lineCount: lines.length, warnings, filename };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(message);
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[CardIntelligence] export failed', error);
    }
    const exportedAt = new Date().toISOString();
    const fallbackLine = buildExportMetaLine(0, warnings, options, exportedAt);
    downloadJsonl(`${fallbackLine}\n`, filename);
    return { lineCount: 1, warnings, filename };
  }
}
