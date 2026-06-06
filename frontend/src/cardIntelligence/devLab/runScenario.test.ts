import { getFixtureById } from '../fixtures';
import { ALL_DEV_LAB_SCENARIOS, getScenarioById, listScenarios } from './presetScenarios';
import { generateSeededDeal } from './seededRandom';
import { runScenario } from './runScenario';
import { DevLabScenarioError } from './errors';
import { validateScenario } from './validateScenario';
import { labFromFixture } from './presetScenarios';

describe('presetScenarios', () => {
  it('lists four lab scenarios one per game', () => {
    const list = listScenarios();
    expect(list).toHaveLength(4);
    expect(list.map((item) => item.id).sort()).toEqual([
      'LAB_H13',
      'LAB_K02',
      'LAB_S16',
      'LAB_SP09',
    ]);
  });

  it('wraps existing fixtures', () => {
    for (const scenario of ALL_DEV_LAB_SCENARIOS) {
      expect(scenario.fixtureId).toBeTruthy();
      expect(getFixtureById(scenario.fixtureId!)).toBeDefined();
    }
  });
});

describe('validateScenario', () => {
  it('throws when chosenCard not in legalMoves', () => {
    const scenario = labFromFixture('LAB_BAD', 'K02');
    scenario.chosenCard = scenario.playEvent.handBefore[0];
    scenario.legalMoves = [scenario.playEvent.handBefore[1] ?? scenario.playEvent.handBefore[0]];
    expect(() => validateScenario(scenario)).toThrow(DevLabScenarioError);
  });
});

describe('seededRandom', () => {
  it('same seed produces same dealHash', () => {
    const first = generateSeededDeal({ variant: 'sueca', seed: 42 });
    const second = generateSeededDeal({ variant: 'sueca', seed: 42 });
    expect(first.dealHash).toBe(second.dealHash);
    expect(first.cardOrder).toEqual(second.cardOrder);
  });

  it('different seeds produce different dealHash', () => {
    const first = generateSeededDeal({ variant: 'sueca', seed: 42 });
    const second = generateSeededDeal({ variant: 'sueca', seed: 43 });
    expect(first.dealHash).not.toBe(second.dealHash);
  });
});

describe('runScenario', () => {
  it('LAB_K02 sets contractId no_king_hearts', async () => {
    const result = await runScenario('LAB_K02');
    expect(result.play.source).toBe('test');
    expect(result.encoded?.contractId).toBe('no_king_hearts');
    expect(result.evaluation?.metricResults.some((metric) => metric.metricId === 'K02')).toBe(true);
    expect(result.reportText).toContain('LAB_K02');
  });

  it('LAB_S16 evaluates with player view', async () => {
    const result = await runScenario('LAB_S16');
    expect(result.evaluation?.viewTypeUsed).toBe('player');
    expect(result.evaluation?.activatedMetricIds).toContain('S16');
  });

  it('LAB_SP09 returns evaluation', async () => {
    const result = await runScenario('LAB_SP09');
    expect(result.evaluation).toBeDefined();
    expect(result.evaluation?.metricResults.some((metric) => metric.metricId === 'SP09')).toBe(true);
  });

  it('LAB_H13 includes danger context in encode', async () => {
    const result = await runScenario('LAB_H13');
    expect(result.encoded).toBeDefined();
    expect(result.reportText).toContain('LAB_H13');
  });

  it('throws for unknown scenario', async () => {
    await expect(runScenario('LAB_MISSING')).rejects.toThrow(DevLabScenarioError);
  });

  it('getScenarioById returns undefined for missing id', () => {
    expect(getScenarioById('NOPE')).toBeUndefined();
  });
});
