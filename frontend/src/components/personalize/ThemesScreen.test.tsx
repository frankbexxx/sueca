/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemesScreen } from '../screens/ThemesScreen';
import { PersonalizeHubScreen } from '../screens/PrimaryHubScreens';
import { getActiveTheme } from '../../services/billingService';

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      shell: { back: 'Voltar' },
      themesScreen: {
        title: 'Temas',
        subtitle: 'Aparência da mesa e do ambiente',
        active: 'Activo',
        currentLabel: 'Tema actual',
        iapNote: 'Temas premium disponíveis em breve na Play Store.'
      }
    }
  })
}));

describe('ThemesScreen / Personalizar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows current theme and selects a built-in with active state', () => {
    render(<ThemesScreen showBack onBack={() => undefined} />);
    expect(screen.getByTestId('themes-screen')).toBeTruthy();
    expect(screen.getByTestId('themes-current')).toHaveTextContent(/Clássico/i);

    fireEvent.click(screen.getByTestId('theme-select-forest'));
    expect(getActiveTheme()).toBe('forest');
    expect(screen.getByTestId('theme-card-forest')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('themes-current')).toHaveTextContent(/Floresta/i);
  });

  it('renders compact previews without gameplay canvas', () => {
    render(<ThemesScreen showBack onBack={() => undefined} />);
    expect(screen.getAllByTestId('theme-preview-classic').length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('Personalizar hub lists Temas then Mão then Música', () => {
    const onOpenThemes = vi.fn();
    render(
      <PersonalizeHubScreen
        showBack={false}
        onBack={() => undefined}
        onOpenThemes={onOpenThemes}
        onOpenAudio={() => undefined}
        onOpenHand={() => undefined}
      />
    );
    const hub = screen.getByTestId('personalize-hub-screen');
    const labels = within(hub)
      .getAllByRole('button')
      .map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim());
    const themesIdx = labels.findIndex((l) => l.startsWith('Temas'));
    const handIdx = labels.findIndex((l) => /Mão e Cartas/i.test(l));
    const audioIdx = labels.findIndex((l) => /Música e Som/i.test(l));
    expect(themesIdx).toBeGreaterThanOrEqual(0);
    expect(handIdx).toBeGreaterThan(themesIdx);
    expect(audioIdx).toBeGreaterThan(handIdx);
    expect(labels[audioIdx]).toMatch(/Música e efeitos sonoros/i);
    expect(labels[audioIdx]).not.toMatch(/idioma/i);
    fireEvent.click(within(hub).getByText('Temas'));
    expect(onOpenThemes).toHaveBeenCalled();
  });
});
