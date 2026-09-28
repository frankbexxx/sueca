/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreditsModal } from './CreditsModal';
import { ProfileCreditsScreen } from './screens/ProfileCreditsScreen';
import { translations } from '../i18n/translations';

vi.mock('../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    t: translations.en
  })
}));

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    t: translations.en
  })
}));

describe('Credits runtime attribution (REL-LEGAL-01B)', () => {
  it('CreditsModal renders without Hazmat / DOBO / removed Casino pack wording', () => {
    render(<CreditsModal onClose={() => undefined} />);
    const root = screen.getByTestId('credits-modal');
    const text = root.textContent || '';
    expect(text).not.toMatch(/Hazmat/i);
    expect(text).not.toMatch(/DOBO|dobo_ui/i);
    expect(text).not.toMatch(/Casino/i);
    expect(text).toMatch(/CardMeister/);
    expect(text).toMatch(/Webisso/);
    expect(text).toMatch(/Kenney/);
    expect(text).toMatch(/Saul Spatz/);
    expect(text).toMatch(/Suecão · 2026/);
  });

  it('ProfileCreditsScreen shares the same attribution contract', () => {
    render(<ProfileCreditsScreen showBack onBack={() => undefined} />);
    const root = screen.getByTestId('profile-credits-screen');
    const text = root.textContent || '';
    expect(text).not.toMatch(/Hazmat/i);
    expect(text).not.toMatch(/DOBO|dobo_ui/i);
    expect(text).not.toMatch(/Casino/i);
    expect(text).toMatch(/AustinGabriel|woodcut|Sylly/i);
  });

  it('PT and EN credits keys avoid stale sources', () => {
    for (const lang of ['pt', 'en'] as const) {
      const c = translations[lang].credits;
      const blob = [
        c.assetsCards,
        c.assetsBacks,
        c.assetsSfx,
        c.assetsMusic,
        c.copyright,
        translations[lang].landing.copyright
      ].join('\n');
      expect(blob, lang).not.toMatch(/Hazmat/i);
      expect(blob, lang).not.toMatch(/DOBO|dobo_ui/i);
      expect(blob, lang).not.toMatch(/Casino/i);
      expect(blob, lang).not.toMatch(/all rights reserved/i);
      expect(blob, lang).not.toMatch(/Todos os direitos reservados/i);
      expect(c.assetsCards).toMatch(/CardMeister/);
      expect(c.assetsCards).toMatch(/Webisso/);
      expect(c.sectionCards).toBeTruthy();
      expect(c.sectionBacks).toBeTruthy();
      expect(c.sectionSfx).toBeTruthy();
      expect(c.sectionMusic).toBeTruthy();
    }
  });
});
