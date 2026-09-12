import {
  appendKingAuctionHistory,
  buildDevAuctionHistoryFromActions,
  formatAuctionHistoryChipValue,
  shortAuctionSeatLabel,
  shouldShowKingAuctionTimeline
} from './kingAuctionHistory';
import { KingPtGame, getKingPtState } from '../KingPtGame';
import { auctionBidderOrder } from './kingAuction';

const NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

function enterAuction(game: KingPtGame): void {
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
  internal.state.waitingForRoundStart = true;
  internal.state.players.forEach((p) => {
    p.type = 'human';
  });
  internal.state.variantState = { ...internal.state.variantState, kingPt: king };
}

describe('kingAuctionHistory', () => {
  it('appends chronological entries with sequence', () => {
    let history = appendKingAuctionHistory([], 1, 'bid', { amount: 6, bidType: 'positive' });
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual({
      seat: 1,
      action: 'bid',
      amount: 6,
      bidType: 'positive',
      sequence: 1
    });

    history = appendKingAuctionHistory(history, 2, 'pass');
    expect(history).toHaveLength(2);
    expect(history[1]).toEqual({ seat: 2, action: 'pass', sequence: 2 });

    history = appendKingAuctionHistory(history, 3, 'bid', { amount: 7, bidType: 'positive' });
    expect(history.map((e) => e.sequence)).toEqual([1, 2, 3]);
    expect(history.map((e) => e.seat)).toEqual([1, 2, 3]);
  });

  it('formats chips and seat labels', () => {
    expect(formatAuctionHistoryChipValue({ seat: 1, action: 'pass', sequence: 1 })).toBe('PASS');
    expect(
      formatAuctionHistoryChipValue({
        seat: 1,
        action: 'bid',
        amount: 6,
        bidType: 'positive',
        sequence: 1
      })
    ).toBe('6');
    expect(
      formatAuctionHistoryChipValue({
        seat: 1,
        action: 'bid',
        amount: 2,
        bidType: 'null',
        sequence: 1
      })
    ).toBe('2N');
    expect(shortAuctionSeatLabel('Player 2', 1)).toBe('P2');
  });

  it('shows timeline only in auction / result / negotiation phases', () => {
    expect(shouldShowKingAuctionTimeline('auction')).toBe(true);
    expect(shouldShowKingAuctionTimeline('auction_result')).toBe(true);
    expect(shouldShowKingAuctionTimeline('negotiation')).toBe(true);
    expect(shouldShowKingAuctionTimeline('negotiation_counter')).toBe(true);
    expect(shouldShowKingAuctionTimeline('fallback')).toBe(false);
    expect(shouldShowKingAuctionTimeline('setup')).toBe(false);
    expect(shouldShowKingAuctionTimeline(null)).toBe(false);
  });

  it('records history on engine auction actions without changing winner rules', () => {
    const game = new KingPtGame();
    enterAuction(game);
    const order = auctionBidderOrder(0);

    game.submitAuctionBid(order[0], 'positive', 6);
    let king = getKingPtState(game.getCurrentState());
    expect(king.auctionHistory).toHaveLength(1);
    expect(king.auctionHistory[0].action).toBe('bid');
    expect(king.auctionHistory[0].amount).toBe(6);
    expect(king.waitingForAuctionContinue).toBe(true);

    game.confirmAuctionContinue();
    game.submitAuctionPass(order[1]);
    king = getKingPtState(game.getCurrentState());
    expect(king.auctionHistory).toHaveLength(2);
    expect(king.auctionHistory[1].action).toBe('pass');
    expect(king.auctionHistory.map((e) => e.seat)).toEqual([order[0], order[1]]);
    expect(king.waitingForAuctionContinue).toBe(true);

    game.confirmAuctionContinue();
    game.submitAuctionBid(order[2], 'positive', 7);
    king = getKingPtState(game.getCurrentState());
    expect(king.auctionHistory).toHaveLength(3);
    expect(king.auctionHistory.map((e) => e.sequence)).toEqual([1, 2, 3]);
    expect(king.festaPhase).toBe('auction_result');
    expect(king.bestBid).toEqual({
      bidderIndex: order[2],
      bidType: 'positive',
      amount: 7
    });
  });

  it('records three PASS for no-bids and resets on new auction', () => {
    const game = new KingPtGame();
    enterAuction(game);
    const order = auctionBidderOrder(0);

    game.submitAuctionPass(order[0]);
    expect(getKingPtState(game.getCurrentState()).waitingForAuctionContinue).toBe(true);
    game.confirmAuctionContinue();

    game.submitAuctionPass(order[1]);
    expect(getKingPtState(game.getCurrentState()).waitingForAuctionContinue).toBe(true);
    game.confirmAuctionContinue();

    game.submitAuctionPass(order[2]);
    let king = getKingPtState(game.getCurrentState());
    expect(king.auctionHistory.every((e) => e.action === 'pass')).toBe(true);
    expect(king.auctionHistory).toHaveLength(3);
    expect(king.auctionHistory.map((e) => e.seat)).toEqual(order);
    expect(king.auctionHistory.map((e) => e.sequence)).toEqual([1, 2, 3]);
    expect(king.bestBid).toBeNull();
    expect(king.festaPhase).toBe('auction_result');
    expect(king.waitingForAuctionContinue).toBe(true);

    // New festa auction clears history (NODE_ENV=development fixture path)
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const jumped = game.applyDevFestaFixture(NAMES, {
        festaGameNumber: 8,
        festaPhase: 'auction',
        liveAuction: false
      });
      const next = getKingPtState(jumped);
      expect(next.auctionHistory).toEqual([]);
      expect(next.festaOwnerIndex).toBe(1);
      expect(next.festaPhase).toBe('auction');
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('buildDevAuctionHistoryFromActions preserves order', () => {
    const order = [1, 2, 3];
    const history = buildDevAuctionHistoryFromActions(order, {
      1: { bidderIndex: 1, bidType: 'positive', amount: 5 },
      2: 'pass',
      3: 'pass'
    });
    expect(history.map((e) => `${e.seat}:${e.action}`)).toEqual([
      '1:bid',
      '2:pass',
      '3:pass'
    ]);
  });
});
