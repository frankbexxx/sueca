/**
 * ARCH-SUECA-04 — engine PlayDirection contract.
 * RIGHT preserves production ACW; LEFT is engine-supported (not yet UI-selectable).
 */

import { describe, expect, it } from 'vitest';
import { Game } from '../Game';
import { Card, GameState } from '../../types/game';
import { cloneGameState } from './cloneGameState';
import { normalizeGameState } from '../../multiplayer/normalizeGameState';
import {
  asSeat,
  firstLeader,
  nextDealer,
  nextSeat,
  seatAtOffset
} from './suecaRules';
import { SuecaGame } from './SuecaGame';

function forceDealer(game: Game, dealer: number): void {
  const s = game.getState();
  s.dealerIndex = dealer;
  const play = s.playDirection === 'left' ? 'left' : 'right';
  const leader = firstLeader(asSeat(dealer), play);
  s.trickLeader = leader;
  s.currentPlayerIndex = leader;
  game.loadState(s);
}

function playLegal(game: Game): boolean {
  const st = game.getState();
  const idx = st.currentPlayerIndex;
  const hand = st.players[idx].hand;
  for (let i = 0; i < hand.length; i++) {
    if (game.canPlayCard(idx, i)) {
      return game.playCard(idx, i);
    }
  }
  return false;
}

function playFullTrickFromLeader(game: Game): GameState {
  for (let i = 0; i < 4; i++) {
    expect(playLegal(game)).toBe(true);
  }
  return game.getState();
}

describe('ARCH-SUECA-04 PlayDirection — RIGHT preservation', () => {
  it('defaults playDirection to right', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    expect(game.getState().playDirection).toBe('right');
  });

  it('dealer 0: leader 3; order 3→2→1→0', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    forceDealer(game, 0);
    game.startRound();
    const s0 = game.getState();
    expect(s0.playDirection).toBe('right');
    expect(s0.trickLeader).toBe(3);
    expect(s0.currentPlayerIndex).toBe(3);

    expect(playLegal(game)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(2);
    expect(playLegal(game)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(1);
    expect(playLegal(game)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(0);
  });

  it('dealer rotation RIGHT: 0→3 next hand', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    forceDealer(game, 0);
    game.startRound();
    const s = game.getState();
    s.waitingForRoundEnd = true;
    s.waitingForRoundStart = false;
    game.loadState(s);
    game.continueToNextRound();
    const s2 = game.getState();
    expect(s2.dealerIndex).toBe(3);
    expect(s2.trickLeader).toBe(firstLeader(3, 'right'));
  });
});

describe('ARCH-SUECA-04 PlayDirection — LEFT engine', () => {
  it('dealer 0: first leader = 1; order 1→2→3→0', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A', 'medium', undefined, undefined, 'left');
    forceDealer(game, 0);
    expect(game.getState().playDirection).toBe('left');
    expect(game.getState().trickLeader).toBe(1);
    expect(game.getState().currentPlayerIndex).toBe(1);

    game.startRound();
    expect(playLegal(game)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(2);
    expect(playLegal(game)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(3);
    expect(playLegal(game)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(0);
  });

  it('LEFT: winner at trick offsets maps CW; winner leads next', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A', 'medium', undefined, undefined, 'left');
    forceDealer(game, 0);
    game.startRound();

    // Force a deterministic trick: leader=1 plays; we check seat mapping helpers match engine.
    const leader = game.getState().trickLeader;
    expect(leader).toBe(1);
    expect(seatAtOffset(1, 1, 'left')).toBe(2);
    expect(seatAtOffset(1, 3, 'left')).toBe(0);

    const after = playFullTrickFromLeader(game);
    expect(after.waitingForTrickEnd).toBe(true);
    expect(after.nextTrickLeader).not.toBeNull();
    const winner = after.nextTrickLeader!;
    // Winner seat must be one of the four CW seats from leader
    expect([1, 2, 3, 0]).toContain(winner);

    game.finishTrick();
    const next = game.getState();
    expect(next.trickLeader).toBe(winner);
    expect(next.currentPlayerIndex).toBe(winner);
  });

  it('LEFT: dealer 0 rotates to 1 next hand', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A', 'medium', undefined, undefined, 'left');
    forceDealer(game, 0);
    game.startRound();
    const s = game.getState();
    s.waitingForRoundEnd = true;
    s.waitingForRoundStart = false;
    game.loadState(s);
    game.continueToNextRound();
    const s2 = game.getState();
    expect(s2.dealerIndex).toBe(1);
    expect(s2.trickLeader).toBe(firstLeader(1, 'left'));
    expect(s2.trickLeader).toBe(2);
  });

  it('SuecaGame.initialize accepts playDirection left', () => {
    const adapter = new SuecaGame();
    const state = adapter.initialize(['A', 'B', 'C', 'D'], {
      dealingMethod: 'A',
      playDirection: 'left'
    });
    expect(state.playDirection).toBe('left');
  });
});

describe('ARCH-SUECA-04 deal independence from play', () => {
  it.each(['left', 'right'] as const)(
    'RIGHT play: dealingDirection=%s does not change leader/order',
    (dealDir) => {
      const game = new Game(['A', 'B', 'C', 'D'], 'A');
      forceDealer(game, 0);
      game.setDealingDirection(dealDir);
      game.setDealingMethod('A');
      expect(game.getState().playDirection).toBe('right');
      expect(game.getState().trickLeader).toBe(3);
      game.startRound();
      expect(playLegal(game)).toBe(true);
      expect(game.getState().currentPlayerIndex).toBe(2);
    }
  );

  it.each(['left', 'right'] as const)(
    'LEFT play: dealingDirection=%s does not change leader/order',
    (dealDir) => {
      const game = new Game(['A', 'B', 'C', 'D'], 'A', 'medium', undefined, undefined, 'left');
      forceDealer(game, 0);
      game.setDealingDirection(dealDir);
      expect(game.getState().playDirection).toBe('left');
      expect(game.getState().trickLeader).toBe(1);
      game.startRound();
      expect(playLegal(game)).toBe(true);
      expect(game.getState().currentPlayerIndex).toBe(2);
    }
  );
});

describe('ARCH-SUECA-04 playDirection snapshot / restore', () => {
  it('getState/clone preserves playDirection', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A', 'medium', undefined, undefined, 'left');
    const snap = game.getState();
    expect(snap.playDirection).toBe('left');
    expect(cloneGameState(snap).playDirection).toBe('left');
  });

  it('loadState preserves explicit left', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A', 'medium', undefined, undefined, 'left');
    forceDealer(game, 0);
    const snap = game.getState();
    expect(snap.playDirection).toBe('left');
    expect(snap.trickLeader).toBe(1);

    const other = new Game(['A', 'B', 'C', 'D'], 'A');
    other.loadState(snap);
    expect(other.getState().playDirection).toBe('left');
    expect(other.getState().trickLeader).toBe(1);
  });

  it('TEMPORARY: missing playDirection normalizes to right', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    const raw = { ...game.getState() } as Partial<GameState>;
    delete raw.playDirection;
    const normalized = normalizeGameState(raw);
    expect(normalized.playDirection).toBe('right');

    game.loadState(normalized);
    expect(game.getState().playDirection).toBe('right');
  });

  it('restore via SuecaGame preserves left', () => {
    const adapter = new SuecaGame();
    adapter.initialize(['A', 'B', 'C', 'D'], { playDirection: 'left' });
    const mid = adapter.getCurrentState();
    expect(mid.playDirection).toBe('left');
    const restored = adapter.restoreState(mid);
    expect(restored.playDirection).toBe('left');
  });
});

describe('ARCH-SUECA-04 geometry helpers match engine LEFT/RIGHT', () => {
  it('nextSeat / seatAtOffset / nextDealer table', () => {
    expect(nextSeat(0, 'right')).toBe(3);
    expect(nextSeat(0, 'left')).toBe(1);
    expect(seatAtOffset(0, 1, 'right')).toBe(3);
    expect(seatAtOffset(0, 1, 'left')).toBe(1);
    expect(nextDealer(0, 'right')).toBe(3);
    expect(nextDealer(0, 'left')).toBe(1);
  });
});
