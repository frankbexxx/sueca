import { EncodedDecisionState } from '../encoder/types';
import { DecisionEvaluationResult } from '../evaluator/types';
import { DevLabScenario, SeededGameResult } from './types';

function formatMetricResults(evaluation?: DecisionEvaluationResult): string {
  if (!evaluation) return '(none)';
  const lines = evaluation.metricResults
    .filter((metric) => metric.classification !== 'not_applicable')
    .map((metric) => `${metric.metricId} ${metric.classification}`);
  return lines.length > 0 ? lines.join(', ') : '(none applicable)';
}

function formatEncodedFields(encoded?: EncodedDecisionState): string[] {
  if (!encoded) return ['(skipped)'];
  const lines = [`contractId: ${encoded.contractId ?? 'null'}`];
  const variant = encoded.variantEncoding;
  if ('mustPlayKingHeartsNow' in variant) {
    lines.push(`mustPlayKingHeartsNow: ${String(variant.mustPlayKingHeartsNow)}`);
  }
  if ('dangerousCardsInHand' in variant && variant.dangerousCardsInHand.length > 0) {
    lines.push(`dangerousCardsInHand: ${variant.dangerousCardsInHand.length}`);
  }
  if ('canWinCheaply' in variant && variant.canWinCheaply !== null) {
    lines.push(`canWinCheaply: ${String(variant.canWinCheaply)}`);
  }
  return lines;
}

export function buildScenarioReport(input: {
  scenario: DevLabScenario;
  encoded?: EncodedDecisionState;
  evaluation?: DecisionEvaluationResult;
  seeded?: SeededGameResult;
  warnings?: string[];
}): string {
  const { scenario, encoded, evaluation, seeded, warnings = [] } = input;
  const lines: string[] = [
    'Card Intelligence — Dev Lab Report',
    `Scenario: ${scenario.id} (${scenario.variant})`,
    `Metric: ${scenario.primaryMetricId} — ${scenario.humanNote}`,
  ];

  if (scenario.fixtureId) {
    lines.push(`Fixture: ${scenario.fixtureId}`);
  }

  if (seeded) {
    lines.push('', '--- Seeded Deal ---', `seed: ${seeded.seed}`, `dealHash: ${seeded.dealHash}`);
  }

  lines.push('', '--- Encode (Player View) ---', ...formatEncodedFields(encoded));

  lines.push(
    '',
    '--- Evaluation ---',
    `classification: ${evaluation?.classification ?? '(skipped)'}`,
    `reasonShort: ${evaluation?.reasonShort ?? '(skipped)'}`,
    `metricResults: ${formatMetricResults(evaluation)}`
  );

  lines.push('', `Warnings: ${warnings.length === 0 ? '(none)' : warnings.join('; ')}`);

  return lines.join('\n');
}
