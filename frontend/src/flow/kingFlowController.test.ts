import {
  buildKingFestaSyncKey,
  createKingFlowController,
  isKingInFestaFlow
} from './kingFlowController';
import type { KingVariantFlow } from '../models/games/variantFlowApi';
import type { KingPtVariantState } from '../models/games/KingPtGame';
import type { GameState } from '../types/game';

function kingStub(overrides: Partial<KingPtVariantState> = {}): KingPtVariantState {
  return {
    phase: 'negative',
    festaPhase: null,
    waitingForFallback: false,
    waitingForFestaSetup: false,
    eightOrNullsPending: false,
    eightOrNullsTarget: null,
    auctionTurnIndex: 0,
    showScorePopup: null,
    ...overrides
  } as KingPtVariantState;
}

function mockFlow(overrides: Partial<KingVariantFlow> = {}): KingVariantFlow {
  const base: KingVariantFlow = {
    kind: 'king',
    isPtNormal: () => true,
    readPtState: () => kingStub(),
    readPlayerScores: () => [0, 0, 0, 0],
    readSimplifiedHandType: () => undefined,
    advanceKohRevealStep: jest.fn(),
    confirmKohReveal: jest.fn(),
    submitAuctionPass: jest.fn(),
    submitAuctionBid: jest.fn(),
    acceptContract: jest.fn(),
    rejectContract: jest.fn(),
    requestHigherBid: jest.fn(),
    respondToHigherBid: jest.fn(),
    declareEightOrNulls: jest.fn(),
    respondEightOrNulls: jest.fn(),
    chooseFallback: jest.fn(),
    setupFesta: jest.fn(),
    dismissScorePopup: jest.fn(),
    acceptEarlyEnd: jest.fn(),
    declineEarlyEnd: jest.fn(),
    tickFestaAi: jest.fn(() => true),
    ...overrides
  };
  return { ...base, ...overrides };
}

describe('kingFlowController', () => {
  it('detects festa flow and builds sync key', () => {
    const king = kingStub({ festaPhase: 'auction', auctionTurnIndex: 2 });
    expect(isKingInFestaFlow(king)).toBe(true);
    expect(isKingInFestaFlow(kingStub({ phase: 'koh_reveal' }))).toBe(false);
    expect(buildKingFestaSyncKey(king)).toContain('auction');
  });

  it('dispatchFestaAction routes auction bid', () => {
    const submitAuctionBid = jest.fn();
    const ctrl = createKingFlowController(mockFlow({ submitAuctionBid }));
    ctrl.dispatchFestaAction({
      type: 'auction_bid',
      playerIndex: 0,
      bidType: 'positive',
      amount: 8
    });
    expect(submitAuctionBid).toHaveBeenCalledWith(0, 'positive', 8);
  });

  it('shouldTickFestaAi only in PT festa during round start', () => {
    const state = { waitingForRoundStart: true } as GameState;
    const ctrl = createKingFlowController(
      mockFlow({
        isPtNormal: () => true,
        readPtState: () => kingStub({ festaPhase: 'auction' })
      })
    );
    expect(ctrl.shouldTickFestaAi(state, 'king-pt-normal')).toBe(true);

    expect(
      createKingFlowController(
        mockFlow({
          isPtNormal: () => false,
          readPtState: () => kingStub({ festaPhase: 'auction' })
        })
      ).shouldTickFestaAi(state, 'king-simplified')
    ).toBe(false);

    expect(
      createKingFlowController(
        mockFlow({
          readPtState: () => kingStub({ festaPhase: null })
        })
      ).shouldTickFestaAi(state, 'king-pt-normal')
    ).toBe(false);
  });

  it('resolvePtOverlay prioritises KOH then festa then score', () => {
    const ctrl = createKingFlowController(
      mockFlow({
        readPtState: () =>
          kingStub({ phase: 'koh_reveal', festaPhase: 'auction', showScorePopup: 'round' })
      })
    );
    expect(
      ctrl.resolvePtOverlay({ waitingForRoundStart: true } as GameState, 'king-pt-normal')
    ).toBe('koh_reveal');

    expect(
      createKingFlowController(
        mockFlow({
          readPtState: () => kingStub({ festaPhase: 'negotiation' })
        })
      ).resolvePtOverlay({ waitingForRoundStart: true } as GameState, 'king-pt-normal')
    ).toBe('festa');

    expect(
      createKingFlowController(
        mockFlow({
          readPtState: () => kingStub({ showScorePopup: 'round' })
        })
      ).resolvePtOverlay({ waitingForRoundStart: false } as GameState, 'king-pt-normal')
    ).toBe('score_popup');
  });

  it('resolveEarlyEnd and KOH paths forward without side rules', () => {
    const acceptEarlyEnd = jest.fn();
    const declineEarlyEnd = jest.fn();
    const advanceKohRevealStep = jest.fn();
    const confirmKohReveal = jest.fn();
    const ctrl = createKingFlowController(
      mockFlow({ acceptEarlyEnd, declineEarlyEnd, advanceKohRevealStep, confirmKohReveal })
    );
    ctrl.resolveEarlyEnd(true);
    ctrl.resolveEarlyEnd(false);
    ctrl.advanceKohRevealStep();
    ctrl.confirmKohReveal();
    expect(acceptEarlyEnd).toHaveBeenCalledTimes(1);
    expect(declineEarlyEnd).toHaveBeenCalledTimes(1);
    expect(advanceKohRevealStep).toHaveBeenCalledTimes(1);
    expect(confirmKohReveal).toHaveBeenCalledTimes(1);
  });
});
