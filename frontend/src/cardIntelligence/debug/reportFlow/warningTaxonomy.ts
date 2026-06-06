import { DecisionEvaluationResult } from '../../evaluator/types';
import { ReportWarning, WarningSeverity } from './types';

const TRICK_END_MISSING_PATTERN = /trick_end missing for trickIndex/i;

export function classifyRawWarning(
  message: string,
  evaluation?: DecisionEvaluationResult
): ReportWarning {
  if (TRICK_END_MISSING_PATTERN.test(message)) {
    const degraded =
      evaluation?.partialEvaluation === true ||
      evaluation?.classification === 'unknown';
    return {
      code: 'trick_end_missing',
      severity: degraded ? 'degraded' : 'informational',
      message,
    };
  }

  if (/encoder|tier b|missing field/i.test(message)) {
    return {
      code: 'encoder_tier_b_gap',
      severity: 'informational',
      message,
    };
  }

  return {
    code: 'other',
    severity: 'informational',
    message,
  };
}

export function classifyWarnings(
  raw: string[],
  evaluation?: DecisionEvaluationResult
): ReportWarning[] {
  return raw.map((message) => classifyRawWarning(message, evaluation));
}

export function formatWarningLine(warning: ReportWarning): string {
  const prefix =
    warning.severity === 'informational'
      ? '[info]'
      : warning.severity === 'degraded'
        ? '[warn]'
        : '[error]';
  return `${prefix} ${warning.message}`;
}

export function blockingWarnings(warnings: ReportWarning[]): ReportWarning[] {
  return warnings.filter((w) => w.severity === 'blocking');
}

export function severityRank(severity: WarningSeverity): number {
  if (severity === 'blocking') return 3;
  if (severity === 'degraded') return 2;
  return 1;
}
