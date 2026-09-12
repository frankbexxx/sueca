import { KingPtGame, getKingPtState } from '../KingPtGame';
import { auctionBidderOrder } from './kingAuction';
import { resolveKingFestaUiView } from './kingFestaActionAvailability';
import {
  FESTA_AUCTION_AI_DELAY_MS,
  FESTA_AUCTION_RESULT_DELAY_MS
} from '../../../constants/gameConstants';

const NAMES = ['P1', 'P2', 'P3', 'P4'];

function enterAuction(
  game: KingPtGame,
  opts?: { allHumanBidders?: boolean }
): ReturnType<typeof getKingPtState> {
  game.initialize(NAMES, { localPlayerIndex: 0, kohPlayerIndex: 0 });
  game.confirmKohReveal();
  const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
  const king = getKingPtState(internal.state);
  king.gameIndex = 6;
  king.phase = 'festa_setup';
  king.festaOwnerIndex = 0;
  king.festaPhase = 'auction';
  king.auctionOrder = auctionBidderOrder(0);
  king.auctionTurnIndex = 0;
  king.bestBid = null;
  king.auctionPlayerActions = {};
  king.pauseFestaAiForDev = false;
  internal.state.waitingForRoundStart = true;
  if (opts?.allHumanBidders) {
    internal.state.players.forEach((p) => {
      p.type = 'human';
    });
  }
  internal.state.variantState = { ...internal.state.variantState, kingPt: king };
  return king;
}

describe('King festa auction pacing', () => {
  it('exposes ~1s auction and ~1.2s result delays for the host', () => {
    expect(FESTA_AUCTION_AI_DELAY_MS).toBe(1000);
    expect(FESTA_AUCTION_RESULT_DELAY_MS).toBe(1200);
  });

  it('runs only one AI auction action per tickFestaAi', () => {
    const game = new KingPtGame();
    enterAuction(game);

    expect(game.tickFestaAi()).toBe(true);
    const after1 = getKingPtState(game.getCurrentState());
    expect(after1.festaPhase).toBe('auction');
    expect(after1.auctionTurnIndex).toBe(1);
    expect(Object.keys(after1.auctionPlayerActions)).toHaveLength(1);
    expect(after1.auctionPlayerActions[after1.auctionOrder[0]]).toBeDefined();

    expect(game.tickFestaAi()).toBe(true);
    const after2 = getKingPtState(game.getCurrentState());
    expect(after2.festaPhase).toBe('auction');
    expect(after2.auctionTurnIndex).toBe(2);
    expect(Object.keys(after2.auctionPlayerActions)).toHaveLength(2);
  });

  it('follows auctionOrder seat sequence', () => {
    const game = new KingPtGame();
    enterAuction(game);
    const order = auctionBidderOrder(0);

    game.tickFestaAi();
    expect(Object.keys(getKingPtState(game.getCurrentState()).auctionPlayerActions)).toEqual([
      String(order[0])
    ]);

    game.tickFestaAi();
    expect(
      Object.keys(getKingPtState(game.getCurrentState()).auctionPlayerActions).map(Number).sort()
    ).toEqual([order[0], order[1]].sort());

    game.tickFestaAi();
    const done = getKingPtState(game.getCurrentState());
    expect(done.festaPhase).toBe('auction_result');
    expect(Object.keys(done.auctionPlayerActions).map(Number).sort()).toEqual(
      [...order].sort()
    );
  });

  it('does not start negotiation until auction_result is resolved', () => {
    const game = new KingPtGame();
    enterAuction(game, { allHumanBidders: true });
    const order = auctionBidderOrder(0);

    game.submitAuctionBid(order[0], 'positive', 5);
    game.submitAuctionPass(order[1]);
    game.submitAuctionBid(order[2], 'positive', 6);

    const result = getKingPtState(game.getCurrentState());
    expect(result.festaPhase).toBe('auction_result');
    expect(result.bestBid).toEqual({
      bidderIndex: order[2],
      bidType: 'positive',
      amount: 6
    });
    expect(resolveKingFestaUiView(result, 0)).toBe('auction_result');

    // Winner presentation must not change bestBid
    const winnerBefore = result.bestBid;
    expect(game.tickFestaAi()).toBe(true);
    const negotiated = getKingPtState(game.getCurrentState());
    expect(negotiated.festaPhase).toBe('negotiation');
    expect(negotiated.bestBid).toEqual(winnerBefore);
    expect(resolveKingFestaUiView(negotiated, 0)).toBe('negotiation_owner');
  });

  it('records passes and keeps winner correct', () => {
    const game = new KingPtGame();
    enterAuction(game, { allHumanBidders: true });
    const order = auctionBidderOrder(0);

    game.submitAuctionBid(order[0], 'positive', 4);
    game.submitAuctionPass(order[1]);
    game.submitAuctionPass(order[2]);

    const result = getKingPtState(game.getCurrentState());
    expect(result.auctionPlayerActions[order[1]]).toBe('pass');
    expect(result.auctionPlayerActions[order[2]]).toBe('pass');
    expect(result.bestBid?.bidderIndex).toBe(order[0]);
    expect(result.festaPhase).toBe('auction_result');

    game.tickFestaAi();
    expect(getKingPtState(game.getCurrentState()).festaPhase).toBe('negotiation');
    expect(getKingPtState(game.getCurrentState()).bestBid?.amount).toBe(4);
  });

  it('no-bids shows auction_result then fallback', () => {
    const game = new KingPtGame();
    enterAuction(game, { allHumanBidders: true });
    const order = auctionBidderOrder(0);

    game.submitAuctionPass(order[0]);
    game.submitAuctionPass(order[1]);
    game.submitAuctionPass(order[2]);

    const result = getKingPtState(game.getCurrentState());
    expect(result.festaPhase).toBe('auction_result');
    expect(result.bestBid).toBeNull();
    expect(result.waitingForFallback).toBe(false);

    game.tickFestaAi();
    const fallback = getKingPtState(game.getCurrentState());
    expect(fallback.festaPhase).toBe('fallback');
    expect(fallback.waitingForFallback).toBe(true);
    expect(fallback.fallbackReason).toBe('no_bids');
    expect(fallback.bestBid).toBeNull();
  });

  it('DEV pause blocks auction ticks', () => {
    const game = new KingPtGame();
    enterAuction(game);
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.pauseFestaAiForDev = true;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };

    expect(game.tickFestaAi()).toBe(false);
    const after = getKingPtState(game.getCurrentState());
    expect(after.festaPhase).toBe('auction');
    expect(after.auctionTurnIndex).toBe(0);
    expect(Object.keys(after.auctionPlayerActions)).toHaveLength(0);
  });
});
