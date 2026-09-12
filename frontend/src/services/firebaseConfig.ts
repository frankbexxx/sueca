import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { readViteEnv } from '../config/runtimeEnv';

const projectId = readViteEnv('VITE_FIREBASE_PROJECT_ID');

const firebaseConfig = {
  apiKey: readViteEnv('VITE_FIREBASE_API_KEY'),
  authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
  databaseURL: readViteEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId,
  appId: readViteEnv('VITE_FIREBASE_APP_ID')
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getDatabase(app);
