import { Card } from '../../../types/game';
import { ENCODED_SCHEMA_VERSION } from '../../encoder/types';
import { EVALUATOR_SCHEMA_VERSION } from '../../evaluator/types';
import { RoundPlayEntry } from '../../shared/types/logEvents';
import { buildDebugReportDocument, buildPlaySection } from './documentHelpers';
import { formatHumanReport } from './formatHumanReport';
import { DEBUG_REPORT_SCHEMA_VERSION, DebugReportDocument } from './types';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

function minimalDoc(
  evaluation?: DebugReportDocument['sections']['evaluation']
): DebugReportDocument {
  return {
    meta: {
      schemaVersion: DEBUG_REPORT_SCHEMA_VERSION,
      kind: 'event',
      source: 'synthetic_test',
      generatedAt: '2026-06-06T00:00:00.000Z',
      offlineEvaluation: true,
      viewTypeUsed: 'player',
      eventId: 'evt-1',
    },
    summary: {
      classification: 'medium',
      reasonShort: 'test',
      activatedMetricIds: [],
      failedMetricIds: [],
      topIssues: [],
    },
    sections: {
      evaluation,
      metricResultsLine: '(none applicable)',
    },
    warnings: [],
    text: '',
  };
}

describe('formatHumanReport — alternatives', () => {
  it('shows better and equivalent alternatives when present', () => {
    const doc = minimalDoc({
      classification: 'medium',
      reasonShort: 'test',
      betterAlternatives: [makeCard('7', 'spades')],
      equivalentAlternatives: [makeCard('4', 'diamonds'), makeCard('5', 'diamonds')],
    });
    const text = formatHumanReport(doc);
    expect(text).toContain('--- Alternatives ---');
    expect(text).toContain('better: 7s');
    expect(text).toContain('equivalent: 4d, 5d');
  });

  it('shows only better line when no equivalent alternatives', () => {
    const doc = minimalDoc({
      classification: 'bad',
      reasonShort: 'test',
      betterAlternatives: [makeCard('2', 'clubs')],
      equivalentAlternatives: [],
    });
    const text = formatHumanReport(doc);
    expect(text).toContain('--- Alternatives ---');
    expect(text).toContain('better: 2c');
    expect(text).not.toMatch(/^equivalent:/m);
  });

  it('omits alternatives section when arrays are empty', () => {
    const doc = minimalDoc({
      classification: 'good',
      reasonShort: 'test',
      betterAlternatives: [],
      equivalentAlternatives: [],
    });
    const text = formatHumanReport(doc);
    expect(text).not.toContain('--- Alternatives ---');
  });

  it('omits alternatives section when evaluation section is absent', () => {
    const text = formatHumanReport(minimalDoc(undefined));
    expect(text).not.toContain('--- Alternatives ---');
  });
});

function makeEncodedPartial(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: ENCODED_SCHEMA_VERSION,
    sourceEventId: 'evt-1',
    gameId: 'g1',
    sessionId: 's1',
    timestamp: '2026-06-06T00:00:00.000Z',
    variant: 'sueca' as const,
    mode: null,
    contractId: null,
    phase: 'play' as const,
    playerIndex: 0,
    playerType: 'bot' as const,
    difficulty: 'medium' as const,
    viewType: 'player' as const,
    encodeMode: 'post_decision' as const,
    roundIndex: 0,
    trickIndex: 2,
    turnIndex: 5,
    hand: [makeCard('7', 'spades'), makeCard('2', 'clubs')],
    legalMoves: [makeCard('7', 'spades'), makeCard('2', 'clubs')],
    chosenCard: makeCard('7', 'spades'),
    currentTrick: [makeCard('K', 'spades')],
    trickPosition: 1,
    ledSuit: 'spades' as const,
    trumpSuit: 'clubs' as const,
    currentWinner: 2,
    visiblePlayedCards: [
      {
        roundIndex: 0,
        trickIndex: 1,
        turnIndex: 3,
        playerIndex: 1,
        card: makeCard('5', 'hearts'),
      },
    ] as RoundPlayEntry[],
    importantCardsSeen: {
      acesBySuit: { hearts: false, diamonds: false, clubs: false, spades: false },
      sevensBySuit: { hearts: false, diamonds: false, clubs: false, spades: false },
      trumpSeenCount: 0,
      queenSpadesPlayed: false,
      kingHeartsPlayed: false,
    },
    scoreContext: { raw: {}, teamIndex: 1 },
    riskContext: { cutRisk: null, avoidBagMode: null },
    memoryContext: { schemaVersion: '6.0.0-stub' as const, aggregates: [] },
    metricContext: [],
    availableInformation: { known: {}, inferred: {}, hidden: [] },
    hiddenInformationPolicy: {
      viewType: 'player' as const,
      excludedFields: [],
      inferenceAllowed: true,
      sourceOfTruth: 'log' as const,
    },
    variantEncoding: {
      partnerIndex: 2,
      teamIndex: 1,
      acesSeenBySuit: { hearts: false, diamonds: false, clubs: false, spades: false },
      sevensSeenBySuit: { hearts: false, diamonds: false, clubs: false, spades: false },
      trumpSeenCount: 0,
      partnerWinning: null,
      canWinCheaply: null,
      canCutWithLowestTrump: null,
      cutRisk: null,
    },
    ...overrides,
  };
}

describe('formatHumanReport — play context', () => {
  it('shows hand, legal moves, trick, suits, position and history', () => {
    const doc = minimalDoc(undefined);
    doc.sections.play = buildPlaySection(undefined, makeEncodedPartial() as never);
    const text = formatHumanReport(doc);
    expect(text).toContain('hand: 7s, 2c');
    expect(text).toContain('legalMoves: 7s, 2c');
    expect(text).toContain('currentTrick: Ks');
    expect(text).toContain('ledSuit: spades');
    expect(text).toContain('trumpSuit: clubs');
    expect(text).toContain('trickPosition: 1');
    expect(text).toContain('visiblePlayedCards: P1:5h');
    expect(text).toContain('trickIndex: 2');
  });

  it('omits empty optional play lines', () => {
    const doc = minimalDoc(undefined);
    doc.sections.play = {
      chosenCard: '7s',
      legalMovesCount: 0,
      trickIndex: null,
    };
    const text = formatHumanReport(doc);
    expect(text).toContain('chosen: 7s');
    expect(text).not.toMatch(/^hand:/m);
    expect(text).not.toMatch(/^legalMoves:/m);
    expect(text).not.toMatch(/^currentTrick:/m);
    expect(text).not.toMatch(/^ledSuit:/m);
    expect(text).not.toMatch(/^trumpSuit:/m);
    expect(text).not.toMatch(/^visiblePlayedCards:/m);
  });
});

describe('buildDebugReportDocument — play context transport', () => {
  it('populates play section from encoded state', () => {
    const doc = buildDebugReportDocument({
      kind: 'event',
      source: 'synthetic_test',
      viewTypeUsed: 'player',
      encoded: makeEncodedPartial() as never,
      rawWarnings: [],
    });
    expect(doc.sections.play?.hand).toHaveLength(2);
    expect(doc.sections.play?.legalMoves).toHaveLength(2);
    expect(doc.sections.play?.currentTrick).toHaveLength(1);
    expect(doc.text).toContain('hand: 7s, 2c');
    expect(doc.text).toContain('legalMoves: 7s, 2c');
  });
});

describe('buildDebugReportDocument — alternatives transport', () => {
  it('copies betterAlternatives and equivalentAlternatives into sections.evaluation', () => {
    const doc = buildDebugReportDocument({
      kind: 'event',
      source: 'synthetic_test',
      viewTypeUsed: 'player',
      evaluation: {
        schemaVersion: EVALUATOR_SCHEMA_VERSION,
        evaluatorVersion: EVALUATOR_SCHEMA_VERSION,
        classification: 'medium',
        confidence: 'high',
        reasonShort: 'mock',
        metricResults: [],
        activatedMetricIds: [],
        failedMetricIds: [],
        betterAlternatives: [makeCard('A', 'hearts')],
        equivalentAlternatives: [makeCard('3', 'clubs')],
        missingFields: [],
        evaluatorWarnings: [],
        viewTypeUsed: 'player',
        evaluatedAt: '2026-06-06T00:00:00.000Z',
      },
      rawWarnings: [],
    });
    expect(doc.sections.evaluation?.betterAlternatives).toHaveLength(1);
    expect(doc.sections.evaluation?.equivalentAlternatives).toHaveLength(1);
    expect(doc.text).toContain('--- Alternatives ---');
    expect(doc.text).toContain('better: Ah');
    expect(doc.text).toContain('equivalent: 3c');
  });
});
