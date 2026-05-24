import { KingPtGame, festaOwner, gameLeader, getKingPtState } from '../KingPtGame';
import { KING_NEGATIVE_CONTRACTS, KING_TOTAL_GAMES } from './kingContracts';
import { bidAbsoluteValue } from './kingAuction';

describe('KingPtGame', () => {
  it('starts with koh_reveal phase', () => {
    const game = new KingPtGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    const king = getKingPtState(state);
    expect(king.phase).toBe('koh_reveal');
    expect(king.kohReveal).not.toBeNull();
    expect(state.waitingForRoundStart).toBe(true);
  });

  it('deals after koh confirm', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    while (true) {
      const k = getKingPtState(game.getCurrentState());
      if (!k.kohReveal || k.kohReveal.step >= k.kohReveal.sequence.length - 1) break;
      game.advanceKohRevealStep();
    }
    game.confirmKohReveal();
    const state = game.getCurrentState();
    expect(state.players.every((p) => p.hand.length === 13)).toBe(true);
    expect(getKingPtState(state).phase).toBe('negative');
  });

  it('orders negatives: queens before men', () => {
    expect(KING_NEGATIVE_CONTRACTS[2].id).toBe('no_queens');
    expect(KING_NEGATIVE_CONTRACTS[3].id).toBe('no_men');
  });

  it('applies -20 for trick winner in no_tricks', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    game.confirmKohReveal();
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    internal.state.waitingForRoundStart = false;
    internal.state.waitingForTrickEnd = true;
    internal.state.nextTrickLeader = 1;
    internal.state.currentTrick = [
      { id: '1', rank: '2', suit: 'clubs' },
      { id: '2', rank: '3', suit: 'clubs' },
      { id: '3', rank: '4', suit: 'clubs' },
      { id: '4', rank: '5', suit: 'clubs' }
    ];
    game.finishTrick(internal.state);
    const king = getKingPtState(internal.state);
    expect(king.lastRoundDeltas[1]).toBe(-20);
  });

  it('blocks leading hearts when holding other suits in no_hearts', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.contract = 'no_hearts';
    king.gameIndex = 1;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    internal.state.waitingForRoundStart = false;
    internal.state.currentTrick = [];
    internal.state.currentPlayerIndex = 0;
    internal.state.players[0].hand = [
      { id: 'h1', rank: '2', suit: 'hearts' },
      { id: 'c1', rank: '3', suit: 'clubs' }
    ];
    expect(game.canPlayCard(internal.state, 0, 0)).toBe(false);
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(true);
  });

  it('requestHigherBid moves to negotiation_counter', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.festaPhase = 'negotiation';
    king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 4 };
    king.festaOwnerIndex = 0;
    internal.state.players[1].type = 'human';
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    game.requestHigherBid('positive', 6);
    const after = getKingPtState(game.getCurrentState());
    expect(after.festaPhase).toBe('negotiation_counter');
    expect(after.requestedBid?.amount).toBe(6);
    expect(bidAbsoluteValue(after.requestedBid!)).toBeGreaterThanOrEqual(
      bidAbsoluteValue(after.bestBid!)
    );
  });

  it('runs AI auction when entering first festa', () => {
    const game = new KingPtGame();
    game.initialize(['P1', 'P2', 'P3', 'P4'], { localPlayerIndex: 0, kohPlayerIndex: 0 });
    game.confirmKohReveal();

    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.gameIndex = 5;
    king.kohPlayerIndex = 0;
    internal.state.waitingForRoundEnd = true;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };

    game.continueToNextRound(internal.state);
    const after = getKingPtState(game.getCurrentState());

    expect(after.gameIndex).toBe(6);
    expect(after.festaOwnerIndex).toBe(0);
    const aiActed =
      after.auctionTurnIndex > 0 ||
      after.bestBid !== null ||
      after.festaPhase !== 'auction';
    expect(aiActed).toBe(true);
  });

  it('aligns first festa owner with K♥ holder', () => {
    const koh = 2;
    expect(festaOwner(koh, 6)).toBe(koh);
    expect(gameLeader(koh, 0)).toBe((koh + 2) % 4);
  });

  it('runs 10 games structure', () => {
    expect(KING_TOTAL_GAMES).toBe(10);
  });
});
