import { EncodedDecisionState } from '../encoder/types';
import { DecisionEvaluationResult } from '../evaluator/types';
import { buildScenarioDocumentFromRun } from '../debug/reportFlow/scenarioDocument';
import { formatHumanReport } from '../debug/reportFlow/formatHumanReport';
import { DevLabScenario } from './types';
import { SeededGameResult } from './types';

/** @deprecated use reportFlow — kept for tests importing buildScenarioReport */
export function buildScenarioReport(input: {
  scenario: DevLabScenario;
  encoded?: EncodedDecisionState;
  evaluation?: DecisionEvaluationResult;
  seeded?: SeededGameResult;
  warnings?: string[];
}): string {
  if (input.seeded) {
    return [
      'Card Intelligence — Debug Report',
      `seed: ${input.seeded.seed}`,
      `dealHash: ${input.seeded.dealHash}`,
    ].join('\n');
  }

  const doc = buildScenarioDocumentFromRun({
    scenario: input.scenario,
    play: input.scenario.playEvent,
    trickEnd: input.scenario.trickEndEvent ?? null,
    encoded: input.encoded,
    evaluation: input.evaluation,
    rawWarnings: input.warnings ?? [],
  });
  return formatHumanReport(doc);
}
