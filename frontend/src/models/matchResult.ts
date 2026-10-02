import type { IndividualMatchResult, MatchResult, TeamMatchResult } from '../types/matchResult';

export type HumanAudioCue = 'win' | 'lose' | 'draw';

export type MatchHistoryProjection = {
  resultKind: 'team' | 'individual';
  /** Winning team, or the unique winning seat. Null on an individual tie. */
  winner: number | null;
  /** Present only when several seats share the winning score. */
  tiedSeats?: number[];
  playerWon: boolean;
};

function isSeat(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 3;
}

export function isMatchResult(value: unknown): value is MatchResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as MatchResult;
  if (result.kind === 'team') {
    return (
      (result.winnerTeam === 1 || result.winnerTeam === 2 || result.winnerTeam === null) &&
      typeof result.draw === 'boolean'
    );
  }
  if (result.kind === 'individual') {
    return (
      Array.isArray(result.winnerSeats) &&
      result.winnerSeats.every(isSeat) &&
      typeof result.draw === 'boolean'
    );
  }
  return false;
}

export function teamMatchResult(winnerTeam: 1 | 2): TeamMatchResult {
  return { kind: 'team', winnerTeam, draw: false };
}

/** Seats are the winning score holders already chosen by the variant engine. */
export function individualMatchResult(winnerSeats: readonly number[]): IndividualMatchResult {
  const seats = [...winnerSeats].filter(isSeat).sort((a, b) => a - b);
  return { kind: 'individual', winnerSeats: seats, draw: seats.length > 1 };
}

/**
 * Local win / loss / draw from the engine result.
 * An individual tie is a draw for every seat, matching the previous Hearts and King cue.
 */
export function audioCueFromMatchResult(
  result: MatchResult | null | undefined,
  local: { playerIndex: number; team: 1 | 2 | null }
): HumanAudioCue | null {
  if (!result) return null;
  if (result.kind === 'team') {
    if (result.draw) return 'draw';
    if (result.winnerTeam == null || local.team == null) return null;
    return local.team === result.winnerTeam ? 'win' : 'lose';
  }
  if (result.draw) return 'draw';
  const seat = result.winnerSeats[0];
  if (seat == null) return null;
  return seat === local.playerIndex ? 'win' : 'lose';
}

export function historyFieldsFromMatchResult(
  result: MatchResult,
  localTeam: 1 | 2 | null,
  localPlayerIndex: number
): MatchHistoryProjection {
  if (result.kind === 'team') {
    return {
      resultKind: 'team',
      winner: result.winnerTeam,
      playerWon: result.winnerTeam != null && localTeam === result.winnerTeam
    };
  }
  if (result.draw) {
    return {
      resultKind: 'individual',
      winner: null,
      tiedSeats: [...result.winnerSeats],
      playerWon: false
    };
  }
  const seat = result.winnerSeats[0] ?? null;
  return {
    resultKind: 'individual',
    winner: seat,
    playerWon: seat === localPlayerIndex
  };
}

export function modalFocusFromMatchResult(result: MatchResult | null | undefined): {
  winnerTeam: 1 | 2 | null;
  winnerSeats: number[];
  draw: boolean;
} {
  if (!isMatchResult(result)) {
    return { winnerTeam: null, winnerSeats: [], draw: false };
  }
  if (result.kind === 'team') {
    return { winnerTeam: result.winnerTeam, winnerSeats: [], draw: result.draw };
  }
  return {
    winnerTeam: null,
    winnerSeats: [...result.winnerSeats],
    draw: result.draw
  };
}
