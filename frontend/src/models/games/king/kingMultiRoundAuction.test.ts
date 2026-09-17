import { KingPtGame, getKingPtState } from '../KingPtGame';
import {
  auctionBidderOrder,
  bidEquivalentPositive,
  canUseFourThreeThree,
  compareKingOffers
} from './kingAuction';

const NAMES = ['P0', 'P1', 'P2', 'P3'];

function enterHumanAuction(game: KingPtGame): void {
  game.initialize(NAMES, { localPlayerIndex: 0, kohPlayerIndex: 0 });
  game.confirmKohReveal();
  const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
  const king = getKingPtState(internal.state);
  king.gameIndex = 6;
  king.phase = 'festa_setup';
  king.festaOwnerIndex = 0;
  king.festaPhase = 'auction';
  king.auctionOrder = auctionBidderOrder(0);
  king.activeBidders = [...king.auctionOrder];
  king.passedBidders = [];
  king.currentBidder = king.auctionOrder[0];
  king.auctionTurnIndex = 0;
  king.standingBid = null;
  king.bestBid = null;
  king.highestEquivalentValue = 0;
  king.auctionPlayerActions = {};
  king.auctionHistory = [];
  king.waitingForAuctionContinue = false;
  king.pauseFestaAiForDev = false;
  internal.state.waitingForRoundStart = true;
  internal.state.players.forEach((p) => {
    p.type = 'human';
  });
  internal.state.variantState = { ...internal.state.variantState, kingPt: king };
}

describe('King multi-round festa auction', () => {
  it('exact regression: P1 2V → P2 1N → P3 3V → P1 3V → P2 pass → P3 4V → P1 pass → P3 wins', () => {
    const game = new KingPtGame();
    enterHumanAuction(game);
    const [p1, p2, p3] = auctionBidderOrder(0);

    game.submitAuctionBid(p1, 'positive', 2);
    game.confirmAuctionContinue();
    game.submitAuctionBid(p2, 'null', 1);
    game.confirmAuctionContinue();
    game.submitAuctionBid(p3, 'positive', 3);

    let mid = getKingPtState(game.getCurrentState());
    expect(mid.festaPhase).toBe('auction');
    expect(mid.standingBid).toEqual({ bidderIndex: p2, bidType: 'null', amount: 1 });
    expect(mid.currentBidder).toBe(p1);
    expect(mid.activeBidders.sort()).toEqual([p1, p2, p3].sort());

    game.confirmAuctionContinue();
    game.submitAuctionBid(p1, 'positive', 3);
    mid = getKingPtState(game.getCurrentState());
    expect(mid.standingBid).toEqual({ bidderIndex: p1, bidType: 'positive', amount: 3 });
    expect(mid.bestBid?.bidderIndex).toBe(p1);

    game.confirmAuctionContinue();
    game.submitAuctionPass(p2);
    mid = getKingPtState(game.getCurrentState());
    expect(mid.passedBidders).toContain(p2);
    expect(mid.activeBidders.sort()).toEqual([p1, p3].sort());

    game.confirmAuctionContinue();
    game.submitAuctionBid(p3, 'positive', 4);
    mid = getKingPtState(game.getCurrentState());
    expect(mid.standingBid).toEqual({ bidderIndex: p3, bidType: 'positive', amount: 4 });
    expect(mid.highestEquivalentValue).toBeGreaterThanOrEqual(4);

    game.confirmAuctionContinue();
    game.submitAuctionPass(p1);
    const done = getKingPtState(game.getCurrentState());
    expect(done.activeBidders).toEqual([p3]);
    expect(done.festaPhase).toBe('auction_result');
    expect(done.standingBid).toEqual({ bidderIndex: p3, bidType: 'positive', amount: 4 });
    expect(done.bestBid).toEqual(done.standingBid);

    game.confirmAuctionContinue();
    const negotiated = getKingPtState(game.getCurrentState());
    expect(negotiated.festaPhase).toBe('negotiation');
    expect(negotiated.bestBid?.bidderIndex).toBe(p3);
    expect(negotiated.bestBid?.amount).toBe(4);
  });

  it('PASS removes bidder permanently; cannot bid again', () => {
    const game = new KingPtGame();
    enterHumanAuction(game);
    const [p1, p2, p3] = auctionBidderOrder(0);

    game.submitAuctionPass(p1);
    game.confirmAuctionContinue();
    expect(getKingPtState(game.getCurrentState()).activeBidders).not.toContain(p1);

    game.submitAuctionBid(p2, 'positive', 2);
    game.confirmAuctionContinue();
    // p1 turn skipped — already passed
    game.submitAuctionPass(p3);
    const done = getKingPtState(game.getCurrentState());
    expect(done.festaPhase).toBe('auction_result');
    expect(done.bestBid?.bidderIndex).toBe(p2);
    expect(done.passedBidders).toEqual(expect.arrayContaining([p1, p3]));
  });

  it('bidder can bid multiple times across cycles', () => {
    const game = new KingPtGame();
    enterHumanAuction(game);
    const [p1, p2, p3] = auctionBidderOrder(0);

    game.submitAuctionBid(p1, 'positive', 1);
    game.confirmAuctionContinue();
    game.submitAuctionBid(p2, 'positive', 2);
    game.confirmAuctionContinue();
    game.submitAuctionPass(p3);
    game.confirmAuctionContinue();
    game.submitAuctionBid(p1, 'positive', 3);
    const mid = getKingPtState(game.getCurrentState());
    expect(mid.festaPhase).toBe('auction');
    expect(mid.standingBid?.amount).toBe(3);
    expect(mid.auctionHistory.filter((e) => e.seat === p1 && e.action === 'bid')).toHaveLength(2);
  });

  it('preference equality: P1 3V takes lead from P2 1-null; P3 3V cannot steal from P1', () => {
    const order = auctionBidderOrder(0);
    const p1Null: Parameters<typeof compareKingOffers>[0] = {
      bidderIndex: order[1],
      bidType: 'null',
      amount: 1
    };
    const p0Three = { bidderIndex: order[0], bidType: 'positive' as const, amount: 3 };
    const p2Three = { bidderIndex: order[2], bidType: 'positive' as const, amount: 3 };
    expect(compareKingOffers(p0Three, p1Null, order)).toBe('beats');
    expect(compareKingOffers(p2Three, p0Three, order)).toBe('equal_no_preference');
  });

  it('all pass → no winner → fallback after auction_result', () => {
    const game = new KingPtGame();
    enterHumanAuction(game);
    const [p1, p2, p3] = auctionBidderOrder(0);
    game.submitAuctionPass(p1);
    game.confirmAuctionContinue();
    game.submitAuctionPass(p2);
    game.confirmAuctionContinue();
    game.submitAuctionPass(p3);
    expect(getKingPtState(game.getCurrentState()).festaPhase).toBe('auction_result');
    expect(getKingPtState(game.getCurrentState()).bestBid).toBeNull();
    game.confirmAuctionContinue();
    expect(getKingPtState(game.getCurrentState()).fallbackReason).toBe('no_bids');
  });

  it('8-or-nulls targets multi-round winner', () => {
    const game = new KingPtGame();
    enterHumanAuction(game);
    const [p1, p2, p3] = auctionBidderOrder(0);
    game.submitAuctionBid(p1, 'positive', 2);
    game.confirmAuctionContinue();
    game.submitAuctionPass(p2);
    game.confirmAuctionContinue();
    game.submitAuctionBid(p3, 'positive', 4);
    game.confirmAuctionContinue();
    game.submitAuctionPass(p1);
    game.confirmAuctionContinue();
    expect(getKingPtState(game.getCurrentState()).bestBid?.bidderIndex).toBe(p3);

    game.declareEightOrNulls();
    const pending = getKingPtState(game.getCurrentState());
    expect(pending.eightOrNullsPending).toBe(true);
    expect(pending.eightOrNullsTarget).toBe(p3);
  });

  it('4x3x3 blocked by watermark even if standing leader later forfeits', () => {
    const game = new KingPtGame();
    enterHumanAuction(game);
    const [p1, p2, p3] = auctionBidderOrder(0);

    game.submitAuctionBid(p1, 'positive', 4);
    expect(getKingPtState(game.getCurrentState()).highestEquivalentValue).toBe(4);
    game.confirmAuctionContinue();
    game.submitAuctionBid(p2, 'positive', 5);
    game.confirmAuctionContinue();
    game.submitAuctionPass(p3);
    game.confirmAuctionContinue();
    // p1 (not leader) passes
    game.submitAuctionPass(p1);
    const done = getKingPtState(game.getCurrentState());
    expect(done.bestBid?.bidderIndex).toBe(p2);
    expect(done.highestEquivalentValue).toBeGreaterThanOrEqual(4);
    expect(canUseFourThreeThree(done.bestBid, done.highestEquivalentValue)).toBe(false);

    // Case A: watermark 3 allows 4x3x3
    expect(
      canUseFourThreeThree({ bidderIndex: 1, bidType: 'positive', amount: 3 }, 3)
    ).toBe(true);
  });

  it('resume defaults: missing multi-round fields hydrate safely', () => {
    const game = new KingPtGame();
    game.initialize(NAMES, { localPlayerIndex: 0, kohPlayerIndex: 0 });
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const legacy = {
      ...getKingPtState(internal.state),
      festaPhase: 'auction' as const,
      auctionOrder: auctionBidderOrder(0),
      auctionTurnIndex: 1,
      bestBid: { bidderIndex: 1, bidType: 'positive' as const, amount: 2 }
    };
    delete (legacy as { activeBidders?: unknown }).activeBidders;
    delete (legacy as { passedBidders?: unknown }).passedBidders;
    delete (legacy as { currentBidder?: unknown }).currentBidder;
    delete (legacy as { standingBid?: unknown }).standingBid;
    delete (legacy as { highestEquivalentValue?: unknown }).highestEquivalentValue;
    internal.state.variantState = { ...internal.state.variantState, kingPt: legacy };
    const hydrated = getKingPtState(internal.state);
    expect(hydrated.activeBidders).toEqual(auctionBidderOrder(0));
    expect(hydrated.passedBidders).toEqual([]);
    expect(hydrated.currentBidder).toBe(auctionBidderOrder(0)[1]);
    expect(hydrated.standingBid).toEqual(legacy.bestBid);
    expect(hydrated.highestEquivalentValue).toBe(bidEquivalentPositive(legacy.bestBid!));
  });
});
