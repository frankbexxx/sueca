import {
  KING_PENALTY_CARD_CONTRACTS,
  shouldShowKingPenaltyCards
} from './kingHudPenaltyDisplay';
import {
  formatKingHudTotalLabel,
  formatSignedScore,
  resolveKingNegativeHudScore
} from './kingHudScoreDisplay';
import {
  applyDevNegativeFixture,
  parseDevKingNegParams,
  samplePenaltyCardsForContract,
  sampleRoundDeltasForContract
} from '../../../dev/kingNegativeJump';
import { KingPtGame, getKingPtState } from '../KingPtGame';

describe('kingHudPenaltyDisplay', () => {
  it('shows mosaics only for hearts/queens/men/koh', () => {
    expect(shouldShowKingPenaltyCards('no_hearts')).toBe(true);
    expect(shouldShowKingPenaltyCards('no_queens')).toBe(true);
    expect(shouldShowKingPenaltyCards('no_men')).toBe(true);
    expect(shouldShowKingPenaltyCards('no_king_hearts')).toBe(true);
    expect(shouldShowKingPenaltyCards('no_tricks')).toBe(false);
    expect(shouldShowKingPenaltyCards('no_last_two')).toBe(false);
    expect(shouldShowKingPenaltyCards(null)).toBe(false);
    expect(KING_PENALTY_CARD_CONTRACTS).toHaveLength(4);
  });

  it('shows mosaics for synthetic all-negatives even when contract is no_tricks', () => {
    expect(
      shouldShowKingPenaltyCards('no_tricks', { syntheticAllNegatives: true })
    ).toBe(true);
    expect(
      shouldShowKingPenaltyCards(null, { syntheticAllNegatives: true })
    ).toBe(true);
    expect(
      shouldShowKingPenaltyCards('no_tricks', { syntheticAllNegatives: false })
    ).toBe(false);
  });
});

describe('kingHudScoreDisplay', () => {
  it('uses lastRoundDeltas as primary during negative play', () => {
    const line = resolveKingNegativeHudScore({
      gameIndex: 1,
      phase: 'negative',
      lastRoundDeltas: [-40, 0, -20, 0],
      playerScores: [-90, 20, -50, 60],
      roundStartScores: [-50, 20, -30, 60],
      playerIndex: 0
    });
    expect(line.roundPrimary).toBe(true);
    expect(line.roundDelta).toBe(-40);
    expect(line.totalScore).toBe(-50);
    expect(formatSignedScore(-40)).toBe('-40');
    expect(formatKingHudTotalLabel(-50, 'pt')).toBe('Total -50');
  });

  it('does not use round-primary during festa setup (pre-play)', () => {
    const line = resolveKingNegativeHudScore({
      gameIndex: 6,
      phase: 'festa_setup',
      lastRoundDeltas: [0, 0, 0, 0],
      playerScores: [1, 2, 3, 4],
      playerIndex: 1
    });
    expect(line.roundPrimary).toBe(false);
  });

  it('uses lastRoundDeltas as primary during festa_play', () => {
    const line = resolveKingNegativeHudScore({
      gameIndex: 6,
      phase: 'festa_play',
      lastRoundDeltas: [50, 0, 25, 0],
      playerScores: [-50, 20, -10, 60],
      roundStartScores: [-100, 20, -35, 60],
      playerIndex: 0
    });
    expect(line.roundPrimary).toBe(true);
    expect(line.roundDelta).toBe(50);
    expect(line.totalScore).toBe(-100);
    expect(formatSignedScore(50)).toBe('+50');
    expect(formatKingHudTotalLabel(-100, 'pt')).toBe('Total -100');
  });

  it('UX-KING-SCORE-LIVE-01: Total stays at roundStart while deltas move', () => {
    const line = resolveKingNegativeHudScore({
      gameIndex: 7,
      phase: 'festa_play',
      lastRoundDeltas: [75, -125, 25, 0],
      playerScores: [-90, 75, 325, 400],
      roundStartScores: [-165, 200, 300, 400],
      playerIndex: 0
    });
    expect(line.roundDelta).toBe(75);
    expect(line.totalScore).toBe(-165);
  });
});

describe('kingNegativeJump samples', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('parses DEV query and ignores production', () => {
    process.env.NODE_ENV = 'development';
    expect(parseDevKingNegParams('?devKingNeg=no_hearts')).toBe('no_hearts');
    expect(parseDevKingNegParams('?devKingNeg=koh')).toBe('no_king_hearts');
    expect(parseDevKingNegParams('?devKingNeg=nope')).toBeNull();
    process.env.NODE_ENV = 'production';
    expect(parseDevKingNegParams('?devKingNeg=no_hearts')).toBeNull();
  });

  it('associates sample cards to correct players', () => {
    const hearts = samplePenaltyCardsForContract('no_hearts');
    expect(hearts[0].every((c) => c.suit === 'hearts')).toBe(true);
    expect(hearts[2].length).toBe(2);
    expect(hearts[1]).toHaveLength(0);

    const queens = samplePenaltyCardsForContract('no_queens');
    expect(queens[1][0].rank).toBe('Q');
    expect(queens[3][0].rank).toBe('Q');

    const men = samplePenaltyCardsForContract('no_men');
    expect(men[0].map((c) => c.rank).sort()).toEqual(['J', 'K']);
    expect(men[2][0]).toMatchObject({ rank: 'K', suit: 'hearts' });

    const koh = samplePenaltyCardsForContract('no_king_hearts');
    expect(koh[1][0]).toMatchObject({ rank: 'K', suit: 'hearts' });

    expect(samplePenaltyCardsForContract('no_tricks').flat()).toHaveLength(0);
    expect(samplePenaltyCardsForContract('no_last_two').flat()).toHaveLength(0);
  });

  it('DEV fixture wires engine fields without recalculating scores', () => {
    process.env.NODE_ENV = 'development';
    const game = new KingPtGame();
    const state = applyDevNegativeFixture(game, ['P1', 'P2', 'P3', 'P4'], 'no_hearts');
    expect(state).not.toBeNull();
    const king = getKingPtState(state!);
    expect(king.contract).toBe('no_hearts');
    expect(king.phase).toBe('negative');
    expect(king.lastRoundDeltas).toEqual(sampleRoundDeltasForContract('no_hearts'));
    expect(king.roundBreakdown.penaltyCardsTaken[0]).toHaveLength(2);
    expect(king.roundBreakdown.penaltyCardsTaken[2]).toHaveLength(2);
    expect(king.playerScores[0]).toBe(king.roundStartScores[0] + king.lastRoundDeltas[0]);
  });
});