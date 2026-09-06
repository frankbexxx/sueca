import {
  isTrickContinueActionAllowed,
  shouldShowTrickContinueChrome,
  shouldShowTrickContinueCta
} from './continueFlowUi';
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

describe('continueFlowUi', () => {
  it('allows Continue only while waiting for trick end', () => {
    expect(isTrickContinueActionAllowed(baseState())).toBe(false);
    expect(
      isTrickContinueActionAllowed(baseState({ waitingForTrickEnd: true }))
    ).toBe(true);
  });

  it('blocks Continue during round/game waits and game over', () => {
    expect(
      isTrickContinueActionAllowed(
        baseState({ waitingForTrickEnd: true, waitingForRoundEnd: true })
      )
    ).toBe(false);
    expect(
      isTrickContinueActionAllowed(
        baseState({ waitingForTrickEnd: true, waitingForRoundStart: true })
      )
    ).toBe(false);
    expect(
      isTrickContinueActionAllowed(
        baseState({ waitingForTrickEnd: true, isGameOver: true })
      )
    ).toBe(false);
  });

  it('hides CTA under flow overlays even if trick wait is set', () => {
    const waiting = baseState({ waitingForTrickEnd: true });
    expect(shouldShowTrickContinueCta(waiting)).toBe(true);
    expect(
      shouldShowTrickContinueCta(waiting, { flowOverlayActive: true })
    ).toBe(false);
  });

  it('hides continue chrome during round end / setup / game over', () => {
    expect(
      shouldShowTrickContinueChrome(baseState({ waitingForRoundEnd: true }))
    ).toBe(false);
    expect(
      shouldShowTrickContinueChrome(baseState({ waitingForRoundStart: true }))
    ).toBe(false);
    expect(shouldShowTrickContinueChrome(baseState({ isGameOver: true }))).toBe(
      false
    );
    expect(shouldShowTrickContinueChrome(baseState())).toBe(true);
  });
});
