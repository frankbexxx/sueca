/** @jest-environment jsdom */

const mockFeatures = {
  CARD_INTELLIGENCE_DEBUG: false,
  CARD_INTELLIGENCE_DEV_LAB: false,
  CARD_INTELLIGENCE_LLM_ADVISORY: false,
};

jest.mock('../../../config/features', () => mockFeatures);

describe('devLabConsole T12', () => {
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
    delete window.__ciEventReport;
    delete window.__ciGameReport;
  });

  it('uses same __ciScenarioReport reference as debugConsole', () => {
    mockFeatures.CARD_INTELLIGENCE_DEBUG = true;
    mockFeatures.CARD_INTELLIGENCE_DEV_LAB = true;

    const { installCardIntelligenceDebugConsole } = require('../debugConsole');
    const { installCardIntelligenceDevLabConsole } = require('../devLabConsole');
    const { ciScenarioReport } = require('./buildScenarioReport');

    installCardIntelligenceDebugConsole();
    const fromDebug = window.__ciScenarioReport;
    installCardIntelligenceDevLabConsole();
    const fromLab = window.__ciScenarioReport;

    expect(fromDebug).toBe(ciScenarioReport);
    expect(fromLab).toBe(ciScenarioReport);
    expect(fromLab).toBe(fromDebug);
  });
});
