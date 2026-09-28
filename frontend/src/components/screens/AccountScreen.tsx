import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShellHeader } from '../navigation/ShellHeader';
import { useLanguage } from '../../i18n/useLanguage';
import {
  deleteAccount,
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
import { AccountDeleteDialog, type AccountDeleteChoice } from './AccountDeleteDialog';
import {
  SyncSetupDialog,
  type SyncSetupMode
} from './SyncSetupDialog';
import {
  deriveSyncLinkState,
  canUploadForAccount
} from '../../services/syncFirstLinkState';
import {
  getSyncEngineState,
  subscribeSyncEngine,
  syncNow,
  type SyncEngineState
} from '../../services/syncEngine';
import {
  inspectFirstLink,
  completeFirstLink,
  type FirstLinkFlowResult
} from '../../services/syncFirstLinkFlow';
import '../../styles/shell-screens.css';
import './MoreScreen.css';
import './AccountScreen.css';

interface AccountScreenProps {
  showBack: boolean;
  onBack: () => void;
}

type UiStatus = 'idle' | 'loading' | 'error';

function syncStatusLabel(
  copy: {
    syncStatusSetupRequired: string;
    syncStatusSynced: string;
    syncStatusSyncing: string;
    syncStatusOffline: string;
    syncStatusError: string;
    syncStatusAccountMismatch: string;
  },
  linkState: ReturnType<typeof deriveSyncLinkState>,
  engine: SyncEngineState
): string {
  if (linkState === 'BOUND_DIFFERENT_ACCOUNT' || engine === 'ACCOUNT_MISMATCH') {
    return copy.syncStatusAccountMismatch;
  }
  if (
    linkState === 'FIRST_LINK_REQUIRED' ||
    linkState === 'BOUND_SAME_ACCOUNT' ||
    engine === 'FIRST_LINK_REQUIRED'
  ) {
    return copy.syncStatusSetupRequired;
  }
  if (engine === 'SYNCING') return copy.syncStatusSyncing;
  if (engine === 'OFFLINE') return copy.syncStatusOffline;
  if (engine === 'ERROR') return copy.syncStatusError;
  if (linkState === 'READY_INCREMENTAL') return copy.syncStatusSynced;
  return copy.syncStatusSetupRequired;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ showBack, onBack }) => {
  const { t, language } = useLanguage();
  const [auth, setAuth] = useState<AuthState>(() => getAuthState());
  const [ui, setUi] = useState<UiStatus>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [gisEpoch, setGisEpoch] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [engineState, setEngineState] = useState<SyncEngineState>(() => getSyncEngineState());
  const [syncSetupOpen, setSyncSetupOpen] = useState(false);
  const [syncSetupMode, setSyncSetupMode] = useState<SyncSetupMode>('busy');
  const [syncBusy, setSyncBusy] = useState(false);
  const buttonHostRef = useRef<HTMLDivElement | null>(null);
  const signingInRef = useRef(false);
  const androidPlatform = isAndroidAuthPlatform();
  const webPlatform = isWebAuthPlatform();
  const configured = isGoogleAuthConfiguredForPlatform();
  const configStatus = getAuthConfigStatus();

  useEffect(() => subscribeAuthState(setAuth), []);
  useEffect(() => subscribeSyncEngine(setEngineState), []);

  const accountId = auth.status === 'authenticated' ? auth.accountId : null;
  const linkState = deriveSyncLinkState({ authenticatedAccountId: accountId });
  const syncReady = canUploadForAccount(accountId);
  const needsSyncSetup =
    auth.status === 'authenticated' &&
    (linkState === 'FIRST_LINK_REQUIRED' ||
      linkState === 'BOUND_SAME_ACCOUNT' ||
      linkState === 'BOUND_DIFFERENT_ACCOUNT');

  const applyFailure = useCallback((reason: string, remountGis = false) => {
    signingInRef.current = false;
    setUi('error');
    if (reason === 'cancelled') setErrorKey('cancelled');
    else if (reason === 'misconfigured') setErrorKey('misconfigured');
    else if (reason === 'unavailable') setErrorKey('unavailable');
    else if (reason === 'network') setErrorKey('network');
    else if (reason === 'backend') setErrorKey('backend');
    else if (reason === 'storage') setErrorKey('storage');
    else if (reason === 'pending_delete') setErrorKey('pending_delete');
    else if (reason === 'invalid_credential') setErrorKey('invalid_credential');
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

  const onDeleteConfirm = useCallback(
    async (choice: AccountDeleteChoice) => {
      if (ui === 'loading') return;
      setUi('loading');
      setErrorKey(null);
      const result = await deleteAccount({ wipeLocalData: choice === 'wipe_local' });
      if (result.ok) {
        setDeleteOpen(false);
        setAuth(result.state);
        setUi('idle');
        return;
      }
      // Failed server delete: stay signed in when session still valid; never wipe.
      setDeleteOpen(false);
      setUi('error');
      if (result.reason === 'network') setErrorKey('network');
      else if (result.reason === 'misconfigured') setErrorKey('misconfigured');
      else if (result.reason === 'unauthorized') {
        // Session already dead — auth facade dropped to guest.
        setAuth(getAuthState());
        setErrorKey('deleteFailed');
      } else setErrorKey('deleteFailed');
    },
    [ui]
  );

  const applyInspectResult = useCallback((result: FirstLinkFlowResult) => {
    if (result.ok) {
      if (result.case === 'CLOUD_EMPTY_LOCAL_HAS_DATA') {
        setSyncSetupMode('info_a');
        return;
      }
      if (result.case === 'CLOUD_HAS_DATA_LOCAL_EMPTY' || result.case === 'SAME_ACCOUNT_RESUME') {
        setSyncSetupMode('busy');
        return;
      }
      if (result.case === 'BOTH_HAVE_DATA') {
        setSyncSetupMode('prefs_c');
        return;
      }
      setSyncSetupMode('busy');
      return;
    }
    if (result.code === 'prefs_choice_required') {
      setSyncSetupMode('prefs_c');
      return;
    }
    if (result.code === 'account_switch_required') {
      setSyncSetupMode('account_switch');
      return;
    }
    if (result.code === 'seed_mismatch') {
      setSyncSetupMode('seed_mismatch');
      return;
    }
    if (result.code === 'network') {
      setSyncSetupMode('error');
      return;
    }
    setSyncSetupMode('error');
  }, []);

  const runComplete = useCallback(
    async (input: {
      prefsChoice?: 'device' | 'cloud';
      accountSwitchAction?: 'use_cloud_account' | 'stay_unsynced';
    }) => {
      setSyncBusy(true);
      setSyncSetupMode('busy');
      try {
        const result = await completeFirstLink(input);
        if (result.ok) {
          setSyncSetupOpen(false);
          setSyncBusy(false);
          return;
        }
        applyInspectResult(result);
        if (result.code === 'seed_mismatch') setSyncSetupMode('seed_mismatch');
        else if (result.code === 'network' || result.code === 'error' || result.code === 'stale_revision') {
          setSyncSetupMode('error');
        }
      } catch {
        setSyncSetupMode('error');
      } finally {
        setSyncBusy(false);
      }
    },
    [applyInspectResult]
  );

  const onConfigureSync = useCallback(async () => {
    if (syncBusy || ui === 'loading') return;
    setSyncSetupOpen(true);
    setSyncBusy(true);
    setSyncSetupMode('busy');
    setErrorKey(null);
    try {
      const inspected = await inspectFirstLink();
      applyInspectResult(inspected);
      if (inspected.ok) {
        if (
          inspected.case === 'CLOUD_HAS_DATA_LOCAL_EMPTY' ||
          inspected.case === 'SAME_ACCOUNT_RESUME' ||
          inspected.case === 'CLOUD_EMPTY_LOCAL_HAS_DATA'
        ) {
          // Case A: show info then confirm. B/D: auto-run.
          if (inspected.case === 'CLOUD_EMPTY_LOCAL_HAS_DATA') {
            setSyncBusy(false);
            return;
          }
          await runComplete({});
          return;
        }
        if (inspected.case === 'BOTH_HAVE_DATA' && inspected.phase === 'READY_TO_RUN') {
          await runComplete({});
          return;
        }
      }
    } catch {
      setSyncSetupMode('error');
    } finally {
      setSyncBusy(false);
    }
  }, [syncBusy, ui, applyInspectResult, runComplete]);

  const onSyncNow = useCallback(async () => {
    if (!syncReady || syncBusy || ui === 'loading') return;
    setSyncBusy(true);
    setErrorKey(null);
    try {
      await syncNow('manual');
    } finally {
      setSyncBusy(false);
    }
  }, [syncReady, syncBusy, ui]);

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
                : errorKey === 'pending_delete'
                  ? copy.errorPendingDelete
                  : errorKey === 'invalid_credential'
                    ? copy.errorInvalidCredential
                    : errorKey === 'deleteFailed'
                      ? copy.errorDelete
                      : errorKey
                        ? copy.errorGeneric
                        : null;

  const statusText =
    auth.status === 'authenticated'
      ? syncStatusLabel(copy, linkState, engineState)
      : null;

  // REL-LEGAL-01D1: deep link stays safe when Auth not configured (no GIS / Capgo / sync CTA).
  // Already-authenticated sessions can still sign out / delete if reachable.
  if (!configured && auth.status === 'guest') {
    return (
      <div className="shell-screen screen-account" data-testid="account-screen">
        <ShellHeader title={copy.title} showBack={showBack} onBack={onBack} />
        <div className="shell-panel account-unavailable" data-testid="account-unavailable">
          <p>{copy.unavailable}</p>
        </div>
      </div>
    );
  }

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

            <div className="account-sync-section" data-testid="account-sync-section">
              <p className="account-sync-title">{copy.syncSectionTitle}</p>
              {statusText && (
                <p className="account-sync-status" data-testid="account-sync-status">
                  {statusText}
                </p>
              )}
              {needsSyncSetup && (
                <button
                  type="button"
                  className="sueca-btn sueca-btn-primary account-action"
                  data-testid="account-sync-configure"
                  disabled={ui === 'loading' || syncBusy}
                  onClick={() => void onConfigureSync()}
                >
                  {copy.syncConfigureCta}
                </button>
              )}
              {syncReady && (
                <button
                  type="button"
                  className="sueca-btn sueca-btn--secondary account-action"
                  data-testid="account-sync-now"
                  disabled={ui === 'loading' || syncBusy || engineState === 'SYNCING'}
                  onClick={() => void onSyncNow()}
                >
                  {copy.syncNowCta}
                </button>
              )}
            </div>

            <button
              type="button"
              className="sueca-btn sueca-btn--secondary account-action"
              data-testid="account-sign-out"
              disabled={ui === 'loading'}
              onClick={() => void onLogout()}
            >
              {ui === 'loading' ? copy.loading : copy.signOut}
            </button>
            <button
              type="button"
              className="sueca-btn sueca-btn--danger account-action account-delete-action"
              data-testid="account-delete"
              disabled={ui === 'loading'}
              onClick={() => {
                setErrorKey(null);
                setDeleteOpen(true);
              }}
            >
              {copy.deleteAccount}
            </button>
            <p className="account-delete-hint">{copy.deleteExplain}</p>
          </>
        )}

        {errorText && (
          <p className="account-error" data-testid="account-error" role="alert">
            {errorText}
          </p>
        )}
      </div>

      <AccountDeleteDialog
        open={deleteOpen}
        busy={ui === 'loading'}
        copy={{
          title: copy.deleteConfirmTitle,
          body: copy.deleteConfirmBody,
          keepLocal: copy.deleteKeepLocal,
          wipeLocal: copy.deleteWipeLocal,
          cancel: t.gameMenu.cancel,
          wipeConfirmTitle: copy.deleteWipeConfirmTitle,
          wipeConfirmBody: copy.deleteWipeConfirmBody,
          wipeConfirmAction: copy.deleteWipeConfirmAction
        }}
        onCancel={() => {
          if (ui === 'loading') return;
          setDeleteOpen(false);
        }}
        onConfirm={(choice) => void onDeleteConfirm(choice)}
      />

      <SyncSetupDialog
        open={syncSetupOpen}
        mode={syncSetupMode}
        busy={syncBusy}
        copy={{
          title: copy.syncSectionTitle,
          body: copy.syncInfoABody,
          infoConfirm: copy.syncInfoAConfirm,
          prefsTitle: copy.syncPrefsTitle,
          prefsBody: copy.syncPrefsBody,
          prefsDevice: copy.syncPrefsDevice,
          prefsCloud: copy.syncPrefsCloud,
          switchTitle: copy.syncSwitchTitle,
          switchBody: copy.syncSwitchBody,
          switchUseCloud: copy.syncSwitchUseCloud,
          switchStay: copy.syncSwitchStay,
          seedMismatchTitle: copy.syncSeedMismatchTitle,
          seedMismatchBody: copy.syncSeedMismatchBody,
          cancel: copy.syncCancel,
          busy: copy.syncBusy,
          error: copy.syncError,
          retry: copy.syncRetry
        }}
        onCancel={() => {
          if (syncBusy) return;
          setSyncSetupOpen(false);
        }}
        onConfirmInfo={() => void runComplete({})}
        onChoosePrefs={(choice) => void runComplete({ prefsChoice: choice })}
        onSwitchUseCloud={() => void runComplete({ accountSwitchAction: 'use_cloud_account' })}
        onSwitchStay={() => void runComplete({ accountSwitchAction: 'stay_unsynced' })}
        onRetry={() => void onConfigureSync()}
      />
    </div>
  );
};
