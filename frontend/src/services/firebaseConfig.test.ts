import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInitializeApp = vi.fn((config: unknown) => ({ name: '[DEFAULT]', config }));
const mockGetApps = vi.fn(() => [] as unknown[]);
const mockGetDatabase = vi.fn((app: unknown) => ({ app, kind: 'database' }));

vi.mock('firebase/app', () => ({
  initializeApp: (config: unknown) => mockInitializeApp(config),
  getApps: () => mockGetApps()
}));

vi.mock('firebase/database', () => ({
  getDatabase: (app: unknown) => mockGetDatabase(app)
}));

const mockReadViteEnv = vi.fn<(key: string) => string | undefined>();

vi.mock('../config/runtimeEnv', () => ({
  readViteEnv: (key: string) => mockReadViteEnv(key)
}));

vi.mock('../config/features', () => ({
  MULTIPLAYER_ENABLED: true
}));

describe('firebaseConfig (lazy init)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockInitializeApp.mockClear();
    mockGetApps.mockClear();
    mockGetDatabase.mockClear();
    mockGetApps.mockReturnValue([]);
    mockReadViteEnv.mockImplementation(() => undefined);
  });

  async function loadConfig() {
    return import('./firebaseConfig');
  }

  it('does not call initializeApp or getDatabase on module import', async () => {
    await loadConfig();
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetDatabase).not.toHaveBeenCalled();
  });

  it('multiplayer ON + incomplete config => controlled error (no obscure Firebase init)', async () => {
    mockReadViteEnv.mockImplementation((key) =>
      key === 'VITE_FIREBASE_API_KEY' ? 'test-key' : undefined
    );
    const { getFirebaseApp, resetFirebaseSingletonsForTests } = await loadConfig();
    resetFirebaseSingletonsForTests();
    expect(() => getFirebaseApp()).toThrow(/Firebase client config incomplete/i);
    expect(() => getFirebaseApp()).toThrow(/VITE_FIREBASE_PROJECT_ID/);
    expect(mockInitializeApp).not.toHaveBeenCalled();
  });

  it('multiplayer ON + complete config => initializes once (singleton)', async () => {
    mockReadViteEnv.mockImplementation((key) => {
      switch (key) {
        case 'VITE_FIREBASE_API_KEY':
          return 'api';
        case 'VITE_FIREBASE_DATABASE_URL':
          return 'https://example.firebaseio.com';
        case 'VITE_FIREBASE_PROJECT_ID':
          return 'example';
        case 'VITE_FIREBASE_APP_ID':
          return '1:1:web:abc';
        default:
          return undefined;
      }
    });
    const { getFirebaseApp, getFirebaseDatabase, resetFirebaseSingletonsForTests } =
      await loadConfig();
    resetFirebaseSingletonsForTests();

    const app1 = getFirebaseApp();
    mockGetApps.mockReturnValue([app1]);
    const app2 = getFirebaseApp();
    expect(app1).toBe(app2);
    expect(mockInitializeApp).toHaveBeenCalledTimes(1);

    const db1 = getFirebaseDatabase();
    const db2 = getFirebaseDatabase();
    expect(db1).toBe(db2);
    expect(mockGetDatabase).toHaveBeenCalledTimes(1);
  });
});

describe('firebaseConfig when multiplayer is OFF', () => {
  beforeEach(() => {
    vi.resetModules();
    mockInitializeApp.mockClear();
    mockGetApps.mockClear();
    mockGetDatabase.mockClear();
    mockGetApps.mockReturnValue([]);
    mockReadViteEnv.mockReturnValue(undefined);
  });

  it('refuses init and never calls Firebase SDK', async () => {
    vi.doMock('../config/features', () => ({
      MULTIPLAYER_ENABLED: false
    }));
    const { getFirebaseApp, getFirebaseDatabase, resetFirebaseSingletonsForTests } =
      await import('./firebaseConfig');
    resetFirebaseSingletonsForTests();
    expect(() => getFirebaseApp()).toThrow(/VITE_MULTIPLAYER_ENABLED is not true/);
    expect(() => getFirebaseDatabase()).toThrow(/VITE_MULTIPLAYER_ENABLED is not true/);
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetDatabase).not.toHaveBeenCalled();
  });
});
