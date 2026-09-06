import {
  formatPositiveFestaBreakdownLine,
  nullFestaPlayerBreakdowns,
  nullFestaRunningScore,
  nullFestaStartScores,
  positiveFestaPlayerBreakdowns
} from './kingFestaScoreDisplay';
import { settlePositiveAuctionRound, settleNegativeFesta, settleNullAuctionFesta } from './kingScoring';
import { emptyBreakdown } from './kingBreakdown';
import { buildBreakdownLines } from './kingBreakdownHelpers';

describe('kingFestaScoreDisplay', () => {
  it('null running score: 0/1/4/5 vazas', () => {
    expect(nullFestaRunningScore(0)).toBe(325);
    expect(nullFestaRunningScore(1)).toBe(250);
    expect(nullFestaRunningScore(4)).toBe(25);
    expect(nullFestaRunningScore(5)).toBe(-50);
  });

  it('null start scores seed +325 (unsold)', () => {
    expect(nullFestaStartScores(null, null, null)).toEqual([325, 325, 325, 325]);
  });

  it('null start scores apply sold transfer on base', () => {
    expect(nullFestaStartScores(0, 1, 2)).toEqual(
      settleNullAuctionFesta([0, 0, 0, 0], 0, 1, 2)
    );
  });

  it('positive sold [2,3,4,4] offer 5 matches A9 settlement parts', () => {
    const parts = positiveFestaPlayerBreakdowns([2, 3, 4, 4], 5, 0, 1);
    expect(parts[0]).toEqual({
      playerIndex: 0,
      trickPts: 50,
      contractPts: 125,
      total: 175
    });
    expect(parts[1]).toEqual({
      playerIndex: 1,
      trickPts: 75,
      contractPts: -125,
      total: -50
    });
    expect(parts[2]).toEqual({ playerIndex: 2, trickPts: 100, contractPts: 0, total: 100 });
    expect(parts[3]).toEqual({ playerIndex: 3, trickPts: 100, contractPts: 0, total: 100 });
    expect(parts.map((p) => p.total)).toEqual(
      settlePositiveAuctionRound(5, [2, 3, 4, 4], 0, 1)
    );
  });

  it('positive unsold has no contract transfer', () => {
    const parts = positiveFestaPlayerBreakdowns([2, 3, 4, 4], null, null, null);
    expect(parts.every((p) => p.contractPts === 0)).toBe(true);
    expect(parts.map((p) => p.total)).toEqual([50, 75, 100, 100]);
    expect(formatPositiveFestaBreakdownLine(parts[0])).not.toContain('contrato');
  });

  it('null sold breakdown totals match settlement', () => {
    const tricks = [2, 4, 4, 3];
    const parts = nullFestaPlayerBreakdowns(tricks, 2, 0, 1);
    expect(parts.map((p) => p.total)).toEqual(settleNullAuctionFesta(tricks, 0, 1, 2));
    expect(parts.map((p) => p.trickPts)).toEqual(settleNegativeFesta(tricks));
    expect(parts[0].contractPts).toBe(150);
    expect(parts[1].contractPts).toBe(-150);
  });
});

describe('buildBreakdownLines festa presentation', () => {
  it('positive sold includes contrato transfer lines', () => {
    const b = emptyBreakdown();
    b.festaMode = 'positive';
    b.tricksWon = [2, 3, 4, 4];
    b.positiveTransfer = { beneficiary: 0, bidder: 1, amount: 5 };
    b.contractLabel = 'Contrato: 5 positivas';
    const lines = buildBreakdownLines(b, null, 'pt');
    expect(lines.some((l) => l.includes('contrato +125') && l.includes('total +175'))).toBe(true);
    expect(lines.some((l) => l.includes('contrato -125') && l.includes('total -50'))).toBe(true);
    expect(lines.every((l) => !l.match(/J[34]:.*contrato/))).toBe(true);
  });

  it('positive unsold omits contrato', () => {
    const b = emptyBreakdown();
    b.festaMode = 'positive';
    b.tricksWon = [5, 3, 3, 2];
    const lines = buildBreakdownLines(b, null, 'pt');
    expect(lines.every((l) => !l.includes('contrato'))).toBe(true);
    expect(lines.some((l) => l.includes('vazas +125') && l.includes('total +125'))).toBe(true);
  });

  it('null breakdown shows base 325 − 75×vazas totals', () => {
    const b = emptyBreakdown();
    b.festaMode = 'negative_festa';
    b.tricksWon = [0, 1, 4, 5];
    const lines = buildBreakdownLines(b, null, 'pt');
    expect(lines.some((l) => l.includes('0 vaza') && l.includes('total +325'))).toBe(true);
    expect(lines.some((l) => l.includes('1 vaza') && l.includes('total +250'))).toBe(true);
    expect(lines.some((l) => l.includes('4 vaza') && l.includes('total +25'))).toBe(true);
    expect(lines.some((l) => l.includes('5 vaza') && l.includes('total -50'))).toBe(true);
  });
});
