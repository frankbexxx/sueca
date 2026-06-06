import { labFromFixture } from './presetScenarios';
import { buildScenarioReport } from './scenarioReport';

describe('buildScenarioReport', () => {
  it('formats readable report text', () => {
    const scenario = labFromFixture('LAB_K02', 'K02');
    const text = buildScenarioReport({ scenario, warnings: [] });
    expect(text).toContain('Card Intelligence — Dev Lab Report');
    expect(text).toContain('LAB_K02');
    expect(text).toContain('Warnings: (none)');
  });
});
