/** @deprecated Import from `./debug` — thin re-export for H3 compatibility */
export {
  installCardIntelligenceDebugConsole,
  loadAllLogEvents,
  sortEventsByTimestamp,
  splitLogEvents,
  summarizeLogEvents,
  ciEncode,
  findTrickEndForPlay,
  exportCardIntelligenceJsonl,
  evaluateStoredPlayByEventId,
  evaluateStoredGame,
  encodeStoredPlayByEventId,
  listMemoryAggregates,
  ingestEvaluationsOffline,
  buildPostGameReport,
} from './debug/debugConsole';
export type { CiEncodeOptions, CardIntelligenceDebugConsole } from './debug/debugConsole';
