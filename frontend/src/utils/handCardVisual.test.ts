import {
  handCardVisualClassName,
  isHandPlayActionAllowed,
  resolveHandCardVisualState
} from './handCardVisual';
import { GameState } from '../types/game';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [],
    currentPlayerIndex: 0,
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

describe('handCardVisual', () => {
  describe('isHandPlayActionAllowed', () => {
    it('is true during normal play', () => {
      expect(isHandPlayActionAllowed(baseState())).toBe(true);
    });

    it('is false during waits, pause, and game over', () => {
      expect(isHandPlayActionAllowed(baseState({ isPaused: true }))).toBe(false);
      expect(isHandPlayActionAllowed(baseState({ waitingForTrickEnd: true }))).toBe(false);
      expect(isHandPlayActionAllowed(baseState({ waitingForRoundStart: true }))).toBe(false);
      expect(isHandPlayActionAllowed(baseState({ waitingForRoundEnd: true }))).toBe(false);
      expect(isHandPlayActionAllowed(baseState({ waitingForGameStart: true }))).toBe(false);
      expect(isHandPlayActionAllowed(baseState({ isGameOver: true }))).toBe(false);
    });
  });

  describe('resolveHandCardVisualState', () => {
    it('marks playable vs illegal when the hand has at least one legal card', () => {
      expect(
        resolveHandCardVisualState({
          readOnly: false,
          isPlayable: true,
          handHasPlayable: true
        })
      ).toBe('playable');
      expect(
        resolveHandCardVisualState({
          readOnly: false,
          isPlayable: false,
          handHasPlayable: true
        })
      ).toBe('illegal');
    });

    it('uses uniform hand-inactive when nothing is playable or hand is read-only', () => {
      expect(
        resolveHandCardVisualState({
          readOnly: false,
          isPlayable: false,
          handHasPlayable: false
        })
      ).toBe('hand-inactive');
      expect(
        resolveHandCardVisualState({
          readOnly: true,
          isPlayable: true,
          handHasPlayable: true
        })
      ).toBe('hand-inactive');
    });

    it('keeps pass-selected cards as playable for selection feedback', () => {
      expect(
        resolveHandCardVisualState({
          readOnly: false,
          isPlayable: false,
          handHasPlayable: false,
          isPassSelected: true
        })
      ).toBe('playable');
    });
  });

  it('maps visual states to CSS class names', () => {
    expect(handCardVisualClassName('playable')).toBe('card-hand--playable');
    expect(handCardVisualClassName('illegal')).toBe('card-hand--illegal');
    expect(handCardVisualClassName('hand-inactive')).toBe('card-hand--hand-inactive');
  });
});
