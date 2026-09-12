/**
 * Vite env accessors with Vitest/process.env override support.
 * Production/dev: import.meta.env.VITE_* (build-time).
 * Tests: may set process.env.VITE_* before calling readers.
 */

type ViteEnvKey = keyof ImportMetaEnv | `VITE_${string}`;

export function readViteEnv(key: ViteEnvKey): string | undefined {
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    const value = process.env[key as string];
    if (value !== undefined) return value;
  }
  const fromMeta = (import.meta.env as Record<string, string | boolean | undefined>)[
    key as string
  ];
  if (typeof fromMeta === 'string') return fromMeta;
  return undefined;
}

export function viteEnvFlag(key: ViteEnvKey, expected = 'true'): boolean {
  return readViteEnv(key) === expected;
}

/** CRA PUBLIC_URL equivalent — relative for Capacitor (`base: './'`). */
export function publicUrl(): string {
  const base = import.meta.env.BASE_URL || './';
  if (base === './' || base === '.') return '.';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function isDevMode(): boolean {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }
  return Boolean(import.meta.env.DEV);
}

export function isProdMode(): boolean {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV === 'production';
  }
  return Boolean(import.meta.env.PROD);
}

export function isTestMode(): boolean {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return true;
  }
  return import.meta.env.MODE === 'test';
}
