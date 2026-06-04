import { PlayerType } from '../../types/game';
import { CardDecisionLogEvent, LogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import { openLogDatabase } from '../shared/storage/indexedDb';

export async function loadAllLogEvents(): Promise<LogEvent[]> {
  try {
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
  } catch {
    return [];
  }
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

export function filterLogEvents(
  events: LogEvent[],
  opts?: {
    gameId?: string;
    eventId?: string;
    playerType?: PlayerType;
    variant?: CardDecisionLogEvent['variant'];
  }
): LogEvent[] {
  return events.filter((event) => {
    if (opts?.gameId && event.gameId !== opts.gameId) return false;
    if (opts?.eventId && event.eventId !== opts.eventId) return false;
    if (opts?.variant && event.variant !== opts.variant) return false;
    if (opts?.playerType && 'playerType' in event && event.playerType !== opts.playerType) {
      return false;
    }
    return true;
  });
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

export async function findPlayByEventId(
  eventId: string
): Promise<CardDecisionLogEvent | null> {
  const events = await loadAllLogEvents();
  const { plays } = splitLogEvents(events);
  return plays.find((p) => p.eventId === eventId) ?? null;
}

export async function listGameIds(): Promise<string[]> {
  const events = await loadAllLogEvents();
  return Array.from(new Set(events.map((e) => e.gameId))).sort();
}
