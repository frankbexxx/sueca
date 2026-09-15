import { publicUrl } from '../config/runtimeEnv';

export type SfxId =
  | 'cardPlay1'
  | 'cardPlay2'
  | 'cardPlay3'
  | 'shuffle'
  | 'deal'
  | 'trickCollect'
  | 'roundStart'
  | 'roundEnd'
  | 'gameWin'
  | 'gameLose'
  | 'error'
  | 'uiClick';

const base = `${publicUrl()}/assets/sfx`;

export const SFX_PATHS: Record<SfxId, string> = {
  cardPlay1: `${base}/card-play-1.ogg`,
  cardPlay2: `${base}/card-play-2.ogg`,
  cardPlay3: `${base}/card-play-3.ogg`,
  shuffle: `${base}/card-shuffle.ogg`,
  deal: `${base}/deal-1.ogg`,
  trickCollect: `${base}/trick-collect.ogg`,
  roundStart: `${base}/round-start.ogg`,
  roundEnd: `${base}/round-end.ogg`,
  gameWin: `${base}/game-win.ogg`,
  gameLose: `${base}/game-lose.ogg`,
  error: `${base}/error.ogg`,
  uiClick: `${base}/ui-click.ogg`
};

export const CARD_PLAY_VARIANTS: SfxId[] = ['cardPlay1', 'cardPlay2', 'cardPlay3'];
