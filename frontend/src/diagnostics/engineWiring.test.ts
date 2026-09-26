import { beforeEach, describe, expect, it } from 'vitest';
import { HeartsGame, getHeartsState } from '../models/games/HeartsGame';
import { SpadesGame, getSpadesState } from '../models/games/SpadesGame';
import { KingGame } from '../models/games/KingGame';
import {
  clearDiagnosticMatchLogsForTests,
  completeDiagnosticMatch,
  getActiveDiagnosticLog,
  resetDiagnosticSessionForTests,
  startDiagnosticMatch,
  recordDealCompleted
} from './index';

describe('REL-REPLAY-01 engine diagnostic wiring', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetDiagnosticSessionForTests();
    await clearDiagnosticMatchLogsForTests();
  });

  it('Hearts confirmPass emits HEARTS_PASS for all seats', () => {
    const game = new HeartsGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], {
      aiDifficulty: 'easy',
      localPlayerIndex: 0
    });
    startDiagnosticMatch({
      gameVariant: 'hearts',
      rulesPresetId: 'hearts-us-normal',
      difficulty: 'easy',
      players: state.players.map((p, i) => ({
        index: i,
        name: p.name,
        type: p.type
      })),
      seed: 'h1'
    });
    recordDealCompleted({ players: state.players });

    const hearts = getHeartsState(game.getCurrentState());
    expect(['left', 'right', 'across', 'hold']).toContain(hearts.passDirection);

    if (hearts.waitingForPass && hearts.passDirection !== 'hold') {
      const hand = game.getCurrentState().players[0].hand;
      expect(hand.length).toBeGreaterThanOrEqual(3);
      game.togglePassCard(0);
      game.togglePassCard(1);
      game.togglePassCard(2);
      expect(game.confirmPass(0)).toBe(true);
      const log = getActiveDiagnosticLog();
      const passes = log?.events.filter((e) => e.type === 'HEARTS_PASS') ?? [];
      expect(passes.length).toBe(4);
      if (passes[0].type === 'HEARTS_PASS') {
        expect(passes[0].payload.cards.length).toBe(3);
        expect(passes[0].payload.passDirection).toBe(hearts.passDirection);
      }
    } else if (hearts.passDirection === 'hold') {
      expect(game.confirmPass(0)).toBe(true);
      const passes =
        getActiveDiagnosticLog()?.events.filter((e) => e.type === 'HEARTS_PASS') ?? [];
      expect(passes.length).toBe(4);
    }
  });

  it('Spades submitBid emits SPADES_BID with nil when applicable', () => {
    const game = new SpadesGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], {
      aiDifficulty: 'medium',
      rulesPresetId: 'spades-pt-nil',
      localPlayerIndex: 0
    });
    startDiagnosticMatch({
      gameVariant: 'spades',
      rulesPresetId: 'spades-pt-nil',
      difficulty: 'medium',
      players: state.players.map((p, i) => ({ index: i, name: p.name, type: p.type })),
      seed: 's1'
    });
    recordDealCompleted({ players: state.players });

    const spades = getSpadesState(game.getCurrentState());
    expect(spades.waitingForBids).toBe(true);
    const first = spades.currentBidderIndex;
    expect(game.submitBid(first, 0, 'nil')).toBe(true);
    const log = getActiveDiagnosticLog();
    const bids = log?.events.filter((e) => e.type === 'SPADES_BID') ?? [];
    expect(bids.length).toBeGreaterThanOrEqual(1);
    const last = bids[bids.length - 1];
    expect(last.type).toBe('SPADES_BID');
    if (last.type === 'SPADES_BID') {
      expect(last.payload.seat).toBe(first);
      expect(last.payload.nil).toBe(true);
      expect(last.payload.bid).toBe(0);
      expect(last.payload.bidType).toBe('nil');
    }
  });

  it('King normal + synthetic sessions retain LEVEL 1 reconstruct markers', async () => {
    for (const preset of ['king-pt-normal', 'king-pt-synthetic'] as const) {
      resetDiagnosticSessionForTests();
      const game = new KingGame();
      const state = game.initialize(['A', 'B', 'C', 'D'], {
        aiDifficulty: 'hard',
        rulesPresetId: preset,
        localPlayerIndex: 0
      });
      startDiagnosticMatch({
        gameVariant: 'king',
        rulesPresetId: preset,
        difficulty: 'hard',
        players: state.players.map((p, i) => ({ index: i, name: p.name, type: p.type })),
        seed: preset
      });
      recordDealCompleted({ players: state.players });
      const done = await completeDiagnosticMatch({
        summary: `${preset}-done`,
        finalScores: { players: [1, 2, 3, 4] },
        playerWon: true,
        winner: 0
      });
      expect(done?.replayLevel).toBe(1);
      expect(done?.rng.deterministic).toBe(false);
      expect(done?.rulesPresetId).toBe(preset);
      expect(done?.initialHands?.length).toBe(4);
      expect(done?.events.some((e) => e.type === 'DEAL_COMPLETED')).toBe(true);
      expect(done?.events.some((e) => e.type === 'MATCH_COMPLETED')).toBe(true);
    }
  });
});
