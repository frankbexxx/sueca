import { SpadesGame, SpadesVariantState } from './SpadesGame';
import { trickWinnerIndex } from './trickUtils';
import { Card } from '../../types/game';

const names = ['A', 'B', 'C', 'D'];

function getSpades(state: ReturnType<SpadesGame['getCurrentState']>): SpadesVariantState {
  return state.variantState?.spades as SpadesVariantState;
}

function submitAllBidsInOrder(
  game: SpadesGame,
  bids: Array<{ bid: number; bidType?: 'normal' | 'nil' | 'blindNil' }>
): void {
  const state = game.getCurrentState();
  const leader = getSpades(state).bidLeaderIndex;
  for (let step = 0; step < 4; step++) {
    const playerIndex = (leader + step) % 4;
    const entry = bids[playerIndex];
    game.submitBid(playerIndex, entry.bid, entry.bidType ?? 'normal');
  }
}

describe('SpadesGame', () => {
  it('follows suit when possible', () => {
    const game = new SpadesGame();
    const state = game.initialize(names, {});
    const player = state.players[0];
    player.hand = [
      { id: '1', rank: '2', suit: 'hearts' },
      { id: '2', rank: '5', suit: 'clubs' }
    ];
    state.currentTrick = [{ id: '3', rank: 'A', suit: 'clubs' }];
    state.currentPlayerIndex = 0;
    state.waitingForRoundStart = false;
    getSpades(state).waitingForBids = false;
    getSpades(state).playerBids = [4, 4, 4, 4];
    (game as unknown as { state: typeof state }).state = state;

    expect(game.canPlayCard(state, 0, 0)).toBe(false);
    expect(game.canPlayCard(state, 0, 1)).toBe(true);
  });

  it('trick winner uses spades as trump', () => {
    const trick: Card[] = [
      { id: '1', rank: 'A', suit: 'clubs' },
      { id: '2', rank: 'K', suit: 'clubs' },
      { id: '3', rank: '2', suit: 'spades' },
      { id: '4', rank: 'A', suit: 'hearts' }
    ];
    expect(trickWinnerIndex(trick, 0, 'spades')).toBe(2);
  });

  it('records team trick on finishTrick', () => {
    const game = new SpadesGame();
    game.initialize(names, {});
    const internal = game as unknown as {
      state: ReturnType<SpadesGame['getCurrentState']>;
    };
    const s = internal.state;
    s.waitingForTrickEnd = true;
    s.nextTrickLeader = 0;
    s.currentTrick = [
      { id: '1', rank: '2', suit: 'clubs' },
      { id: '2', rank: '3', suit: 'clubs' },
      { id: '3', rank: '4', suit: 'clubs' },
      { id: '4', rank: '5', suit: 'clubs' }
    ];
    game.finishTrick(s);
    expect(getSpades(s).team1Tricks).toBe(1);
    expect(getSpades(s).playerTricks[0]).toBe(1);
  });

  it('allows leading spades after spades are broken', () => {
    const game = new SpadesGame();
    game.initialize(names, {});
    const internal = game as unknown as { state: ReturnType<SpadesGame['getCurrentState']> };
    const s = internal.state;
    s.waitingForRoundStart = false;
    getSpades(s).waitingForBids = false;
    getSpades(s).playerBids = [4, 4, 4, 4];
    getSpades(s).spadesBroken = true;
    s.players[0].hand = [
      { id: '1', rank: '2', suit: 'spades' },
      { id: '2', rank: '5', suit: 'clubs' }
    ];
    s.currentTrick = [];
    s.currentPlayerIndex = 0;
    expect(game.canPlayCard(s, 0, 0)).toBe(true);
  });

  it('completes bidding sequentially in bid order', () => {
    const game = new SpadesGame();
    game.initialize(names, {});
    const leader = getSpades(game.getCurrentState()).bidLeaderIndex;
    submitAllBidsInOrder(game, [
      { bid: 3 },
      { bid: 2 },
      { bid: 4 },
      { bid: 1 }
    ]);
    const spades = getSpades(game.getCurrentState());
    expect(spades.waitingForBids).toBe(false);
    expect(spades.playerBids).toEqual([3, 2, 4, 1]);
    expect(spades.team1Bid).toBe(7);
    expect(spades.team2Bid).toBe(3);
    expect(game.getCurrentState().currentPlayerIndex).toBe(
      (game.getCurrentState().dealerIndex + 1) % 4
    );
    expect(leader).toBeGreaterThanOrEqual(0);
    expect(leader).toBeLessThan(4);
  });

  it('rotates first bidder each round', () => {
    const game = new SpadesGame();
    game.initialize(names, {});
    const leader1 = getSpades(game.getCurrentState()).bidLeaderIndex;
    submitAllBidsInOrder(game, [
      { bid: 2 },
      { bid: 2 },
      { bid: 2 },
      { bid: 2 }
    ]);
    const internal = game as unknown as { state: ReturnType<SpadesGame['getCurrentState']> };
    internal.state.waitingForRoundEnd = true;
    game.continueToNextRound(internal.state);
    const leader2 = getSpades(game.getCurrentState()).bidLeaderIndex;
    expect(leader2).toBe((leader1 + 1) % 4);
  });

  it('sums individual bids into team totals via applyBids helper', () => {
    const game = new SpadesGame();
    game.initialize(names, {});
    game.applyBids([3, 2, 4, 1]);
    const spades = getSpades(game.getCurrentState());
    expect(spades.playerBids).toEqual([3, 2, 4, 1]);
    expect(spades.team1Bid).toBe(7);
    expect(spades.team2Bid).toBe(3);
  });

  it('scores contract and bags', () => {
    const game = new SpadesGame();
    game.initialize(names, {});
    game.applyBids([2, 2, 2, 2]);
    const internal = game as unknown as {
      state: ReturnType<SpadesGame['getCurrentState']>;
      endRound: (s: ReturnType<SpadesGame['getCurrentState']>) => void;
    };
    const s = internal.state;
    getSpades(s).team1Tricks = 6;
    getSpades(s).team1Bid = 4;
    getSpades(s).team2Tricks = 7;
    internal.endRound(s);
    expect(s.gameScore.team1).toBeGreaterThan(0);
  });

  it('applies nil bonus when nil player takes zero tricks', () => {
    const game = new SpadesGame();
    game.initialize(names, { rulesPresetId: 'spades-pt-nil' });
    submitAllBidsInOrder(game, [
      { bid: 0, bidType: 'nil' },
      { bid: 3, bidType: 'normal' },
      { bid: 3, bidType: 'normal' },
      { bid: 3, bidType: 'normal' }
    ]);
    const internal = game as unknown as {
      state: ReturnType<SpadesGame['getCurrentState']>;
      endRound: (s: ReturnType<SpadesGame['getCurrentState']>) => void;
    };
    const s = internal.state;
    const spades = getSpades(s);
    spades.team1Bid = 3;
    spades.team2Bid = 6;
    spades.team1Tricks = 4;
    spades.team2Tricks = 9;
    spades.playerTricks = [0, 2, 2, 5];
    internal.endRound(s);
    expect(s.scores.team1).toBeGreaterThanOrEqual(100);
  });

  it('tickBidAi submits for current AI bidder', () => {
    const game = new SpadesGame();
    game.initialize(names, {});
    const internal = game as unknown as { state: ReturnType<SpadesGame['getCurrentState']> };
    const spades = getSpades(internal.state);
    spades.currentBidderIndex = 1;
    internal.state.players[1].type = 'ai';
    game.tickBidAi();
    expect(getSpades(game.getCurrentState()).playerBids[1]).not.toBeNull();
  });
});
