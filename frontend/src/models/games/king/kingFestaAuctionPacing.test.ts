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
  king.auctionHistory = [];
  king.waitingForAuctionContinue = false;
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

describe('King festa auction pacing (manual Continuar)', () => {
  it('keeps delay constants documented (unused for auction auto-advance)', () => {
    expect(FESTA_AUCTION_AI_DELAY_MS).toBe(1000);
    expect(FESTA_AUCTION_RESULT_DELAY_MS).toBe(1200);
  });

  it('runs only one AI auction action per tickFestaAi then waits', () => {
    const game = new KingPtGame();
    enterAuction(game);

    expect(game.tickFestaAi()).toBe(true);
    const after1 = getKingPtState(game.getCurrentState());
    expect(after1.festaPhase).toBe('auction');
    expect(after1.auctionTurnIndex).toBe(1);
    expect(Object.keys(after1.auctionPlayerActions)).toHaveLength(1);
    expect(after1.waitingForAuctionContinue).toBe(true);
    expect(resolveKingFestaUiView(after1, 0)).toBe('auction_continue');

    // Blocked until Continuar
    expect(game.tickFestaAi()).toBe(false);
    expect(getKingPtState(game.getCurrentState()).auctionTurnIndex).toBe(1);

    game.confirmAuctionContinue();
    const afterContinue = getKingPtState(game.getCurrentState());
    expect(afterContinue.auctionTurnIndex).toBe(2);
    expect(Object.keys(afterContinue.auctionPlayerActions)).toHaveLength(2);
    expect(afterContinue.waitingForAuctionContinue).toBe(true);
  });

  it('follows auctionOrder seat sequence with Continuar between voices', () => {
    const game = new KingPtGame();
    enterAuction(game);
    const order = auctionBidderOrder(0);

    game.tickFestaAi();
    expect(Object.keys(getKingPtState(game.getCurrentState()).auctionPlayerActions)).toEqual([
      String(order[0])
    ]);

    game.confirmAuctionContinue();
    expect(
      Object.keys(getKingPtState(game.getCurrentState()).auctionPlayerActions).map(Number).sort()
    ).toEqual([order[0], order[1]].sort());

    game.confirmAuctionContinue();
    const done = getKingPtState(game.getCurrentState());
    expect(done.festaPhase).toBe('auction_result');
    expect(done.waitingForAuctionContinue).toBe(true);
    expect(Object.keys(done.auctionPlayerActions).map(Number).sort()).toEqual(
      [...order].sort()
    );
  });

  it('PASS also waits for Continuar', () => {
    const game = new KingPtGame();
    enterAuction(game, { allHumanBidders: true });
    const order = auctionBidderOrder(0);

    game.submitAuctionPass(order[0]);
    const afterPass = getKingPtState(game.getCurrentState());
    expect(afterPass.auctionPlayerActions[order[0]]).toBe('pass');
    expect(afterPass.waitingForAuctionContinue).toBe(true);
    expect(afterPass.auctionHistory).toHaveLength(1);
    expect(afterPass.auctionHistory[0].action).toBe('pass');
    expect(resolveKingFestaUiView(afterPass, 0)).toBe('auction_continue');
    expect(afterPass.auctionTurnIndex).toBe(1);

    // Next human cannot act until Continuar
    game.submitAuctionBid(order[1], 'positive', 3);
    expect(getKingPtState(game.getCurrentState()).auctionTurnIndex).toBe(1);

    game.confirmAuctionContinue();
    expect(getKingPtState(game.getCurrentState()).waitingForAuctionContinue).toBe(false);
    expect(getKingPtState(game.getCurrentState()).auctionTurnIndex).toBe(1);
  });

  it('does not start negotiation until auction_result Continuar', () => {
    const game = new KingPtGame();
    enterAuction(game, { allHumanBidders: true });
    const order = auctionBidderOrder(0);

    game.submitAuctionBid(order[0], 'positive', 5);
    game.confirmAuctionContinue();
    game.submitAuctionPass(order[1]);
    game.confirmAuctionContinue();
    game.submitAuctionBid(order[2], 'positive', 6);

    const result = getKingPtState(game.getCurrentState());
    expect(result.festaPhase).toBe('auction_result');
    expect(result.bestBid).toEqual({
      bidderIndex: order[2],
      bidType: 'positive',
      amount: 6
    });
    expect(resolveKingFestaUiView(result, 0)).toBe('auction_result');
    expect(result.waitingForAuctionContinue).toBe(true);

    expect(game.tickFestaAi()).toBe(false);
    expect(getKingPtState(game.getCurrentState()).festaPhase).toBe('auction_result');

    const winnerBefore = result.bestBid;
    game.confirmAuctionContinue();
    const negotiated = getKingPtState(game.getCurrentState());
    expect(negotiated.festaPhase).toBe('negotiation');
    expect(negotiated.bestBid).toEqual(winnerBefore);
    expect(negotiated.waitingForAuctionContinue).toBe(false);
    expect(resolveKingFestaUiView(negotiated, 0)).toBe('negotiation_owner');
  });

  it('records passes and keeps winner correct', () => {
    const game = new KingPtGame();
    enterAuction(game, { allHumanBidders: true });
    const order = auctionBidderOrder(0);

    game.submitAuctionBid(order[0], 'positive', 4);
    game.confirmAuctionContinue();
    game.submitAuctionPass(order[1]);
    game.confirmAuctionContinue();
    game.submitAuctionPass(order[2]);

    const result = getKingPtState(game.getCurrentState());
    expect(result.auctionPlayerActions[order[1]]).toBe('pass');
    expect(result.auctionPlayerActions[order[2]]).toBe('pass');
    expect(result.bestBid?.bidderIndex).toBe(order[0]);
    expect(result.festaPhase).toBe('auction_result');

    game.confirmAuctionContinue();
    expect(getKingPtState(game.getCurrentState()).festaPhase).toBe('negotiation');
    expect(getKingPtState(game.getCurrentState()).bestBid?.amount).toBe(4);
  });

  it('no-bids shows auction_result then fallback after Continuar', () => {
    const game = new KingPtGame();
    enterAuction(game, { allHumanBidders: true });
    const order = auctionBidderOrder(0);

    game.submitAuctionPass(order[0]);
    game.confirmAuctionContinue();
    game.submitAuctionPass(order[1]);
    game.confirmAuctionContinue();
    game.submitAuctionPass(order[2]);

    const result = getKingPtState(game.getCurrentState());
    expect(result.festaPhase).toBe('auction_result');
    expect(result.bestBid).toBeNull();
    expect(result.waitingForFallback).toBe(false);
    expect(result.waitingForAuctionContinue).toBe(true);

    expect(game.tickFestaAi()).toBe(false);

    game.confirmAuctionContinue();
    const fallback = getKingPtState(game.getCurrentState());
    expect(fallback.festaPhase).toBe('fallback');
    expect(fallback.waitingForFallback).toBe(true);
    expect(fallback.fallbackReason).toBe('no_bids');
    expect(fallback.bestBid).toBeNull();
  });

  it('timeline keeps entries during waits', () => {
    const game = new KingPtGame();
    enterAuction(game, { allHumanBidders: true });
    const order = auctionBidderOrder(0);

    game.submitAuctionBid(order[0], 'positive', 2);
    expect(getKingPtState(game.getCurrentState()).auctionHistory).toHaveLength(1);
    game.confirmAuctionContinue();
    game.submitAuctionPass(order[1]);
    const mid = getKingPtState(game.getCurrentState());
    expect(mid.auctionHistory).toHaveLength(2);
    expect(mid.waitingForAuctionContinue).toBe(true);
    expect(mid.auctionHistory.map((e) => e.action)).toEqual(['bid', 'pass']);
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