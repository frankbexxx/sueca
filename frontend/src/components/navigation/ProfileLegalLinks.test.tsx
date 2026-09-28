/**
 * @vitest-environment jsdom
 * REL-LEGAL-01D2 — Privacy / Terms discoverability in Perfil
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      profileScreen: {
        title: 'Perfil',
        subtitle: 'sub',
        hubName: 'Nome',
        hubNameHint: 'hint',
        hubCreditsHint: 'créditos',
        privacyPolicy: 'Política de Privacidade',
        termsOfUse: 'Termos de Utilização',
        legalSectionHint: 'Documentos legais',
        feedback: 'Feedback',
        exitApp: 'Sair',
        exitConfirm: 'confirmar'
      },
      moreScreen: { credits: 'Créditos' },
      gameMenu: { cancel: 'Cancelar' }
    }
  })
}));

vi.mock('../../constants/feedback', () => ({
  FEEDBACK_ISSUE_URL: 'https://example.test/feedback'
}));

vi.mock('../../services/appLifecycle', () => ({
  exitAppToLanding: () => undefined
}));

import { ProfileHubScreen } from '../screens/ProfileHubScreen';

describe('REL-LEGAL-01D2 profile legal links', () => {
  it('exposes Privacy and Terms hrefs under /legal/', () => {
    render(
      <ProfileHubScreen
        showBack={false}
        onBack={() => undefined}
        onOpenSection={() => undefined}
      />
    );
    const privacy = screen.getByTestId('legal-privacy-link') as HTMLAnchorElement;
    const terms = screen.getByTestId('legal-terms-link') as HTMLAnchorElement;
    expect(privacy.getAttribute('href')).toMatch(/legal\/privacy\.html$/);
    expect(terms.getAttribute('href')).toMatch(/legal\/terms\.html$/);
    expect(privacy.textContent).toMatch(/Privacidade/i);
    expect(terms.textContent).toMatch(/Termos/i);
  });
});
