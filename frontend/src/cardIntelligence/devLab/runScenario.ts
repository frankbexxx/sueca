import { ciEncode } from '../debug/evaluateStoredEvents';
import { evaluateDecision } from '../evaluator/evaluateDecision';
import { EVALUATOR_SCHEMA_VERSION } from '../evaluator/types';
import {
  buildMemoryIngestRecord,
  ingestEvaluationResult,
} from '../memory/ingestEvaluation';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { DevLabScenarioError } from './errors';
import { getScenarioById } from './presetScenarios';
import { generateSeededDeal } from './seededRandom';
import { buildScenarioReport } from './scenarioReport';
import {
  DEV_LAB_SCHEMA_VERSION,
  DevLabScenario,
  ScenarioRunOptions,
  ScenarioRunResult,
  SeededGameOptions,
  SeededGameResult,
} from './types';
import { validateScenario } from './validateScenario';

export { validateScenario } from './validateScenario';

function normalizePlayEvent(scenario: DevLabScenario): CardDecisionLogEvent {
  const base = scenario.playEvent;
  return {
    ...base,
    source: 'test',
    classification: 'unknown',
    reason: null,
    fixtureCandidateIds:
      base.fixtureCandidateIds.length > 0
        ? [...base.fixtureCandidateIds]
        : [scenario.primaryMetricId],
  };
}

function evaluateScenarioPlay(
  play: CardDecisionLogEvent,
  trickEnd: DevLabScenario['trickEndEvent'],
  options: ScenarioRunOptions
): {
  encoded?: ScenarioRunResult['encoded'];
  evaluation?: ScenarioRunResult['evaluation'];
  warnings: string[];
} {
  const warnings: string[] = [];
  const engineView = options.engineView === true;
  const includeEvaluation = options.includeEvaluation !== false;
  const includeEncoded = options.includeEncoded !== false;

  if (!trickEnd && play.trickIndex !== null) {
    warnings.push(
      `trick_end missing for trickIndex ${play.trickIndex} (gameId ${play.gameId})`
    );
  }

  let encoded: ScenarioRunResult['encoded'];
  if (includeEncoded || includeEvaluation) {
    encoded = ciEncode(play, {
      trickEndEvent: trickEnd,
      encodeMode: 'post_decision',
      viewType: engineView ? 'engine' : 'player',
      allowEngineView: engineView,
    });
  }

  let evaluation: ScenarioRunResult['evaluation'];
  if (includeEvaluation && encoded) {
    evaluation = evaluateDecision({
      schemaVersion: EVALUATOR_SCHEMA_VERSION,
      encodedState: encoded,
      chosenCard: play.chosenCard,
      legalMoves: play.legalMoves,
      rawLogEvent: play,
      viewType: engineView ? 'engine' : 'player',
      evaluatorMode: engineView ? 'debug' : 'strict',
    });
  }

  return { encoded, evaluation, warnings };
}

export async function runScenario(
  scenarioId: string,
  options: ScenarioRunOptions = {}
): Promise<ScenarioRunResult> {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new DevLabScenarioError(`Scenario ${scenarioId} not found`);
  }

  validateScenario(scenario);
  const play = normalizePlayEvent(scenario);
  const trickEnd = scenario.trickEndEvent ?? null;
  const { encoded, evaluation, warnings } = evaluateScenarioPlay(
    play,
    trickEnd ?? undefined,
    options
  );

  let memoryIngest: ScenarioRunResult['memoryIngest'];
  if (options.includeMemory && encoded && evaluation) {
    const record = buildMemoryIngestRecord({ event: play, encoded, evaluation });
    await ingestEvaluationResult(record);
    memoryIngest = { ingested: 1, warnings: [] };
  }

  const reportText = buildScenarioReport({
    scenario,
    encoded,
    evaluation,
    warnings,
  });

  return {
    schemaVersion: DEV_LAB_SCHEMA_VERSION,
    scenarioId: scenario.id,
    play,
    trickEnd,
    encoded,
    evaluation,
    memoryIngest,
    warnings,
    reportText,
  };
}

export async function runScenarioFromSeeded(
  options: SeededGameOptions & ScenarioRunOptions
): Promise<SeededGameResult> {
  return generateSeededDeal(options);
}

export function exportScenarioJsonl(result: ScenarioRunResult): string {
  const lines: string[] = [];
  lines.push(
    JSON.stringify({
      exportRecordType: 'export_meta',
      schemaVersion: '7.0.0',
      exportedAt: new Date().toISOString(),
      source: 'dev_lab',
      payload: { scenarioId: result.scenarioId, warnings: result.warnings },
    })
  );
  lines.push(
    JSON.stringify({
      exportRecordType: 'card_decision_log',
      schemaVersion: '7.0.0',
      exportedAt: new Date().toISOString(),
      source: 'dev_lab',
      payload: result.play,
    })
  );
  if (result.evaluation) {
    lines.push(
      JSON.stringify({
        exportRecordType: 'evaluation',
        schemaVersion: '7.0.0',
        exportedAt: new Date().toISOString(),
        source: 'dev_lab',
        payload: result.evaluation,
      })
    );
  }
  return lines.join('\n');
}
