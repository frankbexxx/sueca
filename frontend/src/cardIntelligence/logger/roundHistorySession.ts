import { resetRoundHistoryEngineForTests, roundHistoryEngine } from '../history/roundHistory';
import { RoundPlayEntry } from '../shared/types/logEvents';

/** @deprecated Use roundHistoryEngine — kept for test compat */
export class RoundHistorySession {
  reset(): void {
    roundHistoryEngine.reset();
  }

  snapshot(): RoundPlayEntry[] {
    return roundHistoryEngine.snapshotEntries();
  }

  append(entry: RoundPlayEntry): RoundPlayEntry[] {
    roundHistoryEngine.recordPlay(entry);
    return roundHistoryEngine.snapshotEntries();
  }
}

export const roundHistorySession = new RoundHistorySession();

export function resetRoundHistorySessionForTests(): void {
  resetRoundHistoryEngineForTests();
}
