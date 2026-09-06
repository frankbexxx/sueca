import { GameState } from '../types/game';
import {
  getPlayerSeatTeamClass,
  isActiveTurnSeat,
  isIndividualTableVariant,
  shouldShowTeamLabel
} from './playerSeatHelpers';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [],
    currentPlayerIndex: 1,
    dealerIndex: 0,
    trumpSuit: null,
    trumpCard: null,
    currentTrick: [],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    completedPentes: [],
    round: 1,
    isGameOver: false,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: false,
    dealingMethod: 'A',
    dealingDirection: 'left',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P',
    aiDifficulty: 'medium',
    partnerSignals: [],
    ...overrides
  };
}

describe('playerSeatHelpers', () => {
  it('treats hearts and king as individual table variants', () => {
    expect(isIndividualTableVariant('hearts')).toBe(true);
    expect(isIndividualTableVariant('king')).toBe(true);
    expect(isIndividualTableVariant('sueca')).toBe(false);
    expect(isIndividualTableVariant('spades')).toBe(false);
  });

  it('uses neutral seat class for individual variants', () => {
    expect(getPlayerSeatTeamClass('hearts', 1, 1)).toBe('player-seat--individual');
    expect(getPlayerSeatTeamClass('hearts', 1, 2)).toBe('player-seat--individual');
    expect(getPlayerSeatTeamClass('king', 2, 1)).toBe('player-seat--individual');
  });

  it('uses team classes for team variants', () => {
    expect(getPlayerSeatTeamClass('sueca', 1, 1)).toBe('team-us');
    expect(getPlayerSeatTeamClass('sueca', 1, 2)).toBe('team-them');
  });

  it('never shows team labels on individual variants even when showTeamLabels is true', () => {
    expect(shouldShowTeamLabel('hearts', true)).toBe(false);
    expect(shouldShowTeamLabel('king', true)).toBe(false);
    expect(shouldShowTeamLabel('sueca', true)).toBe(true);
    expect(shouldShowTeamLabel('sueca', false)).toBe(false);
  });

  describe('isActiveTurnSeat', () => {
    it('marks only the current player during play', () => {
      const state = baseState({ currentPlayerIndex: 2 });
      expect(isActiveTurnSeat(state, 2)).toBe(true);
      expect(isActiveTurnSeat(state, 0)).toBe(false);
      expect(isActiveTurnSeat(state, 1)).toBe(false);
      expect(isActiveTurnSeat(state, 3)).toBe(false);
    });

    it('suppresses during waiting / game-over states', () => {
      expect(isActiveTurnSeat(baseState({ isGameOver: true }), 1)).toBe(false);
      expect(isActiveTurnSeat(baseState({ waitingForTrickEnd: true }), 1)).toBe(false);
      expect(isActiveTurnSeat(baseState({ waitingForRoundStart: true }), 1)).toBe(false);
      expect(isActiveTurnSeat(baseState({ waitingForRoundEnd: true }), 1)).toBe(false);
      expect(isActiveTurnSeat(baseState({ waitingForGameStart: true }), 1)).toBe(false);
    });

    it('uses bidder index during Spades bid phase', () => {
      const state = baseState({ currentPlayerIndex: 0 });
      expect(
        isActiveTurnSeat(state, 3, {
          spadesBidPhase: true,
          currentBidderIndex: 3
        })
      ).toBe(true);
      expect(
        isActiveTurnSeat(state, 0, {
          spadesBidPhase: true,
          currentBidderIndex: 3
        })
      ).toBe(false);
    });

    it('honours suppress for Hearts pass and similar overlays', () => {
      expect(isActiveTurnSeat(baseState(), 1, { suppress: true })).toBe(false);
    });
  });
});
