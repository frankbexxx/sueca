/**
 * AUTH-01C/D — Suecão Account auth configuration (Vite env).
 *
 * Web: GIS renderButton needs VITE_GOOGLE_WEB_CLIENT_ID + VITE_AUTH_API_BASE_URL
 * Android native: Capgo Credential Manager needs Web client as webClientId (serverClientId);
 *   Android OAuth client ID is still required in config / backend audiences (package+SHA in Cloud).
 */
import { readViteEnv } from './runtimeEnv';
import { isAndroidAuthPlatform } from '../platform/authPlatform';

export function getGoogleWebClientId(): string | undefined {
  const v = readViteEnv('VITE_GOOGLE_WEB_CLIENT_ID')?.trim();
  return v || undefined;
}

export function getGoogleAndroidClientId(): string | undefined {
  const v = readViteEnv('VITE_GOOGLE_ANDROID_CLIENT_ID')?.trim();
  return v || undefined;
}

export function getAuthApiBaseUrl(): string | undefined {
  const v = readViteEnv('VITE_AUTH_API_BASE_URL')?.trim();
  if (!v) return undefined;
  return v.replace(/\/$/, '');
}

/** Both client id and API base must be set for Web Google sign-in. */
export function isWebGoogleAuthConfigured(): boolean {
  return Boolean(getGoogleWebClientId() && getAuthApiBaseUrl());
}

/**
 * Android native Google: Web client (Credential Manager serverClientId) +
 * Android client id (Cloud registration / backend audience) + Account API base.
 */
export function isAndroidGoogleAuthConfigured(): boolean {
  return Boolean(
    getGoogleWebClientId() && getGoogleAndroidClientId() && getAuthApiBaseUrl()
  );
}

export function isGoogleAuthConfiguredForPlatform(): boolean {
  return isAndroidAuthPlatform()
    ? isAndroidGoogleAuthConfigured()
    : isWebGoogleAuthConfigured();
}

export type AuthConfigMissingKey =
  | 'VITE_GOOGLE_WEB_CLIENT_ID'
  | 'VITE_GOOGLE_ANDROID_CLIENT_ID'
  | 'VITE_AUTH_API_BASE_URL';

export function getAuthConfigStatus(): {
  configured: boolean;
  missing: AuthConfigMissingKey[];
} {
  const missing: AuthConfigMissingKey[] = [];
  if (!getGoogleWebClientId()) missing.push('VITE_GOOGLE_WEB_CLIENT_ID');
  if (!getAuthApiBaseUrl()) missing.push('VITE_AUTH_API_BASE_URL');
  if (isAndroidAuthPlatform() && !getGoogleAndroidClientId()) {
    missing.push('VITE_GOOGLE_ANDROID_CLIENT_ID');
  }
  return { configured: missing.length === 0, missing };
}
