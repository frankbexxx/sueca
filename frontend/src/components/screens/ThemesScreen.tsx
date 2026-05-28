import React, { useState } from 'react';
import {
  ThemeId,
  getActiveTheme,
  setActiveTheme
} from '../../services/billingService';
import { useLanguage } from '../../i18n/useLanguage';
import '../../styles/shell-screens.css';
import './ThemesScreen.css';

interface ThemesScreenProps {
  onThemeChange?: (theme: ThemeId) => void;
}

export const ThemesScreen: React.FC<ThemesScreenProps> = ({ onThemeChange }) => {
  const { t, language } = useLanguage();
  const [active, setActive] = useState<ThemeId>(() => getActiveTheme());

  const applyTheme = (theme: ThemeId) => {
    setActiveTheme(theme);
    setActive(theme);
    onThemeChange?.(theme);
  };

  const themes: { id: ThemeId; labelPt: string; labelEn: string }[] = [
    { id: 'classic', labelPt: 'Clássico', labelEn: 'Classic' },
    { id: 'forest', labelPt: 'Floresta', labelEn: 'Forest' },
    { id: 'midnight', labelPt: 'Meia-noite', labelEn: 'Midnight' }
  ];

  return (
    <div className="shell-screen screen-themes">
      <header className="shell-screen-header">
        <h1 className="screen-title">{t.themesScreen.title}</h1>
        <p className="screen-subtitle">{t.themesScreen.subtitle}</p>
      </header>

      <ul className="shell-list">
        {themes.map((theme) => (
          <li key={theme.id}>
            <button
              type="button"
              className={`themes-card shell-panel ${active === theme.id ? 'themes-card--active' : ''}`}
              onClick={() => applyTheme(theme.id)}
            >
              <span className="themes-card-name">
                {language === 'pt' ? theme.labelPt : theme.labelEn}
              </span>
              {active === theme.id && (
                <span className="themes-card-badge">{t.themesScreen.active}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <p className="shell-empty">{t.themesScreen.iapNote}</p>
    </div>
  );
};
