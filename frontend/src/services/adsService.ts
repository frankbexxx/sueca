import { ADS_ENABLED, GAMES_PER_INTERSTITIAL } from '../config/features';

const STORAGE_GAMES = 'suecao-games-since-ad';

export function recordGameFinished(): void {
  const n = Number(localStorage.getItem(STORAGE_GAMES) || '0') + 1;
  localStorage.setItem(STORAGE_GAMES, String(n));
}

export function shouldShowInterstitial(): boolean {
  if (!ADS_ENABLED) return false;
  const n = Number(localStorage.getItem(STORAGE_GAMES) || '0');
  return n > 0 && n % GAMES_PER_INTERSTITIAL === 0;
}

/** Stub — wire @capacitor-community/admob in native build */
export async function showInterstitialIfDue(): Promise<void> {
  if (!shouldShowInterstitial()) return;
  if (process.env.NODE_ENV === 'development') {
    console.info('[ads] interstitial slot (disabled in dev)');
  }
  localStorage.setItem(STORAGE_GAMES, '0');
}
