import { buildFixtureEvent } from './buildFixtureEvent';
import { C } from './cards';
import { FixtureCase } from './types';

const spadesSnapshot = (overrides: Record<string, unknown>) => ({
  raw: {
    variantState: {
      spades: {
        playerBids: [4, 3, 2, 3],
        playerTricks: [1, 1, 0, 0],
        team1Bid: 6,
        team2Bid: 5,
        team1Tricks: 2,
        team2Tricks: 1,
        team1Bags: 0,
        team2Bags: 0,
        spadesBroken: true,
        ...overrides,
      },
    },
  },
});

export const SP01_FIXTURE: FixtureCase = {
  fixtureId: 'SP01',
  variant: 'spades',
  primaryMetricId: 'SP01',
  level: 'medium',
  tier: 'A',
  humanNote: 'Bid conservador — proxy play-phase; bid real em Impl 5.',
  event: buildFixtureEvent({
    variant: 'spades',
    playerIndex: 0,
    turnIndex: 1,
    trickIndex: 2,
    handBefore: [C.sA, C.sK, C.sQ, C.hK],
    legalMoves: [C.sA, C.hK],
    chosenCard: C.hK,
    trickBefore: [C.s4],
    trickAfter: [C.s4, C.hK],
    ledSuit: 'spades',
    variantFields: { playerBid: 4, teamBid: 6, spadesBroken: true },
    scoreBefore: spadesSnapshot({}),
  }),
  expected: {
    metricContext: { metricId: 'SP01', applicable: true },
    variantFields: { playerBid: 4, needTricks: 4 },
  },
};

export const SP06_FIXTURE: FixtureCase = {
  fixtureId: 'SP06',
  variant: 'spades',
  primaryMetricId: 'SP06',
  level: 'medium',
  tier: 'A',
  humanNote: 'Proteger parceiro — jogar baixo.',
  event: buildFixtureEvent({
    variant: 'spades',
    playerIndex: 3,
    turnIndex: 2,
    trickIndex: 3,
    handBefore: [C.sK, C.c3],
    legalMoves: [C.sK, C.c3],
    chosenCard: C.c3,
    trickBefore: [C.sA, C.c5],
    trickAfter: [C.sA, C.c5, C.c3],
    ledSuit: 'spades',
    variantFields: { playerBid: 3, teamBid: 5, spadesBroken: true },
    scoreBefore: spadesSnapshot({}),
  }),
  expected: {
    metricContext: { metricId: 'SP06', applicable: true },
    variantFields: { partnerWinning: true },
  },
};

export const SP09_FIXTURE: FixtureCase = {
  fixtureId: 'SP09',
  variant: 'spades',
  primaryMetricId: 'SP09',
  level: 'medium',
  tier: 'A',
  humanNote: 'Bid cumprido — evitar bag.',
  event: buildFixtureEvent({
    variant: 'spades',
    playerIndex: 0,
    turnIndex: 3,
    trickIndex: 8,
    handBefore: [C.sA, C.c2],
    legalMoves: [C.sA, C.c2],
    chosenCard: C.c2,
    trickBefore: [C.h2, C.h4, C.h5],
    trickAfter: [C.h2, C.h4, C.h5, C.c2],
    ledSuit: 'hearts',
    variantFields: { playerBid: 4, teamBid: 6, spadesBroken: true },
    scoreBefore: spadesSnapshot({
      team1Tricks: 6,
      team1Bags: 8,
    }),
  }),
  expected: {
    metricContext: { metricId: 'SP09', applicable: true },
    variantFields: { bidMet: true, avoidBagMode: true },
  },
};

export const SP08_FIXTURE: FixtureCase = {
  fixtureId: 'SP08',
  variant: 'spades',
  primaryMetricId: 'SP08',
  level: 'medium',
  tier: 'A',
  humanNote: 'Cortar com espada mínima.',
  event: buildFixtureEvent({
    variant: 'spades',
    playerIndex: 0,
    turnIndex: 2,
    trickIndex: 4,
    handBefore: [C.s4, C.sJ],
    legalMoves: [C.s4, C.sJ],
    chosenCard: C.s4,
    trickBefore: [C.hA, C.h7],
    trickAfter: [C.hA, C.h7, C.s4],
    ledSuit: 'hearts',
    variantFields: { playerBid: 4, teamBid: 6, spadesBroken: true },
    scoreBefore: spadesSnapshot({ team1Tricks: 3, team2Tricks: 2 }),
  }),
  expected: {
    metricContext: { metricId: 'SP08', applicable: true },
    variantFields: { needTricks: 3, spadesBroken: true },
  },
};

export const SP14_FIXTURE: FixtureCase = {
  fixtureId: 'SP14',
  variant: 'spades',
  primaryMetricId: 'SP14',
  level: 'hard',
  tier: 'B',
  humanNote: 'Pressão contra bid adversária alta.',
  event: buildFixtureEvent({
    variant: 'spades',
    playerIndex: 0,
    turnIndex: 1,
    trickIndex: 7,
    handBefore: [C.sA, C.sK],
    legalMoves: [C.sA, C.sK],
    chosenCard: C.sA,
    trickBefore: [C.hK],
    trickAfter: [C.hK, C.sA],
    ledSuit: 'hearts',
    variantFields: { playerBid: 4, teamBid: 6, spadesBroken: true },
    scoreBefore: spadesSnapshot({
      team1Bid: 6,
      team2Bid: 8,
      team1Tricks: 5,
      team2Tricks: 6,
    }),
  }),
  expected: {
    metricContext: { metricId: 'SP14', applicable: true },
    variantFields: { bidMet: false, needTricks: 1 },
  },
};

export const SPADES_FIXTURES: FixtureCase[] = [
  SP01_FIXTURE,
  SP06_FIXTURE,
  SP09_FIXTURE,
  SP08_FIXTURE,
  SP14_FIXTURE,
];
