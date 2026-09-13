import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';
import { MULTIPLAYER_ENABLED } from '../config/features';
import { readViteEnv } from '../config/runtimeEnv';

type FirebaseClientConfig = {
  apiKey: string | undefined;
  authDomain: string | undefined;
  databaseURL: string | undefined;
  projectId: string | undefined;
  appId: string | undefined;
};

let cachedDatabase: Database | undefined;

function readFirebaseClientConfig(): FirebaseClientConfig {
  const projectId = readViteEnv('VITE_FIREBASE_PROJECT_ID');
  return {
    apiKey: readViteEnv('VITE_FIREBASE_API_KEY'),
    authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
    databaseURL: readViteEnv('VITE_FIREBASE_DATABASE_URL'),
    projectId,
    appId: readViteEnv('VITE_FIREBASE_APP_ID')
  };
}

/** True when all four public client env vars are present. Does not initialize Firebase. */
export function isFirebaseConfigComplete(): boolean {
  const config = readFirebaseClientConfig();
  return Boolean(config.apiKey && config.databaseURL && config.projectId && config.appId);
}

function assertFirebaseConfigComplete(config: FirebaseClientConfig): void {
  const missing: string[] = [];
  if (!config.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!config.databaseURL) missing.push('VITE_FIREBASE_DATABASE_URL');
  if (!config.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!config.appId) missing.push('VITE_FIREBASE_APP_ID');
  if (missing.length > 0) {
    throw new Error(
      `Firebase client config incomplete (required when multiplayer is enabled): ${missing.join(', ')}`
    );
  }
}

/**
 * Lazy Firebase App singleton.
 * No-op at module load — only initializes when multiplayer actually needs RTDB.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!MULTIPLAYER_ENABLED) {
    throw new Error(
      'Firebase is unavailable because VITE_MULTIPLAYER_ENABLED is not true'
    );
  }

  const existing = getApps()[0];
  if (existing) return existing;

  const config = readFirebaseClientConfig();
  assertFirebaseConfigComplete(config);
  return initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    databaseURL: config.databaseURL,
    projectId: config.projectId,
    appId: config.appId
  });
}

/** Lazy Realtime Database singleton (shares getFirebaseApp()). */
export function getFirebaseDatabase(): Database {
  if (cachedDatabase) return cachedDatabase;
  cachedDatabase = getDatabase(getFirebaseApp());
  return cachedDatabase;
}

/** @internal Vitest only — clear module singletons between cases. */
export function resetFirebaseSingletonsForTests(): void {
  cachedDatabase = undefined;
}
