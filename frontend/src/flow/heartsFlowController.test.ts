import { createHeartsFlowController } from './heartsFlowController';
import type { HeartsVariantFlow } from '../models/games/variantFlowApi';
import type { HeartsVariantState } from '../models/games/HeartsGame';
import type { GameState } from '../types/game';

function heartsState(overrides: Partial<HeartsVariantState> = {}): HeartsVariantState {
  return {
    heartsBroken: false,
    playerScores: [0, 0, 0, 0],
    roundPoints: [0, 0, 0, 0],
    lastRoundDeltas: [0, 0, 0, 0],
    waitingForPass: false,
    passDirection: 'left',
    humanPassIndices: [],
    heartsTakenCount: 0,
    queenSpadesTaken: false,
    penaltyCardsTaken: [[], [], [], []],
    waitingForEarlyEnd: false,
    scoringFrozen: false,
    earlyEndOffered: false,
    ...overrides
  };
}

describe('heartsFlowController', () => {
  it('togglePassCardIfPassing only while waitingForPass', () => {
    const togglePassCard = jest.fn();
    let waiting = false;
    const flow: HeartsVariantFlow = {
      kind: 'hearts',
      readState: () => heartsState({ waitingForPass: waiting }),
      togglePassCard,
      confirmPass: jest.fn(() => true),
      acceptEarlyEnd: jest.fn(),
      declineEarlyEnd: jest.fn()
    };
    const ctrl = createHeartsFlowController(flow);
    const state = {} as GameState;

    expect(ctrl.togglePassCardIfPassing(state, 2, 0)).toBe(false);
    expect(togglePassCard).not.toHaveBeenCalled();

    waiting = true;
    expect(ctrl.togglePassCardIfPassing(state, 2, 0)).toBe(true);
    expect(togglePassCard).toHaveBeenCalledWith(2, 0);
  });

  it('confirmPass forwards to API', () => {
    const confirmPass = jest.fn(() => true);
    const flow: HeartsVariantFlow = {
      kind: 'hearts',
      readState: () => heartsState({ waitingForPass: true }),
      togglePassCard: jest.fn(),
      confirmPass,
      acceptEarlyEnd: jest.fn(),
      declineEarlyEnd: jest.fn()
    };
    createHeartsFlowController(flow).confirmPass(0);
    expect(confirmPass).toHaveBeenCalledWith(0);
  });

  it('resolveEarlyEnd does not call the opposite path', () => {
    const acceptEarlyEnd = jest.fn();
    const declineEarlyEnd = jest.fn();
    const flow: HeartsVariantFlow = {
      kind: 'hearts',
      readState: () => heartsState({ waitingForEarlyEnd: true }),
      togglePassCard: jest.fn(),
      confirmPass: jest.fn(() => true),
      acceptEarlyEnd,
      declineEarlyEnd
    };
    const ctrl = createHeartsFlowController(flow);
    ctrl.resolveEarlyEnd(true);
    expect(acceptEarlyEnd).toHaveBeenCalledTimes(1);
    expect(declineEarlyEnd).not.toHaveBeenCalled();
    ctrl.resolveEarlyEnd(false);
    expect(declineEarlyEnd).toHaveBeenCalledTimes(1);
  });
});
