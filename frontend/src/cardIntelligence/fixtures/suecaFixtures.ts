import { buildFixtureEvent } from './buildFixtureEvent';
import { C } from './cards';
import { FixtureCase } from './types';

export const S08_FIXTURE: FixtureCase = {
  fixtureId: 'S08',
  variant: 'sueca',
  primaryMetricId: 'S08',
  level: 'medium',
  tier: 'A',
  humanNote: 'Parceiro Q♦; adversário K♦; ganhar barato vs risco de corte.',
  event: buildFixtureEvent({
    variant: 'sueca',
    playerIndex: 0,
    turnIndex: 2,
    trickIndex: 3,
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
    metricContext: { metricId: 'S08', applicable: true },
    secondaryMetrics: [{ metricId: 'T04', applicable: true }],
    variantFields: { canWinCheaply: true },
  },
};

export const S16_FIXTURE: FixtureCase = {
  fixtureId: 'S16',
  variant: 'sueca',
  primaryMetricId: 'S16',
  level: 'medium',
  tier: 'A',
  humanNote: 'Liderar sem abrir manilha de ouros antes do Ás sair.',
  event: buildFixtureEvent({
    variant: 'sueca',
    playerIndex: 0,
    turnIndex: 0,
    trickIndex: 0,
    trumpSuit: 'spades',
    handBefore: [C.sevenD, C.d4, C.sJ],
    legalMoves: [C.sevenD, C.d4, C.sJ],
    chosenCard: C.d4,
    trickBefore: [],
    trickAfter: [C.d4],
    ledSuit: null,
    variantFields: { partnerIndex: 2, teamIndex: 1 },
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'S16', applicable: true },
  },
};

export const S19_FIXTURE: FixtureCase = {
  fixtureId: 'S19',
  variant: 'sueca',
  primaryMetricId: 'S19',
  level: 'medium',
  tier: 'A',
  humanNote: 'Parceiro ganha vaza segura — jogar baixo.',
  event: buildFixtureEvent({
    variant: 'sueca',
    playerIndex: 0,
    turnIndex: 2,
    trickIndex: 4,
    trumpSuit: 'clubs',
    handBefore: [C.cK, C.c2],
    legalMoves: [C.cK, C.c2],
    chosenCard: C.c2,
    trickBefore: [C.cA, C.c7],
    trickAfter: [C.cA, C.c7, C.c2],
    ledSuit: 'clubs',
    variantFields: { partnerIndex: 2, teamIndex: 1 },
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'S19', applicable: true },
    variantFields: { partnerWinning: true },
  },
};

export const S12_FIXTURE: FixtureCase = {
  fixtureId: 'S12',
  variant: 'sueca',
  primaryMetricId: 'S12',
  level: 'medium',
  tier: 'A',
  humanNote: 'Cortar com trunfo mínimo que chega.',
  event: buildFixtureEvent({
    variant: 'sueca',
    playerIndex: 0,
    turnIndex: 2,
    trickIndex: 5,
    trumpSuit: 'clubs',
    handBefore: [C.c5, C.cJ],
    legalMoves: [C.c5, C.cJ],
    chosenCard: C.c5,
    trickBefore: [C.dA, C.dK],
    trickAfter: [C.dA, C.dK, C.c5],
    ledSuit: 'diamonds',
    variantFields: { partnerIndex: 2, teamIndex: 1 },
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'S12', applicable: true },
    variantFields: { canCutWithLowestTrump: true },
  },
};

export const S25_FIXTURE: FixtureCase = {
  fixtureId: 'S25',
  variant: 'sueca',
  primaryMetricId: 'S25',
  level: 'hard',
  tier: 'B',
  humanNote: 'Destrunfar trunfo a favor do parceiro void — encoder v0 parcial.',
  event: buildFixtureEvent({
    variant: 'sueca',
    playerIndex: 0,
    turnIndex: 0,
    trickIndex: 6,
    trumpSuit: 'clubs',
    handBefore: [C.cA, C.c6, C.d4],
    legalMoves: [C.cA, C.c6, C.d4],
    chosenCard: C.cA,
    trickBefore: [],
    trickAfter: [C.cA],
    ledSuit: null,
    variantFields: { partnerIndex: 2, teamIndex: 1 },
    roundPlayHistory: [],
  }),
  expected: {
    metricContext: { metricId: 'S25', applicable: false, allowPartial: true },
    variantFields: { partnerIndex: 2 },
  },
};

export const SUECA_FIXTURES: FixtureCase[] = [
  S08_FIXTURE,
  S16_FIXTURE,
  S19_FIXTURE,
  S12_FIXTURE,
  S25_FIXTURE,
];
