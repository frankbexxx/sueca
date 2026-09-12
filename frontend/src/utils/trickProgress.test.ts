import {
  formatTrickProgressLabel,
  resolveTrickProgress,
  tricksPerHand
} from './trickProgress';
import type { Card, GameState } from '../types/game';
import { kingHudContractTitle, kingGameTitle, kingHudMatchProgress } from '../models/games/king/kingContracts';

function cards(n: number, prefix: string): Card[] {
  return new Array(n).fill(null).map((_, i) => ({
    suit: 'hearts',
    rank: 'A',
    id: `${prefix}${i}`
  }));
}

function baseState(partial: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: '1', name: 'P1', hand: cards(10, 'h'), team: 1 },
      { id: '2', name: 'P2', hand: cards(10, 's'), team: 2 },
      { id: '3', name: 'P3', hand: cards(10, 'c'), team: 1 },
      { id: '4', name: 'P4', hand: cards(10, 'd'), team: 2 }
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

function withHands(handSize: number, playedCount: number, extra: Partial<GameState> = {}): GameState {
  return baseState({
    players: [
      { id: '1', name: 'P1', hand: cards(handSize, 'h'), team: 1 },
      { id: '2', name: 'P2', hand: cards(handSize, 's'), team: 2 },
      { id: '3', name: 'P3', hand: cards(handSize, 'c'), team: 1 },
      { id: '4', name: 'P4', hand: cards(handSize, 'd'), team: 2 }
    ],
    playedCards: cards(playedCount, 'p'),
    ...extra
  });
}

describe('trickProgress UX-P3.4a — single source of truth', () => {
  it('uses 10 tricks for Sueca and 13 for Spades/Hearts/King', () => {
    expect(tricksPerHand('sueca')).toBe(10);
    expect(tricksPerHand('spades')).toBe(13);
    expect(tricksPerHand('hearts')).toBe(13);
    expect(tricksPerHand('king')).toBe(13);
  });

  describe('Sueca', () => {
    it('starts at Vaza 1/10', () => {
      const p = resolveTrickProgress(withHands(10, 0), 'sueca');
      expect(p).toEqual({ current: 1, total: 10 });
      expect(formatTrickProgressLabel(p, 'pt')).toBe('Vaza 1/10');
    });

    it('reaches middle and end without overflowing', () => {
      expect(resolveTrickProgress(withHands(6, 16), 'sueca')).toEqual({
        current: 5,
        total: 10
      });
      expect(resolveTrickProgress(withHands(0, 40), 'sueca')).toEqual({
        current: 10,
        total: 10
      });
      expect(resolveTrickProgress(withHands(0, 44), 'sueca').current).toBeLessThanOrEqual(10);
    });
  });

  describe('Spades', () => {
    it('uses 13-trick hand progress', () => {
      expect(resolveTrickProgress(withHands(13, 0), 'spades')).toEqual({
        current: 1,
        total: 13
      });
      expect(resolveTrickProgress(withHands(7, 24), 'spades')).toEqual({
        current: 7,
        total: 13
      });
      expect(resolveTrickProgress(withHands(0, 52), 'spades')).toEqual({
        current: 13,
        total: 13
      });
      expect(formatTrickProgressLabel({ current: 7, total: 13 }, 'pt')).toBe('Vaza 7/13');
    });
  });

  describe('Hearts', () => {
    it('uses 13-trick hand progress', () => {
      expect(resolveTrickProgress(withHands(13, 0), 'hearts')).toEqual({
        current: 1,
        total: 13
      });
      expect(resolveTrickProgress(withHands(7, 24), 'hearts')).toEqual({
        current: 7,
        total: 13
      });
      expect(resolveTrickProgress(withHands(0, 52), 'hearts')).toEqual({
        current: 13,
        total: 13
      });
    });
  });

  describe('King', () => {
    it('uses 13-trick hand progress for negatives and positive', () => {
      const negative = withHands(13, 0, {
        variantState: { kingPt: { trickNumber: 0, contract: 'no_tricks', gameIndex: 0 } }
      });
      expect(resolveTrickProgress(negative, 'king')).toEqual({ current: 1, total: 13 });

      const mid = withHands(7, 24, {
        variantState: { kingPt: { trickNumber: 6, contract: 'no_queens', gameIndex: 2 } }
      });
      expect(resolveTrickProgress(mid, 'king')).toEqual({ current: 7, total: 13 });

      const positive = withHands(0, 52, {
        variantState: {
          kingPt: { trickNumber: 13, contract: null, gameIndex: 6, festaMode: 'positive' }
        }
      });
      expect(resolveTrickProgress(positive, 'king')).toEqual({ current: 13, total: 13 });
    });

    it('never reports 14/13', () => {
      const overflow = withHands(0, 60, {
        variantState: { kingPt: { trickNumber: 14 } }
      });
      expect(resolveTrickProgress(overflow, 'king')).toEqual({ current: 13, total: 13 });
    });

    it('holds trick index while waiting for continue', () => {
      const waiting = withHands(12, 4, {
        waitingForTrickEnd: true,
        variantState: { kingPt: { trickNumber: 0 } }
      });
      expect(resolveTrickProgress(waiting, 'king')).toEqual({ current: 1, total: 13 });
    });

    it('disambiguates match progress from trick progress in HUD titles', () => {
      // Legacy modal title may still use bare n/10 — HUD must use Jogo N/10.
      expect(kingGameTitle(0, 'no_tricks', null, 'pt')).toBe('Não fazer vazas · 1/10');
      expect(kingHudContractTitle(0, 'no_tricks', null, 'pt')).toBe(
        'Não fazer vazas · Jogo 1/10'
      );
      expect(kingHudMatchProgress(0, 'pt')).toBe('Jogo 1/10');
      expect(kingHudContractTitle(0, 'no_tricks', null, 'pt')).not.toMatch(/· 1\/10$/);
      expect(kingHudContractTitle(6, null, 'Ana', 'pt')).toBe('Festa de Ana · Jogo 7/10');
      expect(kingHudContractTitle(9, null, null, 'pt')).toBe('Jogo 10/10');
    });
  });
});