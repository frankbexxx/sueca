import { HEARTS_FIXTURES } from './heartsFixtures';
import { KING_FIXTURES } from './kingFixtures';
import { SPADES_FIXTURES } from './spadesFixtures';
import { SUECA_FIXTURES } from './suecaFixtures';
import { TRANSVERSAL_FIXTURES } from './transversalFixtures';
import { FixtureCase } from './types';

export const ALL_FIXTURES: FixtureCase[] = [
  ...SUECA_FIXTURES,
  ...SPADES_FIXTURES,
  ...HEARTS_FIXTURES,
  ...KING_FIXTURES,
  ...TRANSVERSAL_FIXTURES,
];

export const FIXTURE_IDS = ALL_FIXTURES.map((f) => f.fixtureId);

export function getFixtureById(id: string): FixtureCase | undefined {
  return ALL_FIXTURES.find((f) => f.fixtureId === id);
}

export type { FixtureCase, FixtureExpected, FixtureMetricExpectation, FixtureTier } from './types';
export { buildFixtureEvent } from './buildFixtureEvent';
