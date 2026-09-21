import { chooseKingPtCard } from '../../../ai/games/king/KingPlayStrategy';
import { getLegalIndices } from '../../../ai/core/LegalMoveFilter';
import { playFirstLegal } from '../../../ai/core/FallbackMoveSelector';
import { KingPtGame, getKingPtState } from '../KingPtGame';
import { Card, GameState } from '../../../types/game';

/**
 * KING LEGALITY HARDENING — real adapter path (no stubbed canPlayCard).
 */
describe('KingPtGame legality hardening', () => {
  function setupPlayableNegative(opts: {
    contract: 'no_tricks' | 'no_hearts' | 'no_king_hearts';
    gameIndex: number;
    hand: Card[];
    trick: Card[];
    playerIndex?: number;
  }) {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as { state: GameState };
    const king = getKingPtState(internal.state);
    king.contract = opts.contract;
    king.gameIndex = opts.gameIndex;
    king.phase = 'negative';
    king.festaPhase = null;
    king.waitingForEarlyEnd = false;
    king.waitingForFallback = false;
    king.waitingForFestaSetup = false;
    king.eightOrNullsPending = false;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    internal.state.waitingForRoundStart = false;
    internal.state.waitingForTrickEnd = false;
    internal.state.isPaused = false;
    const pi = opts.playerIndex ?? 0;
    internal.state.currentPlayerIndex = pi;
    internal.state.trickLeader = opts.trick.length === 0 ? pi : (pi - opts.trick.length + 4) % 4;
    internal.state.currentTrick = opts.trick.map((c) => ({ ...c }));
    internal.state.players[pi].hand = opts.hand.map((c) => ({ ...c }));
    return { game, state: internal.state, playerIndex: pi };
  }

  it('bot follow-suit: chooseKingPtCard + playCard never renounce when holding led suit', () => {
    const hand: Card[] = [
      { id: 's2', rank: '2', suit: 'spades' },
      { id: 'c5', rank: '5', suit: 'clubs' },
      { id: 'h9', rank: '9', suit: 'hearts' },
      { id: 'cK', rank: 'K', suit: 'clubs' }
    ];
    const trick: Card[] = [{ id: 'cA', rank: 'A', suit: 'clubs' }];
    const { game, state, playerIndex } = setupPlayableNegative({
      contract: 'no_tricks',
      gameIndex: 0,
      hand,
      trick
    });

    const legal = getLegalIndices(game, state, playerIndex);
    expect(legal.length).toBeGreaterThan(0);
    expect(legal.every((i) => state.players[playerIndex].hand[i].suit === 'clubs')).toBe(true);
    expect(legal).not.toContain(0); // spades
    expect(legal).not.toContain(2); // hearts

    const king = getKingPtState(state);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const snap = game.getCurrentState();
      const chosen = chooseKingPtCard(game, snap, playerIndex, king, difficulty);
      expect(legal).toContain(chosen);
      expect(snap.players[playerIndex].hand[chosen].suit).toBe('clubs');
    }

    const chosen = chooseKingPtCard(game, state, playerIndex, king, 'medium');
    const beforeLen = state.players[playerIndex].hand.length;
    expect(game.playCard(state, playerIndex, chosen)).toBe(true);
    expect(state.players[playerIndex].hand.length).toBe(beforeLen - 1);
    expect(state.currentTrick[state.currentTrick.length - 1].suit).toBe('clubs');
  });

  it('fallback playFirstLegal cannot renounce when led suit is held', () => {
    const hand: Card[] = [
      { id: 'h2', rank: '2', suit: 'hearts' },
      { id: 's9', rank: '9', suit: 'spades' },
      { id: 'c3', rank: '3', suit: 'clubs' }
    ];
    const trick: Card[] = [{ id: 'cA', rank: 'A', suit: 'clubs' }];
    const { game, state, playerIndex } = setupPlayableNegative({
      contract: 'no_hearts',
      gameIndex: 1,
      hand,
      trick
    });

    // Simulate rejected AI pick of off-suit index 0, then fallback.
    expect(game.canPlayCard(state, playerIndex, 0)).toBe(false);
    expect(game.playCard(state, playerIndex, 0)).toBe(false);
    expect(state.players[playerIndex].hand).toHaveLength(3);

    const played = playFirstLegal(game, state, playerIndex);
    expect(played).toBe(2);
    expect(state.currentTrick[state.currentTrick.length - 1].suit).toBe('clubs');
    expect(state.players[playerIndex].hand.every((c) => c.suit !== 'clubs' || c.id !== 'c3')).toBe(
      true
    );
  });

  it('festa_play follow-suit uses the same canonical canPlayCard', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as { state: GameState };
    const king = getKingPtState(internal.state);
    king.gameIndex = 6;
    king.phase = 'festa_play';
    king.contract = null;
    king.festaMode = 'positive';
    king.festaPhase = null;
    king.noTrumpChosen = true;
    king.chosenTrump = null;
    king.waitingForFallback = false;
    king.waitingForFestaSetup = false;
    king.eightOrNullsPending = false;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    internal.state.trumpSuit = null;
    internal.state.waitingForRoundStart = false;
    internal.state.waitingForTrickEnd = false;
    internal.state.isPaused = false;
    internal.state.currentPlayerIndex = 0;
    internal.state.trickLeader = 3;
    internal.state.currentTrick = [{ id: 'dA', rank: 'A', suit: 'diamonds' }];
    internal.state.players[0].hand = [
      { id: 'c2', rank: '2', suit: 'clubs' },
      { id: 'd5', rank: '5', suit: 'diamonds' },
      { id: 'hK', rank: 'K', suit: 'hearts' }
    ];

    expect(game.canPlayCard(internal.state, 0, 0)).toBe(false);
    expect(game.canPlayCard(internal.state, 0, 1)).toBe(true);
    expect(game.canPlayCard(internal.state, 0, 2)).toBe(false);

    const legal = getLegalIndices(game, internal.state, 0);
    expect(legal).toEqual([1]);
    expect(chooseKingPtCard(game, internal.state, 0, getKingPtState(internal.state), 'medium')).toBe(
      1
    );
  });
});
