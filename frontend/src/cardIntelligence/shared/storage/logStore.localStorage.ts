import { CardDecisionLogEvent, LogSessionMeta } from '../types/logEvents';

const FALLBACK_KEY = 'card-intelligence-log-events-fallback';
const MAX_FALLBACK_EVENTS = 50;

export interface LogStore {
  appendEvent(event: CardDecisionLogEvent, sessionMeta: LogSessionMeta): Promise<void>;
}

export function readFallbackEvents(): CardDecisionLogEvent[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(FALLBACK_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CardDecisionLogEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFallbackEvents(events: CardDecisionLogEvent[]): void {
  if (typeof localStorage === 'undefined') return;
  const trimmed = events.slice(-MAX_FALLBACK_EVENTS);
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(trimmed));
}

export class LocalStorageLogStore implements LogStore {
  async appendEvent(event: CardDecisionLogEvent, _sessionMeta: LogSessionMeta): Promise<void> {
    const events = readFallbackEvents();
    events.push(event);
    writeFallbackEvents(events);
  }
}

export function clearFallbackEventsForTests(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(FALLBACK_KEY);
}
