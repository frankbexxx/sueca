import { describe, expect, it } from 'vitest';
import {
  CARD_FRAME_ASPECT,
  cardFrameHeight,
  containDisplaySize,
  containedFrameHitArea,
  isCanonicalFrameRatio
} from './cardDisplayContract';

describe('REL-DECK-SIZE-02 cardDisplayContract', () => {
  it('defines outer 5:7 frame', () => {
    expect(CARD_FRAME_ASPECT).toBe(1.4);
    expect(cardFrameHeight(50)).toBe(70);
    expect(isCanonicalFrameRatio(50, 70)).toBe(true);
    expect(isCanonicalFrameRatio(50, 50)).toBe(false);
  });

  it('contain preserves source ratio and never exceeds frame', () => {
    // Exact 5:7 art fills the frame
    const poker = containDisplaySize(50, 70, 250, 350);
    expect(poker.width).toBeCloseTo(50, 5);
    expect(poker.height).toBeCloseTo(70, 5);

    // square Kenney in 5:7 → width-limited, letterbox height
    const kenney = containDisplaySize(50, 70, 384, 384);
    expect(kenney.width).toBeCloseTo(50, 5);
    expect(kenney.height).toBeCloseTo(50, 5);
    expect(kenney.height).toBeLessThan(70);

    // tall minicards → height-limited
    const mini = containDisplaySize(50, 70, 384, 593);
    expect(mini.height).toBeCloseTo(70, 5);
    expect(mini.width).toBeLessThan(50);
    expect(mini.width / mini.height).toBeCloseTo(384 / 593, 4);
  });

  it('hit area expands to full outer frame in texture space', () => {
    const frameW = 50;
    const frameH = 70;
    const tex = 384;
    const art = containDisplaySize(frameW, frameH, tex, tex);
    const hit = containedFrameHitArea(frameW, frameH, tex, tex, art.width, art.height);
    expect(hit.width).toBeCloseTo(frameW * (tex / art.width), 5);
    expect(hit.height).toBeCloseTo(frameH * (tex / art.height), 5);
    // taller than texture → covers letterbox zones
    expect(hit.height).toBeGreaterThan(tex);
  });

  it.each([
    ['pd-ornate', 366, 512],
    ['woodcut', 352, 493],
    ['kenney', 384, 384],
    ['minicards', 384, 593],
    ['jumbo-2', 352, 528]
  ] as const)('%s art fits 5:7 frame without crop or stretch', (_deck, tw, th) => {
    const frameW = 56;
    const frameH = cardFrameHeight(frameW);
    const art = containDisplaySize(frameW, frameH, tw, th);
    expect(art.width).toBeLessThanOrEqual(frameW + 1e-6);
    expect(art.height).toBeLessThanOrEqual(frameH + 1e-6);
    expect(art.width / art.height).toBeCloseTo(tw / th, 4);
    // touches at least one frame edge (fully contained)
    expect(art.width === frameW || art.height === frameH ||
      Math.abs(art.width - frameW) < 1e-6 || Math.abs(art.height - frameH) < 1e-6).toBe(true);
  });
});
