import {
  kingHudContractPrimary,
  kingHudContractTitle,
  kingHudMatchProgress
} from '../models/games/king/kingContracts';
import { computeSeatPresentation } from '../renderers/phaser/phaserSeatPresentation';
import { formatTrickProgressLabel } from '../utils/trickProgress';

describe('UX seat/HUD polish — annotated screenshot pass', () => {
  it('keeps King match secondary to Vaza and never bare N/10', () => {
    expect(kingHudContractPrimary(0, 'no_tricks', null, 'pt')).toBe('Não fazer vazas');
    expect(kingHudMatchProgress(0, 'pt')).toBe('Jogo 1/10');
    expect(kingHudContractTitle(0, 'no_hearts', null, 'pt')).toBe(
      'Não fazer copas · Jogo 1/10'
    );
    expect(kingHudMatchProgress(0, 'pt')).not.toMatch(/^1\/10$/);
    expect(formatTrickProgressLabel({ current: 1, total: 13 }, 'pt')).toBe('Vaza 1/13');
  });

  it('formats festa primary without stacking match into the title slot', () => {
    expect(kingHudContractPrimary(6, null, 'Ana', 'pt')).toBe('Festa de Ana');
    expect(kingHudMatchProgress(6, 'pt')).toBe('Jogo 7/10');
  });

  it('uses clean seat labels without monogram numbers or team tokens', () => {
    const north = computeSeatPresentation({
      name: 'Player 3',
      handCount: 10,
      isLocal: false,
      isDealer: true,
      teamLabel: 'Nós',
      secondaryBadge: null,
      showActiveHighlight: false,
      aspect: 'portrait',
      omitTeam: true
    });
    expect(north.labelText).toBe('Player 3 · D');
    expect(north.showMonogram).toBe(false);
    expect(north.monogram).toBe('');
    expect(north.labelText).not.toMatch(/Nós/i);

    const local = computeSeatPresentation({
      name: 'Player 1',
      handCount: 10,
      isLocal: true,
      isDealer: false,
      teamLabel: 'Nós',
      secondaryBadge: null,
      showActiveHighlight: true,
      activeTurnLabel: 'A JOGAR',
      aspect: 'portrait'
    });
    expect(local.labelText).toBe('Player 1');
    expect(local.showActiveRing).toBe(true);
    expect(local.turnCueLabel).toBe('A JOGAR');

    const inactive = computeSeatPresentation({
      name: 'Player 2',
      handCount: 10,
      isLocal: false,
      isDealer: false,
      teamLabel: null,
      secondaryBadge: null,
      showActiveHighlight: false,
      activeTurnLabel: 'A JOGAR',
      aspect: 'portrait'
    });
    expect(inactive.turnCueLabel).toBeNull();
  });

  it('keeps compact side seats as Player N without P# / team / counts', () => {
    const side = computeSeatPresentation({
      name: 'Player 2',
      handCount: 13,
      isLocal: false,
      isDealer: false,
      teamLabel: 'Eles',
      secondaryBadge: null,
      showActiveHighlight: false,
      aspect: 'portrait',
      compactSide: true
    });
    expect(side.labelText).toBe('Player 2');
    expect(side.monogram).toBe('');
    expect(side.showMonogram).toBe(false);
  });

  it('ignores pending ellipsis bid badges on seats', () => {
    const pending = computeSeatPresentation({
      name: 'Player 1',
      handCount: 13,
      isLocal: true,
      isDealer: true,
      teamLabel: null,
      secondaryBadge: '…',
      showActiveHighlight: true,
      aspect: 'portrait'
    });
    expect(pending.labelText).toBe('Player 1 · D');
  });
});