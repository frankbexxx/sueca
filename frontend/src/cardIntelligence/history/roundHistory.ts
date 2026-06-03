import { RoundPlayEntry } from '../shared/types/logEvents';
import { cloneCard } from '../shared/clone';
import { CompletedTrickRecord, TrickPlayRecord } from './types';
import { clonePlayRecord, snapshotPlayRecords } from './historySelectors';

export class RoundHistoryEngine {
  private plays: TrickPlayRecord[] = [];
  private completedTricks: CompletedTrickRecord[] = [];

  reset(): void {
    this.plays = [];
    this.completedTricks = [];
  }

  recordPlay(entry: RoundPlayEntry): void {
    this.plays.push({
      roundIndex: entry.roundIndex,
      trickIndex: entry.trickIndex,
      turnIndex: entry.turnIndex,
      playerIndex: entry.playerIndex,
      card: cloneCard(entry.card),
    });
  }

  snapshotEntries(): RoundPlayEntry[] {
    return this.plays.map((p) => clonePlayRecord(p));
  }

  getPlays(): TrickPlayRecord[] {
    return snapshotPlayRecords(this.plays);
  }

  getCompletedTricks(): CompletedTrickRecord[] {
    return this.completedTricks.map((t) => ({
      ...t,
      plays: snapshotPlayRecords(t.plays),
      variantFields: { ...t.variantFields },
    }));
  }

  /**
   * Build completed trick from the last 4 plays matching roundIndex + trickIndex.
   */
  completeTrick(record: CompletedTrickRecord): void {
    if (record.plays.length !== 4) {
      throw new Error('CompletedTrickRecord must have exactly 4 plays');
    }
    this.completedTricks.push({
      ...record,
      plays: snapshotPlayRecords(record.plays),
    });
  }

  lastTrickPlays(roundIndex: number, trickIndex: number): TrickPlayRecord[] {
    const matching = this.plays.filter(
      (p) => p.roundIndex === roundIndex && p.trickIndex === trickIndex
    );
    if (matching.length < 4) {
      return snapshotPlayRecords(matching.slice(-4));
    }
    return snapshotPlayRecords(matching.slice(-4));
  }
}

export const roundHistoryEngine = new RoundHistoryEngine();

export function resetRoundHistoryEngineForTests(): void {
  roundHistoryEngine.reset();
}
