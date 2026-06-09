import { encodeDecisionState } from '../encoder/encodeDecisionState';
import { C } from '../fixtures/cards';
import { getFixtureById } from '../fixtures';
import { evaluateDecision } from './evaluateDecision';
import { evaluateHypotheticalMove } from './evaluateHypotheticalMove';
import { mapLegalMoveRisks } from './mapLegalMoveRisks';
import { EVALUATOR_SCHEMA_VERSION } from './types';

describe('evaluateHypotheticalMove', () => {
  it('pre_decision + legal hypothetical card does not return unknown for encodeMode', () => {
    const fixture = getFixtureById('K03')!;
    const encoded = encodeDecisionState({
      event: { ...fixture.event, chosenCard: null },
      encodeMode: 'pre_decision',
    });
    const result = evaluateHypotheticalMove({
      encodedState: encoded,
      hypotheticalCard: C.c2,
      legalMoves: fixture.event.legalMoves,
      fixtureId: 'K03',
    });
    expect(result.classification).not.toBe('unknown');
    expect(result.missingFields).not.toContain('encodeMode');
    expect(result.classification).toBe('good');
  });

  it('post_decision + chosenCard null stays unknown via evaluateDecision', () => {
    const fixture = getFixtureById('K03')!;
    const encoded = encodeDecisionState({ event: fixture.event });
    const result = evaluateDecision({
      schemaVersion: EVALUATOR_SCHEMA_VERSION,
      encodedState: encoded,
      chosenCard: null,
      legalMoves: fixture.event.legalMoves,
    });
    expect(result.classification).toBe('unknown');
    expect(result.missingFields).toContain('chosenCard');
  });

  it('illegal hypothetical card returns bad explicitly', () => {
    const fixture = getFixtureById('K03')!;
    const encoded = encodeDecisionState({
      event: { ...fixture.event, chosenCard: null },
      encodeMode: 'pre_decision',
    });
    const result = evaluateHypotheticalMove({
      encodedState: encoded,
      hypotheticalCard: C.sA,
      legalMoves: fixture.event.legalMoves,
    });
    expect(result.classification).toBe('bad');
    expect(result.reasonShort).toMatch(/ilegal/i);
    expect(result.failedMetricIds).toContain('T01');
  });

  it('rejects post_decision state', () => {
    const fixture = getFixtureById('K03')!;
    const encoded = encodeDecisionState({ event: fixture.event });
    const result = evaluateHypotheticalMove({
      encodedState: encoded,
      hypotheticalCard: C.c2,
      legalMoves: fixture.event.legalMoves,
    });
    expect(result.classification).toBe('unknown');
    expect(result.missingFields).toContain('encodeMode');
  });
});

describe('mapLegalMoveRisks', () => {
  function k03PreDecision() {
    const fixture = getFixtureById('K03')!;
    const legalMoves = [...fixture.event.legalMoves];
    const encoded = encodeDecisionState({
      event: { ...fixture.event, chosenCard: null },
      encodeMode: 'pre_decision',
    });
    return { encoded, legalMoves, fixture };
  }

  it('returns one entry per legal move preserving order', () => {
    const { encoded, legalMoves } = k03PreDecision();
    const map = mapLegalMoveRisks({ encodedState: encoded, legalMoves });
    expect(map.entries).toHaveLength(legalMoves.length);
    map.entries.forEach((entry, index) => {
      expect(entry.card).toEqual(legalMoves[index]);
    });
  });

  it('shows distinct classifications for K03 legal moves', () => {
    const { encoded, legalMoves } = k03PreDecision();
    const map = mapLegalMoveRisks({
      encodedState: encoded,
      legalMoves,
      fixtureId: 'K03',
    });
    const classes = new Set(map.entries.map((e) => e.classification));
    expect(classes.size).toBeGreaterThan(1);
    const heartEntries = map.entries.filter((e) => e.card.suit === 'hearts');
    const offHeart = map.entries.find((e) => e.card.suit === 'clubs');
    expect(heartEntries.every((e) => e.classification === 'bad')).toBe(true);
    expect(offHeart?.classification).toBe('good');
  });

  it('sortedByRisk ranks worst first and exposes best/worst entries', () => {
    const { encoded, legalMoves } = k03PreDecision();
    const map = mapLegalMoveRisks({ encodedState: encoded, legalMoves });
    expect(map.sortedByRisk[0].riskRank).toBeGreaterThanOrEqual(
      map.sortedByRisk[map.sortedByRisk.length - 1].riskRank
    );
    expect(map.worstEntry?.riskRank).toBe(map.sortedByRisk[0].riskRank);
    expect(map.bestEntry?.classification).toBe('good');
    expect(map.worstEntry?.classification).toBe('bad');
  });

  it('entries preserve legalMoves order; sortedByRisk is risk-sorted', () => {
    const { encoded, legalMoves } = k03PreDecision();
    const map = mapLegalMoveRisks({ encodedState: encoded, legalMoves });
    expect(map.entries.map((e) => e.card.id)).toEqual(
      legalMoves.map((c) => c.id)
    );
    for (let i = 1; i < map.sortedByRisk.length; i += 1) {
      expect(map.sortedByRisk[i - 1].riskRank).toBeGreaterThanOrEqual(
        map.sortedByRisk[i].riskRank
      );
    }
  });

  it('empty legalMoves returns empty map with warning', () => {
    const { encoded } = k03PreDecision();
    const map = mapLegalMoveRisks({ encodedState: encoded, legalMoves: [] });
    expect(map.entries).toHaveLength(0);
    expect(map.warnings).toContain('legalMoves is empty');
  });

  it('post_decision encoded state returns empty map with warning', () => {
    const fixture = getFixtureById('K03')!;
    const encoded = encodeDecisionState({ event: fixture.event });
    const map = mapLegalMoveRisks({
      encodedState: encoded,
      legalMoves: fixture.event.legalMoves,
    });
    expect(map.entries).toHaveLength(0);
    expect(map.warnings[0]).toMatch(/pre_decision/);
  });
});

describe('evaluateDecision post_decision regression', () => {
  it('post_decision fixture K03 unchanged', () => {
    const fixture = getFixtureById('K03')!;
    const encoded = encodeDecisionState({ event: fixture.event });
    const result = evaluateDecision({
      schemaVersion: EVALUATOR_SCHEMA_VERSION,
      encodedState: encoded,
      chosenCard: fixture.event.chosenCard,
      legalMoves: fixture.event.legalMoves,
      fixtureId: 'K03',
    });
    expect(result.classification).toBe('good');
  });

  it('post_decision rejects pre_decision encode mode', () => {
    const fixture = getFixtureById('K03')!;
    const encoded = encodeDecisionState({
      event: fixture.event,
      encodeMode: 'pre_decision',
    });
    const result = evaluateDecision({
      schemaVersion: EVALUATOR_SCHEMA_VERSION,
      encodedState: encoded,
      chosenCard: fixture.event.chosenCard,
      legalMoves: fixture.event.legalMoves,
    });
    expect(result.classification).toBe('unknown');
    expect(result.missingFields).toContain('encodeMode');
  });
});
