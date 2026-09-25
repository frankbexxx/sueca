import {
  KingPtGame,
  getKingPtState,
  isDevSyntheticAllNegatives
} from '../KingPtGame';
import { syntheticAllNegativesTrickPenalty } from './kingScoring';
import { kingSyntheticRoundLabel } from './kingContracts';
import { canKingEndRoundEarly } from '../../../utils/earlyRoundEnd';

type Internal = { state: ReturnType<KingPtGame['getCurrentState']> };

function enableSyntheticAfterDeal(game: KingPtGame): Internal {
  game.initialize(['A', 'B', 'C', 'D'], {
    localPlayerIndex: 0,
    rulesPresetId: 'king-pt-synthetic'
  });
  game.confirmKohReveal();
  const internal = game as unknown as Internal;
  internal.state.waitingForRoundStart = false;
  return internal;
}

describe('King synthetic combined negatives', () => {
  // Product mode — no development NODE_ENV required.

  it('follow-suit is mandatory', () => {
    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);
    internal.state.currentPlayerIndex = 0;
    internal.state.currentTrick = [{ id: 'c7', rank: '7', suit: 'clubs' }];
    internal.state.trickLeader = 3;
    internal.state.players[0].hand = [
      { id: 'c2', rank: '2', suit: 'clubs' },
      { id: 'h2', rank: '2', suit: 'hearts' }
    ];
    expect(game.canPlayCard(internal.state, 0, 0)).toBe(true);
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(false);
  });

  it('hearts lead restriction is active', () => {
    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);
    internal.state.currentPlayerIndex = 0;
    internal.state.currentTrick = [];
    internal.state.players[0].hand = [
      { id: 'h2', rank: '2', suit: 'hearts' },
      { id: 'c3', rank: '3', suit: 'clubs' }
    ];
    expect(game.canPlayCard(internal.state, 0, 0)).toBe(false);
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(true);
  });

  it('K♥ obligation active when void', () => {
    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);
    internal.state.currentPlayerIndex = 0;
    internal.state.currentTrick = [{ id: 's7', rank: '7', suit: 'spades' }];
    internal.state.players[0].hand = [
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'c2', rank: '2', suit: 'clubs' }
    ];
    expect(game.canPlayCard(internal.state, 0, 0)).toBe(true);
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(false);
  });

  it('K♥ does not override follow-suit', () => {
    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);
    internal.state.currentPlayerIndex = 0;
    internal.state.currentTrick = [{ id: 'c7', rank: '7', suit: 'clubs' }];
    internal.state.players[0].hand = [
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'c2', rank: '2', suit: 'clubs' }
    ];
    expect(game.canPlayCard(internal.state, 0, 0)).toBe(false);
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(true);
  });

  it('K♥ + non-heart on lead → non-heart required', () => {
    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);
    internal.state.currentPlayerIndex = 0;
    internal.state.currentTrick = [];
    internal.state.players[0].hand = [
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 's2', rank: '2', suit: 'spades' }
    ];
    expect(game.canPlayCard(internal.state, 0, 0)).toBe(false);
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(true);
  });

  it('hearts-only with K♥ on lead → K♥ mandatory', () => {
    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);
    internal.state.currentPlayerIndex = 0;
    internal.state.currentTrick = [];
    internal.state.players[0].hand = [
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'h2', rank: '2', suit: 'hearts' }
    ];
    expect(game.canPlayCard(internal.state, 0, 0)).toBe(true);
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(false);
  });

  it('one trick accumulates multiple negative penalties', () => {
    // Last-two trick with Heart + Queen + Jack (+ trick + last-two)
    const trick = [
      { id: '1', rank: 'Q', suit: 'hearts' },
      { id: '2', rank: 'J', suit: 'hearts' },
      { id: '3', rank: '2', suit: 'clubs' },
      { id: '4', rank: '3', suit: 'clubs' }
    ];
    // no_tricks 20 + heart 20*2 + queen 50 + man(J) 30 + last-two 90 = 230
    expect(syntheticAllNegativesTrickPenalty(trick, 12)).toBe(230);

    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);
    const king = getKingPtState(internal.state);
    king.trickNumber = 11;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    internal.state.waitingForTrickEnd = true;
    internal.state.nextTrickLeader = 1;
    internal.state.currentTrick = trick;
    const before = king.playerScores[1];
    game.finishTrick(internal.state);
    const after = getKingPtState(internal.state);
    expect(after.playerScores[1]).toBe(before - 230);
    expect(after.lastRoundDeltas[1]).toBe(-230);
  });

  it('tricks 12/13 add last-two penalty', () => {
    const plain = [
      { id: '1', rank: '2', suit: 'clubs' },
      { id: '2', rank: '3', suit: 'clubs' },
      { id: '3', rank: '4', suit: 'clubs' },
      { id: '4', rank: '5', suit: 'clubs' }
    ];
    // no_tricks 20 + last-two 90 = 110
    expect(syntheticAllNegativesTrickPenalty(plain, 12)).toBe(110);
    expect(syntheticAllNegativesTrickPenalty(plain, 13)).toBe(110);
    expect(syntheticAllNegativesTrickPenalty(plain, 11)).toBe(20);
  });

  it('early-end disabled in synthetic even when K♥ taken', () => {
    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);
    const king = getKingPtState(internal.state);
    king.roundBreakdown.kingTakenBy = 0;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    // Helper would fire for no_king_hearts, but contract is no_tricks + synthetic gate.
    expect(
      canKingEndRoundEarly(king.gameIndex, 'no_king_hearts', king.roundBreakdown)
    ).toBe(true);

    internal.state.waitingForTrickEnd = true;
    internal.state.nextTrickLeader = 0;
    internal.state.currentTrick = [
      { id: '1', rank: '2', suit: 'clubs' },
      { id: '2', rank: '3', suit: 'clubs' },
      { id: '3', rank: '4', suit: 'clubs' },
      { id: '4', rank: '5', suit: 'clubs' }
    ];
    // Leave cards in hand so round doesn't end
    for (let i = 0; i < 4; i++) {
      internal.state.players[i].hand = [{ id: `x${i}`, rank: '6', suit: 'spades' }];
    }
    game.finishTrick(internal.state);
    const after = getKingPtState(internal.state);
    expect(isDevSyntheticAllNegatives(after)).toBe(true);
    expect(after.waitingForEarlyEnd).toBe(false);
    expect(after.earlyEndOffered).toBe(false);
  });

  it('round reaches 13 tricks with one synthetic history row', () => {
    const game = new KingPtGame();
    const internal = enableSyntheticAfterDeal(game);

    for (let t = 0; t < 13; t++) {
      for (let p = 0; p < 4; p++) {
        internal.state.players[p].hand = Array.from({ length: 13 - t }, (_, i) => ({
          id: `p${p}t${t}i${i}`,
          rank: '2',
          suit: 'clubs' as const
        }));
      }
      internal.state.waitingForTrickEnd = true;
      internal.state.nextTrickLeader = t % 4;
      internal.state.currentTrick = [
        { id: `a${t}`, rank: '2', suit: 'clubs' },
        { id: `b${t}`, rank: '3', suit: 'clubs' },
        { id: `c${t}`, rank: '4', suit: 'clubs' },
        { id: `d${t}`, rank: '5', suit: 'clubs' }
      ];
      // Simulate card already removed from hands for this trick
      for (let p = 0; p < 4; p++) {
        internal.state.players[p].hand = Array.from({ length: 12 - t }, (_, i) => ({
          id: `rem${p}${t}${i}`,
          rank: '6',
          suit: 'spades' as const
        }));
      }
      game.finishTrick(internal.state);
    }

    const king = getKingPtState(internal.state);
    expect(king.trickNumber).toBe(13);
    expect(king.showScorePopup).toBe('synthetic_complete');
    expect(king.gameHistory).toHaveLength(1);
    expect(king.gameHistory[0].title).toBe(kingSyntheticRoundLabel('pt'));
    expect(king.gameHistory[0].gameIndex).toBe(0);

    game.promoteSyntheticRoundComplete();
    expect(getKingPtState(internal.state).showScorePopup).toBe('round');
  });

  it('normal King early-end still works without synthetic flag', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as Internal;
    internal.state.waitingForRoundStart = false;
    const king = getKingPtState(internal.state);
    king.contract = 'no_king_hearts';
    king.gameIndex = 4;
    king.roundBreakdown.kingTakenBy = 1;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    for (let i = 0; i < 4; i++) {
      internal.state.players[i].hand = [{ id: `h${i}`, rank: '2', suit: 'spades' }];
    }
    internal.state.waitingForTrickEnd = true;
    internal.state.nextTrickLeader = 1;
    internal.state.currentTrick = [
      { id: '1', rank: '2', suit: 'clubs' },
      { id: '2', rank: '3', suit: 'clubs' },
      { id: '3', rank: '4', suit: 'clubs' },
      { id: '4', rank: '5', suit: 'clubs' }
    ];
    game.finishTrick(internal.state);
    expect(getKingPtState(internal.state).waitingForEarlyEnd).toBe(true);
  });
});
