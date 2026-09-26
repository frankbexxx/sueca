import { beforeEach, describe, expect, it } from 'vitest';
import {
  MATCH_HISTORY_KEY,
  MAX_MATCH_HISTORY,
  createMatchId,
  estimateMatchHistorySerializedSize,
  exportMatchHistory,
  getMatchById,
  getMatchHistoryByVariant,
  loadMatchHistory,
  loadRecentFinishedFromHistory,
  recordMatchHistory,
  resolveMatchCompletionId,
  serializeMatchHistoryExport,
  snapshotPlayersFromGame
} from './matchHistoryStorage';
import { FINISHED_KEY, MAX_FINISHED, recordFinishedGame } from './gameHistoryStorage';
import {
  STATS_KEY,
  loadLocalStats,
  recordGameResult
} from './gameSessionStorage';
import {
  DURABLE_SCHEMA_VERSION,
  getQuarantineEntriesForKey,
  hasDurableQuarantine,
  wrapDurableEnvelope,
  writeDurableEnvelope
} from './durableLocalStorage';

function minimalRecord(
  id: string,
  completedAtMs: number,
  summary = id
): {
  id: string;
  schemaVersion: 1;
  completedAt: string;
  gameVariant: 'sueca';
  rulesPresetId: 'sueca-pt-normal';
  players: Array<{ index: number; name: string }>;
  resultKind: 'team';
  finalScores: { team1: number; team2: number };
  summary: string;
  migratedFrom: 'live';
} {
  return {
    id,
    schemaVersion: 1,
    completedAt: new Date(completedAtMs).toISOString(),
    gameVariant: 'sueca',
    rulesPresetId: 'sueca-pt-normal',
    players: [{ index: 0, name: 'P1' }],
    resultKind: 'team',
    finalScores: { team1: 4, team2: 1 },
    summary,
    migratedFrom: 'live'
  };
}

describe('matchHistoryStorage (REL-DATA-02)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('migration', () => {
    it('empty install → empty history', () => {
      expect(loadMatchHistory()).toEqual([]);
      expect(loadRecentFinishedFromHistory()).toEqual([]);
    });

    it('existing stats only → no fabricated match records', () => {
      localStorage.setItem(
        STATS_KEY,
        JSON.stringify(
          wrapDurableEnvelope(
            {
              gamesPlayed: 160,
              wins: 80,
              lastPlayedVariant: 'king',
              byVariant: {
                sueca: { played: 0, wins: 0 },
                hearts: { played: 0, wins: 0 },
                spades: { played: 0, wins: 0 },
                king: { played: 160, wins: 80 }
              }
            },
            DURABLE_SCHEMA_VERSION
          )
        )
      );
      expect(loadMatchHistory()).toEqual([]);
      expect(loadLocalStats().byVariant.king.played).toBe(160);
    });

    it('old finished summaries only → migrate up to 3 with provenance', () => {
      const raw = [
        {
          variant: 'sueca',
          finishedAt: 1000,
          playerWon: true,
          summary: 'Nós · 4-2'
        },
        {
          variant: 'king',
          finishedAt: 2000,
          playerWon: false,
          summary: 'Bot · 90/100/80/70'
        },
        {
          variant: 'hearts',
          finishedAt: 3000,
          playerWon: true,
          summary: 'Player 1 · 40/60/55/70'
        }
      ];
      localStorage.setItem(FINISHED_KEY, JSON.stringify(raw));

      const history = loadMatchHistory();
      expect(history).toHaveLength(3);
      expect(history.every((r) => r.migratedFrom === 'finished-games-v1')).toBe(true);
      expect(history[0].id).toBe('migrated-finished-hearts-3000');
      expect(history[0].summary).toBe('Player 1 · 40/60/55/70');
      expect(history[2].gameVariant).toBe('sueca');
      // Do not invent scores/players from thin summaries.
      expect(history[0].players).toEqual([]);
      expect(history[0].finalScores).toEqual({});
    });

    it('stats + 3 summaries → migrate summaries only; stats untouched', () => {
      localStorage.setItem(
        STATS_KEY,
        JSON.stringify({
          gamesPlayed: 50,
          wins: 20,
          byVariant: {
            sueca: { played: 10, wins: 5 },
            hearts: { played: 10, wins: 5 },
            spades: { played: 10, wins: 5 },
            king: { played: 20, wins: 5 }
          }
        })
      );
      localStorage.setItem(
        FINISHED_KEY,
        JSON.stringify([
          { variant: 'king', finishedAt: 1, playerWon: true, summary: 'A' },
          { variant: 'sueca', finishedAt: 2, playerWon: false, summary: 'B' },
          { variant: 'spades', finishedAt: 3, playerWon: true, summary: 'C' }
        ])
      );

      expect(loadMatchHistory()).toHaveLength(3);
      expect(loadLocalStats().gamesPlayed).toBe(50);
      expect(loadLocalStats().byVariant.king.played).toBe(20);
    });

    it('second load is idempotent — no duplicate migrated matches', () => {
      localStorage.setItem(
        FINISHED_KEY,
        JSON.stringify([
          { variant: 'king', finishedAt: 42, playerWon: true, summary: 'X' }
        ])
      );
      const first = loadMatchHistory();
      const second = loadMatchHistory();
      expect(first).toHaveLength(1);
      expect(second).toHaveLength(1);
      expect(second[0].id).toBe(first[0].id);
    });
  });

  describe('persistence', () => {
    it('append one and reload', () => {
      const rec = recordMatchHistory({
        gameVariant: 'sueca',
        rulesPresetId: 'sueca-pt-normal',
        difficulty: 'hard',
        players: snapshotPlayersFromGame([
          { name: 'P1', type: 'human', team: 1 },
          { name: 'B2', type: 'ai', team: 2 },
          { name: 'B3', type: 'ai', team: 1 },
          { name: 'B4', type: 'ai', team: 2 }
        ]),
        localPlayerIndex: 0,
        playerWon: true,
        resultKind: 'team',
        winner: 1,
        finalScores: { team1: 4, team2: 2 },
        summary: 'Nós · 4-2'
      });
      expect(rec).not.toBeNull();
      expect(loadMatchHistory()).toHaveLength(1);
      expect(getMatchById(rec!.id)?.summary).toBe('Nós · 4-2');
    });

    it('append many preserves newest-first order and unique ids', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const r = recordMatchHistory({
          gameVariant: i % 2 === 0 ? 'hearts' : 'spades',
          rulesPresetId: i % 2 === 0 ? 'hearts-us-normal' : 'spades-pt-normal',
          players: [{ index: 0, name: 'P1' }],
          finalScores: i % 2 === 0 ? { players: [10, 20, 30, 40] } : { team1: 100, team2: 200 },
          summary: `m${i}`,
          playerWon: true,
          resultKind: i % 2 === 0 ? 'individual' : 'team'
        });
        expect(r).not.toBeNull();
        ids.add(r!.id);
      }
      expect(ids.size).toBe(5);
      const list = loadMatchHistory();
      expect(list).toHaveLength(5);
      expect(list[0].summary).toBe('m4');
      expect(list[4].summary).toBe('m0');
      expect(getMatchHistoryByVariant('hearts')).toHaveLength(3);
    });

    it('respects MAX_MATCH_HISTORY retention (not MAX_FINISHED)', () => {
      expect(MAX_MATCH_HISTORY).toBeGreaterThan(MAX_FINISHED);
      for (let i = 0; i < 12; i++) {
        recordMatchHistory({
          gameVariant: 'sueca',
          players: [{ index: 0, name: 'P' }],
          finalScores: { team1: 1, team2: 0 },
          summary: `r${i}`,
          resultKind: 'team'
        });
      }
      expect(loadMatchHistory().length).toBe(12);
      expect(loadRecentFinishedFromHistory().length).toBe(MAX_FINISHED);
    });

    it('keeps newest 2000 deterministically when over retention', () => {
      expect(MAX_MATCH_HISTORY).toBe(2000);
      localStorage.setItem(
        STATS_KEY,
        JSON.stringify(
          wrapDurableEnvelope(
            {
              gamesPlayed: 99,
              wins: 40,
              byVariant: {
                sueca: { played: 99, wins: 40 },
                hearts: { played: 0, wins: 0 },
                spades: { played: 0, wins: 0 },
                king: { played: 0, wins: 0 }
              }
            },
            DURABLE_SCHEMA_VERSION
          )
        )
      );

      const base = Date.UTC(2026, 0, 1);
      // Newest-first: index 0 = id-2004 (newest), last = id-0 (oldest).
      const seeded = Array.from({ length: MAX_MATCH_HISTORY + 5 }, (_, i) => {
        const seq = MAX_MATCH_HISTORY + 4 - i;
        return minimalRecord(`keep-${seq}`, base + seq * 1000, `s${seq}`);
      });
      writeDurableEnvelope(
        MATCH_HISTORY_KEY,
        { records: seeded, legacyFinishedMigrated: true },
        DURABLE_SCHEMA_VERSION
      );

      const newest = recordMatchHistory({
        id: 'brand-new-top',
        gameVariant: 'sueca',
        players: [{ index: 0, name: 'P1' }],
        finalScores: { team1: 4, team2: 0 },
        summary: 'newest-live',
        resultKind: 'team',
        playerWon: true,
        completedAt: base + (MAX_MATCH_HISTORY + 5) * 1000
      });
      expect(newest).not.toBeNull();

      const list = loadMatchHistory();
      expect(list).toHaveLength(MAX_MATCH_HISTORY);
      expect(list[0].id).toBe('brand-new-top');
      expect(list[0].summary).toBe('newest-live');
      // Seed had keep-2004..keep-0 (2005). Load slices to keep-2004..keep-5;
      // appending brand-new-top then re-slices drops keep-5 → oldest retained keep-6.
      expect(list.some((r) => r.id === 'keep-0')).toBe(false);
      expect(list.some((r) => r.id === 'keep-5')).toBe(false);
      expect(list[list.length - 1].id).toBe('keep-6');

      const ids = list.map((r) => r.id);
      expect(new Set(ids).size).toBe(MAX_MATCH_HISTORY);

      // Pruning history must not touch aggregate stats.
      expect(loadLocalStats().gamesPlayed).toBe(99);
      expect(loadLocalStats().byVariant.sueca.played).toBe(99);
    });
  });

  describe('corruption', () => {
    it('malformed JSON quarantines raw and survives subsequent normal writes', () => {
      const corrupt = '{not-json';
      localStorage.setItem(MATCH_HISTORY_KEY, corrupt);
      expect(loadMatchHistory()).toEqual([]);
      expect(hasDurableQuarantine(MATCH_HISTORY_KEY)).toBe(true);
      expect(getQuarantineEntriesForKey(MATCH_HISTORY_KEY)[0].raw).toBe(corrupt);

      recordMatchHistory({
        gameVariant: 'hearts',
        players: [{ index: 0, name: 'P1' }],
        finalScores: { players: [10, 20, 30, 40] },
        summary: 'after-corrupt',
        resultKind: 'individual',
        playerWon: true
      });
      expect(loadMatchHistory()).toHaveLength(1);
      expect(loadMatchHistory()[0].summary).toBe('after-corrupt');
      // Recovery copy must not be erased by the fresh history write.
      expect(getQuarantineEntriesForKey(MATCH_HISTORY_KEY)[0].raw).toBe(corrupt);
    });

    it('structurally invalid envelope quarantines and returns safe fallback', () => {
      const corrupt = JSON.stringify({
        schemaVersion: 1,
        updatedAt: Date.now(),
        data: { nope: true }
      });
      localStorage.setItem(MATCH_HISTORY_KEY, corrupt);
      expect(loadMatchHistory()).toEqual([]);
      expect(hasDurableQuarantine(MATCH_HISTORY_KEY)).toBe(true);
      expect(getQuarantineEntriesForKey(MATCH_HISTORY_KEY)[0].raw).toBe(corrupt);
      expect(getQuarantineEntriesForKey(MATCH_HISTORY_KEY)[0].reason).toBe(
        'envelope_data_invalid'
      );
    });

    it('one invalid record among valid ones is salvaged', () => {
      const good = {
        id: 'good-1',
        schemaVersion: 1,
        completedAt: '2026-01-01T00:00:00.000Z',
        gameVariant: 'sueca',
        rulesPresetId: 'sueca-pt-normal',
        players: [{ index: 0, name: 'P1' }],
        resultKind: 'team',
        finalScores: { team1: 4, team2: 1 },
        summary: 'ok'
      };
      localStorage.setItem(
        MATCH_HISTORY_KEY,
        JSON.stringify({
          schemaVersion: 1,
          updatedAt: Date.now(),
          data: {
            records: [good, { id: 123, broken: true }, good],
            legacyFinishedMigrated: true
          }
        })
      );
      const list = loadMatchHistory();
      expect(list).toHaveLength(2);
      expect(list.every((r) => r.id === 'good-1')).toBe(true);
    });
  });

  describe('completion integration (shared write path)', () => {
    function completeLikeBoard(args: {
      variant: 'sueca' | 'hearts' | 'spades' | 'king';
      preset: string;
      playerWon: boolean;
      summary: string;
      finalScores: { team1?: number; team2?: number; players?: number[] };
      resultKind: 'team' | 'individual';
      winner: number;
      id?: string;
    }) {
      const id = args.id ?? createMatchId();
      recordGameResult(args.variant, args.playerWon);
      // History before finished so adoptLegacyFinished does not treat this
      // completion's finished summary as a second migrated row.
      const recorded = recordMatchHistory({
        id,
        idempotencyKey: id,
        gameVariant: args.variant,
        rulesPresetId: args.preset,
        difficulty: 'medium',
        players: snapshotPlayersFromGame([
          { name: 'Player 1', type: 'human', team: 1 },
          { name: 'Bot 2', type: 'ai', team: 2 },
          { name: 'Bot 3', type: 'ai', team: 1 },
          { name: 'Bot 4', type: 'ai', team: 2 }
        ]),
        localPlayerIndex: 0,
        playerWon: args.playerWon,
        resultKind: args.resultKind,
        winner: args.winner,
        finalScores: args.finalScores,
        summary: args.summary
      });
      recordFinishedGame({
        variant: args.variant,
        finishedAt: Date.now(),
        playerWon: args.playerWon,
        summary: args.summary
      });
      return recorded;
    }

    it('Sueca completion → one history + one stats increment', () => {
      completeLikeBoard({
        variant: 'sueca',
        preset: 'sueca-pt-normal',
        playerWon: true,
        summary: 'Nós · 4-1',
        finalScores: { team1: 4, team2: 1 },
        resultKind: 'team',
        winner: 1
      });
      expect(loadMatchHistory()).toHaveLength(1);
      expect(loadLocalStats().byVariant.sueca.played).toBe(1);
      expect(loadMatchHistory()[0].rulesPresetId).toBe('sueca-pt-normal');
    });

    it('Hearts completion', () => {
      completeLikeBoard({
        variant: 'hearts',
        preset: 'hearts-us-normal',
        playerWon: true,
        summary: 'Player 1 · 20/40/50/60',
        finalScores: { players: [20, 40, 50, 60] },
        resultKind: 'individual',
        winner: 0
      });
      expect(loadMatchHistory()[0].gameVariant).toBe('hearts');
      expect(loadMatchHistory()[0].finalScores.players).toEqual([20, 40, 50, 60]);
    });

    it('Spades completion', () => {
      completeLikeBoard({
        variant: 'spades',
        preset: 'spades-pt-nil',
        playerWon: false,
        summary: 'Eles · 520-480',
        finalScores: { team1: 480, team2: 520 },
        resultKind: 'team',
        winner: 2
      });
      expect(loadMatchHistory()[0].rulesPresetId).toBe('spades-pt-nil');
    });

    it('King normal completion', () => {
      completeLikeBoard({
        variant: 'king',
        preset: 'king-pt-normal',
        playerWon: true,
        summary: 'Player 1 · 120/80/90/70',
        finalScores: { players: [120, 80, 90, 70] },
        resultKind: 'individual',
        winner: 0
      });
      expect(loadMatchHistory()[0].rulesPresetId).toBe('king-pt-normal');
    });

    it('King Sintético completion', () => {
      completeLikeBoard({
        variant: 'king',
        preset: 'king-pt-synthetic',
        playerWon: false,
        summary: 'Bot 2 · 50/80/40/30',
        finalScores: { players: [50, 80, 40, 30] },
        resultKind: 'individual',
        winner: 1
      });
      expect(loadMatchHistory()[0].rulesPresetId).toBe('king-pt-synthetic');
      expect(loadMatchHistory()[0].players[0].name).toBe('Player 1');
    });

    it('duplicate completion id does not double-record', () => {
      const id = createMatchId();
      completeLikeBoard({
        variant: 'king',
        preset: 'king-pt-normal',
        playerWon: true,
        summary: 'once',
        finalScores: { players: [1, 2, 3, 4] },
        resultKind: 'individual',
        winner: 0,
        id
      });
      completeLikeBoard({
        variant: 'king',
        preset: 'king-pt-normal',
        playerWon: true,
        summary: 'once',
        finalScores: { players: [1, 2, 3, 4] },
        resultKind: 'individual',
        winner: 0,
        id
      });
      expect(loadMatchHistory()).toHaveLength(1);
      // stats still increments twice if callers re-fire recordGameResult — history stays 1
      expect(loadLocalStats().byVariant.king.played).toBe(2);
    });

    it('resolveMatchCompletionId is stable for same fingerprint', () => {
      const a = resolveMatchCompletionId('fp-king-1');
      const b = resolveMatchCompletionId('fp-king-1');
      expect(a).toBe(b);
      expect(resolveMatchCompletionId('fp-king-2')).not.toBe(a);
    });
  });

  describe('160-game King regression (mandatory)', () => {
    it('played=160 migrates without fabricating history; next match → 161 + exactly 1 record', () => {
      localStorage.setItem(
        STATS_KEY,
        JSON.stringify({
          gamesPlayed: 160,
          wins: 70,
          lastPlayedVariant: 'king',
          byVariant: {
            sueca: { played: 0, wins: 0 },
            hearts: { played: 0, wins: 0 },
            spades: { played: 0, wins: 0 },
            king: { played: 160, wins: 70 }
          }
        })
      );

      expect(loadMatchHistory()).toHaveLength(0);
      expect(loadLocalStats().byVariant.king.played).toBe(160);

      recordGameResult('king', true);
      recordMatchHistory({
        gameVariant: 'king',
        rulesPresetId: 'king-pt-normal',
        difficulty: 'hard',
        players: snapshotPlayersFromGame([
          { name: 'Player 1', type: 'human' },
          { name: 'Bot', type: 'ai' },
          { name: 'Bot', type: 'ai' },
          { name: 'Bot', type: 'ai' }
        ]),
        playerWon: true,
        resultKind: 'individual',
        winner: 0,
        finalScores: { players: [100, 80, 70, 60] },
        summary: 'Player 1 · 100/80/70/60'
      });

      expect(loadLocalStats().byVariant.king.played).toBe(161);
      expect(loadLocalStats().gamesPlayed).toBe(161);
      expect(loadMatchHistory()).toHaveLength(1);
      expect(loadMatchHistory()[0].migratedFrom).toBe('live');
      // Never invent 160 fake career rows from the counter.
      expect(loadMatchHistory().filter((r) => r.migratedFrom === 'finished-games-v1')).toHaveLength(
        0
      );
    });
  });

  describe('export / size', () => {
    it('export helper returns full retained history with schema, not replay payloads', () => {
      for (let i = 0; i < 5; i++) {
        recordMatchHistory({
          id: `exp-${i}`,
          gameVariant: 'sueca',
          players: [{ index: 0, name: 'P1' }],
          finalScores: { team1: 4, team2: 0 },
          summary: `capote-${i}`,
          resultKind: 'team',
          playerWon: true
        });
      }
      const beforeRaw = localStorage.getItem(MATCH_HISTORY_KEY);
      const exp = exportMatchHistory();
      expect(exp.kind).toBe('suecao-match-history');
      expect(exp.schemaVersion).toBe(1);
      expect(exp.recordCount).toBe(5);
      expect(exp.records).toHaveLength(5);
      // Full career export — not the recent-3 UI slice.
      expect(exp.records.length).toBeGreaterThan(MAX_FINISHED);
      const serialized = serializeMatchHistoryExport();
      expect(serialized).toContain('suecao-match-history');
      expect(serialized).not.toMatch(/trickLog|rngStream|cardIntelligence|aiDecision|debugSnapshot/i);

      // Export must not mutate durable store.
      exp.records.pop();
      expect(localStorage.getItem(MATCH_HISTORY_KEY)).toBe(beforeRaw);
      expect(loadMatchHistory()).toHaveLength(5);
    });

    it('reports approximate sizes for 100 / 500 / 1000 records', () => {
      const s100 = estimateMatchHistorySerializedSize(100);
      const s500 = estimateMatchHistorySerializedSize(500);
      const s1000 = estimateMatchHistorySerializedSize(1000);
      expect(s100).toBeGreaterThan(10_000);
      expect(s500).toBeGreaterThan(s100);
      expect(s1000).toBeGreaterThan(s500);
      // localStorage typically ~5MB; 1000 compact records should stay well under.
      expect(s1000).toBeLessThan(2_000_000);
      expect({
        bytes100: s100,
        bytes500: s500,
        bytes1000: s1000
      }).toMatchObject({
        bytes100: expect.any(Number),
        bytes500: expect.any(Number),
        bytes1000: expect.any(Number)
      });
    });
  });
});
