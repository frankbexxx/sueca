import {
  buildFestaSetupSummaryLines,
  formatFestaFinalContract
} from './kingFestaSetupSummary';

describe('kingFestaSetupSummary', () => {
  it('formats positive with trump', () => {
    expect(
      formatFestaFinalContract({
        bid: { bidderIndex: 2, bidType: 'positive', amount: 3 },
        festaMode: 'positive',
        noTrump: false,
        trump: 'hearts'
      })
    ).toBe('3 positivas com Copas');
  });

  it('formats positive no trump', () => {
    expect(
      formatFestaFinalContract({
        bid: { bidderIndex: 1, bidType: 'positive', amount: 2 },
        festaMode: 'positive',
        noTrump: true,
        trump: null
      })
    ).toBe('2 positivas sem trunfo');
  });

  it('formats fallback no-trump without bid', () => {
    expect(
      formatFestaFinalContract({
        bid: null,
        festaMode: 'positive',
        noTrump: true,
        trump: null
      })
    ).toBe('Sem trunfo');
  });

  it('formats nulls / negative festa', () => {
    expect(
      formatFestaFinalContract({
        bid: { bidderIndex: 0, bidType: 'null', amount: 2 },
        festaMode: 'negative_festa',
        noTrump: true,
        trump: null
      })
    ).toBe('2 nulos');
    expect(
      formatFestaFinalContract({
        bid: null,
        festaMode: 'negative_festa',
        noTrump: true,
        trump: null
      })
    ).toBe('Nulos');
  });

  it('uses Tu for local winner and first player', () => {
    const lines = buildFestaSetupSummaryLines({
      winnerName: 'Player 1',
      winnerIndex: 0,
      localPlayerIndex: 0,
      bid: { bidderIndex: 0, bidType: 'positive', amount: 3 },
      festaMode: 'positive',
      noTrump: false,
      trump: 'clubs',
      firstPlayerName: 'Player 1',
      firstPlayerIndex: 0
    });
    expect(lines.winnerLine).toBe('Vencedor: Tu');
    expect(lines.contractLine).toBe('Contrato final: 3 positivas com Paus');
    expect(lines.firstPlayerLine).toBe('Primeiro jogador: Tu');
  });

  it('keeps other seat names', () => {
    const lines = buildFestaSetupSummaryLines({
      winnerName: 'Amigo 1',
      winnerIndex: 1,
      localPlayerIndex: 0,
      bid: null,
      festaMode: 'negative_festa',
      noTrump: true,
      trump: null,
      firstPlayerName: 'Amigo 3',
      firstPlayerIndex: 3
    });
    expect(lines.winnerLine).toBe('Vencedor: Amigo 1');
    expect(lines.contractLine).toBe('Contrato final: Nulos');
    expect(lines.firstPlayerLine).toBe('Primeiro jogador: Amigo 3');
  });
});
