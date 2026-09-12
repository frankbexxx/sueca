import {
  buildFestaSetupSummaryLines,
  buildKingHudFestaPlayLines,
  formatFestaFinalContract,
  formatFestaPlayHudDetail
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

describe('king HUD festa_play contract lines', () => {
  it('formats positive with trump for HUD', () => {
    expect(
      formatFestaPlayHudDetail({
        bid: { bidderIndex: 0, bidType: 'positive', amount: 3 },
        festaMode: 'positive',
        noTrump: false,
        trump: 'hearts'
      })
    ).toBe('3 positivas · ♥ Copas');
  });

  it('formats positive no trump for HUD', () => {
    expect(
      formatFestaPlayHudDetail({
        bid: { bidderIndex: 0, bidType: 'positive', amount: 3 },
        festaMode: 'positive',
        noTrump: true,
        trump: null
      })
    ).toBe('3 positivas · Sem trunfo');
  });

  it('formats nulls for HUD', () => {
    expect(
      formatFestaPlayHudDetail({
        bid: null,
        festaMode: 'negative_festa',
        noTrump: true,
        trump: null
      })
    ).toBe('Nulos');
  });

  it('builds persistent festa_play lines including first player', () => {
    const lines = buildKingHudFestaPlayLines({
      gameIndex: 6,
      phase: 'festa_play',
      festaOwnerName: 'Player 1',
      activeContract: {
        bidType: 'positive',
        amount: 3,
        bidderIndex: 0,
        beneficiaryIndex: 0
      },
      bestBid: null,
      festaMode: 'positive',
      noTrumpChosen: false,
      chosenTrump: 'hearts',
      firstPlayerIndex: 3,
      firstPlayerName: 'Player 4'
    });
    expect(lines.primary).toBe('Festa de Player 1');
    expect(lines.detail).toBe('3 positivas · ♥ Copas');
    expect(lines.firstPlayer).toBe('1.º jogador: Player 4');
  });

  it('builds no-trump festa_play lines', () => {
    const lines = buildKingHudFestaPlayLines({
      gameIndex: 6,
      phase: 'festa_play',
      festaOwnerName: 'Player 1',
      activeContract: {
        bidType: 'positive',
        amount: 3,
        bidderIndex: 0,
        beneficiaryIndex: 0
      },
      bestBid: null,
      festaMode: 'positive',
      noTrumpChosen: true,
      chosenTrump: null,
      firstPlayerIndex: 1,
      firstPlayerName: 'Player 2'
    });
    expect(lines.detail).toBe('3 positivas · Sem trunfo');
    expect(lines.firstPlayer).toBe('1.º jogador: Player 2');
  });

  it('builds nulos festa_play lines', () => {
    const lines = buildKingHudFestaPlayLines({
      gameIndex: 7,
      phase: 'festa_play',
      festaOwnerName: 'Player 1',
      activeContract: null,
      bestBid: null,
      festaMode: 'negative_festa',
      noTrumpChosen: true,
      chosenTrump: null,
      firstPlayerIndex: 2,
      firstPlayerName: 'Player 3'
    });
    expect(lines.primary).toBe('Festa de Player 1');
    expect(lines.detail).toBe('Nulos');
    expect(lines.firstPlayer).toBe('1.º jogador: Player 3');
  });

  it('omits detail outside festa_play', () => {
    const lines = buildKingHudFestaPlayLines({
      gameIndex: 6,
      phase: 'festa_setup',
      festaOwnerName: 'Player 1',
      activeContract: {
        bidType: 'positive',
        amount: 3,
        bidderIndex: 0,
        beneficiaryIndex: 0
      },
      bestBid: null,
      festaMode: 'positive',
      noTrumpChosen: false,
      chosenTrump: 'hearts',
      firstPlayerIndex: 0,
      firstPlayerName: 'Player 1'
    });
    expect(lines.primary).toBe('Festa de Player 1');
    expect(lines.detail).toBeNull();
    expect(lines.firstPlayer).toBeNull();
  });
});
