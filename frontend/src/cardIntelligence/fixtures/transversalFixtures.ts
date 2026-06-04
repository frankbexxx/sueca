import { buildFixtureEvent } from './buildFixtureEvent';
import { C } from './cards';
import { FixtureCase } from './types';

export const T01_FIXTURE: FixtureCase = {
  fixtureId: 'T01',
  variant: 'sueca',
  primaryMetricId: 'T01',
  level: 'medium',
  tier: 'A',
  humanNote: 'Jogada legal — seguir naipe liderado.',
  event: buildFixtureEvent({
    variant: 'sueca',
    playerIndex: 0,
    turnIndex: 1,
    trickIndex: 1,
    trumpSuit: 'clubs',
    handBefore: [C.c2, C.h5, C.dK],
    legalMoves: [C.c2],
    chosenCard: C.c2,
    trickBefore: [C.cA],
    trickAfter: [C.cA, C.c2],
    ledSuit: 'clubs',
    variantFields: { partnerIndex: 2, teamIndex: 1 },
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'T01', applicable: true },
  },
};

export const T04_FIXTURE: FixtureCase = {
  fixtureId: 'T04',
  variant: 'sueca',
  primaryMetricId: 'T04',
  level: 'medium',
  tier: 'A',
  humanNote: 'Ganhar barato condicional — Sueca (não Hearts default).',
  event: buildFixtureEvent({
    variant: 'sueca',
    playerIndex: 0,
    turnIndex: 2,
    trickIndex: 2,
    trumpSuit: 'clubs',
    handBefore: [C.dA, C.d9, C.c3],
    legalMoves: [C.dA, C.d9],
    chosenCard: C.d9,
    trickBefore: [C.dQ, C.dK],
    trickAfter: [C.dQ, C.dK, C.d9],
    ledSuit: 'diamonds',
    variantFields: { partnerIndex: 2, teamIndex: 1 },
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'T04', applicable: true },
    variantFields: { canWinCheaply: true },
  },
};

export const T06_FIXTURE: FixtureCase = {
  fixtureId: 'T06',
  variant: 'spades',
  primaryMetricId: 'T06',
  level: 'medium',
  tier: 'A',
  humanNote: 'Jogar baixo para perder — bid cumprido Spades.',
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
    scoreBefore: {
      raw: {
        variantState: {
          spades: {
            playerBids: [4, 3, 2, 3],
            team1Bid: 6,
            team2Bid: 5,
            team1Tricks: 6,
            team2Tricks: 2,
            team1Bags: 0,
            spadesBroken: true,
          },
        },
      },
    },
  }),
  expected: {
    metricContext: { metricId: 'T06', applicable: true },
    variantFields: { bidMet: true },
  },
};

export const TRANSVERSAL_FIXTURES: FixtureCase[] = [T01_FIXTURE, T04_FIXTURE, T06_FIXTURE];
