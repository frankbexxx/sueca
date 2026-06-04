import { buildFixtureEvent } from './buildFixtureEvent';
import { C } from './cards';
import { FixtureCase } from './types';

const kingPtNull = {
  contractId: null,
  contractType: null,
  festaPhase: null,
  noTrump: false,
  syntheticMode: false,
} as const;

function kingScore(contract: string, extra: Record<string, unknown> = {}) {
  return {
    raw: {
      variantState: {
        kingPt: { contract, trickNumber: 1, ...extra },
        rulesPresetId: 'king-pt-normal',
      },
    },
  };
}

export const K00_FIXTURE: FixtureCase = {
  fixtureId: 'K00',
  variant: 'king',
  primaryMetricId: 'K00',
  level: 'medium',
  tier: 'A',
  humanNote: 'Contrato activo define objectivo — evitar copas.',
  event: buildFixtureEvent({
    variant: 'king',
    playerIndex: 0,
    turnIndex: 1,
    trickIndex: 2,
    handBefore: [C.hK, C.h5, C.c2],
    legalMoves: [C.c2],
    chosenCard: C.c2,
    trickBefore: [C.sA],
    trickAfter: [C.sA, C.c2],
    ledSuit: 'spades',
    variantFields: kingPtNull,
    scoreBefore: kingScore('no_hearts'),
  }),
  expected: {
    metricContext: { metricId: 'K00', applicable: true, reasonShortIncludes: 'no_hearts' },
    variantFields: { contractId: 'no_hearts' },
  },
};

export const K02_FIXTURE: FixtureCase = {
  fixtureId: 'K02',
  variant: 'king',
  primaryMetricId: 'K02',
  level: 'medium',
  tier: 'A',
  humanNote: 'K♥ obrigatório na 1.ª oportunidade legal (lead).',
  event: buildFixtureEvent({
    variant: 'king',
    playerIndex: 0,
    turnIndex: 0,
    trickIndex: 2,
    handBefore: [C.hK, C.h3],
    legalMoves: [C.hK, C.h3],
    chosenCard: C.hK,
    trickBefore: [],
    trickAfter: [C.hK],
    ledSuit: null,
    variantFields: kingPtNull,
    roundPlayHistory: [
      {
        roundIndex: 0,
        trickIndex: 2,
        turnIndex: 0,
        playerIndex: 0,
        card: C.hK,
      },
    ],
    scoreBefore: kingScore('no_king_hearts'),
  }),
  expected: {
    metricContext: {
      metricId: 'K02',
      applicable: true,
      reasonShortIncludes: 'Obrigação K♥',
    },
    variantFields: {
      contractId: 'no_king_hearts',
      mustPlayKingHeartsNow: true,
      kingHeartsPlayed: false,
    },
  },
};

export const K03_FIXTURE: FixtureCase = {
  fixtureId: 'K03',
  variant: 'king',
  primaryMetricId: 'K03',
  level: 'medium',
  tier: 'A',
  humanNote: 'Não puxar copas ao liderar — alternativa legal off-suit.',
  event: buildFixtureEvent({
    variant: 'king',
    playerIndex: 0,
    turnIndex: 0,
    trickIndex: 1,
    handBefore: [C.hK, C.h5, C.c2],
    legalMoves: [C.hK, C.h5, C.c2],
    chosenCard: C.c2,
    trickBefore: [],
    trickAfter: [C.c2],
    ledSuit: null,
    variantFields: kingPtNull,
    scoreBefore: kingScore('no_king_hearts'),
  }),
  expected: {
    metricContext: { metricId: 'K03', applicable: true },
    variantFields: { cannotLeadHearts: true },
  },
};

export const K01_FIXTURE: FixtureCase = {
  fixtureId: 'K01',
  variant: 'king',
  primaryMetricId: 'K01',
  level: 'medium',
  tier: 'A',
  humanNote: 'Descarte consciente — evitar damas no contrato no_queens.',
  event: buildFixtureEvent({
    variant: 'king',
    playerIndex: 0,
    turnIndex: 2,
    trickIndex: 4,
    handBefore: [C.dQ, C.sJ, C.c4],
    legalMoves: [C.dQ, C.sJ, C.c4],
    chosenCard: C.c4,
    trickBefore: [C.hA, C.h3],
    trickAfter: [C.hA, C.h3, C.c4],
    ledSuit: 'hearts',
    variantFields: kingPtNull,
    scoreBefore: kingScore('no_queens'),
  }),
  expected: {
    metricContext: { metricId: 'K01', applicable: true },
    variantFields: { penaltyMap: { no_queens: 40 } },
  },
};

export const K10_FIXTURE: FixtureCase = {
  fixtureId: 'K10',
  variant: 'king',
  primaryMetricId: 'K10',
  level: 'hard',
  tier: 'B',
  humanNote: 'Duas últimas — trick 11/12.',
  event: buildFixtureEvent({
    variant: 'king',
    playerIndex: 0,
    turnIndex: 0,
    trickIndex: 10,
    handBefore: [C.c2, C.c3, C.d4],
    legalMoves: [C.c2, C.c3, C.d4],
    chosenCard: C.c2,
    trickBefore: [],
    trickAfter: [C.c2],
    ledSuit: null,
    variantFields: kingPtNull,
    scoreBefore: kingScore('no_last_two', { trickNumber: 11 }),
  }),
  expected: {
    metricContext: { metricId: 'K10', applicable: true },
    variantFields: { isLastTwoPhase: true, trickNumberForLastTwo: 11 },
  },
};

export const KING_FIXTURES: FixtureCase[] = [
  K00_FIXTURE,
  K02_FIXTURE,
  K03_FIXTURE,
  K01_FIXTURE,
  K10_FIXTURE,
];
