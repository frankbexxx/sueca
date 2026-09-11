import {
  formatTrickProgressLabel,
  resolveTrickProgress,
  tricksPerHand
} from './trickProgress';
import type { GameState } from '../types/game';

function baseState(partial: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: '1', name: 'P1', hand: new Array(10).fill(null).map((_, i) => ({ suit: 'hearts', rank: 'A', id: `h${i}` })), team: 1 },
      { id: '2', name: 'P2', hand: new Array(10).fill(null).map((_, i) => ({ suit: 'spades', rank: 'A', id: `s${i}` })), team: 2 },
      { id: '3', name: 'P3', hand: new Array(10).fill(null).map((_, i) => ({ suit: 'clubs', rank: 'A', id: `c${i}` })), team: 1 },
      { id: '4', name: 'P4', hand: new Array(10).fill(null).map((_, i) => ({ suit: 'diamonds', rank: 'A', id: `d${i}` })), team: 2 }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trumpSuit: 'hearts',
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
    isFirstTrick: true,
    dealingMethod: 'A',
    dealingDirection: 'left',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P1',
    aiDifficulty: 'medium',
    partnerSignals: [],
    ...partial
  } as GameState;
}

describe('trickProgress UX-P3.2', () => {
  it('uses 10 tricks for Sueca and 13 for others', () => {
    expect(tricksPerHand('sueca')).toBe(10);
    expect(tricksPerHand('spades')).toBe(13);
    expect(tricksPerHand('hearts')).toBe(13);
    expect(tricksPerHand('king')).toBe(13);
  });

  it('starts at Vaza 1/10', () => {
    const p = resolveTrickProgress(baseState(), 'sueca');
    expect(p).toEqual({ current: 1, total: 10 });
    expect(formatTrickProgressLabel(p, 'pt')).toBe('Vaza 1/10');
    expect(formatTrickProgressLabel(p, 'en')).toBe('Trick 1/10');
  });

  it('advances from playedCards', () => {
    const cards = new Array(8).fill(null).map((_, i) => ({
      suit: 'hearts' as const,
      rank: 'A' as const,
      id: `p${i}`
    }));
    const p = resolveTrickProgress(baseState({ playedCards: cards }), 'sueca');
    expect(p.current).toBe(3);
  });

  it('holds current trick number while waiting for continue', () => {
    const cards = new Array(4).fill(null).map((_, i) => ({
      suit: 'hearts' as const,
      rank: 'A' as const,
      id: `p${i}`
    }));
    const p = resolveTrickProgress(
      baseState({ playedCards: cards, waitingForTrickEnd: true }),
      'sueca'
    );
    expect(p.current).toBe(1);
  });
});
