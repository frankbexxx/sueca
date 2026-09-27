import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShellHeader } from '../navigation/ShellHeader';
import { useLanguage } from '../../i18n/useLanguage';
import {
  getAuthState,
  mapGoogleProviderFailure,
  signInWithAndroidGoogle,
  signInWithGoogleCredential,
  signOut,
  subscribeAuthState,
  type AuthState
} from '../../services/authState';
import {
  getAuthConfigStatus,
  getGoogleWebClientId,
  isGoogleAuthConfiguredForPlatform
} from '../../config/authConfig';
import { mountGoogleSignInButton, invalidateGoogleSignInSession } from '../../services/googleWebSignIn';
import { isAndroidAuthPlatform, isWebAuthPlatform } from '../../platform/authPlatform';
import '../../styles/shell-screens.css';
import './MoreScreen.css';
import './AccountScreen.css';

interface AccountScreenProps {
  showBack: boolean;
  onBack: () => void;
}

type UiStatus = 'idle' | 'loading' | 'error';

export const AccountScreen: React.FC<AccountScreenProps> = ({ showBack, onBack }) => {
  const { t, language } = useLanguage();
  const [auth, setAuth] = useState<AuthState>(() => getAuthState());
  const [ui, setUi] = useState<UiStatus>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [gisEpoch, setGisEpoch] = useState(0);
  const buttonHostRef = useRef<HTMLDivElement | null>(null);
  const signingInRef = useRef(false);
  const androidPlatform = isAndroidAuthPlatform();
  const webPlatform = isWebAuthPlatform();
  const configured = isGoogleAuthConfiguredForPlatform();
  const configStatus = getAuthConfigStatus();

  useEffect(() => subscribeAuthState(setAuth), []);

  const applyFailure = useCallback((reason: string, remountGis = false) => {
    signingInRef.current = false;
    setUi('error');
    if (reason === 'cancelled') setErrorKey('cancelled');
    else if (reason === 'misconfigured') setErrorKey('misconfigured');
    else if (reason === 'unavailable') setErrorKey('unavailable');
    else if (reason === 'network') setErrorKey('network');
    else if (reason === 'backend') setErrorKey('backend');
    else if (reason === 'storage') setErrorKey('storage');
    else setErrorKey('error');
    if (remountGis && webPlatform) {
      invalidateGoogleSignInSession();
      setGisEpoch((n) => n + 1);
    }
  }, [webPlatform]);

  const onCredentialRef = useRef<(payload: { idToken: string; nonce: string }) => void>(() => undefined);
  onCredentialRef.current = (payload) => {
    if (signingInRef.current) return;
    signingInRef.current = true;
    setUi('loading');
    setErrorKey(null);
    void (async () => {
      const result = await signInWithGoogleCredential(payload);
      if (result.ok) {
        signingInRef.current = false;
        invalidateGoogleSignInSession();
        setAuth(result.state);
        setUi('idle');
        return;
      }
      applyFailure(result.reason, true);
    })();
  };

  const applyFailureRef = useRef(applyFailure);
  applyFailureRef.current = applyFailure;

  // Web only: mount GIS renderButton. Never mount GIS on Android.
  useEffect(() => {
    if (!webPlatform || androidPlatform) return;
    if (auth.status !== 'guest' || !configured) return;
    const host = buttonHostRef.current;
    const clientId = getGoogleWebClientId();
    if (!host || !clientId) return;

    let active = true;
    let unmount: (() => void) | undefined;

    void (async () => {
      const mounted = await mountGoogleSignInButton({
        clientId,
        container: host,
        locale: language === 'en' ? 'en' : 'pt',
        onCredential: (payload) => {
          if (!active) return;
          onCredentialRef.current(payload);
        },
        onError: (failure) => {
          if (!active) return;
          const mapped = mapGoogleProviderFailure(failure.reason, failure.message);
          if (!mapped.ok) applyFailureRef.current(mapped.reason, true);
        }
      });
      if (!active) {
        if ('unmount' in mounted) mounted.unmount();
        return;
      }
      if ('ok' in mounted && mounted.ok === false) {
        applyFailureRef.current(mounted.reason, false);
        return;
      }
      if ('unmount' in mounted) {
        unmount = mounted.unmount;
      }
    })();

    return () => {
      active = false;
      unmount?.();
    };
  }, [auth.status, configured, language, gisEpoch, webPlatform, androidPlatform]);

  const onAndroidLink = useCallback(async () => {
    if (ui === 'loading' || signingInRef.current) return;
    signingInRef.current = true;
    setUi('loading');
    setErrorKey(null);
    const result = await signInWithAndroidGoogle();
    signingInRef.current = false;
    if (result.ok) {
      setAuth(result.state);
      setUi('idle');
      return;
    }
    applyFailure(result.reason, false);
  }, [ui, applyFailure]);

  const onLogout = useCallback(async () => {
    if (ui === 'loading') return;
    setUi('loading');
    setErrorKey(null);
    const next = await signOut();
    setAuth(next);
    setUi('idle');
  }, [ui]);

  const copy = t.accountScreen;
  const errorText =
    errorKey === 'cancelled'
      ? copy.errorCancelled
      : errorKey === 'misconfigured'
        ? copy.errorMisconfigured
        : errorKey === 'unavailable'
          ? copy.errorUnavailable
          : errorKey === 'network'
            ? copy.errorNetwork
            : errorKey === 'backend'
              ? copy.errorBackend
              : errorKey === 'storage'
                ? copy.errorStorage
                : errorKey
                  ? copy.errorGeneric
                  : null;

  return (
    <div className="shell-screen screen-account" data-testid="account-screen">
      <ShellHeader
        title={copy.title}
        subtitle={copy.subtitle}
        showBack={showBack}
        onBack={onBack}
      />

      <div className="account-panel shell-panel">
        {auth.status === 'guest' ? (
          <>
            <p className="account-status" data-testid="account-status-guest">
              {copy.guestStatus}
            </p>
            <p className="account-explain">{copy.guestExplain}</p>
            {!configured && (
              <p className="account-config-hint" data-testid="account-config-missing">
                {copy.configMissing}
                {configStatus.missing.length > 0
                  ? ` (${configStatus.missing.join(', ')})`
                  : ''}
              </p>
            )}
            {configured && webPlatform && !androidPlatform && (
              <div
                className="account-gis-host"
                data-testid="account-gis-host"
                ref={buttonHostRef}
                aria-busy={ui === 'loading'}
              />
            )}
            {configured && androidPlatform && (
              <button
                type="button"
                className="sueca-btn sueca-btn-primary account-action"
                data-testid="account-android-link-google"
                disabled={ui === 'loading'}
                onClick={() => void onAndroidLink()}
              >
                {ui === 'loading' ? copy.loading : copy.linkGoogle}
              </button>
            )}
            {ui === 'loading' && webPlatform && (
              <p className="account-loading" data-testid="account-loading">
                {copy.loading}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="account-status" data-testid="account-status-signed-in">
              {copy.signedInStatus}
            </p>
            {auth.account.displayName && (
              <p className="account-identity" data-testid="account-display-name">
                {auth.account.displayName}
              </p>
            )}
            {auth.account.email && (
              <p className="account-email" data-testid="account-email">
                {auth.account.email}
              </p>
            )}
            <button
              type="button"
              className="sueca-btn sueca-btn-secondary account-action"
              data-testid="account-sign-out"
              disabled={ui === 'loading'}
              onClick={() => void onLogout()}
            >
              {ui === 'loading' ? copy.loading : copy.signOut}
            </button>
            <p className="account-delete-hint">{copy.deleteLater}</p>
          </>
        )}

        {errorText && (
          <p className="account-error" data-testid="account-error" role="alert">
            {errorText}
          </p>
        )}
      </div>
    </div>
  );
};
