import {
  CARD_INTELLIGENCE_DEBUG,
  CARD_INTELLIGENCE_DEV_LAB,
} from '../../config/features';
import { listScenarios } from '../devLab/presetScenarios';
import { exportScenarioJsonl, runScenario } from '../devLab/runScenario';
import { generateSeededDeal } from '../devLab/seededRandom';
import { ciScenarioReport } from './reportFlow/buildScenarioReport';
import type { ScenarioRunOptions, SeededGameOptions } from '../devLab/types';

declare global {
  interface Window {
    __ciListScenarios?: typeof listScenarios;
    __ciRunScenario?: typeof runScenario;
    __ciRunSeededGame?: typeof generateSeededDeal;
    __ciScenarioReport?: typeof ciScenarioReport;
    __ciExportScenario?: (
      id: string,
      opts?: ScenarioRunOptions
    ) => Promise<{ blob: Blob; filename: string }>;
    __ciLab?: {
      listScenarios: typeof listScenarios;
      runScenario: typeof runScenario;
      runSeededGame: typeof generateSeededDeal;
      scenarioReport: typeof ciScenarioReport;
      exportScenario: (
        id: string,
        opts?: ScenarioRunOptions
      ) => Promise<{ blob: Blob; filename: string }>;
    };
  }
}

async function exportScenario(
  id: string,
  opts?: ScenarioRunOptions
): Promise<{ blob: Blob; filename: string }> {
  const result = await runScenario(id, opts);
  const jsonl = exportScenarioJsonl(result);
  const filename = `ci-lab-${id}.jsonl`;
  return { blob: new Blob([jsonl], { type: 'application/x-ndjson' }), filename };
}

export function installCardIntelligenceDevLabConsole(): void {
  if (!CARD_INTELLIGENCE_DEBUG || !CARD_INTELLIGENCE_DEV_LAB) {
    return;
  }

  window.__ciListScenarios = listScenarios;
  window.__ciRunScenario = runScenario;
  window.__ciRunSeededGame = generateSeededDeal;
  window.__ciScenarioReport = ciScenarioReport;
  window.__ciExportScenario = exportScenario;
  window.__ciLab = {
    listScenarios,
    runScenario,
    runSeededGame: generateSeededDeal,
    scenarioReport: ciScenarioReport,
    exportScenario,
  };

  // eslint-disable-next-line no-console
  console.info(
    '[CardIntelligence] Dev Lab ready (Impl 9):\n' +
      '  await __ciListScenarios()\n' +
      '  await __ciRunScenario("LAB_K02")\n' +
      '  await __ciScenarioReport("LAB_K02")\n' +
      '  await __ciRunSeededGame({ variant: "sueca", seed: 42 })'
  );
}

export type { ScenarioRunOptions, SeededGameOptions };
