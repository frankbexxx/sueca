import { getScenarioById } from '../../devLab/presetScenarios';
import { runScenario } from '../../devLab/runScenario';
import { DevLabScenarioError } from '../../devLab/errors';
import { buildScenarioDocumentFromRun } from './scenarioDocument';
import { resolveReportOutput } from './documentHelpers';
import { DebugReportDocument, ReportFlowOptions } from './types';

export async function buildScenarioDebugReport(
  scenarioId: string,
  options: ReportFlowOptions = {}
): Promise<DebugReportDocument> {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new DevLabScenarioError(`Scenario ${scenarioId} not found`);
  }

  const result = await runScenario(scenarioId, {
    includeEvaluation: true,
    includeEncoded: true,
    includeMemory: options.includeMemory,
    engineView: options.engineView,
  });

  return buildScenarioDocumentFromRun({
    scenario,
    play: result.play,
    trickEnd: result.trickEnd,
    encoded: result.encoded,
    evaluation: result.evaluation,
    rawWarnings: result.warnings,
    includeRawPayload: options.includeRawPayload,
  });
}

export async function ciScenarioReport(
  scenarioId: string,
  options: ReportFlowOptions = {}
): Promise<string | DebugReportDocument> {
  const doc = await buildScenarioDebugReport(scenarioId, options);
  return resolveReportOutput(doc, options);
}
