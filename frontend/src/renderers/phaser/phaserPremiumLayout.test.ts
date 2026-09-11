import { CARD_BACK_PATH, CARD_BACK_TEXTURE_KEY } from '../../constants/cardAssets';
import {
  computePremiumTableLayout,
  PREMIUM_TABLE,
  premiumTrickOffset,
  zonesOverlap
} from './phaserPremiumLayout';
import {
  buildPhaserTableLayout,
  computeLocalHandLayout,
  layoutTrickSlot
} from './phaserTableLayout';

describe('UX-P3.1 premium table layout', () => {
  const phones = [
    { w: 360, h: 800 },
    { w: 390, h: 844 },
    { w: 414, h: 896 }
  ] as const;

  it.each(phones)('zones fit $w×$h without hand/trick critical overlap', ({ w, h }) => {
    const premium = computePremiumTableLayout({ width: w, height: h });
    const { zones } = premium;
    expect(zones.felt.width).toBeGreaterThan(200);
    expect(zones.trick.height).toBeGreaterThan(premium.cardHeight);
    expect(zones.hand.y).toBeGreaterThan(zones.trick.y);
    // Trick must sit above local seat / hand band.
    expect(zones.trick.y + zones.trick.height).toBeLessThanOrEqual(zones.localSeat.y + 8);
    expect(zones.topSeat.y).toBeLessThan(zones.trick.y);
    expect(premium.handY).toBeGreaterThan(premium.center.y);
    // No critical overlap: trick vs hand with small slack.
    expect(zonesOverlap(zones.trick, zones.hand, 4)).toBe(false);
  });

  it('seat anchors derive from zones on 390×844', () => {
    const layout = buildPhaserTableLayout(390, 844);
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
    expect(layout.trickCardWidth / layout.cardWidth).toBeGreaterThan(1.05);
    expect(layout.trickCardWidth / layout.cardWidth).toBeLessThan(1.12);
    expect(PREMIUM_TABLE.trickScale).toBe(1.08);
  });

  it('card back path + texture key stay stable for swap', () => {
    expect(CARD_BACK_PATH).toContain('/assets/cards2/card_back.');
    expect(CARD_BACK_TEXTURE_KEY).toBe('card-back');
  });

  it('landscape sanity: no inverted zones', () => {
    const layout = buildPhaserTableLayout(740, 360);
    expect(layout.aspect).toBe('landscape');
    expect(layout.handY).toBeGreaterThan(layout.center.y);
    expect(layout.seatAnchor.west.x).toBeLessThan(layout.seatAnchor.east.x);
  });
});
