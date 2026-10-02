import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/game';
import { HeartsGame, getHeartsState, type HeartsVariantState } from './HeartsGame';

const NAMES = ['A', 'B', 'C', 'D'];

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function dealt(): GameState {
  const game = new HeartsGame();
  return game.initialize(NAMES, {});
}

function heartsOf(state: GameState): HeartsVariantState {
  return state.variantState!.hearts as HeartsVariantState;
}

function resume(state: GameState): GameState {
  return new HeartsGame().restoreState(cloneState(state));
}

function twoClubsSeat(state: GameState): number {
  return state.players.findIndex((player) =>
    player.hand.some((card) => card.rank === '2' && card.suit === 'clubs')
  );
}

describe('Hearts resume integrity', () => {
  it('rejects a missing hearts object without creating a pass or changing the payload', () => {
    const live = new HeartsGame();
    const before = JSON.stringify(live.initialize(NAMES, {}));
    const saved = JSON.parse(before) as GameState;
    delete saved.variantState!.hearts;
    const payload = JSON.stringify(saved);

    const fresh = new HeartsGame();
    expect(() => fresh.restoreState(saved)).toThrow(/missing_variant_state/);
    expect(JSON.stringify(saved)).toBe(payload);
    expect(saved.variantState!.hearts).toBeUndefined();
    expect(() => fresh.getCurrentState()).toThrow(/not initialized/);

    expect(() => live.restoreState(JSON.parse(payload) as GameState)).toThrow(/missing_variant_state/);
    expect(JSON.stringify(live.getCurrentState())).toBe(before);
  });

  it('rejects a malformed hearts object', () => {
    const saved = dealt();
    saved.variantState = { ...saved.variantState, hearts: [] as unknown as HeartsVariantState };
    expect(() => resume(saved)).toThrow(/malformed_variant_state/);
  });

  it('keeps an open pass with no selection', () => {
    const saved = dealt();
    const restored = resume(saved);
    const hearts = getHeartsState(restored);
    expect(hearts.waitingForPass).toBe(true);
    expect(hearts.humanPassIndices).toEqual([]);
    expect(hearts.passDirection).toBe('left');
    expect(restored.players.map((player) => player.hand.length)).toEqual([13, 13, 13, 13]);
  });

  it('keeps an open pass with two selected cards', () => {
    const game = new HeartsGame();
    game.initialize(NAMES, {});
    game.togglePassCard(0, 0);
    game.togglePassCard(4, 0);
    const restored = resume(game.getCurrentState());
    expect(getHeartsState(restored).waitingForPass).toBe(true);
    expect(getHeartsState(restored).humanPassIndices).toEqual([0, 4]);
    expect(getHeartsState(restored).passExchangeUntilMs).toBeNull();
  });

  it('keeps an open pass with three selected cards', () => {
    const game = new HeartsGame();
    game.initialize(NAMES, {});
    game.togglePassCard(1, 0);
    game.togglePassCard(2, 0);
    game.togglePassCard(3, 0);
    const restored = resume(game.getCurrentState());
    expect(getHeartsState(restored).humanPassIndices).toEqual([1, 2, 3]);
    expect(getHeartsState(restored).waitingForPass).toBe(true);
  });

  it('keeps a completed pass, clears the receipt beat, and does not pass again', () => {
    const game = new HeartsGame();
    game.initialize(NAMES, {});
    game.togglePassCard(0, 0);
    game.togglePassCard(1, 0);
    game.togglePassCard(2, 0);
    expect(game.confirmPass(0)).toBe(true);
    const exchanged = game.getCurrentState();
    const ids = exchanged.players.map((player) => player.hand.map((card) => card.id));
    expect(getHeartsState(exchanged).passExchangeUntilMs).not.toBeNull();

    const restored = game.restoreState(exchanged);
    expect(getHeartsState(restored).waitingForPass).toBe(false);
    expect(getHeartsState(restored).passExchangeUntilMs).toBeNull();
    expect(restored.players.map((player) => player.hand.map((card) => card.id))).toEqual(ids);
    expect(game.confirmPass(0)).toBe(false);
    expect(game.getCurrentState().players.map((player) => player.hand.map((card) => card.id))).toEqual(ids);
  });

  it('preserves accumulated scores and a later-round pass', () => {
    const saved = dealt();
    saved.round = 3;
    heartsOf(saved).passDirection = 'across';
    heartsOf(saved).playerScores = [22, 4, 18, 9];
    heartsOf(saved).roundPoints = [1, 0, 13, 0];
    const restored = resume(saved);
    expect(getHeartsState(restored).playerScores).toEqual([22, 4, 18, 9]);
    expect(getHeartsState(restored).roundPoints).toEqual([1, 0, 13, 0]);
    expect(getHeartsState(restored).passDirection).toBe('across');
    expect(getHeartsState(restored).waitingForPass).toBe(true);
    expect(restored.round).toBe(3);
  });

  it('rejects a malformed score row and a malformed round-point row', () => {
    const shortScores = dealt();
    heartsOf(shortScores).playerScores = [1, 2, 3];
    expect(() => resume(shortScores)).toThrow(/invalid_scores/);

    const badPoints = dealt();
    heartsOf(badPoints).roundPoints = [0, 0, 0, 27];
    expect(() => resume(badPoints)).toThrow(/invalid_round_points/);
  });

  it('accepts every legal pass direction and rejects an unknown one', () => {
    for (const direction of ['left', 'right', 'across', 'hold'] as const) {
      const saved = dealt();
      heartsOf(saved).passDirection = direction;
      expect(getHeartsState(resume(saved)).passDirection).toBe(direction);
    }
    const saved = dealt();
    (heartsOf(saved) as { passDirection: string }).passDirection = 'north';
    expect(() => resume(saved)).toThrow(/invalid_pass_direction/);
  });

  it('rejects an out-of-range pass index, a duplicate, and more than three indices', () => {
    const outOfRange = dealt();
    heartsOf(outOfRange).humanPassIndices = [13];
    expect(() => resume(outOfRange)).toThrow(/invalid_pass_indices/);

    const duplicate = dealt();
    heartsOf(duplicate).humanPassIndices = [1, 1];
    expect(() => resume(duplicate)).toThrow(/invalid_pass_indices/);

    const tooMany = dealt();
    heartsOf(tooMany).humanPassIndices = [0, 1, 2, 3];
    expect(() => resume(tooMany)).toThrow(/invalid_pass_indices/);
  });

  it('restores a mid-trick hand without moving cards or choosing a leader', () => {
    const saved = dealt();
    const leader = twoClubsSeat(saved);
    const [led] = saved.players[leader].hand.splice(
      saved.players[leader].hand.findIndex((card) => card.rank === '2' && card.suit === 'clubs'),
      1
    );
    saved.currentTrick = [led];
    saved.currentPlayerIndex = (leader + 1) % 4;
    saved.trickLeader = leader;
    saved.isFirstTrick = true;
    saved.waitingForRoundStart = false;
    heartsOf(saved).waitingForPass = false;
    heartsOf(saved).humanPassIndices = [];
    const before = cloneState(saved);

    const restored = resume(saved);
    expect(restored.currentPlayerIndex).toBe(before.currentPlayerIndex);
    expect(restored.currentTrick.map((card) => card.id)).toEqual([led.id]);
    expect(restored.players.map((player) => player.hand.map((card) => card.id))).toEqual(
      before.players.map((player) => player.hand.map((card) => card.id))
    );
    expect(getHeartsState(restored).waitingForPass).toBe(false);
  });

  it('restores a between-tricks hand and a hold hand', () => {
    const between = dealt();
    for (const player of between.players) player.hand.pop();
    between.currentTrick = [];
    between.isFirstTrick = false;
    between.waitingForRoundStart = false;
    between.currentPlayerIndex = 2;
    heartsOf(between).waitingForPass = false;
    heartsOf(between).humanPassIndices = [];
    heartsOf(between).heartsBroken = true;
    heartsOf(between).playerScores = [3, 0, 1, 0];
    const resumedBetween = resume(between);
    expect(resumedBetween.players.map((player) => player.hand.length)).toEqual([12, 12, 12, 12]);
    expect(resumedBetween.currentPlayerIndex).toBe(2);
    expect(getHeartsState(resumedBetween).heartsBroken).toBe(true);
    expect(getHeartsState(resumedBetween).playerScores).toEqual([3, 0, 1, 0]);
    expect(getHeartsState(resumedBetween).waitingForPass).toBe(false);

    const hold = dealt();
    const leader = twoClubsSeat(hold);
    hold.currentPlayerIndex = leader;
    hold.trickLeader = leader;
    hold.waitingForRoundStart = false;
    hold.isFirstTrick = true;
    hold.currentTrick = [];
    heartsOf(hold).passDirection = 'hold';
    heartsOf(hold).waitingForPass = false;
    const resumedHold = resume(hold);
    expect(getHeartsState(resumedHold).passDirection).toBe('hold');
    expect(getHeartsState(resumedHold).waitingForPass).toBe(false);
    expect(resumedHold.currentPlayerIndex).toBe(leader);
    expect(getHeartsState(resumedHold).passExchangeUntilMs).toBeNull();
  });

  it('rejects an open pass beside a hand that is no longer a full deal', () => {
    const saved = dealt();
    saved.players[1].hand.pop();
    expect(() => resume(saved)).toThrow(/impossible_pass_phase/);
  });

  it('rejects an opening lead that does not hold the two of clubs', () => {
    const saved = dealt();
    const leader = twoClubsSeat(saved);
    saved.currentPlayerIndex = (leader + 1) % 4;
    saved.trickLeader = saved.currentPlayerIndex;
    saved.waitingForRoundStart = false;
    saved.isFirstTrick = true;
    saved.currentTrick = [];
    heartsOf(saved).waitingForPass = false;
    heartsOf(saved).humanPassIndices = [];
    expect(() => resume(saved)).toThrow(/impossible_leader/);
    expect(saved.currentPlayerIndex).toBe((leader + 1) % 4);
  });

  it('accepts an older complete save that omits later optional fields', () => {
    const saved = dealt();
    const hearts = heartsOf(saved) as Partial<HeartsVariantState>;
    hearts.playerScores = [8, 2, 0, 5];
    delete hearts.lastRoundDeltas;
    delete hearts.heartsTakenCount;
    delete hearts.queenSpadesTaken;
    delete hearts.penaltyCardsTaken;
    delete hearts.waitingForEarlyEnd;
    delete hearts.scoringFrozen;
    delete hearts.earlyEndOffered;
    delete hearts.passExchangeUntilMs;
    const restored = resume(saved);
    expect(getHeartsState(restored).waitingForPass).toBe(true);
    expect(getHeartsState(restored).playerScores).toEqual([8, 2, 0, 5]);
    expect(getHeartsState(restored).passExchangeUntilMs).toBeNull();
    expect(getHeartsState(restored).lastRoundDeltas).toEqual([0, 0, 0, 0]);
  });
});
