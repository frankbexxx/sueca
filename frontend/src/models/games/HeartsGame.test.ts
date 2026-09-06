import { HeartsGame, getHeartsState } from './HeartsGame';
import { getLegalIndices } from '../../ai/core/LegalMoveFilter';
import { Card } from '../../types/game';
import { getHeartsRoundEndDisplayDeltas } from './heartsRoundDisplay';

function c(rank: Card['rank'], suit: Card['suit'], id: string): Card {
  return { id, rank, suit };
}

describe('HeartsGame', () => {
  it('requires pass before play', () => {
    const game = new HeartsGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], {});
    expect((state.variantState?.hearts as { waitingForPass: boolean }).waitingForPass).toBe(true);
    expect(game.canPlayCard(state, 0, 0)).toBe(false);
  });

  it('confirms pass with 3 cards selected', () => {
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const g = game as HeartsGame;
    g.togglePassCard(0, 0);
    g.togglePassCard(1, 0);
    g.togglePassCard(2, 0);
    expect(g.confirmPass(0)).toBe(true);
    const after = game.getCurrentState();
    expect((after.variantState?.hearts as { waitingForPass: boolean }).waitingForPass).toBe(false);
    expect(after.players[0].hand).toHaveLength(13);
  });

  it('uses hold pass on round 4', () => {
    const game = new HeartsGame();
    const internal = game as unknown as {
      createRoundState: (
        names: string[],
        opts: Record<string, unknown> | undefined,
        round: number,
        scores: number[]
      ) => ReturnType<HeartsGame['getCurrentState']>;
    };
    const state = internal.createRoundState(['A', 'B', 'C', 'D'], {}, 4, [0, 0, 0, 0]);
    expect((state.variantState?.hearts as { passDirection: string }).passDirection).toBe('hold');
    expect((state.variantState?.hearts as { waitingForPass: boolean }).waitingForPass).toBe(false);
  });

  function setupFirstTrickFollow(hand: Card[]) {
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const g = game as HeartsGame;
    g.confirmPass(0);
    const internal = game as unknown as { state: ReturnType<HeartsGame['getCurrentState']> };
    const s = internal.state;
    s.isFirstTrick = true;
    s.waitingForRoundStart = false;
    const hearts = getHeartsState(s);
    hearts.waitingForPass = false;
    hearts.waitingForEarlyEnd = false;
    s.variantState = { ...s.variantState, hearts };
    s.currentTrick = [c('2', 'clubs', '2c')];
    s.trickLeader = 0;
    s.currentPlayerIndex = 1;
    s.players[1].hand = hand.map((card) => ({ ...card }));
    internal.state = s;
    return { game, state: s };
  }

  function legalCards(game: HeartsGame, state: ReturnType<HeartsGame['getCurrentState']>, player = 1) {
    return getLegalIndices(game, state, player).map((i) => state.players[player].hand[i].id);
  }

  it('blocks hearts on first trick follow when clubs remain', () => {
    const { game, state } = setupFirstTrickFollow([
      c('3', 'hearts', 'h'),
      c('4', 'clubs', 'club')
    ]);
    expect(game.canPlayCard(state, 1, 0)).toBe(false);
    expect(game.canPlayCard(state, 1, 1)).toBe(true);
  });

  it('Caso 1: void clubs + neutra + hearts + Q♠ → only neutra legal', () => {
    const { game, state } = setupFirstTrickFollow([
      c('5', 'diamonds', 'd5'),
      c('3', 'hearts', 'h3'),
      c('Q', 'spades', 'qs')
    ]);
    expect(legalCards(game, state).sort()).toEqual(['d5']);
  });

  it('Caso 2: void clubs + hearts only → hearts legal', () => {
    const { game, state } = setupFirstTrickFollow([
      c('3', 'hearts', 'h3'),
      c('K', 'hearts', 'hk')
    ]);
    expect(legalCards(game, state).sort()).toEqual(['h3', 'hk']);
  });

  it('Caso 3: void clubs + Q♠ only → Q♠ legal', () => {
    const { game, state } = setupFirstTrickFollow([c('Q', 'spades', 'qs')]);
    expect(legalCards(game, state)).toEqual(['qs']);
  });

  it('Caso 4: void clubs + hearts + Q♠ → all legal (no hearts>Q♠ priority)', () => {
    const { game, state } = setupFirstTrickFollow([
      c('2', 'hearts', 'h2'),
      c('A', 'hearts', 'ha'),
      c('Q', 'spades', 'qs')
    ]);
    expect(legalCards(game, state).sort()).toEqual(['h2', 'ha', 'qs']);
  });

  it('Caso 5: has clubs → must follow clubs', () => {
    const { game, state } = setupFirstTrickFollow([
      c('9', 'clubs', 'c9'),
      c('3', 'hearts', 'h3'),
      c('Q', 'spades', 'qs'),
      c('5', 'diamonds', 'd5')
    ]);
    expect(legalCards(game, state)).toEqual(['c9']);
  });

  it('Caso 6: second trick — first-trick penalty ban no longer applies', () => {
    const { game, state } = setupFirstTrickFollow([
      c('5', 'diamonds', 'd5'),
      c('3', 'hearts', 'h3'),
      c('Q', 'spades', 'qs')
    ]);
    state.isFirstTrick = false;
    state.currentTrick = [c('2', 'clubs', '2c')];
    // Void clubs on later trick: may dump any offsuit including hearts/Q♠
    expect(legalCards(game, state).sort()).toEqual(['d5', 'h3', 'qs']);
  });

  it('first-trick void escape never yields zero legal moves', () => {
    const hands: Card[][] = [
      [c('3', 'hearts', 'h3'), c('Q', 'spades', 'qs')],
      [c('A', 'hearts', 'ha')],
      [c('Q', 'spades', 'qs')],
      [c('4', 'diamonds', 'd4'), c('2', 'hearts', 'h2')]
    ];
    for (const hand of hands) {
      const { game, state } = setupFirstTrickFollow(hand);
      expect(getLegalIndices(game, state, 1).length).toBeGreaterThan(0);
    }
  });

  it('escape play of heart sets heartsBroken', () => {
    const { game, state } = setupFirstTrickFollow([
      c('3', 'hearts', 'h3'),
      c('Q', 'spades', 'qs')
    ]);
    expect(getHeartsState(state).heartsBroken).toBe(false);
    expect(game.playCard(state, 1, 0)).toBe(true);
    expect(getHeartsState(game.getCurrentState()).heartsBroken).toBe(true);
  });

  it('escape play of Q♠ sets heartsBroken', () => {
    const { game, state } = setupFirstTrickFollow([
      c('3', 'hearts', 'h3'),
      c('Q', 'spades', 'qs')
    ]);
    expect(game.playCard(state, 1, 1)).toBe(true);
    expect(getHeartsState(game.getCurrentState()).heartsBroken).toBe(true);
  });

  it('tracks penalty cards taken by trick winner', () => {
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as { state: ReturnType<HeartsGame['getCurrentState']> };
    const s = internal.state;
    s.waitingForTrickEnd = true;
    s.nextTrickLeader = 2;
    s.currentTrick = [
      { id: '1', rank: '5', suit: 'hearts' },
      { id: '2', rank: 'Q', suit: 'spades' },
      { id: '3', rank: '3', suit: 'clubs' },
      { id: '4', rank: '4', suit: 'diamonds' }
    ];
    game.finishTrick(s);
    const hearts = s.variantState?.hearts as { penaltyCardsTaken: { id: string }[][] };
    expect(hearts.penaltyCardsTaken[2]).toHaveLength(2);
    expect(hearts.penaltyCardsTaken[2].map((card) => card.id)).toEqual(['1', '2']);
  });

  it('resets penalty cards on new round', () => {
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as {
      state: ReturnType<HeartsGame['getCurrentState']>;
      createRoundState: (
        names: string[],
        opts: Record<string, unknown> | undefined,
        round: number,
        scores: number[]
      ) => ReturnType<HeartsGame['getCurrentState']>;
    };
    internal.state = internal.createRoundState(['A', 'B', 'C', 'D'], {}, 2, [0, 0, 0, 0]);
    const hearts = internal.state.variantState?.hearts as { penaltyCardsTaken: unknown[][] };
    expect(hearts.penaltyCardsTaken).toEqual([[], [], [], []]);
  });

  it('shoot the moon: raw stays 26, lastRoundDeltas are adjusted, totals match', () => {
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as {
      state: ReturnType<HeartsGame['getCurrentState']>;
      endRound: (s: ReturnType<HeartsGame['getCurrentState']>) => void;
    };
    const s = internal.state;
    const hearts = getHeartsState(s);
    hearts.playerScores = [40, 55, 70, 10];
    hearts.roundPoints = [26, 0, 0, 0];
    s.variantState = { ...s.variantState, hearts };
    s.players.forEach((p) => {
      p.hand = [];
    });
    internal.endRound(s);
    const after = getHeartsState(game.getCurrentState());
    expect(after.roundPoints).toEqual([26, 0, 0, 0]);
    expect(after.lastRoundDeltas).toEqual([0, 26, 26, 26]);
    expect(after.playerScores).toEqual([40, 81, 96, 36]);
    expect(getHeartsRoundEndDisplayDeltas(after)).toEqual([0, 26, 26, 26]);
    expect(s.waitingForRoundEnd).toBe(true);
  });

  it('normal round: lastRoundDeltas equal raw round points', () => {
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as {
      state: ReturnType<HeartsGame['getCurrentState']>;
      endRound: (s: ReturnType<HeartsGame['getCurrentState']>) => void;
    };
    const s = internal.state;
    const hearts = getHeartsState(s);
    hearts.playerScores = [10, 20, 30, 40];
    hearts.roundPoints = [5, 8, 10, 3];
    s.variantState = { ...s.variantState, hearts };
    s.players.forEach((p) => {
      p.hand = [];
    });
    internal.endRound(s);
    const after = getHeartsState(game.getCurrentState());
    expect(after.lastRoundDeltas).toEqual([5, 8, 10, 3]);
    expect(after.playerScores).toEqual([15, 28, 40, 43]);
    expect(getHeartsRoundEndDisplayDeltas(after)).toEqual([5, 8, 10, 3]);
  });
});
