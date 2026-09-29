import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { TrickArea } from './TrickArea';
import { Card, GameState } from '../types/game';
import { CARD_FRAME_ASPECT } from '../constants/cardDisplayContract';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: '1', name: 'South', hand: [], team: 1, type: 'human' },
      { id: '2', name: 'West', hand: [], team: 2, type: 'ai' },
      { id: '3', name: 'North', hand: [], team: 1, type: 'ai' },
      { id: '4', name: 'East', hand: [], team: 2, type: 'ai' }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trumpSuit: 'spades',
    trumpCard: null,
    currentTrick: [
      { suit: 'clubs', rank: '2', id: 'c2' },
      { suit: 'clubs', rank: '3', id: 'c3' }
    ] as Card[],
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
    dealingDirection: 'right',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'South',
    aiDifficulty: 'medium',
    partnerSignals: [],
    ...overrides
  };
}

describe('TrickArea REL-DECK-SIZE-02 frame contract', () => {
  it('wraps trick cards in card-frame with contained art', () => {
    const { container } = render(
      <TrickArea
        gameState={makeState()}
        localPlayerIndex={0}
        getCardImage={(c) => `${c.id}.png`}
        variant="sueca"
      />
    );
    const frames = container.querySelectorAll('.trick-card-cross.card-frame');
    expect(frames.length).toBe(2);
    frames.forEach((frame) => {
      expect(frame.querySelector('img.card-frame__art')).toBeTruthy();
    });
  });
});

describe('Personalizar preview CSS contract (static)', () => {
  it('documents 5:7 preview frame aspect', () => {
    // Runtime CSS is asserted via HandCardsScreen styles; keep numeric contract here.
    expect(28 * CARD_FRAME_ASPECT).toBeCloseTo(39.2, 5);
    expect(36 * CARD_FRAME_ASPECT).toBeCloseTo(50.4, 5);
  });
});
