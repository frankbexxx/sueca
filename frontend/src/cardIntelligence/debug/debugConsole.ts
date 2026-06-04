import { CardDecisionLogEvent } from '../shared/types/logEvents';
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
import { buildPostGameReport } from './postGameReport';
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
import { ClearDebugDataOptions } from './types';

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
  postGameReport: (gameId?: string) => Promise<string>;
  clearAllData: (opts?: ClearDebugDataOptions) => Promise<{ clearedLogs: boolean; clearedMemory: boolean } | null>;
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
    __ciPostGameReport?: (gameId?: string) => Promise<string>;
    __ciClearAllCardIntelligenceData?: (
      opts?: ClearDebugDataOptions
    ) => Promise<{ clearedLogs: boolean; clearedMemory: boolean } | null>;
  }
}

async function buildPostGameReportForGame(gameId?: string): Promise<string> {
  const events = await loadAllLogEvents();
  const filtered = gameId ? events.filter((e) => e.gameId === gameId) : events;
  const { plays } = splitLogEvents(filtered);
  const gamePlays: CardDecisionLogEvent[] = [...plays].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
  const targetGameId = gameId ?? gamePlays[0]?.gameId;
  const scopedPlays = targetGameId
    ? gamePlays.filter((p) => p.gameId === targetGameId)
    : gamePlays;

  const evaluations =
    targetGameId != null
      ? (await evaluateStoredGame(targetGameId))
          .map((r) => r.evaluation)
          .filter((e): e is NonNullable<typeof e> => e != null)
      : [];

  const aggregates = await listMemoryAggregates(
    scopedPlays[0]?.variant ? { variant: scopedPlays[0].variant } : {}
  );

  return buildPostGameReport({
    gameId: targetGameId,
    plays: scopedPlays,
    evaluations,
    aggregates,
  });
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
    clearAllData: clearWithConfirm,
  };

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
  window.__ciClearAllCardIntelligenceData = clearWithConfirm;

  console.info(
    '[CardIntelligence] Debug console ready (Impl 7):\n' +
      '  await __ciLoadEvents()\n' +
      '  __ciSummarize(await __ciLoadEvents())\n' +
      '  await __ciEvaluateEvent("<eventId>")\n' +
      '  await __ciExportLogsJsonl({ includeEvaluations: true })\n' +
      '  await __ciListMemory()\n' +
      '  __ci.encode / __ci.exportJsonl / …'
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
  clearAllCardIntelligenceDebugData,
  confirmClearAllCardIntelligenceDebugData,
} from './clearDebugData';
export * from './types';
