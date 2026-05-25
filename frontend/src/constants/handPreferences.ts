import { Suit } from '../types/game';
import { STORAGE_KEYS } from './gameConstants';

export type TrumpPosition = 'left' | 'right' | 'natural';

export type SuitOrderPresetId = 'vpvp' | 'alphabetical' | 'spades-first';

export interface HandPreferences {
  sortEnabled: boolean;
  suitOrder: Suit[];
  trumpPosition: TrumpPosition;
  suitOrderPreset: SuitOrderPresetId;
}

export const DEFAULT_SUIT_ORDER: Suit[] = ['hearts', 'clubs', 'diamonds', 'spades'];

export const SUIT_ORDER_PRESETS: Record<SuitOrderPresetId, { labelPt: string; labelEn: string; order: Suit[] }> = {
  vpvp: {
    labelPt: 'Vermelho / Preto / Vermelho / Preto (♥ ♣ ♦ ♠)',
    labelEn: 'Red / Black / Red / Black (♥ ♣ ♦ ♠)',
    order: ['hearts', 'clubs', 'diamonds', 'spades']
  },
  alphabetical: {
    labelPt: 'Alfabético (♣ ♦ ♥ ♠)',
    labelEn: 'Alphabetical (♣ ♦ ♥ ♠)',
    order: ['clubs', 'diamonds', 'hearts', 'spades']
  },
  'spades-first': {
    labelPt: 'Espadas primeiro',
    labelEn: 'Spades first',
    order: ['spades', 'hearts', 'diamonds', 'clubs']
  }
};

const VALID_SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];

function parseSuitOrder(raw: string | null): Suit[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 4) return null;
    if (!parsed.every((s) => VALID_SUITS.includes(s as Suit))) return null;
    return parsed as Suit[];
  } catch {
    return null;
  }
}

export function loadHandPreferences(): HandPreferences {
  const presetRaw = localStorage.getItem(STORAGE_KEYS.HAND_SUIT_ORDER) as SuitOrderPresetId | null;
  const preset =
    presetRaw && presetRaw in SUIT_ORDER_PRESETS ? presetRaw : ('vpvp' as SuitOrderPresetId);
  const customOrder = parseSuitOrder(localStorage.getItem(`${STORAGE_KEYS.HAND_SUIT_ORDER}-custom`));
  const trumpRaw = localStorage.getItem(STORAGE_KEYS.TRUMP_POSITION) as TrumpPosition | null;

  return {
    sortEnabled: localStorage.getItem(STORAGE_KEYS.SORT_HAND) !== 'false',
    suitOrder: customOrder ?? SUIT_ORDER_PRESETS[preset].order,
    trumpPosition: trumpRaw === 'right' || trumpRaw === 'natural' ? trumpRaw : 'left',
    suitOrderPreset: preset
  };
}

export function saveHandPreferences(prefs: Partial<HandPreferences>): void {
  if (prefs.sortEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SORT_HAND, String(prefs.sortEnabled));
  }
  if (prefs.suitOrderPreset !== undefined) {
    localStorage.setItem(STORAGE_KEYS.HAND_SUIT_ORDER, prefs.suitOrderPreset);
    localStorage.setItem(
      `${STORAGE_KEYS.HAND_SUIT_ORDER}-custom`,
      JSON.stringify(SUIT_ORDER_PRESETS[prefs.suitOrderPreset].order)
    );
  }
  if (prefs.trumpPosition !== undefined) {
    localStorage.setItem(STORAGE_KEYS.TRUMP_POSITION, prefs.trumpPosition);
  }
}
