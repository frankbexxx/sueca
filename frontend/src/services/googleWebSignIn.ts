/**
 * AUTH-01C — Google Identity Services (Web) ID-token flow.
 *
 * Uses the official GIS `renderButton` control (not One Tap / FedCM `prompt()`).
 * `initialize` is idempotent per client_id (StrictMode remounts reuse the same session).
 * Web nonce is the raw string passed to GIS and compared as-is by the backend.
 * Android AUTH-01D uses a separate nonce helper (`createAndroidGoogleSignInNonce`);
 * Capgo Credential Manager also embeds raw nonce — keep helpers separate.
 *
 * Injectable mounter for tests (no real Google script required).
 */

import { getGoogleWebClientId, isWebGoogleAuthConfigured } from '../config/authConfig';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export type GoogleSignInResult =
  | { ok: true; idToken: string; nonce: string }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'misconfigured' | 'error'; message?: string };

export type GoogleCredentialPayload = { idToken: string; nonce: string };

export type MountGoogleSignInButtonInput = {
  clientId: string;
  container: HTMLElement;
  onCredential: (payload: GoogleCredentialPayload) => void;
  onError?: (result: Extract<GoogleSignInResult, { ok: false }>) => void;
  /** GIS button locale hint (e.g. pt / en). */
  locale?: string;
};

export type MountedGoogleSignInButton = {
  nonce: string;
  unmount: () => void;
};

export type GoogleSignInButtonMounter = (
  input: MountGoogleSignInButtonInput
) => Promise<MountedGoogleSignInButton | Extract<GoogleSignInResult, { ok: false }>>;

let mounterOverride: GoogleSignInButtonMounter | null = null;

/** Active GIS initialize session — one initialize() per client_id until invalidated. */
let gisSession: {
  clientId: string;
  nonce: string;
  onCredential: ((payload: GoogleCredentialPayload) => void) | null;
  onError: ((result: Extract<GoogleSignInResult, { ok: false }>) => void) | null;
} | null = null;

export function setGoogleSignInButtonMounterForTests(mounter: GoogleSignInButtonMounter | null): void {
  mounterOverride = mounter;
}

/** Test / remount helper: force next mount to call initialize with a fresh nonce. */
export function invalidateGoogleSignInSession(): void {
  gisSession = null;
}

/** @deprecated Prefer setGoogleSignInButtonMounterForTests — kept as alias for older tests */
export function setGoogleWebSignInAdapterForTests(
  adapter: ((input: { clientId: string; nonce: string }) => Promise<GoogleSignInResult>) | null
): void {
  if (!adapter) {
    mounterOverride = null;
    return;
  }
  mounterOverride = async ({ clientId, container, onCredential, onError }) => {
    const nonce = createGoogleSignInNonce();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-testid', 'account-gis-button');
    btn.textContent = 'Sign in with Google (test)';
    btn.addEventListener('click', () => {
      void (async () => {
        const result = await adapter({ clientId, nonce });
        if (result.ok) {
          onCredential({ idToken: result.idToken, nonce: result.nonce });
        } else {
          onError?.(result);
        }
      })();
    });
    container.replaceChildren(btn);
    return {
      nonce,
      unmount: () => {
        btn.remove();
      }
    };
  };
}

export function createGoogleSignInNonce(): string {
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
  // base64url — Web GIS embeds this raw value in the ID token `nonce` claim
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no window'));
  }
  const w = window as Window & { google?: { accounts?: { id?: unknown } } };
  if (w.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS script failed')));
      if (w.google?.accounts?.id) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GIS script failed'));
    document.head.appendChild(script);
  });
}

type GisCredentialResponse = { credential?: string; select_by?: string };

type GisIdApi = {
  initialize: (cfg: Record<string, unknown>) => void;
  renderButton: (parent: HTMLElement, options?: Record<string, unknown>) => void;
  cancel?: () => void;
  prompt?: (cb?: unknown) => void;
};

function getGisIdApi(): GisIdApi | null {
  const google = (window as Window & { google?: { accounts?: { id?: GisIdApi } } }).google;
  return google?.accounts?.id ?? null;
}

/**
 * Mount the official GIS sign-in button into `container`.
 * Does not use FedCM / One Tap `prompt()`.
 * Calls `initialize` at most once per client_id until `invalidateGoogleSignInSession()`.
 */
export async function mountGoogleSignInButton(
  input: MountGoogleSignInButtonInput
): Promise<MountedGoogleSignInButton | Extract<GoogleSignInResult, { ok: false }>> {
  if (mounterOverride) {
    return mounterOverride(input);
  }

  const { clientId, container, onCredential, onError, locale } = input;
  if (!clientId.trim()) {
    return { ok: false, reason: 'misconfigured' };
  }

  try {
    await loadGisScript();
  } catch {
    return { ok: false, reason: 'unavailable', message: 'Google Identity Services unavailable' };
  }

  const gis = getGisIdApi();
  if (!gis?.initialize || !gis.renderButton) {
    return { ok: false, reason: 'unavailable', message: 'Google Identity Services unavailable' };
  }

  try {
    const needsInit = !gisSession || gisSession.clientId !== clientId;
    if (needsInit) {
      const nonce = createGoogleSignInNonce();
      gisSession = {
        clientId,
        nonce,
        onCredential,
        onError: onError ?? null
      };
      gis.initialize({
        client_id: clientId,
        nonce,
        callback: (response: GisCredentialResponse) => {
          const session = gisSession;
          if (!session?.onCredential) return;
          if (response?.credential && typeof response.credential === 'string') {
            session.onCredential({
              idToken: response.credential,
              nonce: session.nonce
            });
            return;
          }
          session.onError?.({ ok: false, reason: 'error', message: 'Missing Google credential' });
        },
        auto_select: false
      });
    } else if (gisSession) {
      // StrictMode / remount: reuse initialize + nonce; swap active handlers only.
      gisSession.onCredential = onCredential;
      gisSession.onError = onError ?? null;
    }

    const nonce = gisSession!.nonce;
    container.replaceChildren();
    gis.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.min(320, Math.max(240, container.clientWidth || 280)),
      ...(locale ? { locale } : {})
    });

    return {
      nonce,
      unmount: () => {
        if (gisSession?.onCredential === onCredential) {
          gisSession.onCredential = null;
          gisSession.onError = null;
        }
        container.replaceChildren();
      }
    };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'GIS initialize failed'
    };
  }
}

/**
 * Convenience: resolve configured client id or misconfigured.
 */
export function resolveGoogleWebClientIdForMount(): string | null {
  if (!isWebGoogleAuthConfigured()) return null;
  return getGoogleWebClientId() ?? null;
}
