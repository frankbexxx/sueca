/**
 * Feature flags (CRA: REACT_APP_* at build time).
 */
export const USE_LOCAL_AI_ONLY =
  process.env.REACT_APP_USE_LOCAL_AI_ONLY === 'true' ||
  process.env.REACT_APP_PLATFORM === 'android';

export const MULTIPLAYER_ENABLED = process.env.REACT_APP_MULTIPLAYER_ENABLED === 'true';

export const ADS_ENABLED = process.env.REACT_APP_ADS_ENABLED === 'true';

export const GAMES_PER_INTERSTITIAL = Number(process.env.REACT_APP_GAMES_PER_AD || '20') || 20;

/** Card Intelligence logger — default on; set REACT_APP_CARD_INTELLIGENCE_LOGGER=false to disable */
export const CARD_INTELLIGENCE_LOGGER_ENABLED =
  process.env.REACT_APP_CARD_INTELLIGENCE_LOGGER !== 'false';

/** H3 / dev console: encode + IDB helpers on window.__ci* (npm start or REACT_APP_CARD_INTELLIGENCE_DEBUG=true) */
export const CARD_INTELLIGENCE_DEBUG =
  process.env.NODE_ENV === 'development' ||
  process.env.REACT_APP_CARD_INTELLIGENCE_DEBUG === 'true';

/**
 * Mini-LLM advisory — default OFF everywhere (including npm start).
 * Requires CARD_INTELLIGENCE_DEBUG for __ciGetMiniLLMAdvice helper.
 */
export const CARD_INTELLIGENCE_LLM_ADVISORY =
  process.env.REACT_APP_CARD_INTELLIGENCE_LLM_ADVISORY === 'true';

/** LLM provider kind — mock default; ollama requires model env */
export const CARD_INTELLIGENCE_LLM_PROVIDER =
  process.env.REACT_APP_CARD_INTELLIGENCE_LLM_PROVIDER === 'ollama'
    ? 'ollama'
    : 'mock';

/** Ollama HTTP endpoint — local dev only */
export const CARD_INTELLIGENCE_LLM_ENDPOINT =
  process.env.REACT_APP_CARD_INTELLIGENCE_LLM_ENDPOINT || 'http://localhost:11434';

/** Ollama model name — empty disables real provider (falls back to mock) */
export const CARD_INTELLIGENCE_LLM_MODEL =
  process.env.REACT_APP_CARD_INTELLIGENCE_LLM_MODEL || '';

/**
 * Dev Seeded Game Lab — default OFF everywhere (including npm start).
 * Requires CARD_INTELLIGENCE_DEBUG for __ciListScenarios / __ciRunScenario helpers.
 */
export const CARD_INTELLIGENCE_DEV_LAB =
  process.env.REACT_APP_CARD_INTELLIGENCE_DEV_LAB === 'true';
