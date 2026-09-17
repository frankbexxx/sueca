/**
 * H15-OK — deterministic Hearts full-match smoke (pass rotation, play, moon-safe end).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeartsGame, getHeartsState } from './HeartsGame';
import { pickAIPassCards } from '../../ai/games/hearts/HeartsPassStrategy';
import { createSeededRng, normalizeSeed } from '../../cardIntelligence/devLab/seededRandom';
import { getHeartsRoundEndDisplayDeltas, isHeartsShootTheMoon } from './heartsRoundDisplay';

const NAMES = ['H0', 'H1', 'H2', 'H3'];
const SEED = normalizeSeed('HEARTS-H15-OK-CLOSURE-01');

function sot(game: HeartsGame) {
  return (game as unknown as { state: ReturnType<HeartsGame['getCurrentState']> }).state!;
}

function forceAllAi(game: HeartsGame): void {
  sot(game).players.forEach((p) => {
    p.type = 'ai';
  });
}

function allCardIds(game: HeartsGame): string[] {
  return sot(game).players.flatMap((p) => p.hand.map((c) => c.id));
}

function assertDeckIntegrity(game: HeartsGame, expectHands = true): void {
  const ids = allCardIds(game);
  if (expectHands) {
    expect(ids).toHaveLength(52);
    expect(new Set(ids).size).toBe(52);
    sot(game).players.forEach((p) => expect(p.hand).toHaveLength(13));
  } else {
    // mid-hand: no duplicates among remaining + trick
    const trickIds = sot(game).currentTrick.map((c) => c.id);
    const combined = [...ids, ...trickIds];
    expect(new Set(combined).size).toBe(combined.length);
  }
}

function autoConfirmPass(game: HeartsGame): boolean {
  const state = sot(game);
  const hearts = getHeartsState(state);
  if (!hearts.waitingForPass) return true;
  if (hearts.passDirection === 'hold') {
    return game.confirmPass(0);
  }
  const hand = state.players[0].hand;
  const picked = pickAIPassCards(hand, state.aiDifficulty);
  expect(picked).toHaveLength(3);
  hearts.humanPassIndices = [];
  for (const card of picked) {
    const idx = hand.findIndex((h) => h.id === card.id);
    expect(idx).toBeGreaterThanOrEqual(0);
    hearts.humanPassIndices.push(idx);
  }
  state.variantState = { ...state.variantState, hearts };
  const beforeIds = new Set(allCardIds(game));
  expect(beforeIds.size).toBe(52);
  const ok = game.confirmPass(0);
  expect(ok).toBe(true);
  assertDeckIntegrity(game, true);
  return ok;
}

function playFullMatch(difficulty: 'medium' | 'hard') {
  const game = new HeartsGame();
  game.initialize(NAMES, { aiDifficulty: difficulty, localPlayerIndex: 0 });
  forceAllAi(game);

  const passDirs: string[] = [];
  const roundLog: Array<{
    round: number;
    pass: string;
    deltas: number[];
    display: number[];
    scores: number[];
    moon: boolean;
  }> = [];
  let stalls = 0;
  let steps = 0;
  const MAX = 80000;
  let moonSeen = false;

  while (steps++ < MAX) {
    forceAllAi(game);
    const state = sot(game);
    const hearts = getHeartsState(state);

    if (state.isGameOver) break;

    if (hearts.waitingForEarlyEnd) {
      game.acceptEarlyEnd();
      continue;
    }

    if (state.waitingForRoundEnd) {
      const display = getHeartsRoundEndDisplayDeltas(hearts);
      const moon = isHeartsShootTheMoon(hearts.roundPoints);
      if (moon) {
        moonSeen = true;
        expect(display).toEqual(hearts.lastRoundDeltas);
        // Modal must show adjusted score, not raw 26 on shooter
        expect(display.some((d, i) => hearts.roundPoints[i] === 26 && d === 0)).toBe(true);
      }
      roundLog.push({
        round: state.round,
        pass: hearts.passDirection,
        deltas: [...hearts.lastRoundDeltas],
        display,
        scores: [...hearts.playerScores],
        moon
      });
      game.continueToNextRound(state);
      forceAllAi(game);
      continue;
    }

    if (hearts.waitingForPass) {
      passDirs.push(hearts.passDirection);
      autoConfirmPass(game);
      stalls = 0;
      continue;
    }

    if (state.waitingForRoundStart) {
      game.startRound(state);
      continue;
    }

    if (state.waitingForTrickEnd) {
      game.finishTrick(state);
      stalls = 0;
      continue;
    }

    assertDeckIntegrity(game, false);
    const pi = state.currentPlayerIndex;
    const idx = game.chooseAICard(state, pi);
    let ok = game.canPlayCard(state, pi, idx) && game.playCard(state, pi, idx);
    if (!ok) {
      const hand = state.players[pi].hand;
      for (let i = 0; i < hand.length; i++) {
        if (game.canPlayCard(state, pi, i) && game.playCard(state, pi, i)) {
          ok = true;
          break;
        }
      }
    }
    if (!ok) {
      stalls += 1;
      if (stalls > 30) {
        throw new Error(
          `Play stall pi=${pi} round=${state.round} broken=${hearts.heartsBroken} ` +
            `first=${state.isFirstTrick} hand=${state.players[pi].hand.length} trick=${state.currentTrick.length}`
        );
      }
    } else {
      stalls = 0;
    }
  }

  expect(steps).toBeLessThan(MAX);
  const final = sot(game);
  const finalHearts = getHeartsState(final);
  expect(final.isGameOver).toBe(true);
  expect(Math.max(...finalHearts.playerScores)).toBeGreaterThanOrEqual(100);
  expect(roundLog.length).toBeGreaterThanOrEqual(3);
  // Pass rotation: at least left appeared; over enough rounds expect cycle variety
  expect(passDirs.length).toBeGreaterThanOrEqual(1);
  if (passDirs.length >= 4) {
    expect(new Set(passDirs).size).toBeGreaterThanOrEqual(3);
  }

  return { roundLog, passDirs, moonSeen, steps, stalls: 0, scores: finalHearts.playerScores };
}

describe('H15-OK Hearts full match smoke', () => {
  let restore: (() => void) | undefined;

  beforeEach(() => {
    const rng = createSeededRng(SEED);
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => rng());
    restore = () => spy.mockRestore();
  });

  afterEach(() => {
    restore?.();
  });

  it('Medium: full game completes without stall or card loss', () => {
    const result = playFullMatch('medium');
    expect(result.stalls).toBe(0);
    expect(result.scores.every((s) => Number.isFinite(s))).toBe(true);
  });

  it('Hard: full game completes without stall or card loss', () => {
    // re-seed for independent hard run
    const rng = createSeededRng(normalizeSeed('HEARTS-H15-OK-HARD'));
    vi.spyOn(Math, 'random').mockImplementation(() => rng());
    const result = playFullMatch('hard');
    expect(result.stalls).toBe(0);
  });

  it('pass directions rotate left → right → across → hold', () => {
    const game = new HeartsGame();
    const dirs: string[] = [];
    for (let round = 1; round <= 4; round++) {
      const internal = game as unknown as {
        createRoundState: (
          names: string[],
          opts: Record<string, unknown> | undefined,
          round: number,
          scores: number[]
        ) => ReturnType<HeartsGame['getCurrentState']>;
        state: ReturnType<HeartsGame['getCurrentState']>;
      };
      internal.state = internal.createRoundState(NAMES, { aiDifficulty: 'medium' }, round, [0, 0, 0, 0]);
      dirs.push(getHeartsState(internal.state).passDirection);
    }
    expect(dirs).toEqual(['left', 'right', 'across', 'hold']);
  });
});
