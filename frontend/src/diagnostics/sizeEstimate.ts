import { DiagnosticMatchLog } from './types';

/** Approximate serialized size of a representative completed log × N. */
export function estimateDiagnosticLogsSerializedSize(
  sample: DiagnosticMatchLog,
  count: number
): number {
  const logs = Array.from({ length: count }, (_, i) => ({
    ...sample,
    logId: `est-${i.toString(16).padStart(8, '0')}`,
    startedAt: new Date(Date.UTC(2026, 0, 1) + i * 3600_000).toISOString(),
    completedAt: new Date(Date.UTC(2026, 0, 1) + i * 3600_000 + 1800_000).toISOString()
  }));
  return JSON.stringify({
    kind: 'suecao-diagnostic-match-logs',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    logCount: count,
    logs
  }).length;
}

export function buildRepresentativeKingDiagnosticSample(): DiagnosticMatchLog {
  const hands = [
    [
      { suit: 'hearts' as const, rank: 'A' as const },
      { suit: 'spades' as const, rank: 'K' as const }
    ],
    [
      { suit: 'diamonds' as const, rank: '7' as const },
      { suit: 'clubs' as const, rank: 'Q' as const }
    ],
    [
      { suit: 'hearts' as const, rank: 'K' as const },
      { suit: 'spades' as const, rank: 'A' as const }
    ],
    [
      { suit: 'clubs' as const, rank: 'A' as const },
      { suit: 'diamonds' as const, rank: 'K' as const }
    ]
  ];
  return {
    schemaVersion: 1,
    logId: 'sample-king',
    startedAt: '2026-09-26T12:00:00.000Z',
    completedAt: '2026-09-26T12:45:00.000Z',
    buildVersion: 'abcdef0',
    gameVariant: 'king',
    rulesPresetId: 'king-pt-normal',
    difficulty: 'hard',
    rng: { algorithm: 'math-random', seed: 'deadbeefcafebabe', deterministic: false },
    players: [
      { index: 0, name: 'Player 1', type: 'human' },
      { index: 1, name: 'Bot Norte', type: 'ai' },
      { index: 2, name: 'Bot Este', type: 'ai' },
      { index: 3, name: 'Bot Oeste', type: 'ai' }
    ],
    localPlayerIndex: 0,
    initialHands: hands,
    events: [
      {
        seq: 1,
        type: 'MATCH_STARTED',
        at: '2026-09-26T12:00:00.000Z',
        payload: {
          gameVariant: 'king',
          rulesPresetId: 'king-pt-normal',
          difficulty: 'hard'
        }
      },
      {
        seq: 2,
        type: 'DEAL_COMPLETED',
        at: '2026-09-26T12:00:01.000Z',
        payload: { hands, trumpSuit: null }
      },
      {
        seq: 3,
        type: 'AUCTION_ACTION',
        at: '2026-09-26T12:01:00.000Z',
        payload: { seat: 0, action: 'bid', bidType: 'positivas', bidAmount: 3 }
      },
      {
        seq: 4,
        type: 'FESTA_DECISION',
        at: '2026-09-26T12:02:00.000Z',
        payload: { action: 'accept_contract', seat: 0 }
      },
      {
        seq: 5,
        type: 'AI_DECISION',
        at: '2026-09-26T12:03:00.000Z',
        payload: {
          seat: 1,
          difficulty: 'hard',
          legalCards: [
            { suit: 'diamonds', rank: '7' },
            { suit: 'clubs', rank: 'Q' }
          ],
          chosenCard: { suit: 'clubs', rank: 'Q' },
          trickIndex: 0,
          gameVariant: 'king',
          rulesPresetId: 'king-pt-normal'
        }
      },
      {
        seq: 6,
        type: 'CARD_PLAYED',
        at: '2026-09-26T12:03:00.050Z',
        payload: {
          seat: 1,
          card: { suit: 'clubs', rank: 'Q' },
          trickIndex: 0,
          playerType: 'ai',
          aiDecisionSeq: 5
        }
      },
      {
        seq: 7,
        type: 'MATCH_COMPLETED',
        at: '2026-09-26T12:45:00.000Z',
        payload: {
          playerWon: true,
          winner: 0,
          finalScores: { players: [120, 80, 90, 70] },
          summary: 'Player 1 · 120/80/90/70'
        }
      }
    ],
    finalResult: {
      playerWon: true,
      winner: 0,
      finalScores: { players: [120, 80, 90, 70] },
      summary: 'Player 1 · 120/80/90/70'
    },
    replayLevel: 1
  };
}
