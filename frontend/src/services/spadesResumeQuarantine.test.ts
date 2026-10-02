import { beforeEach, describe, expect, it } from 'vitest';
import { SpadesGame, getSpadesState } from '../models/games/SpadesGame';
import { GameState } from '../types/game';
import {
  LAST_CONFIG_KEY,
  STATS_KEY,
  buildSoloConfigForVariant,
  loadAllGameSessions,
  loadGameSession,
  recordGameResult,
  saveGameSession,
  saveLastConfig
} from './gameSessionStorage';
import { MATCH_HISTORY_KEY } from './matchHistoryStorage';
import { resumeSpadesOrClearSession } from './spadesResumeQuarantine';

const NAMES = ['Ana', 'Bruno', 'Carla', 'Diogo'];

function started(): SpadesGame {
  const game = new SpadesGame();
  game.initialize(NAMES, { aiDifficulty: 'easy', localPlayerIndex: 0 });
  return game;
}

function saveSpades(state: GameState): void {
  saveGameSession(buildSoloConfigForVariant('spades'), state);
}

function resumeSaved(): GameState {
  const saved = loadGameSession('spades');
  if (!saved) throw new Error('missing spades session');
  return resumeSpadesOrClearSession(() => new SpadesGame().restoreState(saved.state));
}

describe('Spades failed-resume slot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deletes the slot when the saved variant object is missing', () => {
    const state = started().getCurrentState();
    delete state.variantState!.spades;
    saveSpades(state);
    expect(loadGameSession('spades')).toBeTruthy();

    expect(() => resumeSaved()).toThrow(/missing_variant_state/);
    expect(loadGameSession('spades')).toBeNull();
  });

  it('deletes the slot when the saved variant is incomplete', () => {
    const state = started().getCurrentState();
    delete (state.variantState!.spades as { playerBids?: unknown }).playerBids;
    saveSpades(state);

    expect(() => resumeSaved()).toThrow(/incomplete_variant_state/);
    expect(loadGameSession('spades')).toBeNull();
  });

  it('does not offer the same broken save on a second Continue', () => {
    const state = started().getCurrentState();
    delete state.variantState!.spades;
    saveSpades(state);
    expect(() => resumeSaved()).toThrow(/missing_variant_state/);

    expect(loadGameSession('spades')).toBeNull();
    expect(loadGameSession()).toBeNull();
  });

  it('keeps a valid mid-auction save and restores it', () => {
    const game = started();
    const leader = getSpadesState(game.getCurrentState()).bidLeaderIndex;
    expect(game.submitBid(leader, 4, 'normal')).toBe(true);
    const savedBids = [...getSpadesState(game.getCurrentState()).playerBids];
    const bidder = getSpadesState(game.getCurrentState()).currentBidderIndex;
    saveSpades(game.getCurrentState());

    const restored = resumeSaved();
    expect(getSpadesState(restored).playerBids).toEqual(savedBids);
    expect(getSpadesState(restored).currentBidderIndex).toBe(bidder);
    expect(getSpadesState(restored).waitingForBids).toBe(true);

    const again = loadGameSession('spades');
    expect(again).toBeTruthy();
    expect(getSpadesState(again!.state).playerBids).toEqual(savedBids);
    expect(new SpadesGame().restoreState(again!.state).currentPlayerIndex).toBe(
      restored.currentPlayerIndex
    );
  });

  it('keeps a valid mid-trick save and restores it', () => {
    const game = started();
    const leader = getSpadesState(game.getCurrentState()).bidLeaderIndex;
    for (let step = 0; step < 4; step++) {
      const seat = (leader + step) % 4;
      game.declineBlindNil(seat);
      expect(game.submitBid(seat, 3, 'normal')).toBe(true);
    }
    const actor = game.getCurrentState().currentPlayerIndex;
    let cardIndex = -1;
    for (let index = 0; index < game.getCurrentState().players[actor].hand.length; index++) {
      if (game.canPlayCard(game.getCurrentState(), actor, index)) {
        cardIndex = index;
        break;
      }
    }
    expect(game.playCard(game.getCurrentState(), actor, cardIndex)).toBe(true);
    const trick = game.getCurrentState().currentTrick.map((card) => card.id);
    saveSpades(game.getCurrentState());

    const restored = resumeSaved();
    expect(restored.currentTrick.map((card) => card.id)).toEqual(trick);
    expect(getSpadesState(restored).waitingForBids).toBe(false);
    expect(loadGameSession('spades')).toBeTruthy();
    expect(loadGameSession('spades')!.state.currentTrick.map((card) => card.id)).toEqual(trick);
  });

  it('leaves history, preferences, stats, and other game slots in place', () => {
    saveLastConfig(buildSoloConfigForVariant('hearts'));
    recordGameResult('hearts', true);
    localStorage.setItem(MATCH_HISTORY_KEY, '{"records":[{"id":"keep"}]}');
    localStorage.setItem('sueca-unrelated-pref', 'keep');
    saveGameSession(buildSoloConfigForVariant('hearts'), started().getCurrentState());
    const history = localStorage.getItem(MATCH_HISTORY_KEY);
    const config = localStorage.getItem(LAST_CONFIG_KEY);
    const stats = localStorage.getItem(STATS_KEY);

    const broken = started().getCurrentState();
    delete broken.variantState!.spades;
    saveSpades(broken);
    expect(() => resumeSaved()).toThrow(/missing_variant_state/);

    expect(loadGameSession('spades')).toBeNull();
    expect(loadGameSession('hearts')?.config.gameVariant).toBe('hearts');
    expect(loadAllGameSessions().spades).toBeUndefined();
    expect(loadAllGameSessions().hearts?.config.gameVariant).toBe('hearts');
    expect(localStorage.getItem(MATCH_HISTORY_KEY)).toBe(history);
    expect(localStorage.getItem(LAST_CONFIG_KEY)).toBe(config);
    expect(localStorage.getItem(STATS_KEY)).toBe(stats);
    expect(localStorage.getItem('sueca-unrelated-pref')).toBe('keep');
  });
});
