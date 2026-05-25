import { CARD_PLAY_VARIANTS, SfxId, SFX_PATHS } from '../constants/sfxAssets';
import { AMBIANCE_PATH } from '../constants/musicAssets';

const SOUND_ENABLED_KEY = 'sueca-sound-enabled';
const AMBIANCE_VOLUME = 0.28;

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
let ambianceAudio: HTMLAudioElement | null = null;
let ambiancePlaying = false;

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  if (enabled) {
    startAmbiance();
  } else {
    stopAmbiance();
  }
}

function getAmbianceAudio(): HTMLAudioElement {
  if (!ambianceAudio) {
    ambianceAudio = new Audio(AMBIANCE_PATH);
    ambianceAudio.loop = true;
    ambianceAudio.preload = 'auto';
    ambianceAudio.volume = AMBIANCE_VOLUME;
  }
  return ambianceAudio;
}

export function preloadAmbiance(): void {
  if (typeof window === 'undefined') return;
  getAmbianceAudio();
}

export function startAmbiance(): void {
  if (typeof window === 'undefined' || !isSoundEnabled()) return;

  try {
    const audio = getAmbianceAudio();
    if (ambiancePlaying && !audio.paused) return;

    void audio.play().then(() => {
      ambiancePlaying = true;
    }).catch(() => {
      /* autoplay restrictions */
    });
  } catch {
    /* silently ignore */
  }
}

export function stopAmbiance(): void {
  if (!ambianceAudio) return;
  ambianceAudio.pause();
  ambianceAudio.currentTime = 0;
  ambiancePlaying = false;
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
  stopAmbiance();
  audioPool.clear();
  ambianceAudio = null;
  preloaded = false;
}
