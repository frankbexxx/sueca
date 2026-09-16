import { isDevMode, readViteEnv } from '../config/runtimeEnv';

/**
 * Central remote music base URL (no scattered CDN origins).
 * Set via `VITE_MUSIC_REMOTE_BASE_URL` at build time.
 * Missing / invalid → remote catalog fetch disabled (core fallback).
 *
 * Note: `*.r2.dev` public endpoints are smoke/dev only — not a production CDN contract.
 */

let baseUrlOverride: string | null | undefined;

function normalizeBaseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const path = u.pathname.replace(/\/+$/, '');
    return `${u.origin}${path === '/' ? '' : path}`;
  } catch {
    return null;
  }
}

/** Configured remote base, or null when remote catalog is disabled. */
export function getMusicRemoteBaseUrl(): string | null {
  if (baseUrlOverride !== undefined) {
    return normalizeBaseUrl(baseUrlOverride);
  }
  return normalizeBaseUrl(readViteEnv('VITE_MUSIC_REMOTE_BASE_URL'));
}

export function isMusicRemoteCatalogEnabled(): boolean {
  return getMusicRemoteBaseUrl() !== null;
}

/** True when base hostname is Cloudflare R2.dev public (smoke/dev). */
export function isMusicRemoteSmokeDevEndpoint(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).hostname.endsWith('.r2.dev');
  } catch {
    return false;
  }
}

/** Quiet in production builds — development / test only. */
export function musicRemoteDevLog(message: string, detail?: unknown): void {
  if (!isDevMode()) return;
  if (detail === undefined) {
    console.info(`[music-remote] ${message}`);
    return;
  }
  console.info(`[music-remote] ${message}`, detail);
}

/** Test helper — pass null to force-disable; undefined resets to env. */
export function __setMusicRemoteBaseUrlForTests(url: string | null | undefined): void {
  baseUrlOverride = url;
}

export function __resetMusicRemoteConfigForTests(): void {
  baseUrlOverride = undefined;
}
