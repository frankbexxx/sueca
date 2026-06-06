import { encodeDecisionState } from '../encoder/encodeDecisionState';
import { ALL_FIXTURES, getFixtureById } from '../fixtures';
import { evaluateDecision } from './evaluateDecision';
import { TIER_B_FIXTURE_IDS } from './aggregateResults';
import { EvaluationClassification } from './types';

const TIER_B_EXPECTED: Record<string, EvaluationClassification> = {
  K10: 'good',
  SP14: 'good',
  H10: 'partial',
  S25: 'partial',
};

function evaluateFixture(fixtureId: string) {
  const fixture = getFixtureById(fixtureId)!;
  const encoded = encodeDecisionState({ event: fixture.event });
  return evaluateDecision({
    schemaVersion: '5.0.0',
    encodedState: encoded,
    chosenCard: fixture.event.chosenCard,
    legalMoves: fixture.event.legalMoves,
    fixtureId: fixture.fixtureId,
    evaluatorMode: 'strict',
    evaluationScope: 'p0',
    viewType: 'player',
  });
}

describe('evaluator golden fixtures', () => {
  it.each(ALL_FIXTURES.filter((f) => f.tier === 'A').map((f) => [f.fixtureId, f] as const))(
    'Tier A %s → good',
    (id) => {
      const result = evaluateFixture(id);
      expect(result.classification).toBe('good');
    }
  );

  it.each(TIER_B_FIXTURE_IDS.map((id) => [id] as const))(
    'Tier B %s → expected v1',
    (id) => {
      const result = evaluateFixture(id);
      expect(result.classification).toBe(TIER_B_EXPECTED[id]);
    }
  );

  it('does not include classification in encoded state', () => {
    const enc = encodeDecisionState({ event: getFixtureById('K02')!.event });
    expect('classification' in enc).toBe(false);
  });
});
