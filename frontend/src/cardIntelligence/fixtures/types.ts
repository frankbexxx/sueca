import { GameVariant } from '../../types/game';
import { CardDecisionLogEvent } from '../shared/types/logEvents';

export type FixtureTier = 'A' | 'B';

export interface FixtureMetricExpectation {
  metricId: string;
  applicable: boolean;
  allowPartial?: boolean;
  reasonShortIncludes?: string;
}

export interface FixtureExpected {
  metricContext: FixtureMetricExpectation;
  encodedFields?: Record<string, unknown>;
  variantFields?: Record<string, unknown>;
  secondaryMetrics?: FixtureMetricExpectation[];
}

export interface FixtureCase {
  fixtureId: string;
  variant: GameVariant;
  primaryMetricId: string;
  level: 'medium' | 'hard';
  tier: FixtureTier;
  humanNote: string;
  event: CardDecisionLogEvent;
  expected: FixtureExpected;
}
