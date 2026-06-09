import { formatCardList } from './formatCard';
import { DebugReportDocument } from './types';
import { formatWarningLine } from './warningTaxonomy';

function formatEncodeSection(encode?: Record<string, unknown>): string[] {
  if (!encode || Object.keys(encode).length === 0) return ['(skipped)'];
  return Object.entries(encode).map(([key, value]) => `${key}: ${String(value)}`);
}

export function formatHumanReport(doc: DebugReportDocument): string {
  const lines: string[] = [
    'Card Intelligence — Debug Report',
    `kind: ${doc.meta.kind} | source: ${doc.meta.source} | schema: ${doc.meta.schemaVersion}`,
  ];

  if (doc.sections.scenario) {
    const s = doc.sections.scenario;
    lines.push(
      `Scenario: ${doc.meta.scenarioId ?? '?'} (${doc.meta.variant ?? '?'}) | Metric: ${s.primaryMetricId}`,
      s.humanNote
    );
    if (s.fixtureId) lines.push(`Fixture: ${s.fixtureId}`);
  }

  if (doc.meta.kind === 'event') {
    lines.push(
      `eventId: ${doc.meta.eventId ?? '?'} | gameId: ${doc.meta.gameId ?? '?'} | variant: ${doc.meta.variant ?? '?'}`
    );
  }

  if (doc.meta.kind === 'game') {
    lines.push(`gameId: ${doc.meta.gameId ?? '?'} | variant: ${doc.meta.variant ?? '?'}`);
    if (doc.sections.gameStats) {
      const gs = doc.sections.gameStats;
      lines.push(`Plays: ${gs.playCount} | TrickEnds: ${gs.trickEndCount}`);
      const byClass = Object.entries(gs.byClassification)
        .map(([k, v]) => `${k} ${v}`)
        .join(', ');
      if (byClass) lines.push(`By classification: ${byClass}`);
    }
  }

  if (doc.sections.play) {
    lines.push(
      '',
      '--- Play ---',
      `chosen: ${doc.sections.play.chosenCard} | legal moves: ${doc.sections.play.legalMovesCount} | trickIndex: ${doc.sections.play.trickIndex ?? 'null'}`
    );
  }

  lines.push('', '--- Encode (Player View) ---', ...formatEncodeSection(doc.sections.encode));

  lines.push(
    '',
    '--- Evaluation ---',
    `classification: ${doc.summary.classification ?? doc.sections.evaluation?.classification ?? '(skipped)'}`,
    `reasonShort: ${doc.summary.reasonShort ?? doc.sections.evaluation?.reasonShort ?? '(skipped)'}`,
    `metricResults: ${doc.sections.metricResultsLine ?? '(skipped)'}`
  );

  const better = doc.sections.evaluation?.betterAlternatives ?? [];
  const equivalent = doc.sections.evaluation?.equivalentAlternatives ?? [];
  if (better.length > 0 || equivalent.length > 0) {
    lines.push('', '--- Alternatives ---');
    if (better.length > 0) {
      lines.push(`better: ${formatCardList(better)}`);
    }
    if (equivalent.length > 0) {
      lines.push(`equivalent: ${formatCardList(equivalent)}`);
    }
  }

  if (doc.sections.highlights && doc.sections.highlights.length > 0) {
    lines.push('', '--- Highlights ---', ...doc.sections.highlights.map((h) => `- ${h}`));
  }

  if (doc.sections.memory) {
    lines.push(
      '',
      '--- Memory ---',
      `aggregates: ${doc.sections.memory.aggregateCount}`,
      ...doc.sections.memory.highlights.map((h) => `  ${h}`)
    );
  }

  const warningLines =
    doc.warnings.length === 0
      ? ['(none)']
      : doc.warnings.map((w) => formatWarningLine(w));
  lines.push('', '--- Warnings ---', ...warningLines);

  lines.push(
    '',
    `generatedAt: ${doc.meta.generatedAt} | offline: true | view: ${doc.meta.viewTypeUsed}`
  );

  return lines.join('\n');
}
