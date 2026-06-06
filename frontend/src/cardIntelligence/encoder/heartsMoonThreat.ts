import { RoundPlayEntry } from '../shared/types/logEvents';
import { HeartsEncoding } from './types';

export type MoonThreatLevel = HeartsEncoding['moonThreatLevel'];

export interface PlayerHeartsStats {
  heartsCount: number;
  points: number;
}

export function countHeartsByPlayer(
  history: RoundPlayEntry[]
): Map<number, PlayerHeartsStats> {
  const map = new Map<number, PlayerHeartsStats>();
  for (const play of history) {
    const stat = map.get(play.playerIndex) ?? { heartsCount: 0, points: 0 };
    if (play.card.suit === 'hearts') {
      stat.heartsCount += 1;
      stat.points += 1;
    }
    if (play.card.rank === 'Q' && play.card.suit === 'spades') {
      stat.points += 13;
    }
    map.set(play.playerIndex, stat);
  }
  return map;
}

function tiedTopCandidates(
  stats: Map<number, PlayerHeartsStats>,
  pick: (s: PlayerHeartsStats) => number,
  threshold: number
): boolean {
  const values = Array.from(stats.values()).map(pick);
  const max = Math.max(...values, 0);
  if (max < threshold) return false;
  const leaders = Array.from(stats.entries()).filter(([, s]) => pick(s) === max);
  return leaders.length > 1;
}

export function deriveMoonThreatLevel(
  heartsBroken: boolean | null,
  history: RoundPlayEntry[]
): MoonThreatLevel {
  if (heartsBroken !== true || history.length === 0) {
    return null;
  }

  const stats = countHeartsByPlayer(history);
  if (stats.size === 0) return null;

  if (
    tiedTopCandidates(stats, (s) => s.heartsCount, 4) ||
    tiedTopCandidates(stats, (s) => s.points, 20)
  ) {
    return null;
  }

  let hasLikely = false;
  let hasPossible = false;

  for (const stat of Array.from(stats.values())) {
    if (stat.heartsCount >= 8 || stat.points >= 22) {
      hasLikely = true;
    }
    if (stat.heartsCount >= 4 || stat.points >= 20) {
      hasPossible = true;
    }
  }

  if (hasLikely) return 'likely';
  if (hasPossible) return 'possible';
  return 'none';
}
