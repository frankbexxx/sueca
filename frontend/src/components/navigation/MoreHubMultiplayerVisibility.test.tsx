/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

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

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      shell: { back: 'Voltar' },
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

import { MoreHubScreen } from '../screens/PrimaryHubScreens';
import { OnlineScreen } from '../screens/OnlineScreen';

describe('REL-MP-01 soft-hide Online', () => {
  beforeEach(() => {
    mpFlag.enabled = false;
  });

  it('hides Online from Mais when MULTIPLAYER_ENABLED is false', () => {
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
    expect(labels.some((l) => l.startsWith('Online'))).toBe(false);
    expect(labels.some((l) => l.startsWith('Regras'))).toBe(true);
  });

  it('shows Online in Mais when MULTIPLAYER_ENABLED is true', () => {
    mpFlag.enabled = true;
    const onOpenOnline = vi.fn();
    render(
      <MoreHubScreen
        showBack={false}
        onBack={() => undefined}
        onOpenOnline={onOpenOnline}
        onOpenRules={() => undefined}
        onOpenSettings={() => undefined}
        onOpenProfile={() => undefined}
        onOpenAccount={() => undefined}
        onOpenDiagnostic={() => undefined}
      />
    );
    const online = within(screen.getByTestId('more-hub-screen')).getByText('Online');
    fireEvent.click(online);
    expect(onOpenOnline).toHaveBeenCalled();
  });

  it('deep Online route stays safe when MP disabled (no lobby create UI)', () => {
    mpFlag.enabled = false;
    render(
      <OnlineScreen showBack onBack={() => undefined} onStartGame={() => undefined} />
    );
    expect(screen.getByText(/não está disponível/i)).toBeTruthy();
    expect(screen.queryByText(/Criar mesa|Create table|Entrar com código|Join/i)).toBeNull();
  });
});
