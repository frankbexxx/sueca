export type SfxId = 'cardPlay1' | 'cardPlay2' | 'cardPlay3' | 'shuffle' | 'trickWin' | 'error' | 'uiClick';

const base = `${process.env.PUBLIC_URL || ''}/assets/sfx`;

export const SFX_PATHS: Record<SfxId, string> = {
  cardPlay1: `${base}/card-play-1.ogg`,
  cardPlay2: `${base}/card-play-2.ogg`,
  cardPlay3: `${base}/card-play-3.ogg`,
  shuffle: `${base}/card-shuffle.ogg`,
  trickWin: `${base}/trick-win.ogg`,
  error: `${base}/error.ogg`,
  uiClick: `${base}/ui-click.ogg`
};

export const CARD_PLAY_VARIANTS: SfxId[] = ['cardPlay1', 'cardPlay2', 'cardPlay3'];
