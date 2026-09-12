/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFeatures = vi.hoisted(() => ({
  CARD_INTELLIGENCE_DEBUG: false,
  CARD_INTELLIGENCE_DEV_LAB: false,
  CARD_INTELLIGENCE_LLM_ADVISORY: false
}));

vi.mock('../../config/features', () => mockFeatures);

describe('devLabConsole', () => {
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
  });

  async function loadInstall() {
    const { installCardIntelligenceDevLabConsole } = await import('./devLabConsole');
    return installCardIntelligenceDevLabConsole;
  }

  it('does not install helpers when flags are off', async () => {
    const install = await loadInstall();
    install();
    expect(window.__ciRunScenario).toBeUndefined();
  });

  it('does not install when only DEBUG is on', async () => {
    mockFeatures.CARD_INTELLIGENCE_DEBUG = true;
    const install = await loadInstall();
    install();
    expect(window.__ciRunScenario).toBeUndefined();
  });

  it('installs helpers when both flags are on', async () => {
    mockFeatures.CARD_INTELLIGENCE_DEBUG = true;
    mockFeatures.CARD_INTELLIGENCE_DEV_LAB = true;
    const install = await loadInstall();
    install();
    expect(typeof window.__ciListScenarios).toBe('function');
    expect(typeof window.__ciRunScenario).toBe('function');
    expect(typeof window.__ciRunSeededGame).toBe('function');
    expect(window.__ciLab).toBeDefined();
  });
});