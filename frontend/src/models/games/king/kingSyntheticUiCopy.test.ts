import {
  kingHudMatchProgress,
  kingSyntheticHudSubtitle,
  kingSyntheticProductName,
  kingSyntheticRoundEndCopy,
  kingSyntheticRoundLabel,
  resolveKingMatchDisplay
} from './kingContracts';
import { resolveKingNegativeHudScore } from './kingHudScoreDisplay';

describe('King Sintético user-facing copy', () => {
  it('uses King Sintético product name — never simplificado', () => {
    expect(kingSyntheticProductName('pt')).toBe('King Sintético');
    expect(kingSyntheticProductName('pt')).not.toMatch(/simplificado/i);
    expect(kingSyntheticHudSubtitle('pt')).toBe('Todos os negativos');
    expect(kingSyntheticRoundLabel('pt')).toBe('Sintético · Todos os negativos');
  });

  it('exposes end-of-negatives modal title and Festa CTA', () => {
    const copy = kingSyntheticRoundEndCopy('pt');
    expect(copy.title).toBe('Negativos sintéticos concluídos');
    expect(copy.totalSection).toBe('Total acumulado');
    expect(copy.continueCta).toBe('Avançar para festas');
    expect(copy.title).not.toMatch(/Jogo 1 Completo/i);
    expect(copy.continueCta).not.toMatch(/Continuar para Jogo/i);
  });

  it('synthetic progress is 1/5 … 5/5; normal stays 1/10 … 10/10', () => {
    const syn = { syntheticSession: true };
    expect(resolveKingMatchDisplay(0, syn)).toEqual({ current: 1, total: 5 });
    expect(resolveKingMatchDisplay(6, syn)).toEqual({ current: 2, total: 5 });
    expect(resolveKingMatchDisplay(9, syn)).toEqual({ current: 5, total: 5 });
    expect(kingHudMatchProgress(0, 'pt', syn)).toBe('Jogo 1/5');
    expect(kingHudMatchProgress(6, 'pt', syn)).toBe('Jogo 2/5');
    expect(kingHudMatchProgress(0, 'pt')).toBe('Jogo 1/10');
    expect(kingHudMatchProgress(9, 'pt')).toBe('Jogo 10/10');
  });

  it('HUD score lines read playerScores / lastRoundDeltas — not ±5 simplified', () => {
    const line = resolveKingNegativeHudScore({
      gameIndex: 0,
      phase: 'negative',
      lastRoundDeltas: [-120, -80, 0, -210],
      playerScores: [-410, -510, 0, -380],
      roundStartScores: [-290, -430, 0, -170],
      playerIndex: 0
    });
    expect(line.roundDelta).toBe(-120);
    expect(line.totalScore).toBe(-290);
    expect(line.roundDelta).not.toBe(-5);
    expect(line.totalScore).not.toBe(5);
  });
});
