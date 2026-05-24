import { KingPtGame, festaOwner, gameLeader, getKingPtState } from '../KingPtGame';
import { KING_NEGATIVE_CONTRACTS, KING_TOTAL_GAMES } from './kingContracts';

describe('KingPtGame', () => {
  it('starts negative phase with contract no_tricks', () => {
    const game = new KingPtGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    const king = getKingPtState(state);
    expect(king.gameIndex).toBe(0);
    expect(king.contract).toBe('no_tricks');
    expect(state.players.every((p) => p.hand.length === 13)).toBe(true);
  });

  it('orders negatives: queens before men', () => {
    expect(KING_NEGATIVE_CONTRACTS[2].id).toBe('no_queens');
    expect(KING_NEGATIVE_CONTRACTS[3].id).toBe('no_men');
  });

  it('applies -20 for trick winner in no_tricks', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
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

  it('forces K♥ when void in led suit during no_king_hearts', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.contract = 'no_king_hearts';
    king.gameIndex = 4;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    internal.state.waitingForRoundStart = false;
    internal.state.currentTrick = [{ id: '1', rank: 'A', suit: 'clubs' }];
    internal.state.currentPlayerIndex = 0;
    internal.state.trickLeader = 1;
    internal.state.players[0].hand = [
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'd1', rank: '2', suit: 'diamonds' }
    ];
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(false);
    expect(game.canPlayCard(internal.state, 0, 0)).toBe(true);
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
