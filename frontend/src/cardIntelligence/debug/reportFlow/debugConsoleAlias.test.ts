/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFeatures = vi.hoisted(() => ({
  CARD_INTELLIGENCE_DEBUG: false,
  CARD_INTELLIGENCE_DEV_LAB: false,
  CARD_INTELLIGENCE_LLM_ADVISORY: false
}));

vi.mock('../../../config/features', () => mockFeatures);

describe('devLabConsole T12', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFeatures.CARD_INTELLIGENCE_DEBUG = false;
    mockFeatures.CARD_INTELLIGENCE_DEV_LAB = false;
    delete window.__ciListScenarios;
    delete window.__ciRunScenario;
    delete window.__ciRunSeededGame;
    delete window.__ciScenarioReport;
    delete window.__ciExportScenario;
    delete window.__ciLab;
    delete window.__ciEventReport;
    delete window.__ciGameReport;
  });

  it('uses same __ciScenarioReport reference as debugConsole', async () => {
    mockFeatures.CARD_INTELLIGENCE_DEBUG = true;
    mockFeatures.CARD_INTELLIGENCE_DEV_LAB = true;

    const { installCardIntelligenceDebugConsole } = await import('../debugConsole');
    const { installCardIntelligenceDevLabConsole } = await import('../devLabConsole');
    const { ciScenarioReport } = await import('./buildScenarioReport');

    installCardIntelligenceDebugConsole();
    const fromDebug = window.__ciScenarioReport;
    installCardIntelligenceDevLabConsole();
    const fromLab = window.__ciScenarioReport;

    expect(fromDebug).toBe(ciScenarioReport);
    expect(fromLab).toBe(ciScenarioReport);
    expect(fromLab).toBe(fromDebug);
  });
});