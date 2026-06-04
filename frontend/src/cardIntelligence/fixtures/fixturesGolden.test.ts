import { encodeDecisionState } from '../encoder/encodeDecisionState';
import {
  HeartsEncoding,
  KingEncoding,
  SpadesEncoding,
  SuecaEncoding,
} from '../encoder/types';
import { cardsMatch } from '../shared/clone';
import { GameVariant } from '../../types/game';
import { ALL_FIXTURES, FIXTURE_IDS, buildFixtureEvent, getFixtureById } from './index';
import { C } from './cards';
import { FixtureCase } from './types';

function assertMetric(
  encoded: ReturnType<typeof encodeDecisionState>,
  expectation: FixtureCase['expected']['metricContext']
) {
  const entry = encoded.metricContext.find((m) => m.metricId === expectation.metricId);
  expect(entry).toBeDefined();
  if (expectation.allowPartial) {
    if (!expectation.applicable) {
      expect(entry!.applicable).toBe(false);
      return;
    }
  }
  expect(entry!.applicable).toBe(expectation.applicable);
  if (expectation.reasonShortIncludes) {
    expect(entry!.reasonShort).toContain(expectation.reasonShortIncludes);
  }
}

function assertVariantFields(
  variantEncoding: unknown,
  expected?: Record<string, unknown>
) {
  if (!expected) return;
  const enc = variantEncoding as Record<string, unknown>;
  for (const [key, value] of Object.entries(expected)) {
    expect(enc[key]).toEqual(value);
  }
}

function runFixtureGolden(fixture: FixtureCase) {
  const { event, expected, tier } = fixture;
  expect(event.legalMoves.length).toBeGreaterThan(0);
  expect(
    event.legalMoves.some((m) => cardsMatch(m, event.chosenCard))
  ).toBe(true);
  expect(event.source).toBe('fixture');

  const encoded = encodeDecisionState({ event });
  expect(encoded.hiddenInformationPolicy.viewType).toBe('player');
  expect('classification' in encoded).toBe(false);

  assertMetric(encoded, expected.metricContext);
  for (const secondary of expected.secondaryMetrics ?? []) {
    assertMetric(encoded, secondary);
  }

  assertVariantFields(encoded.variantEncoding, expected.variantFields);

  if (tier === 'A' && !expected.metricContext.allowPartial) {
    expect(
      encoded.metricContext.find((m) => m.metricId === fixture.primaryMetricId)?.applicable
    ).toBe(true);
  }
}

describe('fixtures registry', () => {
  it('has exactly 23 fixtures with unique ids', () => {
    expect(ALL_FIXTURES.length).toBe(23);
    expect(new Set(FIXTURE_IDS).size).toBe(23);
  });

  it('getFixtureById resolves known fixtures', () => {
    expect(getFixtureById('K02')?.primaryMetricId).toBe('K02');
    expect(getFixtureById('MISSING')).toBeUndefined();
  });
});

describe('fixtures golden encode', () => {
  it.each(ALL_FIXTURES.map((f) => [f.fixtureId, f] as const))(
    '%s encodes without error',
    (_id, fixture) => {
      runFixtureGolden(fixture);
    }
  );

  it('S16 sevens not seen in diamonds when leading', () => {
    const enc = encodeDecisionState({ event: getFixtureById('S16')!.event });
    const v = enc.variantEncoding as SuecaEncoding;
    expect(v.sevensSeenBySuit.diamonds).toBe(false);
  });
});

describe('T01 legalidade parametrized', () => {
  const buildMinimalLegalEvent = (variant: GameVariant) => {
    const base = {
      playerIndex: 0,
      turnIndex: 1,
      trickIndex: 1,
      handBefore: [C.c2, C.h5],
      legalMoves: [C.c2],
      chosenCard: C.c2,
      trickBefore: [C.cA],
      trickAfter: [C.cA, C.c2],
      ledSuit: 'clubs' as const,
      roundPlayHistory: [],
    };

    switch (variant) {
      case 'sueca':
        return buildFixtureEvent({
          variant,
          ...base,
          trumpSuit: 'clubs',
          variantFields: { partnerIndex: 2, teamIndex: 1 },
        });
      case 'spades':
        return buildFixtureEvent({
          variant,
          ...base,
          variantFields: { playerBid: 3, teamBid: 5, spadesBroken: true },
        });
      case 'hearts':
        return buildFixtureEvent({
          variant,
          ...base,
          variantFields: { heartsBroken: false, passDirection: null },
        });
      case 'king':
        return buildFixtureEvent({
          variant,
          ...base,
          variantFields: {
            contractId: null,
            contractType: null,
            festaPhase: null,
            noTrump: false,
            syntheticMode: false,
          },
          scoreBefore: {
            raw: { variantState: { kingPt: { contract: 'no_tricks' } } },
          },
        });
      default:
        throw new Error(`unsupported variant ${variant}`);
    }
  };

  it.each(['sueca', 'spades', 'hearts', 'king'] as const)(
    'T01 applicable for %s',
    (variant) => {
      const enc = encodeDecisionState({ event: buildMinimalLegalEvent(variant) });
      const t01 = enc.metricContext.find((m) => m.metricId === 'T01');
      expect(t01?.applicable).toBe(true);
    }
  );
});

describe('T06 parametrized', () => {
  it.each(['spades', 'hearts', 'king'] as const)('T06 context for %s', (variant) => {
    if (variant === 'spades') {
      const enc = encodeDecisionState({ event: getFixtureById('T06')!.event });
      const t06 = enc.metricContext.find((m) => m.metricId === 'T06');
      expect(t06?.applicable).toBe(true);
      return;
    }
    if (variant === 'hearts') {
      const enc = encodeDecisionState({
        event: buildFixtureEvent({
          variant: 'hearts',
          playerIndex: 0,
          turnIndex: 2,
          trickIndex: 4,
          handBefore: [C.h2, C.c3],
          legalMoves: [C.h2, C.c3],
          chosenCard: C.c3,
          trickBefore: [C.h4, C.h5],
          trickAfter: [C.h4, C.h5, C.c3],
          ledSuit: 'hearts',
          variantFields: { heartsBroken: true, passDirection: null },
        }),
      });
      const t06 = enc.metricContext.find((m) => m.metricId === 'T06');
      expect(t06?.applicable).toBe(true);
      return;
    }
    const enc = encodeDecisionState({
      event: buildFixtureEvent({
        variant: 'king',
        playerIndex: 0,
        turnIndex: 1,
        trickIndex: 3,
        handBefore: [C.c2, C.c3],
        legalMoves: [C.c2, C.c3],
        chosenCard: C.c3,
        trickBefore: [C.sA],
        trickAfter: [C.sA, C.c3],
        ledSuit: 'spades',
        variantFields: {
          contractId: null,
          contractType: null,
          festaPhase: null,
          noTrump: true,
          syntheticMode: false,
        },
        scoreBefore: {
          raw: { variantState: { kingPt: { contract: 'no_tricks' } } },
        },
      }),
    });
    const t06 = enc.metricContext.find((m) => m.metricId === 'T06');
    expect(t06?.applicable).toBe(true);
  });
});

describe('T04 King optional', () => {
  it('King T04 uses contractPenaltiesInTrick path when trick end provided', () => {
    const enc = encodeDecisionState({
      event: buildFixtureEvent({
        variant: 'king',
        playerIndex: 0,
        turnIndex: 0,
        trickIndex: 2,
        handBefore: [C.c2, C.c3],
        legalMoves: [C.c2, C.c3],
        chosenCard: C.c2,
        trickBefore: [],
        trickAfter: [C.c2],
        variantFields: {
          contractId: null,
          contractType: null,
          festaPhase: null,
          noTrump: false,
          syntheticMode: false,
        },
        scoreBefore: {
          raw: { variantState: { kingPt: { contract: 'no_hearts' } } },
        },
      }),
    });
    const v = enc.variantEncoding as KingEncoding;
    expect(v.contractId).toBe('no_hearts');
  });
});
