import type { GameVariant } from '../types/game';

export type HumanGameAudioResult = 'win' | 'lose' | 'draw';

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
 * Hearts: lowest score wins. King: highest score wins.
 * Sueca/Spades: local team vs engine `winner` (1|2).
 * Tied best scores → draw (no win/lose cue).
 */
export function resolveHumanGameAudioResult(args: {
  variant: GameVariant;
  winner: 1 | 2 | null;
  localPlayerIndex: number;
  players: Array<{ team?: 1 | 2 }>;
  individualScores?: number[] | null;
}): HumanGameAudioResult | null {
  const { variant, winner, localPlayerIndex, players, individualScores } = args;

  if (variant === 'hearts') {
    if (!individualScores || individualScores.length < 4) return null;
    const best = Math.min(...individualScores);
    const tied = individualScores.filter((s) => s === best).length > 1;
    if (tied) return 'draw';
    return individualScores.indexOf(best) === localPlayerIndex ? 'win' : 'lose';
  }

  if (variant === 'king') {
    if (!individualScores || individualScores.length < 4) return null;
    const best = Math.max(...individualScores);
    const tied = individualScores.filter((s) => s === best).length > 1;
    if (tied) return 'draw';
    return individualScores.indexOf(best) === localPlayerIndex ? 'win' : 'lose';
  }

  if (variant !== 'sueca' && variant !== 'spades') return null;
  if (winner == null) return null;
  const us = players[localPlayerIndex]?.team;
  if (us == null) return null;
  return us === winner ? 'win' : 'lose';
}
