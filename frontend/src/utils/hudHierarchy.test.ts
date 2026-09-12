import {
  kingHudContractPrimary,
  kingHudContractTitle,
  kingHudMatchProgress
} from '../models/games/king/kingContracts';
import { computeSeatPresentation } from '../renderers/phaser/phaserSeatPresentation';
import { formatTrickProgressLabel } from '../utils/trickProgress';

describe('UX-P3.4b HUD information hierarchy', () => {
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

  it('omits team on top seat while local Sueca may keep team', () => {
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
    expect(north.labelText).not.toMatch(/Nós/i);
    expect(north.labelText).not.toMatch(/\b10\b/);

    const local = computeSeatPresentation({
      name: 'Player 1',
      handCount: 10,
      isLocal: true,
      isDealer: false,
      teamLabel: 'Nós',
      secondaryBadge: null,
      showActiveHighlight: true,
      aspect: 'portrait'
    });
    expect(local.labelText).toMatch(/Nós/);
    expect(local.showActiveRing).toBe(true);
  });

  it('keeps compact side seats free of team noise on 360', () => {
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
    expect(side.labelText).toBe('P2');
    expect(side.monogram).toBe('2');
  });
});
