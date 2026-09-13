import { CARD_BACK_PATH, CARD_BACK_TEXTURE_KEY } from '../../constants/cardAssets';
import {
  computePremiumTableLayout,
  PREMIUM_TABLE,
  premiumTrickOffset,
  resolvePremiumAspectMode,
  zonesOverlap
} from './phaserPremiumLayout';
import {
  buildPhaserTableLayout,
  computeLocalHandLayout,
  layoutTrickSlot,
  resolveAspectMode
} from './phaserTableLayout';
import { computeSeatPresentation } from './phaserSeatPresentation';

describe('UX-P3.1 premium table layout', () => {
  const phones = [
    { w: 360, h: 800 },
    { w: 390, h: 844 },
    { w: 414, h: 896 }
  ];

  it.each(phones)('zones fit $w×$h without hand/trick critical overlap', ({ w, h }) => {
    const premium = computePremiumTableLayout({ width: w, height: h });
    const { zones } = premium;
    expect(zones.felt.width).toBeGreaterThan(200);
    expect(zones.trick.height).toBeGreaterThan(premium.cardHeight);
    expect(zones.hand.y).toBeGreaterThan(zones.trick.y);
    expect(zones.trick.y + zones.trick.height).toBeLessThanOrEqual(zones.localSeat.y + 8);
    expect(zones.topSeat.y).toBeLessThan(zones.trick.y);
    expect(premium.handY).toBeGreaterThan(premium.center.y);
    expect(zonesOverlap(zones.trick, zones.hand, 4)).toBe(false);
  });

  it('compacts side seats on 360×800 without invading trick', () => {
    const layout = buildPhaserTableLayout(360, 800);
    expect(layout.compactSideSeats).toBe(true);
    expect(layout.zones.leftSeat.width).toBeLessThanOrEqual(44);
    expect(layout.zones.rightSeat.width).toBeLessThanOrEqual(44);
    expect(layout.zones.leftSeat.x + layout.zones.leftSeat.width).toBeLessThan(
      layout.zones.trick.x + 8
    );
    expect(layout.zones.trick.x + layout.zones.trick.width).toBeLessThan(
      layout.zones.rightSeat.x + 8
    );
    const side = computeSeatPresentation({
      name: 'Player 2',
      handCount: 10,
      isLocal: false,
      isDealer: false,
      teamLabel: 'Eles',
      secondaryBadge: null,
      showActiveHighlight: false,
      aspect: 'portrait',
      compactSide: true
    });
    expect(side.labelText).not.toMatch(/Eles/i);
    expect(side.labelText).not.toMatch(/\b10\b/);
    expect(side.labelText).toBe('Player 2');
    expect(side.monogram).toBe('');
    expect(side.showMonogram).toBe(false);
    expect(side.labelText.length).toBeLessThan(14);
  });

  it('grows opponent backs for readability without matching hand size', () => {
    const layout = buildPhaserTableLayout(390, 844);
    expect(layout.opponentCardWidth / layout.cardWidth).toBeGreaterThanOrEqual(0.75);
    expect(layout.opponentCardWidth).toBeLessThan(layout.cardWidth);
  });

  it('keeps portrait aspect when canvas is short but window is tall (sheets)', () => {
    const canvasW = 390;
    const canvasH = 420;
    const windowRef = { width: 390, height: 844 };
    expect(resolveAspectMode(canvasW, canvasH)).toBe('desktop');
    expect(resolveAspectMode(canvasW, canvasH, windowRef)).toBe('portrait');
    expect(
      buildPhaserTableLayout(canvasW, canvasH, { orientationReference: windowRef }).aspect
    ).toBe('portrait');
    expect(resolvePremiumAspectMode(360, 380, { width: 360, height: 800 })).toBe(
      'portrait'
    );
  });

  it('still resolves real landscape from reference', () => {
    expect(resolveAspectMode(740, 320, { width: 844, height: 390 })).toBe('landscape');
  });

  it('seat anchors derive from zones on 390×844', () => {
    const layout = buildPhaserTableLayout(390, 844);
    expect(layout.compactSideSeats).toBe(false);
    expect(layout.seatAnchor.north.y).toBeLessThan(layout.center.y);
    expect(layout.seatAnchor.south.y).toBeGreaterThan(layout.center.y);
    expect(layout.seatAnchor.west.x).toBeLessThan(layout.center.x);
    expect(layout.seatAnchor.east.x).toBeGreaterThan(layout.center.x);
    expect(layout.zones.leftSeat.cx).toBe(layout.seatAnchor.west.x);
    expect(layout.zones.rightSeat.cx).toBe(layout.seatAnchor.east.x);
  });

  it('trick anchors follow premium offsets', () => {
    const layout = buildPhaserTableLayout(390, 844);
    const n = layoutTrickSlot('north', layout);
    const e = layoutTrickSlot('east', layout);
    const s = layoutTrickSlot('south', layout);
    const west = layoutTrickSlot('west', layout);
    const offN = premiumTrickOffset('north', layout);
    expect(n.y).toBe(layout.center.y + offN.y);
    expect(e.x).toBeGreaterThan(layout.center.x);
    expect(west.x).toBeLessThan(layout.center.x);
    expect(s.y).toBeGreaterThan(layout.center.y);
    expect(Math.abs(e.x - layout.center.x)).toBeGreaterThanOrEqual(30);
  });

  it('preserves UX-P1 hand fan for same count across variants', () => {
    const phone = { width: 390, height: 844 };
    const sueca = computeLocalHandLayout({ ...phone, cardCount: 10 });
    const spades = computeLocalHandLayout({ ...phone, cardCount: 13 });
    const hearts = computeLocalHandLayout({ ...phone, cardCount: 13 });
    const king = computeLocalHandLayout({ ...phone, cardCount: 13 });
    expect(sueca.layout.cardWidth).toBe(spades.layout.cardWidth);
    expect(spades.slots.map((s) => [s.x, s.y, s.rotationDeg])).toEqual(
      hearts.slots.map((s) => [s.x, s.y, s.rotationDeg])
    );
    expect(hearts.slots.map((s) => [s.x, s.y, s.rotationDeg])).toEqual(
      king.slots.map((s) => [s.x, s.y, s.rotationDeg])
    );
    expect(sueca.slots).toHaveLength(10);
    expect(spades.slots).toHaveLength(13);
  });

  it('exposes trick card size slightly larger than hand', () => {
    const layout = buildPhaserTableLayout(390, 844);
    expect(layout.trickCardWidth).toBeGreaterThan(layout.cardWidth);
    expect(layout.trickCardHeight).toBeGreaterThan(layout.cardHeight);
    expect(layout.trickCardWidth / layout.cardWidth).toBeGreaterThan(1.08);
    expect(layout.trickCardWidth / layout.cardWidth).toBeLessThan(1.15);
    expect(PREMIUM_TABLE.trickScale).toBe(1.11);
    expect(PREMIUM_TABLE.handPresenceScale).toBeGreaterThanOrEqual(1.04);
    expect(PREMIUM_TABLE.handPresenceScale).toBeLessThanOrEqual(1.08);
  });

  it('separates north seat chrome above opponent backs', () => {
    const layout = buildPhaserTableLayout(390, 844);
    expect(layout.seatAnchor.north.y).toBeGreaterThan(layout.zones.topSeat.y + 8);
    expect(layout.zones.topSeat.height).toBeGreaterThanOrEqual(44);
    const north = computeSeatPresentation({
      name: 'Player 3',
      handCount: 10,
      isLocal: false,
      isDealer: false,
      teamLabel: 'Nós',
      secondaryBadge: null,
      showActiveHighlight: false,
      aspect: 'portrait',
      omitTeam: true
    });
    expect(north.labelText).toBe('Player 3');
    expect(north.labelText).not.toMatch(/Nós/i);
    expect(north.showMonogram).toBe(false);
  });

  it('card back path + texture key stay stable for swap', () => {
    expect(CARD_BACK_PATH).toContain('/assets/cards3/card_back.');
    expect(CARD_BACK_TEXTURE_KEY).toBe('card-back');
  });

  it('landscape sanity: no inverted zones', () => {
    const layout = buildPhaserTableLayout(740, 360);
    expect(layout.aspect).toBe('landscape');
    expect(layout.handY).toBeGreaterThan(layout.center.y);
    expect(layout.seatAnchor.west.x).toBeLessThan(layout.seatAnchor.east.x);
  });
});