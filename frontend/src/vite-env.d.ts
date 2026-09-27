/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CARD_EXT?: string;
  readonly VITE_USE_LOCAL_AI_ONLY?: string;
  readonly VITE_PLATFORM?: string;
  readonly VITE_MULTIPLAYER_ENABLED?: string;
  readonly VITE_ADS_ENABLED?: string;
  readonly VITE_GAMES_PER_AD?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_DATABASE_URL?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_DEBUG_MP?: string;
  readonly VITE_AI_SERVICE_URL?: string;
  readonly VITE_TABLE_RENDERER?: string;
  readonly VITE_SHOW_EXPERIMENTAL_GAMES?: string;
  readonly VITE_CARD_INTELLIGENCE_LOGGER?: string;
  readonly VITE_CARD_INTELLIGENCE_DEBUG?: string;
  readonly VITE_CARD_INTELLIGENCE_LLM_ADVISORY?: string;
  readonly VITE_CARD_INTELLIGENCE_LLM_PROVIDER?: string;
  readonly VITE_CARD_INTELLIGENCE_LLM_ENDPOINT?: string;
  readonly VITE_CARD_INTELLIGENCE_LLM_MODEL?: string;
  readonly VITE_CARD_INTELLIGENCE_DEV_LAB?: string;
  /** Smoke/dev remote music base (e.g. r2.dev). Omit in production CDN contract. */
  readonly VITE_MUSIC_REMOTE_BASE_URL?: string;
  /** Optional same-origin smoke when base URL unset. */
  readonly VITE_MUSIC_REMOTE_SMOKE?: string;
  /** AUTH-01C — Google Identity Services Web client ID (OAuth Web client). */
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
  /**
   * AUTH-01D — Google Android OAuth client ID (package + SHA in Cloud Console).
   * Capgo Credential Manager still uses the Web client as webClientId/serverClientId;
   * this Android client ID is required for config readiness + backend audiences.
   */
  readonly VITE_GOOGLE_ANDROID_CLIENT_ID?: string;
  /** AUTH-01C/D — Suecão Account auth API base (e.g. http://127.0.0.1:8787). */
  readonly VITE_AUTH_API_BASE_URL?: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
