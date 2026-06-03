import { RoundPlayEntry } from '../shared/types/logEvents';

export class RoundHistorySession {
  private entries: RoundPlayEntry[] = [];

  reset(): void {
    this.entries = [];
  }

  snapshot(): RoundPlayEntry[] {
    return this.entries.map((entry) => ({
      ...entry,
      card: { ...entry.card },
    }));
  }

  append(entry: RoundPlayEntry): RoundPlayEntry[] {
    this.entries.push({
      ...entry,
      card: { ...entry.card },
    });
    return this.snapshot();
  }
}

export const roundHistorySession = new RoundHistorySession();

export function resetRoundHistorySessionForTests(): void {
  roundHistorySession.reset();
}
