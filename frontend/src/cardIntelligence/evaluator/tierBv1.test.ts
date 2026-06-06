import { encodeDecisionState } from '../encoder/encodeDecisionState';
import { deriveMoonThreatLevel } from '../encoder/heartsMoonThreat';
import { buildFixtureEvent, getFixtureById } from '../fixtures';
import { C } from '../fixtures/cards';
import { evaluateDecision } from './evaluateDecision';
import { evaluateMetric } from './metricEvaluators';
import { buildS25SyntheticContext } from './tierBHelpers';
import { EvaluatorContext } from './types';

function evaluateEvent(
  event: ReturnType<typeof buildFixtureEvent>,
  extra: Parameters<typeof evaluateDecision>[0] = {}
) {
  const encoded = encodeDecisionState({ event });
  return evaluateDecision({
    schemaVersion: '5.0.0',
    encodedState: encoded,
    chosenCard: event.chosenCard,
    legalMoves: event.legalMoves,
    evaluatorMode: 'strict',
    evaluationScope: 'p0',
    viewType: 'player',
    ...extra,
  });
}

function metricFromEvent(
  event: ReturnType<typeof buildFixtureEvent>,
  metricId: string,
  extra: Partial<EvaluatorContext> = {}
) {
  const encoded = encodeDecisionState({ event });
  const ctx: EvaluatorContext = {
    state: encoded,
    chosenCard: event.chosenCard,
    legalMoves: event.legalMoves,
    metricContext: encoded.metricContext,
    evaluatorMode: 'strict',
    ...extra,
  };
  return evaluateMetric(ctx, metricId);
}

const spadesSnapshot = (overrides: Record<string, unknown>) => ({
  raw: {
    variantState: {
      spades: {
        playerBids: [4, 3, 2, 3],
        team1Bid: 6,
        team2Bid: 8,
        team1Tricks: 5,
        team2Tricks: 6,
        team1Bags: 0,
        team2Bags: 0,
        spadesBroken: true,
        ...overrides,
      },
    },
  },
});

describe('evaluator Tier B v1 synthetics', () => {
  it('T1 S25 good — partner void injectado', () => {
    const event = getFixtureById('S25')!.event;
    const result = evaluateEvent(event, {
      fixtureId: 'S25',
      tierBTestContext: buildS25SyntheticContext({
        leadingTrump: true,
        partnerVoidInLedSuit: true,
      }),
    });
    const s25 = result.metricResults.find((m) => m.metricId === 'S25');
    expect(s25?.classification).toBe('good');
  });

  it('T2 S25 bad — partnerWasCutting', () => {
    const event = getFixtureById('S25')!.event;
    const result = evaluateEvent(event, {
      fixtureId: 'S25',
      tierBTestContext: buildS25SyntheticContext({ partnerWasCutting: true }),
    });
    expect(result.metricResults.find((m) => m.metricId === 'S25')?.classification).toBe(
      'bad'
    );
  });

  it('T3 S25 partial — sem sinal void', () => {
    const event = getFixtureById('S25')!.event;
    const result = evaluateEvent(event, {
      fixtureId: 'S25',
      tierBTestContext: buildS25SyntheticContext({ leadingTrump: true }),
    });
    expect(result.metricResults.find((m) => m.metricId === 'S25')?.classification).toBe(
      'partial'
    );
  });

  it('T4 SP14 good — ameaça activa', () => {
    const result = evaluateEvent(getFixtureById('SP14')!.event, { fixtureId: 'SP14' });
    expect(result.metricResults.find((m) => m.metricId === 'SP14')?.classification).toBe(
      'good'
    );
  });

  it('T5 SP14 bad — entrega vaza necessária', () => {
    const base = getFixtureById('SP14')!.event;
    const result = evaluateEvent({ ...base, chosenCard: C.c2 }, { fixtureId: 'SP14' });
    expect(result.metricResults.find((m) => m.metricId === 'SP14')?.classification).toBe(
      'bad'
    );
  });

  it('T6 SP14 partial — score adversário em falta', () => {
    const base = getFixtureById('SP14')!.event;
    const result = evaluateEvent(
      { ...base, scoreBefore: { raw: {} } },
      { fixtureId: 'SP14' }
    );
    expect(result.metricResults.find((m) => m.metricId === 'SP14')?.classification).toBe(
      'partial'
    );
  });

  it('T7 H10 good — moon likely + bloqueio', () => {
    const moonHistory = Array.from({ length: 8 }, (_, i) => ({
      roundIndex: 0,
      trickIndex: i,
      turnIndex: 0,
      playerIndex: 1,
      card: { ...C.h3, id: `h3-${i}` },
    }));
    const event = buildFixtureEvent({
      variant: 'hearts',
      playerIndex: 0,
      turnIndex: 2,
      trickIndex: 6,
      handBefore: [C.h2, C.c3],
      legalMoves: [C.h2, C.c3],
      chosenCard: C.c3,
      trickBefore: [C.h4, C.h5],
      trickAfter: [C.h4, C.h5, C.c3],
      ledSuit: 'hearts',
      variantFields: { heartsBroken: true, passDirection: null },
      roundPlayHistory: moonHistory,
    });
    expect(deriveMoonThreatLevel(true, moonHistory)).toBe('likely');
    const result = evaluateEvent(event, { fixtureId: 'H10' });
    expect(result.metricResults.find((m) => m.metricId === 'H10')?.classification).toBe(
      'good'
    );
  });

  it('T8 H10 partial — moon indisponível', () => {
    const result = evaluateEvent(getFixtureById('H10')!.event, { fixtureId: 'H10' });
    expect(result.metricResults.find((m) => m.metricId === 'H10')?.classification).toBe(
      'partial'
    );
  });

  it('T9 K10 good — golden', () => {
    const result = evaluateEvent(getFixtureById('K10')!.event, { fixtureId: 'K10' });
    expect(result.metricResults.find((m) => m.metricId === 'K10')?.classification).toBe(
      'good'
    );
  });

  it('T10 K10 bad — carta alta desnecessária trick 11', () => {
    const event = buildFixtureEvent({
      variant: 'king',
      playerIndex: 0,
      turnIndex: 0,
      trickIndex: 10,
      handBefore: [C.c2, C.cA],
      legalMoves: [C.c2, C.cA],
      chosenCard: C.cA,
      trickBefore: [],
      trickAfter: [C.cA],
      ledSuit: null,
      variantFields: {
        contractId: null,
        contractType: null,
        festaPhase: null,
        noTrump: false,
        syntheticMode: false,
      },
      scoreBefore: {
        raw: {
          variantState: {
            kingPt: { contract: 'no_last_two', trickNumber: 11 },
            rulesPresetId: 'king-pt-normal',
          },
        },
      },
      roundPlayHistory: [],
    });
    expect(
      metricFromEvent(event, 'K10', { fixtureId: 'K10' })?.classification
    ).toBe('bad');
  });

  it('T11 K10 medium — trade-off trick 12', () => {
    const event = buildFixtureEvent({
      variant: 'king',
      playerIndex: 2,
      turnIndex: 2,
      trickIndex: 10,
      handBefore: [C.c5, C.cK, C.cA],
      legalMoves: [C.c5, C.cK, C.cA],
      chosenCard: C.cK,
      trickBefore: [C.c2, C.c3],
      trickAfter: [C.c2, C.c3, C.cK],
      ledSuit: 'clubs',
      variantFields: {
        contractId: null,
        contractType: null,
        festaPhase: null,
        noTrump: false,
        syntheticMode: false,
      },
      scoreBefore: {
        raw: {
          variantState: {
            kingPt: { contract: 'no_last_two', trickNumber: 11 },
            rulesPresetId: 'king-pt-normal',
          },
        },
      },
      roundPlayHistory: [],
    });
    expect(
      metricFromEvent(event, 'K10', { fixtureId: 'K10' })?.classification
    ).toBe('medium');
  });

  it('T12 K10 partial — fora da fase duas últimas', () => {
    const event = buildFixtureEvent({
      variant: 'king',
      playerIndex: 0,
      turnIndex: 0,
      trickIndex: 5,
      handBefore: [C.c2, C.c3],
      legalMoves: [C.c2, C.c3],
      chosenCard: C.c2,
      trickBefore: [],
      trickAfter: [C.c2],
      ledSuit: null,
      variantFields: {
        contractId: null,
        contractType: null,
        festaPhase: null,
        noTrump: false,
        syntheticMode: false,
      },
      scoreBefore: {
        raw: {
          variantState: {
            kingPt: { contract: 'no_last_two', trickNumber: 6 },
            rulesPresetId: 'king-pt-normal',
          },
        },
      },
      roundPlayHistory: [],
    });
    expect(
      metricFromEvent(event, 'K10', { fixtureId: 'K10' })?.classification
    ).toBe('partial');
  });
});

describe('evaluator Tier B v1 SP14 pressure helper', () => {
  it('detects inactive threat when opponent need is zero', () => {
    const event = buildFixtureEvent({
      variant: 'spades',
      playerIndex: 0,
      turnIndex: 1,
      handBefore: [C.sA, C.c2],
      legalMoves: [C.sA, C.c2],
      chosenCard: C.sA,
      trickBefore: [C.hK],
      trickAfter: [C.hK, C.sA],
      ledSuit: 'hearts',
      variantFields: { playerBid: 4, teamBid: 6, spadesBroken: true },
      scoreBefore: spadesSnapshot({ team2Tricks: 8 }),
    });
    expect(
      metricFromEvent(event, 'SP14', { fixtureId: 'SP14' })?.classification
    ).toBe('partial');
  });
});
