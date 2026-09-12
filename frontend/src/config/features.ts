/**
 * Feature flags (Vite: VITE_* at build time).
 */
import { isDevMode, readViteEnv, viteEnvFlag } from './runtimeEnv';

export const USE_LOCAL_AI_ONLY =
  viteEnvFlag('VITE_USE_LOCAL_AI_ONLY') || readViteEnv('VITE_PLATFORM') === 'android';

export const MULTIPLAYER_ENABLED = viteEnvFlag('VITE_MULTIPLAYER_ENABLED');

export const ADS_ENABLED = viteEnvFlag('VITE_ADS_ENABLED');

export const GAMES_PER_INTERSTITIAL = Number(readViteEnv('VITE_GAMES_PER_AD') || '20') || 20;

/** Card Intelligence logger — default on; set VITE_CARD_INTELLIGENCE_LOGGER=false to disable */
export const CARD_INTELLIGENCE_LOGGER_ENABLED =
  readViteEnv('VITE_CARD_INTELLIGENCE_LOGGER') !== 'false';

/** H3 / dev console: encode + IDB helpers on window.__ci* (npm run dev or VITE_CARD_INTELLIGENCE_DEBUG=true) */
export const CARD_INTELLIGENCE_DEBUG =
  isDevMode() || viteEnvFlag('VITE_CARD_INTELLIGENCE_DEBUG');

/**
 * Mini-LLM advisory — default OFF everywhere (including npm run dev).
 * Requires CARD_INTELLIGENCE_DEBUG for __ciGetMiniLLMAdvice helper.
 */
export const CARD_INTELLIGENCE_LLM_ADVISORY = viteEnvFlag(
  'VITE_CARD_INTELLIGENCE_LLM_ADVISORY'
);

/** LLM provider kind — mock default; ollama requires model env */
export const CARD_INTELLIGENCE_LLM_PROVIDER =
  readViteEnv('VITE_CARD_INTELLIGENCE_LLM_PROVIDER') === 'ollama' ? 'ollama' : 'mock';

/** Ollama HTTP endpoint — local dev only */
export const CARD_INTELLIGENCE_LLM_ENDPOINT =
  readViteEnv('VITE_CARD_INTELLIGENCE_LLM_ENDPOINT') || 'http://localhost:11434';

/** Ollama model name — empty disables real provider (falls back to mock) */
export const CARD_INTELLIGENCE_LLM_MODEL =
  readViteEnv('VITE_CARD_INTELLIGENCE_LLM_MODEL') || '';

/**
 * Dev Seeded Game Lab — default OFF everywhere (including npm run dev).
 * Requires CARD_INTELLIGENCE_DEBUG for __ciListScenarios / __ciRunScenario helpers.
 */
export const CARD_INTELLIGENCE_DEV_LAB = viteEnvFlag('VITE_CARD_INTELLIGENCE_DEV_LAB');
