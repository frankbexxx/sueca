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

  function setupNoKingHeartsLead(
    hand: Array<{ id: string; rank: 'K' | '2' | '3' | 'A'; suit: 'hearts' | 'clubs' | 'spades' }>
  ) {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.contract = 'no_king_hearts';
    king.gameIndex = 4;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    internal.state.waitingForRoundStart = false;
    internal.state.waitingForTrickEnd = false;
    internal.state.isPaused = false;
    internal.state.currentTrick = [];
    internal.state.currentPlayerIndex = 0;
    internal.state.players[0].hand = hand.map((c) => ({ ...c }));
    return { game, state: internal.state };
  }

  it('no_king_hearts lead: hearts-only with K♥ requires K♥', () => {
    const { game, state } = setupNoKingHeartsLead([
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'h2', rank: '2', suit: 'hearts' },
      { id: 'h3', rank: '3', suit: 'hearts' }
    ]);
    expect(game.canPlayCard(state, 0, 0)).toBe(true);
    expect(game.canPlayCard(state, 0, 1)).toBe(false);
    expect(game.canPlayCard(state, 0, 2)).toBe(false);
  });

  it('no_king_hearts lead: K♥ + other suit cannot open hearts', () => {
    const { game, state } = setupNoKingHeartsLead([
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'c3', rank: '3', suit: 'clubs' }
    ]);
    expect(game.canPlayCard(state, 0, 0)).toBe(false);
    expect(game.canPlayCard(state, 0, 1)).toBe(true);
  });

  it('no_king_hearts lead: hearts-only without K♥ allows any heart', () => {
    const { game, state } = setupNoKingHeartsLead([
      { id: 'h2', rank: '2', suit: 'hearts' },
      { id: 'h3', rank: '3', suit: 'hearts' }
    ]);
    expect(game.canPlayCard(state, 0, 0)).toBe(true);
    expect(game.canPlayCard(state, 0, 1)).toBe(true);
  });

  it('no_king_hearts void: must dump K♥ when cannot follow', () => {
    const { game, state } = setupNoKingHeartsLead([
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'h2', rank: '2', suit: 'hearts' },
      { id: 's3', rank: '3', suit: 'spades' }
    ]);
    state.currentTrick = [{ id: 'cA', rank: 'A', suit: 'clubs' }];
    expect(game.canPlayCard(state, 0, 0)).toBe(true);
    expect(game.canPlayCard(state, 0, 1)).toBe(false);
    expect(game.canPlayCard(state, 0, 2)).toBe(false);
  });

  it('no_king_hearts follow: must follow suit instead of dumping K♥', () => {
    const { game, state } = setupNoKingHeartsLead([
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'c2', rank: '2', suit: 'clubs' }
    ]);
    state.currentTrick = [{ id: 'cA', rank: 'A', suit: 'clubs' }];
    expect(game.canPlayCard(state, 0, 0)).toBe(false);
    expect(game.canPlayCard(state, 0, 1)).toBe(true);
  });

  it('no_tricks does not force K♥ on hearts-only lead', () => {
    const { game, state } = setupNoKingHeartsLead([
      { id: 'kh', rank: 'K', suit: 'hearts' },
      { id: 'h2', rank: '2', suit: 'hearts' }
    ]);
    const king = getKingPtState(state);
    king.contract = 'no_tricks';
    king.gameIndex = 0;
    state.variantState = { ...state.variantState, kingPt: king };
    expect(game.canPlayCard(state, 0, 0)).toBe(true);
    expect(game.canPlayCard(state, 0, 1)).toBe(true);
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

  function enterFestaSetup(
    game: KingPtGame,
    patch: Partial<ReturnType<typeof getKingPtState>>
  ): void {
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0, kohPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.gameIndex = 6;
    king.festaOwnerIndex = 0;
    king.phase = 'festa_setup';
    Object.assign(king, patch);
    internal.state.waitingForRoundStart = true;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
  }

  it('accepting null bid forces no-trump before setup', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      festaPhase: 'negotiation',
      bestBid: { bidderIndex: 1, bidType: 'null', amount: 2 },
      waitingForFestaSetup: false,
      noTrumpChosen: false,
      chosenTrump: 'clubs'
    });
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    internal.state.players.forEach((p) => {
      p.type = 'human';
    });

    game.acceptContract();
    const afterState = game.getCurrentState();
    const after = getKingPtState(afterState);
    expect(after.festaMode).toBe('negative_festa');
    expect(after.waitingForFestaSetup).toBe(true);
    expect(after.noTrumpChosen).toBe(true);
    expect(after.chosenTrump).toBeNull();
    expect(afterState.trumpSuit).toBeNull();
  });

  it('setupFesta ignores trump when festa is nulls', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      festaMode: 'negative_festa',
      festaPhase: 'setup',
      waitingForFestaSetup: true,
      noTrumpChosen: true,
      chosenTrump: null,
      benefitOwnerIndex: 1,
      activeContract: {
        bidType: 'null',
        amount: 2,
        bidderIndex: 1,
        beneficiaryIndex: 0
      }
    });
    game.setupFesta('hearts', false, 1);
    const after = game.getCurrentState();
    const king = getKingPtState(after);
    expect(king.festaMode).toBe('negative_festa');
    expect(king.noTrumpChosen).toBe(true);
    expect(king.chosenTrump).toBeNull();
    expect(after.trumpSuit).toBeNull();
    expect(king.phase).toBe('festa_play');
  });

  it('confirmFestaSetup keeps nulls without inventing trump', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      festaMode: 'negative_festa',
      festaPhase: 'setup',
      waitingForFestaSetup: true,
      noTrumpChosen: false,
      chosenTrump: 'spades',
      benefitOwnerIndex: 1
    });
    game.confirmFestaSetup();
    const after = game.getCurrentState();
    expect(getKingPtState(after).noTrumpChosen).toBe(true);
    expect(after.trumpSuit).toBeNull();
  });

  it('fallback nulos forces no-trump', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      waitingForFallback: true,
      festaPhase: null,
      bestBid: null,
      noTrumpChosen: false,
      chosenTrump: 'diamonds'
    });
    game.chooseFallback('nulos');
    const after = getKingPtState(game.getCurrentState());
    expect(after.festaMode).toBe('negative_festa');
    expect(after.waitingForFestaSetup).toBe(true);
    expect(after.noTrumpChosen).toBe(true);
    expect(after.chosenTrump).toBeNull();
  });

  it('valid four_by_three applies once with a single history entry', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      waitingForFallback: true,
      festaPhase: null,
      festaOwnerIndex: 0,
      bestBid: { bidderIndex: 1, bidType: 'positive', amount: 3 },
      gameHistory: [],
      playerScores: [0, 0, 0, 0],
      lastRoundDeltas: [0, 0, 0, 0]
    });
    const beforeScores = [...getKingPtState(game.getCurrentState()).playerScores];
    game.chooseFallback('four_by_three');
    const after = game.getCurrentState();
    const king = getKingPtState(after);
    expect(king.waitingForFallback).toBe(false);
    expect(king.gameHistory).toHaveLength(1);
    expect(king.playerScores[0]).toBe(beforeScores[0] + 100);
    expect(king.playerScores[1]).toBe(beforeScores[1] + 75);
    expect(king.playerScores[2]).toBe(beforeScores[2] + 75);
    expect(king.playerScores[3]).toBe(beforeScores[3] + 75);
    expect(after.waitingForRoundEnd).toBe(true);
  });

  it('invalid four_by_three keeps fallback open without scoring or history', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      waitingForFallback: true,
      festaPhase: null,
      festaOwnerIndex: 0,
      bestBid: { bidderIndex: 1, bidType: 'positive', amount: 4 },
      gameHistory: [],
      playerScores: [10, 20, 30, 40],
      lastRoundDeltas: [0, 0, 0, 0]
    });
    const before = getKingPtState(game.getCurrentState());
    const scoresBefore = [...before.playerScores];
    game.chooseFallback('four_by_three');
    const after = getKingPtState(game.getCurrentState());
    expect(after.waitingForFallback).toBe(true);
    expect(after.gameHistory).toHaveLength(0);
    expect(after.playerScores).toEqual(scoresBefore);
    // Still usable: nulos fallback works
    game.chooseFallback('nulos');
    const next = getKingPtState(game.getCurrentState());
    expect(next.waitingForFallback).toBe(false);
    expect(next.festaMode).toBe('negative_festa');
    expect(next.waitingForFestaSetup).toBe(true);
  });

  it('fallback trump still enters positive setup', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      waitingForFallback: true,
      festaPhase: null,
      bestBid: null,
      gameIndex: 6
    });
    game.chooseFallback('trump');
    const after = getKingPtState(game.getCurrentState());
    expect(after.waitingForFallback).toBe(false);
    expect(after.festaMode).toBe('positive');
    expect(after.waitingForFestaSetup).toBe(true);
    expect(after.noTrumpChosen).toBe(false);
  });

  it('declareEightOrNulls blocks owner negotiation until bidder answers', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      festaPhase: 'negotiation',
      festaOwnerIndex: 0,
      bestBid: { bidderIndex: 1, bidType: 'positive', amount: 3 },
      eightOrNullsPending: false,
      eightOrNullsTarget: null
    });
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    internal.state.players.forEach((p) => {
      p.type = 'human';
    });

    game.declareEightOrNulls();
    let king = getKingPtState(game.getCurrentState());
    expect(king.eightOrNullsPending).toBe(true);
    expect(king.eightOrNullsTarget).toBe(1);
    expect(king.festaPhase).toBe('negotiation');

    // Owner negotiation APIs are no-ops while pending
    game.acceptContract();
    game.rejectContract();
    game.requestHigherBid('positive', 5);
    game.declareEightOrNulls();
    king = getKingPtState(game.getCurrentState());
    expect(king.eightOrNullsPending).toBe(true);
    expect(king.waitingForFallback).toBe(false);
    expect(king.waitingForFestaSetup).toBe(false);
    expect(king.requestedBid).toBeNull();
    expect(king.activeContract).toBeNull();
  });

  it('respondEightOrNulls with 8 auto-accepts positive-8 contract', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      festaPhase: 'negotiation',
      festaOwnerIndex: 0,
      bestBid: { bidderIndex: 1, bidType: 'positive', amount: 3 },
      eightOrNullsPending: false
    });
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    internal.state.players.forEach((p) => {
      p.type = 'human';
    });
    game.declareEightOrNulls();
    game.respondEightOrNulls(1, true);
    const after = getKingPtState(game.getCurrentState());
    expect(after.eightOrNullsPending).toBe(false);
    expect(after.eightOrNullsTarget).toBeNull();
    expect(after.activeContract).toEqual({
      bidType: 'positive',
      amount: 8,
      bidderIndex: 1,
      beneficiaryIndex: 0
    });
    expect(after.festaMode).toBe('positive');
    expect(after.waitingForFestaSetup).toBe(true);
    expect(after.benefitOwnerIndex).toBe(1);
  });

  it('respondEightOrNulls decline returns festa to owner fallback', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      festaPhase: 'negotiation',
      festaOwnerIndex: 0,
      bestBid: { bidderIndex: 2, bidType: 'positive', amount: 2 },
      eightOrNullsPending: false
    });
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    internal.state.players.forEach((p) => {
      p.type = 'human';
    });
    game.declareEightOrNulls();
    game.respondEightOrNulls(2, false);
    const after = getKingPtState(game.getCurrentState());
    expect(after.eightOrNullsPending).toBe(false);
    expect(after.waitingForFallback).toBe(true);
    expect(after.benefitOwnerIndex).toBe(0);
    expect(after.activeContract).toBeNull();
  });

  it('normal accept of positive bid still works without eight-or-nulls', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      festaPhase: 'negotiation',
      festaOwnerIndex: 0,
      bestBid: { bidderIndex: 1, bidType: 'positive', amount: 5 },
      eightOrNullsPending: false
    });
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    internal.state.players.forEach((p) => {
      p.type = 'human';
    });
    game.acceptContract();
    const after = getKingPtState(game.getCurrentState());
    expect(after.activeContract?.amount).toBe(5);
    expect(after.waitingForFestaSetup).toBe(true);
    expect(after.eightOrNullsPending).toBe(false);
  });

  it('normal accept of null bid still works without eight-or-nulls', () => {
    const game = new KingPtGame();
    enterFestaSetup(game, {
      festaPhase: 'negotiation',
      festaOwnerIndex: 0,
      bestBid: { bidderIndex: 1, bidType: 'null', amount: 2 },
      eightOrNullsPending: false,
      noTrumpChosen: false
    });
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    internal.state.players.forEach((p) => {
      p.type = 'human';
    });
    game.acceptContract();
    const after = getKingPtState(game.getCurrentState());
    expect(after.festaMode).toBe('negative_festa');
    expect(after.noTrumpChosen).toBe(true);
    expect(after.waitingForFestaSetup).toBe(true);
  });

  it('positive trump and no-trump setups still work', () => {
    const gameTrump = new KingPtGame();
    enterFestaSetup(gameTrump, {
      festaMode: 'positive',
      festaPhase: 'setup',
      waitingForFestaSetup: true,
      benefitOwnerIndex: 0
    });
    gameTrump.setupFesta('spades', false, 0);
    expect(gameTrump.getCurrentState().trumpSuit).toBe('spades');
    expect(getKingPtState(gameTrump.getCurrentState()).noTrumpChosen).toBe(false);

    const gameNoTrump = new KingPtGame();
    enterFestaSetup(gameNoTrump, {
      festaMode: 'positive',
      festaPhase: 'setup',
      waitingForFestaSetup: true,
      benefitOwnerIndex: 0
    });
    gameNoTrump.setupFesta(null, true, 0);
    expect(gameNoTrump.getCurrentState().trumpSuit).toBeNull();
    expect(getKingPtState(gameNoTrump.getCurrentState()).noTrumpChosen).toBe(true);
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
