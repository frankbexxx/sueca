import { buildFixtureEvent } from './buildFixtureEvent';
import { C } from './cards';
import { FixtureCase } from './types';

const heartsFields = { heartsBroken: true, passDirection: null };

export const H01_FIXTURE: FixtureCase = {
  fixtureId: 'H01',
  variant: 'hearts',
  primaryMetricId: 'H01',
  level: 'medium',
  tier: 'A',
  humanNote: 'Evitar pontos desnecessários na vaza.',
  event: buildFixtureEvent({
    variant: 'hearts',
    playerIndex: 0,
    turnIndex: 2,
    trickIndex: 3,
    handBefore: [C.h2, C.c4],
    legalMoves: [C.h2, C.c4],
    chosenCard: C.c4,
    trickBefore: [C.h4, C.h5],
    trickAfter: [C.h4, C.h5, C.c4],
    ledSuit: 'hearts',
    variantFields: heartsFields,
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'H01', applicable: true },
    variantFields: { pointsInTrick: 2 },
  },
};

export const H05_FIXTURE: FixtureCase = {
  fixtureId: 'H05',
  variant: 'hearts',
  primaryMetricId: 'H05',
  level: 'medium',
  tier: 'A',
  humanNote: 'Pass perigosos — proxy play com cartas perigosas na mão.',
  event: buildFixtureEvent({
    variant: 'hearts',
    playerIndex: 0,
    turnIndex: 0,
    trickIndex: 0,
    handBefore: [C.sQ, C.sA, C.hK, C.c2],
    legalMoves: [C.c2],
    chosenCard: C.c2,
    trickBefore: [],
    trickAfter: [C.c2],
    ledSuit: null,
    variantFields: heartsFields,
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'H05', applicable: true },
  },
};

export const H13_FIXTURE: FixtureCase = {
  fixtureId: 'H13',
  variant: 'hearts',
  primaryMetricId: 'H13',
  level: 'medium',
  tier: 'A',
  humanNote: 'Vaza nossa sem pontos — limpar Q♠.',
  event: buildFixtureEvent({
    variant: 'hearts',
    playerIndex: 2,
    turnIndex: 2,
    trickIndex: 5,
    handBefore: [C.sQ, C.d2],
    legalMoves: [C.sQ, C.d2],
    chosenCard: C.sQ,
    trickBefore: [C.cA, C.c4],
    trickAfter: [C.cA, C.c4],
    ledSuit: 'clubs',
    variantFields: heartsFields,
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'H13', applicable: true },
    variantFields: { trickIsSafeAndPointless: true, canCleanDangerousCard: true },
  },
};

export const H11_FIXTURE: FixtureCase = {
  fixtureId: 'H11',
  variant: 'hearts',
  primaryMetricId: 'H11',
  level: 'medium',
  tier: 'A',
  humanNote: 'Q♠ perigo máximo — seguir espadas baixo.',
  event: buildFixtureEvent({
    variant: 'hearts',
    playerIndex: 0,
    turnIndex: 1,
    trickIndex: 4,
    handBefore: [C.sQ, C.s2, C.h4],
    legalMoves: [C.sQ, C.s2],
    chosenCard: C.s2,
    trickBefore: [C.sA],
    trickAfter: [C.sA, C.s2],
    ledSuit: 'spades',
    variantFields: heartsFields,
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'H11', applicable: true },
    variantFields: { queenSpadesPlayed: false },
  },
};

export const H10_FIXTURE: FixtureCase = {
  fixtureId: 'H10',
  variant: 'hearts',
  primaryMetricId: 'H10',
  level: 'hard',
  tier: 'B',
  humanNote: 'Bloquear shoot the moon — moonStillPossible gap v0.',
  event: buildFixtureEvent({
    variant: 'hearts',
    playerIndex: 0,
    turnIndex: 2,
    trickIndex: 6,
    handBefore: [C.h2, C.c3],
    legalMoves: [C.h2, C.c3],
    chosenCard: C.h2,
    trickBefore: [C.h4, C.h5],
    trickAfter: [C.h4, C.h5, C.h2],
    ledSuit: 'hearts',
    variantFields: { heartsBroken: true, passDirection: null },
    roundPlayHistory: [
      {
        roundIndex: 0,
        trickIndex: 0,
        turnIndex: 0,
        playerIndex: 1,
        card: C.h3,
      },
      {
        roundIndex: 0,
        trickIndex: 1,
        turnIndex: 0,
        playerIndex: 1,
        card: C.h4,
      },
    ],
  }),
  expected: {
    metricContext: { metricId: 'H10', applicable: true },
    variantFields: { heartsBroken: true },
  },
};

export const HEARTS_FIXTURES: FixtureCase[] = [
  H01_FIXTURE,
  H05_FIXTURE,
  H13_FIXTURE,
  H11_FIXTURE,
  H10_FIXTURE,
];
