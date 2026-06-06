import { GameVariant, Card } from '../../types/game';
import { EncodedDecisionState } from '../encoder/types';
import { DecisionEvaluationResult } from '../evaluator/types';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';

export const DEV_LAB_SCHEMA_VERSION = '9.0.0' as const;

export interface DevLabScenario {
  id: string;
  variant: GameVariant;
  primaryMetricId: string;
  humanNote: string;
  playEvent: CardDecisionLogEvent;
  trickEndEvent?: TrickEndEvent;
  legalMoves: Card[];
  chosenCard?: Card | null;
  fixtureId?: string;
  tags?: string[];
}

export interface SeededGameOptions {
  variant: GameVariant;
  seed: number | string;
  roundIndex?: number;
  cutPoint?: number;
}

export interface SeededGameResult {
  schemaVersion: typeof DEV_LAB_SCHEMA_VERSION;
  variant: GameVariant;
  seed: string;
  dealHash: string;
  cardOrder: string[];
  generatedAt: string;
}

export interface ScenarioRunOptions {
  includeEvaluation?: boolean;
  includeMemory?: boolean;
  includeEncoded?: boolean;
  engineView?: boolean;
  persistToIdb?: boolean;
}

export interface ScenarioRunResult {
  schemaVersion: typeof DEV_LAB_SCHEMA_VERSION;
  scenarioId: string;
  play: CardDecisionLogEvent;
  trickEnd: TrickEndEvent | null;
  encoded?: EncodedDecisionState;
  evaluation?: DecisionEvaluationResult;
  memoryIngest?: { ingested: number; warnings: string[] };
  warnings: string[];
  reportText: string;
}

export interface DevLabScenarioSummary {
  id: string;
  variant: GameVariant;
  primaryMetricId: string;
  humanNote: string;
}
