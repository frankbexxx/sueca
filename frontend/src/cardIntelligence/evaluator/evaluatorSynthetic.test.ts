import { encodeDecisionState } from '../encoder/encodeDecisionState';
import { buildFixtureEvent, getFixtureById } from '../fixtures';
import { C } from '../fixtures/cards';
import { evaluateDecision } from './evaluateDecision';

function evaluateEvent(event: ReturnType<typeof buildFixtureEvent>) {
  const encoded = encodeDecisionState({ event });
  return evaluateDecision({
    schemaVersion: '5.0.0',
    encodedState: encoded,
    chosenCard: event.chosenCard,
    legalMoves: event.legalMoves,
    evaluatorMode: 'strict',
    evaluationScope: 'p0',
    viewType: 'player',
  });
}

function evaluateFixtureId(id: string) {
  const fixture = getFixtureById(id)!;
  return evaluateDecision({
    schemaVersion: '5.0.0',
    encodedState: encodeDecisionState({ event: fixture.event }),
    chosenCard: fixture.event.chosenCard,
    legalMoves: fixture.event.legalMoves,
    fixtureId: id,
    evaluatorMode: 'strict',
    evaluationScope: 'p0',
    viewType: 'player',
  });
}

describe('evaluator synthetic cases', () => {
  it('T01 illegal → bad', () => {
    const base = getFixtureById('T01')!.event;
    const result = evaluateEvent({ ...base, chosenCard: C.h5 });
    expect(result.classification).toBe('bad');
  });

  it('K02 hide K♥ → bad', () => {
    const base = getFixtureById('K02')!.event;
    const result = evaluateEvent({
      ...base,
      chosenCard: C.h3,
      roundPlayHistory: [],
      trickAfter: [C.h3],
    });
    expect(result.classification).toBe('bad');
  });

  it('SP09 bag with A♠ → bad', () => {
    const base = getFixtureById('SP09')!.event;
    const result = evaluateEvent({
      ...base,
      handBefore: [C.sA, C.c2],
      legalMoves: [C.sA, C.c2],
      chosenCard: C.sA,
      trickAfter: [C.h2, C.h4, C.h5, C.sA],
    });
    expect(result.classification).toBe('bad');
  });

  it('S16 manilha 7♦ → bad', () => {
    const base = getFixtureById('S16')!.event;
    const result = evaluateEvent({ ...base, chosenCard: C.sevenD });
    expect(result.classification).toBe('bad');
  });

  it('S08 overkill A♦ → medium', () => {
    const base = getFixtureById('S08')!.event;
    const result = evaluateEvent({
      ...base,
      trickBefore: [C.d2, C.d4],
      trickAfter: [C.d2, C.d4, C.dA],
      ledSuit: 'diamonds',
      chosenCard: C.dA,
    });
    expect(result.classification).toBe('medium');
  });

  it('K03 good on fixture', () => {
    expect(evaluateFixtureId('K03').classification).toBe('good');
  });

  it('H13 good on fixture', () => {
    expect(evaluateFixtureId('H13').classification).toBe('good');
  });
});

describe('evaluator synthetic K12 nulos', () => {
  it('wins trick in nulos → bad', () => {
    const event = buildFixtureEvent({
      variant: 'king',
      playerIndex: 1,
      turnIndex: 1,
      trickIndex: 3,
      handBefore: [C.cA, C.c3],
      legalMoves: [C.cA, C.c3],
      chosenCard: C.cA,
      trickBefore: [C.c2],
      trickAfter: [C.c2, C.cA],
      ledSuit: 'clubs',
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
      roundPlayHistory: [],
    });
    const result = evaluateEvent(event);
    expect(result.failedMetricIds.length).toBeGreaterThan(0);
    expect(result.classification).toBe('bad');
  });
});
