import { CARD_PLAY_VARIANTS, SfxId, SFX_PATHS } from '../constants/sfxAssets';

const SOUND_ENABLED_KEY = 'sueca-sound-enabled';

const DEFAULT_VOLUMES: Record<SfxId, number> = {
  cardPlay1: 0.55,
  cardPlay2: 0.55,
  cardPlay3: 0.55,
  shuffle: 0.6,
  trickWin: 0.5,
  error: 0.65,
  uiClick: 0.4
};

const audioPool = new Map<SfxId, HTMLAudioElement>();
let preloaded = false;

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
}

export function preloadSfx(): void {
  if (typeof window === 'undefined' || preloaded) return;
  preloaded = true;

  (Object.keys(SFX_PATHS) as SfxId[]).forEach((id) => {
    const audio = new Audio(SFX_PATHS[id]);
    audio.preload = 'auto';
    audioPool.set(id, audio);
  });
}

export function playSfx(id: SfxId, options?: { volume?: number }): void {
  if (!isSoundEnabled()) return;

  try {
    preloadSfx();
    const template = audioPool.get(id);
    if (!template) return;

    const audio = template.cloneNode(true) as HTMLAudioElement;
    audio.volume = options?.volume ?? DEFAULT_VOLUMES[id];
    void audio.play().catch(() => {
      /* autoplay restrictions or missing file */
    });
  } catch {
    /* silently ignore */
  }
}

export function playRandomCardPlay(): void {
  const id = CARD_PLAY_VARIANTS[Math.floor(Math.random() * CARD_PLAY_VARIANTS.length)];
  playSfx(id);
}

export function playShuffleSound(): void {
  playSfx('shuffle');
}

export function playTrickWinSound(): void {
  playSfx('trickWin');
}

export function playErrorSound(): void {
  playSfx('error');
}

export function playUiClick(): void {
  playSfx('uiClick');
}

/** Test helper */
export function resetAudioServiceForTests(): void {
  audioPool.clear();
  preloaded = false;
}
