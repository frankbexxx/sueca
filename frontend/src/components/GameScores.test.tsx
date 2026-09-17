import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamScoreBlock } from './GameScores';
import { GameState } from '../types/game';
import { SpadesVariantState } from '../models/games/SpadesGame';

vi.mock('../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      gameBoard: { us: 'Nós', them: 'Eles', points: 'Pts', games: 'Jogos' },
      spadesStatus: {
        bagsLine: (bags: number) => `${bags} bags`,
        tricksBidAria: (tricks: number, bid: number) => `Vazas ${tricks} / Bid ${bid}`,
        scoreShort: 'Score'
      }
    }
  })
}));

function spadesState(overrides: Partial<SpadesVariantState> = {}): SpadesVariantState {
  return {
    playerBids: [3, 2, 3, 3],
    playerBidTypes: ['normal', 'normal', 'normal', 'normal'],
    bidLeaderIndex: 0,
    currentBidderIndex: 0,
    team1Bid: 6,
    team2Bid: 5,
    team1Tricks: 4,
    team2Tricks: 3,
    playerTricks: [2, 1, 2, 2],
    team1Bags: 1,
    team2Bags: 2,
    waitingForBids: false,
    spadesBroken: false,
    nilEnabled: false,
    blindNilEnabled: false,
    ...overrides
  };
}

function baseGame(spades: SpadesVariantState): GameState {
  return {
    players: [
      { id: '0', name: 'P0', hand: [], team: 1, type: 'human' },
      { id: '1', name: 'P1', hand: [], team: 2, type: 'ai' },
      { id: '2', name: 'P2', hand: [], team: 1, type: 'ai' },
      { id: '3', name: 'P3', hand: [], team: 2, type: 'ai' }
    ],
    currentPlayerIndex: 0,
    trumpSuit: null,
    trumpCard: null,
    currentTrick: [],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 120, team2: 80 },
    round: 2,
    dealerIndex: 0,
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
    playerName: 'P0',
    aiDifficulty: 'medium',
    partnerSignals: [],
    variant: 'spades',
    variantState: { spades }
  } as GameState;
}

describe('TeamScoreBlock Spades HUD', () => {
  it('shows compact tricks/bid, score, and bags for us/them perspective', () => {
    const gameState = baseGame(spadesState());
    const { rerender } = render(
      <TeamScoreBlock
        gameState={gameState}
        variant="spades"
        team="us"
        usTeam={1}
        themTeam={2}
      />
    );
    expect(screen.getByText('Nós')).toBeInTheDocument();
    expect(screen.getByLabelText('Vazas 4 / Bid 6')).toHaveTextContent('4/6');
    expect(screen.getByText(/Score 120/)).toBeInTheDocument();
    expect(screen.getByLabelText('1 bags')).toBeInTheDocument();

    rerender(
      <TeamScoreBlock
        gameState={gameState}
        variant="spades"
        team="them"
        usTeam={1}
        themTeam={2}
      />
    );
    expect(screen.getByText('Eles')).toBeInTheDocument();
    expect(screen.getByLabelText('Vazas 3 / Bid 5')).toHaveTextContent('3/5');
    expect(screen.getByText(/Score 80/)).toBeInTheDocument();
    expect(screen.getByLabelText('2 bags')).toBeInTheDocument();
  });

  it('maps usTeam=2 so local perspective swaps tricks/bid', () => {
    const gameState = baseGame(spadesState());
    render(
      <TeamScoreBlock
        gameState={gameState}
        variant="spades"
        team="us"
        usTeam={2}
        themTeam={1}
      />
    );
    expect(screen.getByLabelText('Vazas 3 / Bid 5')).toHaveTextContent('3/5');
  });

  it('shows 0/bid at hand start without undefined', () => {
    const gameState = baseGame(
      spadesState({ team1Tricks: 0, team2Tricks: 0, team1Bid: 6, team2Bid: 5 })
    );
    render(
      <TeamScoreBlock
        gameState={gameState}
        variant="spades"
        team="us"
        usTeam={1}
        themTeam={2}
      />
    );
    expect(screen.getByLabelText('Vazas 0 / Bid 6')).toHaveTextContent('0/6');
  });
});
