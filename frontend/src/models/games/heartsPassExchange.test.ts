import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card, GameState } from '../../types/game';
import { HEARTS_PASS_EXCHANGE_MS } from '../../constants/gameConstants';
import { heartsPassExchangeMs } from './gamePacingPolicy';
import {
  HeartsGame,
  getHeartsState,
  heartsCardPlayArmDelayMs,
  isHeartsPassExchangeLocked
} from './HeartsGame';

const NAMES = ['A', 'B', 'C', 'D'];

function twoClubsIndex(hand: Card[]): number {
  return hand.findIndex((card) => card.rank === '2' && card.suit === 'clubs');
}

function giveTwoClubs(state: GameState, seat: number): void {
  const players = state.players;
  let from = -1;
  let index = -1;
  for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
    index = twoClubsIndex(players[seatIndex].hand);
    if (index >= 0) {
      from = seatIndex;
      break;
    }
  }
  if (from < 0 || index < 0) throw new Error('missing 2♣');
  if (from === seat) {
    const [card] = players[from].hand.splice(index, 1);
    players[seat].hand.push(card);
    return;
  }
  const [card] = players[from].hand.splice(index, 1);
  const displaced = players[seat].hand.pop();
  if (!displaced) throw new Error('empty hand');
  players[seat].hand.push(card);
  players[from].hand.push(displaced);
}

function handIds(state: GameState): string[][] {
  return state.players.map((player) => player.hand.map((card) => card.id));
}

describe('Hearts pass exchange beat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses an explicit 800 ms receipt beat', () => {
    expect(heartsPassExchangeMs()).toBe(800);
    expect(HEARTS_PASS_EXCHANGE_MS).toBe(800);
  });

  it('exchanges once, clears the selection, and keeps play locked until the beat ends', () => {
    const game = new HeartsGame();
    game.initialize(NAMES, {});
    const internal = game as unknown as { state: GameState };
    giveTwoClubs(internal.state, 0);
    game.togglePassCard(0, 0);
    game.togglePassCard(1, 0);
    game.togglePassCard(2, 0);

    expect(game.confirmPass(0)).toBe(true);
    const after = game.getCurrentState();
    const hearts = getHeartsState(after);
    expect(after.players.map((player) => player.hand.length)).toEqual([13, 13, 13, 13]);
    expect(hearts.humanPassIndices).toEqual([]);
    expect(hearts.waitingForPass).toBe(false);
    expect(hearts.passExchangeUntilMs).toBe(1_000_000 + 800);
    expect(after.currentPlayerIndex).toBe(0);
    expect(isHeartsPassExchangeLocked(hearts, 1_000_000)).toBe(true);

    const leadIndex = twoClubsIndex(after.players[0].hand);
    expect(leadIndex).toBeGreaterThanOrEqual(0);
    expect(game.canPlayCard(after, 0, leadIndex)).toBe(false);

    const ids = handIds(after);
    expect(game.confirmPass(0)).toBe(false);
    expect(handIds(game.getCurrentState())).toEqual(ids);

    vi.advanceTimersByTime(799);
    expect(game.canPlayCard(game.getCurrentState(), 0, leadIndex)).toBe(false);
    expect(heartsCardPlayArmDelayMs(game.getCurrentState(), Date.now())).toBeNull();

    vi.advanceTimersByTime(1);
    expect(game.canPlayCard(game.getCurrentState(), 0, leadIndex)).toBe(true);
    expect(heartsCardPlayArmDelayMs(game.getCurrentState(), Date.now())).toBe(1500);
  });

  it('does not arm the Hearts AI lead delay until the receipt beat ends', () => {
    const game = new HeartsGame();
    game.initialize(NAMES, {});
    const internal = game as unknown as { state: GameState };
    giveTwoClubs(internal.state, 1);
    game.togglePassCard(0, 0);
    game.togglePassCard(1, 0);
    game.togglePassCard(2, 0);
    expect(game.confirmPass(0)).toBe(true);

    giveTwoClubs(internal.state, 1);
    internal.state.currentPlayerIndex = 1;
    internal.state.trickLeader = 1;
    internal.state.currentTrick = [];

    expect(heartsCardPlayArmDelayMs(internal.state, Date.now())).toBeNull();
    expect(game.canPlayCard(internal.state, 1, twoClubsIndex(internal.state.players[1].hand))).toBe(
      false
    );

    vi.advanceTimersByTime(800);
    expect(heartsCardPlayArmDelayMs(internal.state, Date.now())).toBe(1500);
    expect(game.canPlayCard(internal.state, 1, twoClubsIndex(internal.state.players[1].hand))).toBe(
      true
    );
  });

  it('does not apply the receipt beat on a hold hand', () => {
    const game = new HeartsGame();
    game.initialize(NAMES, {});
    const internal = game as unknown as { state: GameState };
    const hearts = getHeartsState(internal.state);
    hearts.passDirection = 'hold';
    hearts.waitingForPass = true;
    internal.state.waitingForRoundStart = true;
    internal.state.variantState = { ...internal.state.variantState, hearts };

    expect(game.confirmPass(0)).toBe(true);
    const after = getHeartsState(game.getCurrentState());
    expect(after.passDirection).toBe('hold');
    expect(after.passExchangeUntilMs).toBeNull();
    expect(isHeartsPassExchangeLocked(after)).toBe(false);
    expect(heartsCardPlayArmDelayMs(game.getCurrentState(), Date.now())).toBe(1500);
  });

  it('drops the receipt beat on restore and does not pass again', () => {
    const game = new HeartsGame();
    game.initialize(NAMES, {});
    game.togglePassCard(0, 0);
    game.togglePassCard(1, 0);
    game.togglePassCard(2, 0);
    expect(game.confirmPass(0)).toBe(true);

    const exchanged = game.getCurrentState();
    const ids = handIds(exchanged);
    expect(getHeartsState(exchanged).passExchangeUntilMs).toBe(1_000_000 + 800);

    const restored = game.restoreState(exchanged);
    expect(getHeartsState(restored).passExchangeUntilMs).toBeNull();
    expect(handIds(restored)).toEqual(ids);
    expect(game.confirmPass(0)).toBe(false);
    expect(handIds(game.getCurrentState())).toEqual(ids);
    expect(isHeartsPassExchangeLocked(getHeartsState(restored))).toBe(false);
  });
});
