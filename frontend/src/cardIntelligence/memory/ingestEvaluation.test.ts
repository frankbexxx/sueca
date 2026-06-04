import { encodeDecisionState } from '../encoder/encodeDecisionState';
import { evaluateDecision } from '../evaluator/evaluateDecision';
import { getFixtureById } from '../fixtures';
import { C } from '../fixtures/cards';
import {
  buildMemoryIngestRecord,
  ingestEvaluationResult,
} from './ingestEvaluation';
import { queryMemory } from './memoryQueries';
import {
  InMemoryMemoryStore,
  resetMemoryStoreForTests,
  setMemoryStoreForTests,
} from './memoryStore';
import { MemoryIngestRecord, MEMORY_SCHEMA_VERSION } from './types';

beforeEach(async () => {
  setMemoryStoreForTests(new InMemoryMemoryStore());
  await resetMemoryStoreForTests();
});

function baseRecord(
  overrides: Partial<MemoryIngestRecord>
): MemoryIngestRecord {
  return {
    schemaVersion: MEMORY_SCHEMA_VERSION,
    sourceEventId: 'evt-1',
    gameId: 'game-1',
    sessionId: 'session-1',
    timestamp: '2026-01-01T00:00:00.000Z',
    variant: 'spades',
    playerIndex: 0,
    subjectType: 'bot',
    subjectId: 'bot:medium:seat-0',
    playerType: 'ai',
    difficulty: 'medium',
    classification: 'good',
    partialEvaluation: false,
    confidence: 'high',
    reasonShort: 'ok',
    activatedMetricIds: ['SP09'],
    failedMetricIds: [],
    metricResults: [
      {
        metricId: 'SP09',
        classification: 'good',
        reasonShort: 'Bid cumprido — evitou bag.',
        betterAlternatives: [],
      },
    ],
    viewTypeUsed: 'player',
    loggerVersion: '3.0.0',
    encoderVersion: '4.0.0',
    evaluatorVersion: '5.0.0',
    metricCatalogVersion: '1.1',
    ...overrides,
  };
}

describe('ingestEvaluationResult', () => {
  it('3× SP09 bad → badRate 1', async () => {
    for (let i = 0; i < 3; i++) {
      await ingestEvaluationResult(
        baseRecord({
          sourceEventId: `evt-bad-${i}`,
          timestamp: `2026-01-01T00:00:0${i}.000Z`,
          classification: 'bad',
          metricResults: [
            {
              metricId: 'SP09',
              classification: 'bad',
              reasonShort: 'Bid cumprido — overtrick desnecessário (bag).',
              betterAlternatives: [C.c2],
            },
          ],
          failedMetricIds: ['SP09'],
        })
      );
    }
    const agg = await queryMemory({
      subjectId: 'bot:medium:seat-0',
      variant: 'spades',
      metricId: 'SP09',
      difficulty: 'medium',
    });
    expect(agg!.badCount).toBe(3);
    expect(agg!.badRate).toBe(1);
  });

  it('H10 Tier B → partialCount only on H10 metric', async () => {
    const fixture = getFixtureById('H10')!;
    const encoded = encodeDecisionState({ event: fixture.event });
    const evaluation = evaluateDecision({
      schemaVersion: '5.0.0',
      encodedState: encoded,
      chosenCard: fixture.event.chosenCard,
      legalMoves: fixture.event.legalMoves,
      fixtureId: 'H10',
      evaluatorMode: 'strict',
    });
    const record = buildMemoryIngestRecord({
      event: fixture.event,
      encoded,
      evaluation,
      subjectType: 'bot',
      subjectId: 'bot:medium:seat-0',
    });
    await ingestEvaluationResult(record);
    const h10 = await queryMemory({
      variant: 'hearts',
      metricId: 'H10',
      subjectId: 'bot:medium:seat-0',
    });
    expect(h10!.partialCount).toBe(1);
    expect(h10!.goodCount).toBe(0);
    expect(h10!.badCount).toBe(0);
  });

  it('unknown separate from partial', async () => {
    await ingestEvaluationResult(
      baseRecord({
        classification: 'unknown',
        metricResults: [
          {
            metricId: 'SP09',
            classification: 'unknown',
            reasonShort: 'Sem dados.',
            betterAlternatives: [],
          },
        ],
      })
    );
    await ingestEvaluationResult(
      baseRecord({
        sourceEventId: 'evt-partial',
        classification: 'partial',
        partialEvaluation: true,
        metricResults: [
          {
            metricId: 'H10',
            classification: 'partial',
            reasonShort: 'Parcial v0.',
            betterAlternatives: [],
          },
        ],
        variant: 'hearts',
      })
    );
    const unknownAgg = await queryMemory({ metricId: 'SP09' });
    const partialAgg = await queryMemory({ metricId: 'H10', variant: 'hearts' });
    expect(unknownAgg!.unknownCount).toBe(1);
    expect(partialAgg!.partialCount).toBe(1);
    expect(unknownAgg!.partialCount).toBe(0);
    expect(partialAgg!.unknownCount).toBe(0);
  });

  it('isolates subjectId and variant', async () => {
    await ingestEvaluationResult(
      baseRecord({ subjectId: 'bot:medium:seat-0', variant: 'spades' })
    );
    await ingestEvaluationResult(
      baseRecord({
        sourceEventId: 'evt-2',
        subjectId: 'bot:hard:seat-1',
        variant: 'sueca',
        metricResults: [
          {
            metricId: 'S08',
            classification: 'good',
            reasonShort: 'ok',
            betterAlternatives: [],
          },
        ],
        activatedMetricIds: ['S08'],
      })
    );
    const a = await queryMemory({
      subjectId: 'bot:medium:seat-0',
      variant: 'spades',
      metricId: 'SP09',
    });
    const b = await queryMemory({
      subjectId: 'bot:hard:seat-1',
      variant: 'sueca',
      metricId: 'S08',
    });
    expect(a!.goodCount).toBe(1);
    expect(b!.goodCount).toBe(1);
  });

  it('does not mutate DecisionEvaluationResult', async () => {
    const fixture = getFixtureById('SP09')!;
    const encoded = encodeDecisionState({ event: fixture.event });
    const evaluation = evaluateDecision({
      schemaVersion: '5.0.0',
      encodedState: encoded,
      chosenCard: fixture.event.chosenCard,
      legalMoves: fixture.event.legalMoves,
      fixtureId: 'SP09',
      evaluatorMode: 'strict',
    });
    const before = JSON.stringify(evaluation);
    const record = buildMemoryIngestRecord({
      event: fixture.event,
      encoded,
      evaluation,
    });
    await ingestEvaluationResult(record);
    expect(JSON.stringify(evaluation)).toBe(before);
  });

  it('trend worsening after 40 ingests', async () => {
    for (let i = 0; i < 20; i++) {
      await ingestEvaluationResult(
        baseRecord({
          sourceEventId: `g-${i}`,
          timestamp: `2026-01-01T00:${String(i).padStart(2, '0')}:00.000Z`,
          classification: 'good',
          metricResults: [
            {
              metricId: 'SP09',
              classification: 'good',
              reasonShort: 'ok',
              betterAlternatives: [],
            },
          ],
        })
      );
    }
    for (let i = 0; i < 20; i++) {
      await ingestEvaluationResult(
        baseRecord({
          sourceEventId: `b-${i}`,
          timestamp: `2026-01-02T00:${String(i).padStart(2, '0')}:00.000Z`,
          classification: 'bad',
          metricResults: [
            {
              metricId: 'SP09',
              classification: 'bad',
              reasonShort: 'bag',
              betterAlternatives: [],
            },
          ],
        })
      );
    }
    const agg = await queryMemory({ metricId: 'SP09' });
    expect(agg!.trend).toBe('worsening');
  });
});
