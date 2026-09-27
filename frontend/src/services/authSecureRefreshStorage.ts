/**
 * AUTH-01D — Android Keystore-backed refresh-token storage.
 *
 * Uses @aparajita/capacitor-secure-storage (Capacitor 6 · AndroidKeyStore).
 * Do NOT use @capacitor/preferences for refresh tokens.
 * Web must not call these helpers for persistence (see authSessionStorage).
 */

const KEY_PREFIX = 'suecao-auth_';
const REFRESH_KEY = 'refresh-v1';

export type SecureRefreshAdapter = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

let adapterOverride: SecureRefreshAdapter | null = null;

/** In-memory adapter for Android-platform unit tests (no native Keystore). */
export function createMemorySecureRefreshAdapter(): SecureRefreshAdapter {
  const map = new Map<string, string>();
  return {
    get: async (key) => map.get(key) ?? null,
    set: async (key, value) => {
      map.set(key, value);
    },
    remove: async (key) => {
      map.delete(key);
    }
  };
}

export function setSecureRefreshAdapterForTests(adapter: SecureRefreshAdapter | null): void {
  adapterOverride = adapter;
}

async function nativeAdapter(): Promise<SecureRefreshAdapter> {
  const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
  await SecureStorage.setKeyPrefix(KEY_PREFIX);
  return {
    get: async (key) => {
      const v = await SecureStorage.get(key);
      return typeof v === 'string' ? v : null;
    },
    set: async (key, value) => {
      await SecureStorage.set(key, value);
    },
    remove: async (key) => {
      await SecureStorage.remove(key);
    }
  };
}

async function resolveAdapter(): Promise<SecureRefreshAdapter> {
  if (adapterOverride) return adapterOverride;
  return nativeAdapter();
}

export async function secureReadRefreshToken(): Promise<string | null> {
  const adapter = await resolveAdapter();
  return adapter.get(REFRESH_KEY);
}

export async function secureWriteRefreshToken(refreshToken: string): Promise<void> {
  const adapter = await resolveAdapter();
  await adapter.set(REFRESH_KEY, refreshToken);
}

export async function secureClearRefreshToken(): Promise<void> {
  const adapter = await resolveAdapter();
  await adapter.remove(REFRESH_KEY);
}
