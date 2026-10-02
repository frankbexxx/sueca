import type { MatchResult } from '../types/matchResult';
import { audioCueFromMatchResult, type HumanAudioCue } from '../models/matchResult';

export type HumanGameAudioResult = HumanAudioCue;

/**
 * Whether an intermediate round-end cue should fire.
 * Game-over must not play round-end (final cue only).
 */
export function shouldPlayRoundEndCue(args: {
  prevWaitingForRoundEnd: boolean | null;
  waitingForRoundEnd: boolean;
  isGameOver: boolean;
}): boolean {
  const { prevWaitingForRoundEnd, waitingForRoundEnd, isGameOver } = args;
  if (isGameOver) return false;
  return prevWaitingForRoundEnd === false && waitingForRoundEnd;
}

/**
 * Human win/lose/draw for final game-result SFX.
 * Reads the engine match result. Does not inspect scores.
 */
export function resolveHumanGameAudioResult(args: {
  matchResult: MatchResult | null | undefined;
  localPlayerIndex: number;
  localTeam: 1 | 2 | null;
}): HumanGameAudioResult | null {
  return audioCueFromMatchResult(args.matchResult, {
    playerIndex: args.localPlayerIndex,
    team: args.localTeam
  });
}
