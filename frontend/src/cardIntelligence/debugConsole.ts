import { encodeDecisionState } from './encoder/encodeDecisionState';
import type { EncoderInput, EncodedDecisionState } from './encoder/types';
import { CardDecisionLogEvent, LogEvent } from './shared/types/logEvents';
import { TrickEndEvent } from './shared/types/trickEndEvent';
import { openLogDatabase } from './shared/storage/indexedDb';

export async function loadAllLogEvents(): Promise<LogEvent[]> {
  const db = await openLogDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('events', 'readonly');
    const req = tx.objectStore('events').getAll();
    req.onsuccess = () => {
      db.close();
      resolve(req.result as LogEvent[]);
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error('Failed to read events'));
    };
  });
}

export function sortEventsByTimestamp(events: LogEvent[]): LogEvent[] {
  return [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function splitLogEvents(events: LogEvent[]): {
  plays: CardDecisionLogEvent[];
  trickEnds: TrickEndEvent[];
} {
  const plays: CardDecisionLogEvent[] = [];
  const trickEnds: TrickEndEvent[] = [];
  for (const event of events) {
    if ('eventType' in event && event.eventType === 'trick_end') {
      trickEnds.push(event as TrickEndEvent);
    } else {
      plays.push(event as CardDecisionLogEvent);
    }
  }
  return { plays, trickEnds };
}

export function summarizeLogEvents(events: LogEvent[]): Record<string, unknown> {
  const { plays, trickEnds } = splitLogEvents(events);
  const byVariant = (list: LogEvent[]) =>
    list.reduce<Record<string, number>>((acc, e) => {
      acc[e.variant] = (acc[e.variant] ?? 0) + 1;
      return acc;
    }, {});

  const maxTrickAfter = Math.max(0, ...plays.map((e) => e.trickAfter?.length ?? 0));
  const sortedPlays = [...plays].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const sortedTricks = [...trickEnds].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const lastPlay = sortedPlays.at(-1);
  const lastTrickEnd = sortedTricks.at(-1);

  return {
    total: events.length,
    plays: plays.length,
    trickEnds: trickEnds.length,
    byVariantPlays: byVariant(plays),
    byVariantTrickEnds: byVariant(trickEnds),
    maxTrickAfter,
    lastPlay: lastPlay
      ? {
          trickIndex: lastPlay.trickIndex,
          turnIndex: lastPlay.turnIndex,
          playerIndex: lastPlay.playerIndex,
          chosenCard: lastPlay.chosenCard,
        }
      : null,
    lastTrickEnd: lastTrickEnd
      ? {
          trickIndex: lastTrickEnd.trickIndex,
          winnerIndex: lastTrickEnd.winnerIndex,
          pointsInTrick: lastTrickEnd.pointsInTrick,
        }
      : null,
  };
}

export interface CiEncodeOptions {
  trickEndEvent?: TrickEndEvent;
  encodeMode?: EncoderInput['encodeMode'];
  viewType?: EncoderInput['viewType'];
  allowEngineView?: boolean;
}

export function ciEncode(
  event: CardDecisionLogEvent,
  options: CiEncodeOptions = {}
): EncodedDecisionState {
  return encodeDecisionState(
    {
      event,
      trickEndEvent: options.trickEndEvent,
      encodeMode: options.encodeMode,
      viewType: options.viewType,
    },
    { allowEngineView: options.allowEngineView ?? true }
  );
}

export interface CardIntelligenceDebugConsole {
  loadEvents: typeof loadAllLogEvents;
  summarize: typeof summarizeLogEvents;
  encode: typeof ciEncode;
  sortByTimestamp: typeof sortEventsByTimestamp;
  split: typeof splitLogEvents;
}

declare global {
  interface Window {
    __ci?: CardIntelligenceDebugConsole;
    __ciEncode?: typeof ciEncode;
    __ciLoadEvents?: typeof loadAllLogEvents;
    __ciSummarize?: typeof summarizeLogEvents;
  }
}

export function installCardIntelligenceDebugConsole(): void {
  const api: CardIntelligenceDebugConsole = {
    loadEvents: loadAllLogEvents,
    summarize: summarizeLogEvents,
    encode: ciEncode,
    sortByTimestamp: sortEventsByTimestamp,
    split: splitLogEvents,
  };

  window.__ci = api;
  window.__ciEncode = ciEncode;
  window.__ciLoadEvents = loadAllLogEvents;
  window.__ciSummarize = summarizeLogEvents;

  console.info(
    '[CardIntelligence H3] Debug console ready:\n' +
      '  await __ciLoadEvents() — all IDB events\n' +
      '  __ciSummarize(await __ciLoadEvents()) — summary\n' +
      '  __ciEncode(playEvent) — EncodedDecisionState\n' +
      '  __ci.encode / __ci.loadEvents / __ci.summarize'
  );
}
