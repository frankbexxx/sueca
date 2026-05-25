import { buildKingScoreSheet, formatScoreCell } from './kingScoreSheet';
import { GameState } from '../../../types/game';

describe('kingScoreSheet', () => {
  const baseState = (): GameState =>
    ({
      players: [
        { id: 'p0', name: 'P1', hand: [], team: 1, type: 'human' },
        { id: 'p1', name: 'P2', hand: [], team: 2, type: 'ai' },
        { id: 'p2', name: 'P3', hand: [], team: 1, type: 'ai' },
        { id: 'p3', name: 'P4', hand: [], team: 2, type: 'ai' }
      ],
      variantState: {
        kingPt: {
          kohPlayerIndex: 0,
          gameIndex: 1,
          playerScores: [-20, 0, 0, 0],
          gameHistory: [
            {
              gameIndex: 0,
              title: 'Não fazer vazas · 1/10',
              deltas: [-20, 0, 0, 0],
              scoresAfter: [-20, 0, 0, 0],
              breakdownLines: []
            }
          ],
          showScorePopup: 'round'
        },
        rulesPresetId: 'king-pt-normal'
      }
    }) as GameState;

  it('builds 10 rows with completed deltas and totals', () => {
    const { rows, totals } = buildKingScoreSheet(baseState(), 'pt');
    expect(rows).toHaveLength(10);
    expect(rows[0].deltas).toEqual([-20, 0, 0, 0]);
    expect(rows[1].deltas).toEqual([null, null, null, null]);
    expect(rows[0].isHighlighted).toBe(false);
    expect(rows[1].isHighlighted).toBe(true);
    expect(totals).toEqual([-20, 0, 0, 0]);
  });

  it('formats score cells', () => {
    expect(formatScoreCell(null)).toBe('—');
    expect(formatScoreCell(25)).toBe('+25');
    expect(formatScoreCell(-20)).toBe('-20');
  });
});
