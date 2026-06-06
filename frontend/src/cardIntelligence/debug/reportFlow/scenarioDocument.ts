import { EncodedDecisionState } from '../../encoder/types';
import { DecisionEvaluationResult } from '../../evaluator/types';import { buildDebugReportDocument } from './documentHelpers';
import { DevLabScenario } from '../../devLab/types';
import { CardDecisionLogEvent } from '../../shared/types/logEvents';
import { TrickEndEvent } from '../../shared/types/trickEndEvent';
import { DebugReportDocument } from './types';

export function buildScenarioDocumentFromRun(input: {
  scenario: DevLabScenario;
  play: CardDecisionLogEvent;
  trickEnd: TrickEndEvent | null;
  encoded?: EncodedDecisionState;
  evaluation?: DecisionEvaluationResult;
  rawWarnings: string[];
  includeRawPayload?: boolean;
}): DebugReportDocument {
  return buildDebugReportDocument({
    kind: 'scenario',
    source: 'dev_lab_scenario',
    viewTypeUsed: input.evaluation?.viewTypeUsed ?? 'player',
    scenarioId: input.scenario.id,
    variant: input.scenario.variant,
    scenarioSection: {
      primaryMetricId: input.scenario.primaryMetricId,
      humanNote: input.scenario.humanNote,
      fixtureId: input.scenario.fixtureId,
    },
    play: input.play,
    trickEnd: input.trickEnd,
    encoded: input.encoded,
    evaluation: input.evaluation,
    rawWarnings: input.rawWarnings,
    includeRawPayload: input.includeRawPayload,
  });
}
