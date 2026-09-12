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
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
