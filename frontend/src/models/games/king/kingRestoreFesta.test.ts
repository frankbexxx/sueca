import { vi } from 'vitest';
import { KingPtGame, getKingPtState, KingPtVariantState } from '../KingPtGame';
import { GameState } from '../../../types/game';
import { FESTA_AI_STEP_DELAY_MS } from '../../../constants/gameConstants';

const NAMES = ['P1', 'P2', 'P3', 'P4'];

function seeded(): GameState {
  const game = new KingPtGame();
  game.initialize(NAMES, { localPlayerIndex: 0, kohPlayerIndex: 0, aiDifficulty: 'hard' });
  game.confirmKohReveal();
  return (game as unknown as { state: GameState }).state;
}

function save(patch: Partial<KingPtVariantState>, root?: Partial<GameState>): GameState {
  const state = JSON.parse(JSON.stringify(seeded())) as GameState;
  const king = { ...getKingPtState(state), ...patch };
  state.waitingForRoundStart = root?.waitingForRoundStart ?? true;
  state.currentTrick = root?.currentTrick ?? state.currentTrick;
  state.currentPlayerIndex = root?.currentPlayerIndex ?? state.currentPlayerIndex;
  state.variantState = { ...state.variantState, kingPt: king, rulesPresetId: 'king-pt-normal' };
  return state;
}

const bid = { bidderIndex: 2, bidType: 'positive' as const, amount: 4 };

function install(saved: GameState): KingPtGame {
  const game = new KingPtGame();
  game.restoreState(saved);
  return game;
}

describe('King restore does not drain festa AI', () => {
  it('keeps the non-auction festa delay at 350 ms', () => {
    expect(FESTA_AI_STEP_DELAY_MS).toBe(350);
  });

  it('restores AI negotiation without accepting, then the normal tick acts', () => {
    const saved = save({
      gameIndex: 6,
      phase: 'festa_setup',
      festaOwnerIndex: 1,
      festaPhase: 'negotiation',
      bestBid: bid,
      eightOrNullsPending: false,
      waitingForFallback: false,
      waitingForFestaSetup: false,
      activeContract: null
    });
    const game = install(saved);
    expect(getKingPtState(game.getCurrentState())).toEqual(getKingPtState(saved));

    expect(game.tickFestaAi()).toBe(true);
    expect(getKingPtState(game.getCurrentState()).festaPhase).not.toBe('negotiation');
    expect(getKingPtState(game.getCurrentState()).activeContract).not.toBeNull();
  });

  it('restores a pending 8-or-nulls answer without answering', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const saved = save({
      gameIndex: 6,
      phase: 'festa_setup',
      festaOwnerIndex: 0,
      festaPhase: 'negotiation',
      bestBid: bid,
      eightOrNullsPending: true,
      eightOrNullsTarget: 2
    });
    const game = install(saved);
    const king = getKingPtState(game.getCurrentState());
    expect(king.eightOrNullsPending).toBe(true);
    expect(king.eightOrNullsTarget).toBe(2);
    expect(king.festaPhase).toBe('negotiation');

    expect(game.tickFestaAi()).toBe(true);
    expect(getKingPtState(game.getCurrentState()).eightOrNullsPending).toBe(false);
    vi.restoreAllMocks();
  });

  it('restores AI fallback without choosing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const saved = save({
      gameIndex: 6,
      phase: 'festa_setup',
      festaOwnerIndex: 1,
      festaPhase: 'fallback',
      bestBid: bid,
      waitingForFallback: true,
      fallbackReason: 'negotiation_failed',
      waitingForFestaSetup: false
    });
    const game = install(saved);
    expect(getKingPtState(game.getCurrentState()).waitingForFallback).toBe(true);
    expect(getKingPtState(game.getCurrentState()).festaPhase).toBe('fallback');

    expect(game.tickFestaAi()).toBe(true);
    expect(getKingPtState(game.getCurrentState()).waitingForFallback).toBe(false);
    vi.restoreAllMocks();
  });

  it('restores AI setup without confirming', () => {
    const saved = save({
      gameIndex: 6,
      phase: 'festa_setup',
      festaOwnerIndex: 1,
      benefitOwnerIndex: 1,
      festaPhase: 'setup',
      festaMode: 'positive',
      bestBid: bid,
      waitingForFestaSetup: true,
      waitingForFallback: false,
      noTrumpChosen: false
    });
    const game = install(saved);
    expect(getKingPtState(game.getCurrentState()).waitingForFestaSetup).toBe(true);
    expect(game.getCurrentState().waitingForRoundStart).toBe(true);

    expect(game.tickFestaAi()).toBe(true);
    const after = getKingPtState(game.getCurrentState());
    expect(after.waitingForFestaSetup).toBe(false);
    expect(after.phase).toBe('festa_play');
    expect(game.getCurrentState().waitingForRoundStart).toBe(false);
  });

  it('does not advance a human festa decision on restore or on the AI tick', () => {
    const saved = save({
      gameIndex: 6,
      phase: 'festa_setup',
      festaOwnerIndex: 0,
      festaPhase: 'negotiation',
      bestBid: bid,
      eightOrNullsPending: false,
      waitingForFallback: false,
      waitingForFestaSetup: false
    });
    const game = install(saved);
    expect(getKingPtState(game.getCurrentState()).festaPhase).toBe('negotiation');
    expect(game.tickFestaAi()).toBe(false);
    expect(getKingPtState(game.getCurrentState()).festaPhase).toBe('negotiation');
    expect(getKingPtState(game.getCurrentState()).activeContract).toBeNull();
  });

  it('restores a mid-trick hand without playing', () => {
    const base = seeded();
    const card = base.players[1].hand[0];
    const saved = save(
      {
        gameIndex: 6,
        phase: 'festa_play',
        festaPhase: null,
        festaMode: 'positive',
        waitingForFallback: false,
        waitingForFestaSetup: false,
        eightOrNullsPending: false
      },
      {
        waitingForRoundStart: false,
        currentTrick: [{ ...card }],
        currentPlayerIndex: 2
      }
    );
    const game = install(saved);
    const restored = game.getCurrentState();
    expect(restored.currentTrick).toEqual(saved.currentTrick);
    expect(restored.currentPlayerIndex).toBe(2);
    expect(restored.players.map((player) => player.hand)).toEqual(saved.players.map((player) => player.hand));
    expect(getKingPtState(restored).phase).toBe('festa_play');
    expect(game.tickFestaAi()).toBe(false);
    expect(game.getCurrentState().currentTrick).toEqual(saved.currentTrick);
  });
});
