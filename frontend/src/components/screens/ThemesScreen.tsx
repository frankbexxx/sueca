import React, { useState } from 'react';
import {
  ThemeId,
  getActiveTheme,
  setActiveTheme
} from '../../services/billingService';
import { useLanguage } from '../../i18n/useLanguage';
import { ShellHeader } from '../navigation/ShellHeader';
import '../../styles/shell-screens.css';
import './ThemesScreen.css';

interface ThemesScreenProps {
  showBack?: boolean;
  onBack?: () => void;
  onThemeChange?: (theme: ThemeId) => void;
}

export const ThemesScreen: React.FC<ThemesScreenProps> = ({
  showBack = false,
  onBack,
  onThemeChange
}) => {
  const { t, language } = useLanguage();
  const [active, setActive] = useState<ThemeId>(() => getActiveTheme());

  const applyTheme = (theme: ThemeId) => {
    setActiveTheme(theme);
    setActive(theme);
    onThemeChange?.(theme);
  };

  const themes: { id: ThemeId; labelPt: string; labelEn: string }[] = [
    { id: 'classic',  labelPt: 'Clássico',   labelEn: 'Classic'   },
    { id: 'forest',   labelPt: 'Floresta',   labelEn: 'Forest'    },
    { id: 'midnight', labelPt: 'Meia-noite', labelEn: 'Midnight'  },
    { id: 'thebes',   labelPt: 'Tebas',      labelEn: 'Thebes'    },
    { id: 'tikal',    labelPt: 'Tikal',      labelEn: 'Tikal'     },
    { id: 'thule',    labelPt: 'Thule',      labelEn: 'Thule'     },
  ];

  return (
    <div className="shell-screen screen-themes">
      <ShellHeader
        title={t.themesScreen.title}
        subtitle={t.themesScreen.subtitle}
        showBack={showBack}
        onBack={onBack}
      />

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
