import { getFixtureById } from '../fixtures';
import { DevLabScenarioError } from './errors';
import { DevLabScenario, DevLabScenarioSummary } from './types';

export function labFromFixture(labId: string, fixtureId: string): DevLabScenario {
  const fixture = getFixtureById(fixtureId);
  if (!fixture) {
    throw new DevLabScenarioError(`Fixture ${fixtureId} missing`);
  }

  return {
    id: labId,
    variant: fixture.variant,
    primaryMetricId: fixture.primaryMetricId,
    humanNote: fixture.humanNote,
    playEvent: fixture.event,
    trickEndEvent: undefined,
    legalMoves: [...fixture.event.legalMoves],
    chosenCard: fixture.event.chosenCard,
    fixtureId,
  };
}

export const ALL_DEV_LAB_SCENARIOS: DevLabScenario[] = [
  labFromFixture('LAB_K02', 'K02'),
  labFromFixture('LAB_SP09', 'SP09'),
  labFromFixture('LAB_S16', 'S16'),
  labFromFixture('LAB_H13', 'H13'),
  labFromFixture('LAB_SP14', 'SP14'),
  labFromFixture('LAB_K10', 'K10'),
  labFromFixture('LAB_H10', 'H10'),
  labFromFixture('LAB_S25', 'S25'),
];

export function getScenarioById(id: string): DevLabScenario | undefined {
  return ALL_DEV_LAB_SCENARIOS.find((scenario) => scenario.id === id);
}

export function listScenarios(): DevLabScenarioSummary[] {
  return ALL_DEV_LAB_SCENARIOS.map(({ id, variant, primaryMetricId, humanNote }) => ({
    id,
    variant,
    primaryMetricId,
    humanNote,
  }));
}
