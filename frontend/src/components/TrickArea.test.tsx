import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { TrickArea } from './TrickArea';
import { Card, GameState } from '../types/game';

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
      { suit: 'clubs', rank: '3', id: 'c3' },
      { suit: 'clubs', rank: '4', id: 'c4' },
      { suit: 'clubs', rank: '5', id: 'c5' }
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
    playDirection: 'right',
    dealAlignment: 'same',
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

describe('TrickArea REL-SUECA-REG-03 visual seat classes', () => {
  const getCardImage = (c: Card) => `${c.id}.png`;

  it('Sueca leader 0: places cards South East North West', () => {
    const { container } = render(
      <TrickArea
        gameState={makeState()}
        localPlayerIndex={0}
        getCardImage={getCardImage}
        variant="sueca"
      />
    );
    const cards = container.querySelectorAll('.trick-card-cross');
    expect(cards).toHaveLength(4);
    // local=0: seat 0 south, 3 east, 2 north, 1 west
    expect(cards[0].className).toContain('trick-from-south');
    expect(cards[1].className).toContain('trick-from-east');
    expect(cards[2].className).toContain('trick-from-north');
    expect(cards[3].className).toContain('trick-from-west');
  });

  it('Sueca LEFT leader 0: places cards South West North East', () => {
    const { container } = render(
      <TrickArea
        gameState={makeState({ playDirection: 'left' })}
        localPlayerIndex={0}
        getCardImage={getCardImage}
        variant="sueca"
      />
    );
    const cards = container.querySelectorAll('.trick-card-cross');
    expect(cards[0].className).toContain('trick-from-south');
    expect(cards[1].className).toContain('trick-from-west');
    expect(cards[2].className).toContain('trick-from-north');
    expect(cards[3].className).toContain('trick-from-east');
  });

  it('Hearts leader 0: places cards South West North East (clockwise)', () => {
    const { container } = render(
      <TrickArea
        gameState={makeState({ variant: 'hearts' })}
        localPlayerIndex={0}
        getCardImage={getCardImage}
        variant="hearts"
      />
    );
    const cards = container.querySelectorAll('.trick-card-cross');
    expect(cards[0].className).toContain('trick-from-south');
    expect(cards[1].className).toContain('trick-from-west');
    expect(cards[2].className).toContain('trick-from-north');
    expect(cards[3].className).toContain('trick-from-east');
  });
});
