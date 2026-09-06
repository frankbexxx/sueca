/**
 * Pure layout math for the Sueca Phaser POC (no Phaser imports).
 */

export type PhaserCompass = 'south' | 'west' | 'north' | 'east';

export interface PhaserPoint {
  x: number;
  y: number;
}

export interface PhaserTableLayout {
  width: number;
  height: number;
  center: PhaserPoint;
  seatAnchor: Record<PhaserCompass, PhaserPoint>;
  handY: number;
  cardWidth: number;
  cardHeight: number;
  opponentCardWidth: number;
  opponentCardHeight: number;
}

const COMPASS_FROM_OFFSET: PhaserCompass[] = ['south', 'west', 'north', 'east'];

/** Map engine player index → compass relative to local (south). */
export function playerIndexToCompass(
  playerIndex: number,
  localPlayerIndex: number
): PhaserCompass {
  const offset = (playerIndex - localPlayerIndex + 4) % 4;
  return COMPASS_FROM_OFFSET[offset] ?? 'south';
}

export function buildPhaserTableLayout(
  width: number,
  height: number
): PhaserTableLayout {
  const w = Math.max(280, width);
  const h = Math.max(320, height);
  const cardWidth = Math.min(72, Math.max(48, Math.floor(w * 0.09)));
  const cardHeight = Math.round(cardWidth * 1.4);
  const opponentCardWidth = Math.round(cardWidth * 0.55);
  const opponentCardHeight = Math.round(cardHeight * 0.55);
  const marginX = Math.max(48, Math.floor(w * 0.08));
  const marginY = Math.max(40, Math.floor(h * 0.08));
  const handY = h - Math.max(56, cardHeight * 0.55);

  return {
    width: w,
    height: h,
    center: { x: w / 2, y: h * 0.42 },
    seatAnchor: {
      south: { x: w / 2, y: handY - cardHeight * 0.35 },
      west: { x: marginX, y: h * 0.4 },
      north: { x: w / 2, y: marginY + 24 },
      east: { x: w - marginX, y: h * 0.4 }
    },
    handY,
    cardWidth,
    cardHeight,
    opponentCardWidth,
    opponentCardHeight
  };
}

/** Fan positions for local hand cards along the bottom. */
export function layoutLocalHandPositions(
  count: number,
  layout: PhaserTableLayout
): PhaserPoint[] {
  if (count <= 0) return [];
  const { width, handY, cardWidth } = layout;
  const spacing = Math.min(cardWidth * 0.72, (width * 0.78) / Math.max(count, 1));
  const total = spacing * (count - 1);
  const startX = width / 2 - total / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * spacing,
    y: handY
  }));
}

/** Stacked backs for an opponent seat. */
export function layoutOpponentBackPositions(
  count: number,
  compass: PhaserCompass,
  layout: PhaserTableLayout
): PhaserPoint[] {
  const anchor = layout.seatAnchor[compass];
  const n = Math.min(count, 10);
  const gap = compass === 'north' || compass === 'south' ? 10 : 8;
  return Array.from({ length: n }, (_, i) => {
    const mid = (n - 1) / 2;
    if (compass === 'west' || compass === 'east') {
      return { x: anchor.x, y: anchor.y + (i - mid) * gap };
    }
    return { x: anchor.x + (i - mid) * gap, y: anchor.y };
  });
}

/** Trick slot near center by seat compass. */
export function layoutTrickSlot(
  compass: PhaserCompass,
  layout: PhaserTableLayout
): PhaserPoint {
  const { center, cardWidth, cardHeight } = layout;
  const dx = cardWidth * 0.55;
  const dy = cardHeight * 0.4;
  switch (compass) {
    case 'south':
      return { x: center.x, y: center.y + dy };
    case 'north':
      return { x: center.x, y: center.y - dy };
    case 'west':
      return { x: center.x - dx, y: center.y };
    case 'east':
      return { x: center.x + dx, y: center.y };
    default:
      return center;
  }
}
