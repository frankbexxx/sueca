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
