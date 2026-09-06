import {
  isHeartsPassActive,
  isKingFestaSheetActive,
  isSpadesBidActive,
  isWaitingForEarlyEnd,
  resolveGameBoardFlow
} from './gameFlowOrchestrator';
import { GameState } from '../types/game';
import { KingPtVariantState } from '../models/games/KingPtGame';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: '1', name: 'P1', hand: [], team: 1, type: 'human' },
      { id: '2', name: 'P2', hand: [], team: 2, type: 'ai' },
      { id: '3', name: 'P3', hand: [], team: 1, type: 'ai' },
      { id: '4', name: 'P4', hand: [], team: 2, type: 'ai' }
    ],
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

function kingStub(overrides: Partial<KingPtVariantState>): KingPtVariantState {
  return overrides as KingPtVariantState;
}

const heartsPassState = {
  waitingForPass: true,
  heartsBroken: false,
  playerScores: [0, 0, 0, 0],
  roundPoints: [0, 0, 0, 0],
  lastRoundDeltas: [0, 0, 0, 0],
  passDirection: 'left' as const,
  humanPassIndices: [] as number[],
  heartsTakenCount: 0,
  queenSpadesTaken: false,
  penaltyCardsTaken: [[], [], [], []] as [][],
  waitingForEarlyEnd: false,
  scoringFrozen: false,
  earlyEndOffered: false
};

describe('gameFlowOrchestrator', () => {
  it('detects hearts pass / spades bid / early end flags', () => {
    expect(
      isHeartsPassActive(
        'hearts',
        baseState({ variantState: { hearts: heartsPassState } })
      )
    ).toBe(true);

    expect(
      isSpadesBidActive(
        'spades',
        baseState({
          variantState: {
            spades: {
              waitingForBids: true,
              playerBids: [null, null, null, null],
              playerBidTypes: ['normal', 'normal', 'normal', 'normal'],
              bidLeaderIndex: 0,
              currentBidderIndex: 0,
              team1Bid: 0,
              team2Bid: 0,
              team1Tricks: 0,
              team2Tricks: 0,
              playerTricks: [0, 0, 0, 0],
              team1Bags: 0,
              team2Bags: 0,
              spadesBroken: false,
              nilEnabled: false,
              blindNilEnabled: false
            }
          }
        })
      )
    ).toBe(true);

    expect(
      isWaitingForEarlyEnd(
        'hearts',
        baseState({
          variantState: {
            hearts: { ...heartsPassState, waitingForPass: false, waitingForEarlyEnd: true }
          }
        }),
        null
      )
    ).toBe(true);
  });

  it('detects king festa sheet only during round-start festa phases', () => {
    expect(
      isKingFestaSheetActive(kingStub({ phase: 'positive', festaPhase: 'auction' }), true)
    ).toBe(true);
    expect(
      isKingFestaSheetActive(kingStub({ phase: 'positive', festaPhase: 'auction' }), false)
    ).toBe(false);
    expect(
      isKingFestaSheetActive(kingStub({ phase: 'koh_reveal', festaPhase: 'auction' }), true)
    ).toBe(false);
  });

  it('prioritises overlays over trick-end continue', () => {
    const flow = resolveGameBoardFlow({
      variant: 'hearts',
      gameState: baseState({
        waitingForTrickEnd: true,
        variantState: { hearts: heartsPassState }
      })
    });
    expect(flow.kind).toBe('hearts_pass');
    expect(flow.flowOverlayActive).toBe(true);
    expect(flow.showTrickContinueCta).toBe(false);
  });

  it('uses trick_end_wait when only waitingForTrickEnd', () => {
    const flow = resolveGameBoardFlow({
      variant: 'sueca',
      gameState: baseState({ waitingForTrickEnd: true })
    });
    expect(flow.kind).toBe('trick_end_wait');
    expect(flow.showTrickContinueCta).toBe(true);
    expect(flow.flowOverlayActive).toBe(false);
  });

  it('prioritises game_over and round_end', () => {
    expect(
      resolveGameBoardFlow({
        variant: 'sueca',
        gameState: baseState({ isGameOver: true, waitingForTrickEnd: true })
      }).kind
    ).toBe('game_over');

    expect(
      resolveGameBoardFlow({
        variant: 'spades',
        gameState: baseState({ waitingForRoundEnd: true, waitingForTrickEnd: true })
      }).kind
    ).toBe('round_end');
  });

  it('marks paused only when no higher wait is active', () => {
    expect(
      resolveGameBoardFlow({
        variant: 'sueca',
        gameState: baseState({ isPaused: true })
      }).kind
    ).toBe('paused');

    expect(
      resolveGameBoardFlow({
        variant: 'sueca',
        gameState: baseState({ isPaused: true, waitingForTrickEnd: true })
      }).kind
    ).toBe('trick_end_wait');
  });
});
