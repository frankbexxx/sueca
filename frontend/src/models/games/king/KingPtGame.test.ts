import { KingPtGame, festaOwner, gameLeader, getKingPtState, simulateKohDraw } from '../KingPtGame';
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

  it('koh draw rotates from chosen start player', () => {
    const reveal = simulateKohDraw(2);
    expect(reveal.startPlayerIndex).toBe(2);
    expect(reveal.sequence[0].playerIndex).toBe(2);
    const last = reveal.sequence[reveal.sequence.length - 1];
    expect(last.card.rank).toBe('K');
    expect(last.card.suit).toBe('hearts');
    expect(reveal.winnerIndex).toBe(last.playerIndex);
  });

  it('deals 13 cards before festa auction', () => {
    const game = new KingPtGame();
    game.initialize(['P1', 'P2', 'P3', 'P4'], { localPlayerIndex: 0, kohPlayerIndex: 0 });
    game.confirmKohReveal();

    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.gameIndex = 5;
    internal.state.waitingForRoundEnd = true;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };

    game.continueToNextRound(internal.state);
    const state = game.getCurrentState();
    expect(state.players.every((p) => p.hand.length === 13)).toBe(true);
  });

  it('preserves hands after festa setup (no re-deal)', () => {
    const game = new KingPtGame();
    game.initialize(['P1', 'P2', 'P3', 'P4'], { localPlayerIndex: 0, kohPlayerIndex: 0 });
    game.confirmKohReveal();

    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.gameIndex = 6;
    king.festaOwnerIndex = 0;
    king.festaMode = 'positive';
    king.festaPhase = 'setup';
    king.waitingForFestaSetup = true;
    king.benefitOwnerIndex = 1;
    internal.state.waitingForRoundStart = true;
    internal.state.players.forEach((p, i) => {
      p.hand = Array.from({ length: 13 }, (_, j) => ({
        id: `p${i}c${j}`,
        rank: '2',
        suit: 'clubs' as const
      }));
    });
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };

    const beforeIds = internal.state.players.map((p) => p.hand.map((c) => c.id).sort());
    game.setupFesta('hearts', false, 1);
    const after = game.getCurrentState();
    const afterIds = after.players.map((p) => p.hand.map((c) => c.id).sort());

    expect(afterIds).toEqual(beforeIds);
    expect(getKingPtState(after).phase).toBe('festa_play');
    expect(after.trumpSuit).toBe('hearts');
  });

  it('records auction player actions on bid and pass', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0, kohPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.gameIndex = 6;
    king.festaOwnerIndex = 0;
    king.festaPhase = 'auction';
    king.auctionOrder = [1, 2, 3];
    king.auctionTurnIndex = 0;
    king.auctionPlayerActions = {};
    internal.state.waitingForRoundStart = true;
    internal.state.players[1].type = 'human';
    internal.state.players[2].type = 'human';
    internal.state.players[3].type = 'human';
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };

    game.submitAuctionBid(1, 'positive', 2);
    expect(getKingPtState(game.getCurrentState()).auctionPlayerActions[1]).toEqual({
      bidderIndex: 1,
      bidType: 'positive',
      amount: 2
    });

    game.submitAuctionPass(2);
    expect(getKingPtState(game.getCurrentState()).auctionPlayerActions[2]).toBe('pass');
  });

  it('weak positive bid enters negotiation not fallback', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0, kohPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.gameIndex = 6;
    king.festaOwnerIndex = 0;
    king.festaPhase = 'auction';
    king.auctionOrder = [1, 2, 3];
    king.auctionTurnIndex = 2;
    king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 1 };
    internal.state.waitingForRoundStart = true;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };

    game.submitAuctionPass(3);
    const after = getKingPtState(game.getCurrentState());
    expect(after.festaPhase).toBe('negotiation');
    expect(after.bestBid?.amount).toBe(1);
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

  it('tickFestaAi advances auction when restoring saved festa state', () => {
    const game = new KingPtGame();
    game.initialize(['P1', 'P2', 'P3', 'P4'], { localPlayerIndex: 0, kohPlayerIndex: 0 });
    game.confirmKohReveal();

    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.gameIndex = 6;
    king.phase = 'festa_setup';
    king.festaOwnerIndex = 0;
    king.festaPhase = 'auction';
    king.auctionOrder = [1, 2, 3];
    king.auctionTurnIndex = 0;
    internal.state.waitingForRoundStart = true;
    internal.state.waitingForRoundEnd = false;
    internal.state.variantState = { kingPt: king, rulesPresetId: 'king-pt-normal' };

    const snapshot = JSON.parse(JSON.stringify(internal.state)) as typeof internal.state;
    const restored = game.restoreState(snapshot);
    const after = getKingPtState(restored);
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
