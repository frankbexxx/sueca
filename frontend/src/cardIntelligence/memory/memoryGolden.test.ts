import { encodeDecisionState } from '../encoder/encodeDecisionState';
import { evaluateDecision } from '../evaluator/evaluateDecision';
import { getFixtureById } from '../fixtures';
import { buildMemoryIngestRecord, ingestEvaluationResult } from './ingestEvaluation';
import { queryMemory } from './memoryQueries';
import {
  InMemoryMemoryStore,
  resetMemoryStoreForTests,
  setMemoryStoreForTests,
} from './memoryStore';

beforeEach(async () => {
  setMemoryStoreForTests(new InMemoryMemoryStore());
  await resetMemoryStoreForTests();
});

describe('memory golden pipeline', () => {
  it('SP09 fixture → goodCount 1 on SP09 aggregate', async () => {
    const fixture = getFixtureById('SP09')!;
    const encoded = encodeDecisionState({ event: fixture.event });
    const evaluation = evaluateDecision({
      schemaVersion: '5.0.0',
      encodedState: encoded,
      chosenCard: fixture.event.chosenCard,
      legalMoves: fixture.event.legalMoves,
      fixtureId: 'SP09',
      evaluatorMode: 'strict',
      evaluationScope: 'p0',
      viewType: 'player',
    });
    const record = buildMemoryIngestRecord({
      event: fixture.event,
      encoded,
      evaluation,
      subjectType: 'bot',
      subjectId: 'bot:medium:seat-0',
    });
    await ingestEvaluationResult(record);

    const sp09GoodEntries = evaluation.metricResults.filter(
      (m) => m.metricId === 'SP09' && m.classification === 'good'
    ).length;

    const agg = await queryMemory({
      subjectType: 'bot',
      subjectId: 'bot:medium:seat-0',
      variant: 'spades',
      metricId: 'SP09',
      difficulty: null,
    });

    expect(agg).not.toBeNull();
    expect(agg!.goodCount).toBe(sp09GoodEntries);
    expect(agg!.badRate).toBe(0);
    expect(agg!.evaluatorVersion).toBe('5.0.0');
  });
});
