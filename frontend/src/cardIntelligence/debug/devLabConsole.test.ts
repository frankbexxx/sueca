/** @jest-environment jsdom */

const mockFeatures = {
  CARD_INTELLIGENCE_DEBUG: false,
  CARD_INTELLIGENCE_DEV_LAB: false,
  CARD_INTELLIGENCE_LLM_ADVISORY: false,
};

jest.mock('../../config/features', () => mockFeatures);

describe('devLabConsole', () => {
  beforeEach(() => {
    jest.resetModules();
    mockFeatures.CARD_INTELLIGENCE_DEBUG = false;
    mockFeatures.CARD_INTELLIGENCE_DEV_LAB = false;
    delete window.__ciListScenarios;
    delete window.__ciRunScenario;
    delete window.__ciRunSeededGame;
    delete window.__ciScenarioReport;
    delete window.__ciExportScenario;
    delete window.__ciLab;
  });

  function loadInstall() {
    const { installCardIntelligenceDevLabConsole } = require('./devLabConsole');
    return installCardIntelligenceDevLabConsole;
  }

  it('does not install helpers when flags are off', () => {
    loadInstall()();
    expect(window.__ciRunScenario).toBeUndefined();
  });

  it('does not install when only DEBUG is on', () => {
    mockFeatures.CARD_INTELLIGENCE_DEBUG = true;
    loadInstall()();
    expect(window.__ciRunScenario).toBeUndefined();
  });

  it('installs helpers when both flags are on', () => {
    mockFeatures.CARD_INTELLIGENCE_DEBUG = true;
    mockFeatures.CARD_INTELLIGENCE_DEV_LAB = true;
    loadInstall()();
    expect(typeof window.__ciListScenarios).toBe('function');
    expect(typeof window.__ciRunScenario).toBe('function');
    expect(typeof window.__ciRunSeededGame).toBe('function');
    expect(window.__ciLab).toBeDefined();
  });
});
