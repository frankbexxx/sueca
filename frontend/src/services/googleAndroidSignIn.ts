/**
 * AUTH-01D — Native Android Google sign-in via Capgo Social Login (Credential Manager).
 *
 * Capgo `@capgo/capacitor-social-login@6` (Capacitor 6):
 * - `webClientId` = Google **Web** OAuth client (serverClientId for ID token)
 * - Android OAuth client (package + SHA) is registered in Google Cloud Console only
 * - Nonce: raw string via Credential Manager `setNonce` (embedded as-is in ID token)
 * - Do not use Web GIS inside the Android WebView
 *
 * Injectable adapter for unit tests (no native bridge required).
 */

import { getGoogleWebClientId, isAndroidGoogleAuthConfigured } from '../config/authConfig';

export type AndroidGoogleSignInResult =
  | { ok: true; idToken: string; nonce: string }
  | {
      ok: false;
      reason: 'cancelled' | 'unavailable' | 'misconfigured' | 'error';
      message?: string;
    };

export type AndroidGoogleSignInAdapter = () => Promise<AndroidGoogleSignInResult>;

let adapterOverride: AndroidGoogleSignInAdapter | null = null;
let initializePromise: Promise<void> | null = null;

export function setAndroidGoogleSignInAdapterForTests(
  adapter: AndroidGoogleSignInAdapter | null
): void {
  adapterOverride = adapter;
  initializePromise = null;
}

/**
 * Strong raw nonce for Android Credential Manager.
 * Capgo passes this to `setNonce`; Google embeds the same raw value in the ID token.
 * Kept separate from Web GIS nonce helper — do not mix platform semantics.
 */
export function createAndroidGoogleSignInNonce(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function mapNativeError(err: unknown): AndroidGoogleSignInResult {
  const message =
    err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
      ? (err as { message: string }).message
      : err instanceof Error
        ? err.message
        : String(err ?? 'native google error');
  const lower = message.toLowerCase();
  if (
    lower.includes('cancel') ||
    lower.includes('user_cancel') ||
    lower.includes('interrupted') ||
    lower.includes('16:') // common STATUS_USER_CANCELLED pattern
  ) {
    return { ok: false, reason: 'cancelled', message };
  }
  if (
    lower.includes('nocredential') ||
    lower.includes('no credential') ||
    lower.includes('no account') ||
    lower.includes('cannot find') ||
    lower.includes('not available')
  ) {
    return { ok: false, reason: 'unavailable', message };
  }
  if (lower.includes('client id') || lower.includes('misconfig')) {
    return { ok: false, reason: 'misconfigured', message };
  }
  return { ok: false, reason: 'error', message };
}

async function ensureNativeInitialized(webClientId: string): Promise<void> {
  if (!initializePromise) {
    initializePromise = (async () => {
      const { SocialLogin } = await import('@capgo/capacitor-social-login');
      await SocialLogin.initialize({
        google: {
          webClientId,
          mode: 'online'
        }
      });
    })().catch((err) => {
      initializePromise = null;
      throw err;
    });
  }
  await initializePromise;
}

/**
 * Invoke native Google account chooser and return an ID token + raw nonce.
 */
export async function requestAndroidGoogleIdToken(): Promise<AndroidGoogleSignInResult> {
  if (adapterOverride) {
    return adapterOverride();
  }

  if (!isAndroidGoogleAuthConfigured()) {
    return { ok: false, reason: 'misconfigured' };
  }

  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    return { ok: false, reason: 'misconfigured' };
  }

  const nonce = createAndroidGoogleSignInNonce();

  try {
    await ensureNativeInitialized(webClientId);
    const { SocialLogin } = await import('@capgo/capacitor-social-login');
    const response = await SocialLogin.login({
      provider: 'google',
      options: {
        // online + no custom scopes → Credential Manager ID token; MainActivity hook not required
        nonce,
        style: 'standard',
        forcePrompt: true
      }
    });

    if (response.provider !== 'google') {
      return { ok: false, reason: 'error', message: 'Unexpected provider' };
    }

    const result = response.result;
    if (!result || result.responseType !== 'online') {
      return { ok: false, reason: 'error', message: 'Expected online Google ID token response' };
    }

    const idToken = result.idToken;
    if (!idToken || typeof idToken !== 'string') {
      return { ok: false, reason: 'error', message: 'Missing Google ID token' };
    }

    return { ok: true, idToken, nonce };
  } catch (err) {
    return mapNativeError(err);
  }
}
