import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_DIAGNOSTIC_MATCH_LOGS,
  anonymizeDiagnosticLog,
  buildDiagnosticExportFilename,
  buildRepresentativeKingDiagnosticSample,
  clearDiagnosticMatchLogsForTests,
  completeDiagnosticMatch,
  createMulberry32,
  estimateDiagnosticLogsSerializedSize,
  exportDiagnosticMatchLogs,
  findAiDecision,
  getActiveDiagnosticLog,
  loadDiagnosticMatchLogs,
  parseDiagnosticExport,
  persistCompletedDiagnosticLog,
  recordAiDecision,
  recordAuctionAction,
  recordCardPlayed,
  recordDealCompleted,
  recordFestaDecision,
  resetDiagnosticSessionForTests,
  salvageDiagnosticLogsFromUnknown,
  serializeDiagnosticExport,
  startDiagnosticMatch
} from './index';
import { DIAGNOSTIC_LS_KEY } from './store';
import { MATCH_HISTORY_KEY } from '../services/matchHistoryStorage';

describe('REL-REPLAY-01 diagnostic match logs', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetDiagnosticSessionForTests();
    await clearDiagnosticMatchLogsForTests();
  });

  it('records King auction/Festa/AI/card sequence and completes', async () => {
    startDiagnosticMatch({
      gameVariant: 'king',
      rulesPresetId: 'king-pt-normal',
      difficulty: 'hard',
      players: [
        { index: 0, name: 'Alice', type: 'human' },
        { index: 1, name: 'Bot', type: 'ai' },
        { index: 2, name: 'Bot', type: 'ai' },
        { index: 3, name: 'Bot', type: 'ai' }
      ],
      localPlayerIndex: 0,
      seed: 'test-seed-king'
    });

    recordDealCompleted({
      players: [
        { hand: [{ suit: 'hearts', rank: 'A', id: 'hA' }] },
        { hand: [{ suit: 'clubs', rank: 'Q', id: 'cQ' }] },
        { hand: [{ suit: 'spades', rank: 'K', id: 'sK' }] },
        { hand: [{ suit: 'diamonds', rank: '7', id: 'd7' }] }
      ]
    });
    recordAuctionAction({
      seat: 0,
      action: 'auction_bid',
      bidType: 'positive',
      bidAmount: 3
    });
    recordFestaDecision({ action: 'accept_contract', seat: 0 });
    recordAiDecision({
      seat: 1,
      difficulty: 'hard',
      legalCards: [
        { suit: 'clubs', rank: 'Q', id: 'cQ' },
        { suit: 'hearts', rank: '2', id: 'h2' }
      ],
      chosenCard: { suit: 'clubs', rank: 'Q', id: 'cQ' },
      trickIndex: 0,
      gameVariant: 'king',
      rulesPresetId: 'king-pt-normal'
    });
    recordCardPlayed({
      seat: 1,
      card: { suit: 'clubs', rank: 'Q', id: 'cQ' },
      trickIndex: 0,
      playerType: 'ai',
      linkAiDecision: true
    });

    const finished = await completeDiagnosticMatch({
      playerWon: true,
      winner: 0,
      finalScores: { players: [120, 80, 90, 70] },
      summary: 'Alice · 120/80/90/70'
    });

    expect(finished).not.toBeNull();
    expect(finished!.replayLevel).toBe(1);
    expect(finished!.rng.deterministic).toBe(false);
    expect(finished!.rng.algorithm).toBe('math-random');
    expect(finished!.initialHands?.[0][0].rank).toBe('A');
    expect(finished!.events.some((e) => e.type === 'AUCTION_ACTION')).toBe(true);
    expect(finished!.events.some((e) => e.type === 'FESTA_DECISION')).toBe(true);
    expect(finished!.events.some((e) => e.type === 'AI_DECISION')).toBe(true);
    expect(finished!.events.some((e) => e.type === 'CARD_PLAYED')).toBe(true);

    const found = findAiDecision(finished!, {
      seat: 1,
      chosenSuit: 'clubs',
      chosenRank: 'Q'
    });
    expect(found).toHaveLength(1);
    expect(found[0].type).toBe('AI_DECISION');
    if (found[0].type === 'AI_DECISION') {
      expect(found[0].payload.legalCards).toHaveLength(2);
    }

    const stored = await loadDiagnosticMatchLogs();
    expect(stored).toHaveLength(1);
    expect(stored[0].logId).toBe(finished!.logId);

    // Must not write into product match history.
    expect(localStorage.getItem(MATCH_HISTORY_KEY)).toBeNull();
  });

  it('export all / one + anonymise + parse round-trip', async () => {
    startDiagnosticMatch({
      gameVariant: 'sueca',
      rulesPresetId: 'sueca-pt-normal',
      players: [{ index: 0, name: 'Frank', type: 'human' }],
      seed: 's1'
    });
    await completeDiagnosticMatch({ summary: 'Nós · 4-1', playerWon: true });

    const all = await exportDiagnosticMatchLogs({ anonymizePlayers: true });
    expect(all.kind).toBe('suecao-diagnostic-match-logs');
    expect(all.logCount).toBe(1);
    expect(all.replayLevelClaim).toBe(1);
    expect(all.logs[0].players[0].name).toBe('Player 1');
    expect(all.notes?.some((n) => /LEVEL 1/i.test(n))).toBe(true);

    const one = await exportDiagnosticMatchLogs({
      logId: all.logs[0].logId,
      anonymizePlayers: false
    });
    expect(one.logCount).toBe(1);

    const text = serializeDiagnosticExport(all);
    const parsed = parseDiagnosticExport(text);
    expect(parsed.ok).toBe(true);
    expect(parsed.logs).toHaveLength(1);

    const anon = anonymizeDiagnosticLog(buildRepresentativeKingDiagnosticSample());
    expect(anon.players[0].name).toBe('Player 1');
    expect(buildDiagnosticExportFilename({ all: true })).toMatch(
      /^suecao-diagnostic-\d{4}-\d{2}-\d{2}\.json$/
    );
  });

  it('mulberry32 is deterministic; production seed is non-deterministic flag', () => {
    const a = createMulberry32(42);
    const b = createMulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    startDiagnosticMatch({
      gameVariant: 'hearts',
      rulesPresetId: 'hearts-us-normal',
      players: [{ index: 0, name: 'P1' }],
      seed: 'fixed'
    });
    expect(getActiveDiagnosticLog()?.rng.deterministic).toBe(false);
  });

  it('retention keeps newest N; salvage skips invalid entries', async () => {
    for (let i = 0; i < 3; i++) {
      const log = {
        ...buildRepresentativeKingDiagnosticSample(),
        logId: `keep-${i}`,
        completedAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString()
      };
      await persistCompletedDiagnosticLog(log, 2);
    }
    const logs = await loadDiagnosticMatchLogs();
    expect(logs.length).toBeLessThanOrEqual(2);
    expect(logs.every((l) => l.logId.startsWith('keep-'))).toBe(true);

    const salvaged = salvageDiagnosticLogsFromUnknown({
      schemaVersion: 1,
      updatedAt: 1,
      data: {
        logs: [
          buildRepresentativeKingDiagnosticSample(),
          { broken: true },
          { ...buildRepresentativeKingDiagnosticSample(), logId: 'ok-2' }
        ]
      }
    });
    expect(salvaged.length).toBe(2);
  });

  it('corrupt localStorage fallback does not throw on load', async () => {
    localStorage.setItem(DIAGNOSTIC_LS_KEY, '{not-json');
    // Force LS path by clearing via API then writing corrupt — load still safe.
    await expect(loadDiagnosticMatchLogs()).resolves.toEqual(expect.any(Array));
  });

  it('reports approximate sizes for King log batches', () => {
    const sample = buildRepresentativeKingDiagnosticSample();
    // Inflate events to approximate a denser King match (~120 card events).
    for (let i = 0; i < 120; i++) {
      sample.events.push({
        seq: sample.events.length + 1,
        type: 'CARD_PLAYED',
        at: '2026-09-26T12:10:00.000Z',
        payload: {
          seat: i % 4,
          card: { suit: 'hearts', rank: 'A' },
          trickIndex: Math.floor(i / 4),
          playerType: i % 4 === 0 ? 'human' : 'ai'
        }
      });
    }
    const s1 = estimateDiagnosticLogsSerializedSize(sample, 1);
    const s20 = estimateDiagnosticLogsSerializedSize(sample, 20);
    const s50 = estimateDiagnosticLogsSerializedSize(sample, 50);
    const s100 = estimateDiagnosticLogsSerializedSize(sample, 100);
    expect(s1).toBeGreaterThan(1000);
    expect(s20).toBeGreaterThan(s1);
    expect(s50).toBeGreaterThan(s20);
    expect(s100).toBeGreaterThan(s50);
    expect(MAX_DIAGNOSTIC_MATCH_LOGS).toBe(50);
    // 50 dense King logs can exceed typical localStorage — IndexedDB justified.
    expect(s50).toBeGreaterThan(500_000);
  });

  it('covers Sueca / Hearts / Spades start→complete skeleton', async () => {
    for (const [variant, preset] of [
      ['sueca', 'sueca-pt-normal'],
      ['hearts', 'hearts-us-normal'],
      ['spades', 'spades-pt-normal']
    ] as const) {
      resetDiagnosticSessionForTests();
      startDiagnosticMatch({
        gameVariant: variant,
        rulesPresetId: preset,
        players: [{ index: 0, name: 'P1', type: 'human' }],
        seed: variant
      });
      recordDealCompleted({
        players: [
          { hand: [{ suit: 'spades', rank: 'A', id: '1' }] },
          { hand: [{ suit: 'hearts', rank: 'K', id: '2' }] },
          { hand: [{ suit: 'clubs', rank: 'Q', id: '3' }] },
          { hand: [{ suit: 'diamonds', rank: 'J', id: '4' }] }
        ],
        trumpSuit: variant === 'sueca' ? 'spades' : null
      });
      const done = await completeDiagnosticMatch({
        summary: `${variant}-done`,
        playerWon: true
      });
      expect(done?.gameVariant).toBe(variant);
      expect(done?.events[0].type).toBe('MATCH_STARTED');
      expect(done?.events.some((e) => e.type === 'DEAL_COMPLETED')).toBe(true);
    }
  });

  it('Hearts PASS events reconstruct pass direction and cards', async () => {
    startDiagnosticMatch({
      gameVariant: 'hearts',
      rulesPresetId: 'hearts-us-normal',
      players: [
        { index: 0, name: 'P1', type: 'human' },
        { index: 1, name: 'B2', type: 'ai' },
        { index: 2, name: 'B3', type: 'ai' },
        { index: 3, name: 'B4', type: 'ai' }
      ],
      seed: 'hearts-pass'
    });
    const { recordHeartsPass } = await import('./session');
    recordHeartsPass({
      passDirection: 'left',
      sourceSeat: 0,
      destinationSeat: 1,
      cards: [
        { suit: 'spades', rank: 'Q', id: 'sQ' },
        { suit: 'hearts', rank: 'A', id: 'hA' },
        { suit: 'clubs', rank: '2', id: 'c2' }
      ],
      roundIndex: 1
    });
    recordHeartsPass({
      passDirection: 'left',
      sourceSeat: 1,
      destinationSeat: 2,
      cards: [{ suit: 'diamonds', rank: 'K', id: 'dK' }],
      roundIndex: 1
    });
    const done = await completeDiagnosticMatch({ summary: 'hearts-pass', playerWon: true });
    const passes = done!.events.filter((e) => e.type === 'HEARTS_PASS');
    expect(passes).toHaveLength(2);
    expect(passes[0].type).toBe('HEARTS_PASS');
    if (passes[0].type === 'HEARTS_PASS') {
      expect(passes[0].payload.passDirection).toBe('left');
      expect(passes[0].payload.sourceSeat).toBe(0);
      expect(passes[0].payload.destinationSeat).toBe(1);
      expect(passes[0].payload.cards).toHaveLength(3);
      expect(passes[0].payload.cards[0].rank).toBe('Q');
    }
  });

  it('Spades BID events capture bid + nil flag + contract context', async () => {
    startDiagnosticMatch({
      gameVariant: 'spades',
      rulesPresetId: 'spades-pt-nil',
      players: [
        { index: 0, name: 'P1', type: 'human' },
        { index: 1, name: 'B2', type: 'ai' },
        { index: 2, name: 'B3', type: 'ai' },
        { index: 3, name: 'B4', type: 'ai' }
      ],
      seed: 'spades-bid'
    });
    const { recordSpadesBid } = await import('./session');
    recordSpadesBid({
      seat: 0,
      bid: 0,
      bidType: 'nil',
      nil: true,
      nilEnabled: true,
      bidsComplete: false,
      roundIndex: 1
    });
    recordSpadesBid({
      seat: 1,
      bid: 4,
      bidType: 'normal',
      nil: false,
      bidsComplete: true,
      team1Bid: 4,
      team2Bid: 3,
      roundIndex: 1
    });
    const done = await completeDiagnosticMatch({ summary: 'spades-bid', playerWon: false });
    const bids = done!.events.filter((e) => e.type === 'SPADES_BID');
    expect(bids).toHaveLength(2);
    if (bids[0].type === 'SPADES_BID') {
      expect(bids[0].payload.nil).toBe(true);
      expect(bids[0].payload.bid).toBe(0);
      expect(bids[0].payload.bidType).toBe('nil');
    }
    if (bids[1].type === 'SPADES_BID') {
      expect(bids[1].payload.team1Bid).toBe(4);
      expect(bids[1].payload.bidsComplete).toBe(true);
    }
  });
});
