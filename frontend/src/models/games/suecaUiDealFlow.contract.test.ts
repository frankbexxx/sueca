/**
 * ARCH-SUECA-06 — Setup + modal → engine wiring (playDirection × dealAlignment).
 */
import { describe, expect, it } from 'vitest';
import { Game } from '../Game';
import { SuecaGame } from './SuecaGame';
import { createSuecaFlowController } from '../../flow/suecaFlowController';
import { firstLeader, asSeat } from './suecaRules';
import type { DealAlignment, PlayDirection } from '../../types/game';

const NAMES = ['P1', 'P2', 'P3', 'P4'];

function runHand(
  play: PlayDirection,
  align: DealAlignment
): {
  playDirection: PlayDirection;
  dealAlignment: DealAlignment;
  leader: number;
  dealer: number;
} {
  const adapter = new SuecaGame();
  adapter.initialize(NAMES, { playDirection: play });
  const flow = adapter.getVariantFlow();
  createSuecaFlowController(flow).applyDealSetup(align);
  adapter.startRound(adapter.getCurrentState());
  const state = adapter.getCurrentState();
  return {
    playDirection: state.playDirection === 'left' ? 'left' : 'right',
    dealAlignment: state.dealAlignment === 'opposite' ? 'opposite' : 'same',
    leader: state.trickLeader,
    dealer: state.dealerIndex
  };
}

describe('ARCH-SUECA-06 UI→engine flow contracts', () => {
  it.each([
    { play: 'right' as const, align: 'same' as const },
    { play: 'right' as const, align: 'opposite' as const },
    { play: 'left' as const, align: 'same' as const },
    { play: 'left' as const, align: 'opposite' as const }
  ])(
    'Setup $play → modal $align → engine + leader from playDirection',
    ({ play, align }) => {
      const result = runHand(play, align);
      expect(result.playDirection).toBe(play);
      expect(result.dealAlignment).toBe(align);
      expect(result.leader).toBe(firstLeader(asSeat(result.dealer), play));
      // Deal choice must not mutate session play direction
      expect(result.playDirection).toBe(play);
    }
  );

  it('setDealAlignment does not change playDirection', () => {
    const game = new Game(NAMES, 'medium', undefined, undefined, 'left');
    expect(game.getState().playDirection).toBe('left');
    game.setDealAlignment('opposite');
    expect(game.getState().playDirection).toBe('left');
    expect(game.getState().dealAlignment).toBe('opposite');
    game.setDealAlignment('same');
    expect(game.getState().playDirection).toBe('left');
    expect(game.getState().dealAlignment).toBe('same');
  });
});
