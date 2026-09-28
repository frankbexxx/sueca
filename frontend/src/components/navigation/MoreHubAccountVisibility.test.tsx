/**
 * @vitest-environment jsdom
 * REL-LEGAL-01D1 — Conta soft-hide when Auth not configured (Play v1 guest-only).
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

const authFlag = vi.hoisted(() => ({ configured: false }));
const mpFlag = vi.hoisted(() => ({ enabled: false }));

vi.mock('../../config/features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../config/features')>();
  return {
    ...actual,
    get MULTIPLAYER_ENABLED() {
      return mpFlag.enabled;
    }
  };
});

vi.mock('../../config/authConfig', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../config/authConfig')>();
  return {
    ...actual,
    isGoogleAuthConfiguredForPlatform: () => authFlag.configured,
    getAuthConfigStatus: () =>
      authFlag.configured
        ? { configured: true, missing: [] }
        : { configured: false, missing: ['VITE_AUTH_API_BASE_URL'] }
  };
});

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      shell: { back: 'Voltar' },
      accountScreen: {
        title: 'Conta',
        subtitle: 'Conta Google opcional',
        unavailable: 'Conta não está disponível nesta versão.',
        guestStatus: 'Jogar sem conta',
        guestExplain: 'explain',
        configMissing: 'missing',
        linkGoogle: 'Ligar',
        signedInStatus: 'ligada',
        signOut: 'Sair',
        deleteAccount: 'Apagar',
        deleteExplain: '',
        deleteConfirmTitle: '',
        deleteConfirmBody: '',
        deleteKeepLocal: '',
        deleteWipeLocal: '',
        deleteWipeConfirmTitle: '',
        deleteWipeConfirmBody: '',
        deleteWipeConfirmAction: '',
        loading: '…',
        errorCancelled: '',
        errorMisconfigured: '',
        errorUnavailable: '',
        errorNetwork: '',
        errorBackend: '',
        errorStorage: '',
        errorPendingDelete: '',
        errorInvalidCredential: '',
        errorDelete: '',
        errorGeneric: '',
        syncSectionTitle: '',
        syncStatusSetupRequired: '',
        syncStatusSynced: '',
        syncStatusSyncing: '',
        syncStatusOffline: '',
        syncStatusError: '',
        syncStatusAccountMismatch: '',
        syncConfigureCta: '',
        syncNowCta: '',
        syncInfoABody: '',
        syncInfoAConfirm: '',
        syncPrefsTitle: '',
        syncPrefsBody: '',
        syncPrefsDevice: '',
        syncPrefsCloud: '',
        syncSwitchTitle: '',
        syncSwitchBody: '',
        syncSwitchConfirm: '',
        syncBlockedSeedTitle: '',
        syncBlockedSeedBody: '',
        syncBusy: ''
      },
      onlineScreen: {
        title: 'Online',
        unavailable: 'Multiplayer não está disponível nesta versão.'
      }
    }
  })
}));

vi.mock('../../hooks/useGameSetup', () => ({
  useGameSetup: () => ({
    buildConfig: () => ({}),
    setGameVariant: () => undefined
  })
}));

vi.mock('../../config/appBuildInfo', () => ({
  formatAppBuildLabel: () => 'v-test'
}));

vi.mock('../../services/authState', () => ({
  getAuthState: () => ({ status: 'guest', localGuestId: 'g1' }),
  subscribeAuthState: () => () => undefined,
  mapGoogleProviderFailure: () => 'error',
  signInWithAndroidGoogle: async () => ({ ok: false, reason: 'misconfigured' }),
  signInWithGoogleCredential: async () => ({ ok: false, reason: 'misconfigured' }),
  signOut: async () => ({ status: 'guest', localGuestId: 'g1' }),
  deleteAccount: async () => ({ ok: false, reason: 'misconfigured' })
}));

vi.mock('../../services/googleWebSignIn', () => ({
  mountGoogleSignInButton: async () => () => undefined,
  invalidateGoogleSignInSession: () => undefined
}));

vi.mock('../../platform/authPlatform', () => ({
  isAndroidAuthPlatform: () => false,
  isWebAuthPlatform: () => true
}));

vi.mock('../../services/syncEngine', () => ({
  getSyncEngineState: () => 'IDLE',
  subscribeSyncEngine: () => () => undefined,
  syncNow: async () => undefined
}));

vi.mock('../../services/syncFirstLinkState', () => ({
  deriveSyncLinkState: () => 'NONE',
  canUploadForAccount: () => false
}));

vi.mock('../../services/syncFirstLinkFlow', () => ({
  inspectFirstLink: async () => ({ ok: false }),
  completeFirstLink: async () => ({ ok: false })
}));

import { MoreHubScreen } from '../screens/PrimaryHubScreens';
import { AccountScreen } from '../screens/AccountScreen';

describe('REL-LEGAL-01D1 Conta soft-hide', () => {
  beforeEach(() => {
    authFlag.configured = false;
    mpFlag.enabled = false;
  });

  it('hides Conta from Mais when Auth is not configured', () => {
    render(
      <MoreHubScreen
        showBack={false}
        onBack={() => undefined}
        onOpenOnline={() => undefined}
        onOpenRules={() => undefined}
        onOpenSettings={() => undefined}
        onOpenProfile={() => undefined}
        onOpenAccount={() => undefined}
        onOpenDiagnostic={() => undefined}
      />
    );
    const hub = screen.getByTestId('more-hub-screen');
    const labels = within(hub)
      .getAllByRole('button')
      .map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim());
    expect(labels.some((l) => l.startsWith('Conta'))).toBe(false);
    expect(labels.some((l) => l.startsWith('Regras'))).toBe(true);
  });

  it('shows Conta in Mais when Auth is configured', () => {
    authFlag.configured = true;
    const onOpenAccount = vi.fn();
    render(
      <MoreHubScreen
        showBack={false}
        onBack={() => undefined}
        onOpenOnline={() => undefined}
        onOpenRules={() => undefined}
        onOpenSettings={() => undefined}
        onOpenProfile={() => undefined}
        onOpenAccount={onOpenAccount}
        onOpenDiagnostic={() => undefined}
      />
    );
    const conta = within(screen.getByTestId('more-hub-screen')).getByText('Conta');
    fireEvent.click(conta);
    expect(onOpenAccount).toHaveBeenCalled();
  });

  it('deep Conta route stays safe when Auth disabled (no Google link UI)', () => {
    authFlag.configured = false;
    render(<AccountScreen showBack onBack={() => undefined} />);
    expect(screen.getByTestId('account-unavailable')).toBeTruthy();
    expect(screen.getByText(/não está disponível/i)).toBeTruthy();
    expect(screen.queryByTestId('account-gis-host')).toBeNull();
    expect(screen.queryByTestId('account-android-link-google')).toBeNull();
    expect(screen.queryByTestId('account-delete')).toBeNull();
  });
});
