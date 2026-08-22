import {
  CARD_INTELLIGENCE_DEBUG,
  CARD_INTELLIGENCE_DEV_LAB,
  CARD_INTELLIGENCE_LLM_ADVISORY,
} from '../../config/features';
import { mapLegalMoveRisks } from '../evaluator/mapLegalMoveRisks';
import type { LegalMoveRiskMapInput } from '../evaluator/types';
import { buildMiniLLMInputFromStoredEvent } from '../llm/buildMiniLLMInput';
import { getMiniLLMAdvice } from '../llm/getMiniLLMAdvice';
import type { MiniLLMAdvisoryResult } from '../llm/types';
import { MemoryQuery } from '../memory/types';
import {
  clearAllCardIntelligenceDebugData,
  confirmClearAllCardIntelligenceDebugData,
} from './clearDebugData';
import {
  ciEncode,
  encodeStoredPlayByEventId,
  evaluateStoredGame,
  evaluateStoredPlayByEventId,
} from './evaluateStoredEvents';
import { exportCardIntelligenceJsonl } from './exportJsonl';
import {
  ciEventReport,
  ciExportReport,
  ciGameReport,
  ciScenarioReport,
} from './reportFlow';
import { DebugReportError } from './reportFlow/errors';
import type {
  DebugReportDocument,
  ExportReportResult,
  ReportExportOptions,
  ReportFlowOptions,
} from './reportFlow/types';
import { ClearDebugDataOptions } from './types';
import {
  ingestEvaluationsOffline,
  listMemoryAggregates,
} from './readMemory';
import {
  loadAllLogEvents,
  sortEventsByTimestamp,
  splitLogEvents,
  summarizeLogEvents,
} from './readLogs';

export type { CiEncodeOptions } from './evaluateStoredEvents';

export interface CardIntelligenceDebugConsole {
  loadEvents: typeof loadAllLogEvents;
  summarize: typeof summarizeLogEvents;
  encode: typeof ciEncode;
  sortByTimestamp: typeof sortEventsByTimestamp;
  split: typeof splitLogEvents;
  exportJsonl: typeof exportCardIntelligenceJsonl;
  evaluateEvent: typeof evaluateStoredPlayByEventId;
  evaluateGame: typeof evaluateStoredGame;
  encodeEvent: typeof encodeStoredPlayByEventId;
  listMemory: typeof listMemoryAggregates;
  ingestEvaluations: typeof ingestEvaluationsOffline;
  postGameReport: (gameId?: string, opts?: ReportFlowOptions) => Promise<string | DebugReportDocument>;
  eventReport: (
    eventId: string,
    opts?: ReportFlowOptions
  ) => Promise<string | DebugReportDocument>;
  gameReport: (
    gameId?: string,
    opts?: ReportFlowOptions
  ) => Promise<string | DebugReportDocument>;
  exportReport: (options: ReportExportOptions) => Promise<ExportReportResult>;
  scenarioReport?: (
    scenarioId: string,
    opts?: ReportFlowOptions
  ) => Promise<string | DebugReportDocument>;
  clearAllData: (opts?: ClearDebugDataOptions) => Promise<{ clearedLogs: boolean; clearedMemory: boolean } | null>;
  getMiniLLMAdvice?: (
    eventId: string,
    opts?: { fallbackMoveIndex?: number; memoryQuery?: MemoryQuery; includeMemoryHints?: boolean }
  ) => Promise<MiniLLMAdvisoryResult | null>;
  mapLegalMoveRisks?: (input: LegalMoveRiskMapInput) => ReturnType<typeof mapLegalMoveRisks>;
}

declare global {
  interface Window {
    __ci?: CardIntelligenceDebugConsole;
    __ciEncode?: typeof ciEncode;
    __ciLoadEvents?: typeof loadAllLogEvents;
    __ciSummarize?: typeof summarizeLogEvents;
    __ciExportLogsJsonl?: typeof exportCardIntelligenceJsonl;
    __ciEncodeEvent?: typeof encodeStoredPlayByEventId;
    __ciEvaluateEvent?: typeof evaluateStoredPlayByEventId;
    __ciEvaluateGame?: typeof evaluateStoredGame;
    __ciListMemory?: typeof listMemoryAggregates;
    __ciIngestEvaluations?: typeof ingestEvaluationsOffline;
    __ciPostGameReport?: (
      gameId?: string,
      opts?: ReportFlowOptions
    ) => Promise<string | DebugReportDocument>;
    __ciEventReport?: typeof ciEventReport;
    __ciGameReport?: typeof ciGameReportForConsole;
    __ciExportReport?: typeof ciExportReport;
    __ciScenarioReport?: typeof ciScenarioReport;
    __ciClearAllCardIntelligenceData?: (
      opts?: ClearDebugDataOptions
    ) => Promise<{ clearedLogs: boolean; clearedMemory: boolean } | null>;
    __ciGetMiniLLMAdvice?: (
      eventId: string,
      opts?: {
        fallbackMoveIndex?: number;
        memoryQuery?: MemoryQuery;
        includeMemoryHints?: boolean;
      }
    ) => Promise<MiniLLMAdvisoryResult | null>;
    __ciMapLegalRisks?: (input: LegalMoveRiskMapInput) => ReturnType<typeof mapLegalMoveRisks>;
  }
}

async function ciGameReportForConsole(
  gameId?: string,
  opts: ReportFlowOptions = {}
): Promise<string | DebugReportDocument> {
  let targetGameId = gameId;
  if (!targetGameId) {
    const events = await loadAllLogEvents();
    const { plays } = splitLogEvents(events);
    const sorted = [...plays].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    targetGameId = sorted[0]?.gameId;
  }
  if (!targetGameId) {
    throw new DebugReportError('No game events found in debug logs');
  }
  return ciGameReport(targetGameId, opts);
}

async function buildPostGameReportForGame(
  gameId?: string,
  opts?: ReportFlowOptions
): Promise<string | DebugReportDocument> {
  return ciGameReportForConsole(gameId, opts);
}

async function ciGetMiniLLMAdviceForEvent(
  eventId: string,
  opts?: {
    fallbackMoveIndex?: number;
    memoryQuery?: MemoryQuery;
    includeMemoryHints?: boolean;
  }
): Promise<MiniLLMAdvisoryResult | null> {
  const input = await buildMiniLLMInputFromStoredEvent(eventId, opts);
  if (!input) return null;
  return getMiniLLMAdvice(input, { includePromptText: true, forceAdvisory: true });
}

function mapLegalMoveRisksForConsole(input: LegalMoveRiskMapInput) {
  return mapLegalMoveRisks(input);
}

export function installCardIntelligenceDebugConsole(): void {
  const clearWithConfirm = async (
    opts?: ClearDebugDataOptions
  ): Promise<{ clearedLogs: boolean; clearedMemory: boolean } | null> => {
    if (!confirmClearAllCardIntelligenceDebugData(opts)) return null;
    return clearAllCardIntelligenceDebugData(opts);
  };

  const api: CardIntelligenceDebugConsole = {
    loadEvents: loadAllLogEvents,
    summarize: summarizeLogEvents,
    encode: ciEncode,
    sortByTimestamp: sortEventsByTimestamp,
    split: splitLogEvents,
    exportJsonl: exportCardIntelligenceJsonl,
    evaluateEvent: evaluateStoredPlayByEventId,
    evaluateGame: evaluateStoredGame,
    encodeEvent: encodeStoredPlayByEventId,
    listMemory: listMemoryAggregates,
    ingestEvaluations: ingestEvaluationsOffline,
    postGameReport: buildPostGameReportForGame,
    eventReport: ciEventReport,
    gameReport: ciGameReportForConsole,
    exportReport: ciExportReport,
    clearAllData: clearWithConfirm,
  };

  if (CARD_INTELLIGENCE_DEV_LAB) {
    api.scenarioReport = ciScenarioReport;
  }

  window.__ci = api;
  window.__ciEncode = ciEncode;
  window.__ciLoadEvents = loadAllLogEvents;
  window.__ciSummarize = summarizeLogEvents;
  window.__ciExportLogsJsonl = exportCardIntelligenceJsonl;
  window.__ciEncodeEvent = encodeStoredPlayByEventId;
  window.__ciEvaluateEvent = evaluateStoredPlayByEventId;
  window.__ciEvaluateGame = evaluateStoredGame;
  window.__ciListMemory = listMemoryAggregates;
  window.__ciIngestEvaluations = ingestEvaluationsOffline;
  window.__ciPostGameReport = buildPostGameReportForGame;
  window.__ciEventReport = ciEventReport;
  window.__ciGameReport = ciGameReportForConsole;
  window.__ciExportReport = ciExportReport;
  if (CARD_INTELLIGENCE_DEV_LAB) {
    window.__ciScenarioReport = ciScenarioReport;
  }
  window.__ciClearAllCardIntelligenceData = clearWithConfirm;

  if (CARD_INTELLIGENCE_DEBUG && CARD_INTELLIGENCE_LLM_ADVISORY) {
    const getAdvice = ciGetMiniLLMAdviceForEvent;
    api.getMiniLLMAdvice = getAdvice;
    window.__ciGetMiniLLMAdvice = getAdvice;
  }

  if (CARD_INTELLIGENCE_DEBUG) {
    api.mapLegalMoveRisks = mapLegalMoveRisksForConsole;
    window.__ciMapLegalRisks = mapLegalMoveRisksForConsole;
  }

  console.info(
    '[CardIntelligence] Debug console ready (Impl 10):\n' +
      '  await __ciEventReport("<eventId>")\n' +
      '  await __ciGameReport("<gameId>")\n' +
      (CARD_INTELLIGENCE_DEV_LAB
        ? '  await __ciScenarioReport("LAB_K02")  // requires DEV_LAB\n'
        : '') +
      '  await __ciExportReport({ kind: "game", gameId: "...", format: "text" })\n' +
      '  await __ciLoadEvents() / __ciEvaluateEvent / __ciExportLogsJsonl\n' +
      (CARD_INTELLIGENCE_LLM_ADVISORY
        ? '  await __ciGetMiniLLMAdvice("<eventId>") — advisory only; no play\n'
        : '') +
      '  __ciPostGameReport is an alias of __ciGameReport\n' +
      (CARD_INTELLIGENCE_DEBUG
        ? '  await __ciMapLegalRisks({...}) — debug legal move risk map\n'
        : '')
  );
}

export {
  loadAllLogEvents,
  sortEventsByTimestamp,
  splitLogEvents,
  summarizeLogEvents,
  filterLogEvents,
  findPlayByEventId,
  listGameIds,
} from './readLogs';
export {
  ciEncode,
  findTrickEndForPlay,
  evaluateStoredPlay,
  evaluateStoredPlayByEventId,
  evaluateStoredGame,
  encodeStoredPlayByEventId,
} from './evaluateStoredEvents';
export { exportCardIntelligenceJsonl, buildJsonlLines, buildExportFilename } from './exportJsonl';
export { listMemoryAggregates, ingestEvaluationsOffline } from './readMemory';
export { buildPostGameReport } from './postGameReport';
export {
  ciEventReport,
  ciExportReport,
  ciGameReport,
  ciScenarioReport,
  buildScenarioDebugReport,
  buildEventDebugReport,
  buildGameDebugReport,
  exportDebugReport,
  formatHumanReport,
  DEBUG_REPORT_SCHEMA_VERSION,
} from './reportFlow';
export type {
  DebugReportDocument,
  ReportFlowOptions,
  ReportExportOptions,
  ExportReportResult,
} from './reportFlow';
export {
  clearAllCardIntelligenceDebugData,
  confirmClearAllCardIntelligenceDebugData,
} from './clearDebugData';
export * from './types';
