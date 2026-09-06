import { createSpadesFlowController } from './spadesFlowController';
import type { SpadesVariantFlow } from '../models/games/variantFlowApi';
import type { SpadesVariantState } from '../models/games/SpadesGame';
import type { GameState, Player } from '../types/game';

function spadesState(overrides: Partial<SpadesVariantState> = {}): SpadesVariantState {
  return {
    playerBids: [null, null, null, null],
    playerBidTypes: ['normal', 'normal', 'normal', 'normal'],
    bidLeaderIndex: 0,
    currentBidderIndex: 1,
    team1Bid: 0,
    team2Bid: 0,
    team1Tricks: 0,
    team2Tricks: 0,
    playerTricks: [0, 0, 0, 0],
    team1Bags: 0,
    team2Bags: 0,
    waitingForBids: true,
    spadesBroken: false,
    nilEnabled: true,
    blindNilEnabled: false,
    ...overrides
  };
}

function players(types: Array<Player['type']>): Player[] {
  return types.map((type, i) => ({
    id: String(i),
    name: `P${i}`,
    hand: [],
    team: (i % 2 === 0 ? 1 : 2) as 1 | 2,
    type
  }));
}

describe('spadesFlowController', () => {
  it('submitHumanBid calls flow.submitBid', () => {
    const submitBid = jest.fn(() => true);
    const flow: SpadesVariantFlow = {
      kind: 'spades',
      readState: () => spadesState(),
      submitBid,
      tickBidAi: jest.fn()
    };
    createSpadesFlowController(flow).submitHumanBid(0, 3, 'nil');
    expect(submitBid).toHaveBeenCalledWith(0, 3, 'nil');
  });

  it('shouldTickBidAi only when AI bidder and not local turn', () => {
    const vs = spadesState({ currentBidderIndex: 2 });
    const flow: SpadesVariantFlow = {
      kind: 'spades',
      readState: () => vs,
      submitBid: jest.fn(() => true),
      tickBidAi: jest.fn()
    };
    const ctrl = createSpadesFlowController(flow);
    const state = {
      players: players(['human', 'ai', 'ai', 'ai'])
    } as GameState;

    expect(
      ctrl.shouldTickBidAi({
        bidActive: true,
        state,
        localPlayerIndex: 0,
        spadesState: vs
      })
    ).toBe(true);

    expect(
      ctrl.shouldTickBidAi({
        bidActive: false,
        state,
        localPlayerIndex: 0,
        spadesState: vs
      })
    ).toBe(false);

    expect(
      ctrl.shouldTickBidAi({
        bidActive: true,
        state,
        localPlayerIndex: 2,
        spadesState: vs
      })
    ).toBe(false);
  });
});
