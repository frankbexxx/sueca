import React, { useMemo, useState, useCallback } from 'react';
import {
  ThemeId,
  getActiveTheme,
  setActiveTheme,
  isCustomThemeId
} from '../../services/billingService';
import { loadCustomThemes, deleteCustomTheme } from '../../services/customThemeStorage';
import { CustomThemeData } from '../../types/theme';
import { ShellRoute } from '../../types/navigation';
import { useLanguage } from '../../i18n/useLanguage';
import { ShellHeader } from '../navigation/ShellHeader';
import {
  BUILT_IN_THEMES,
  THEME_ZONES,
  getBuiltInTheme,
  getThemeZoneForId,
  type ThemeCatalogueEntry
} from '../../constants/themeRegistry';
import { ThemePreviewChip } from '../personalize/ThemePreviewChip';
import '../../styles/shell-screens.css';
import './ThemesScreen.css';

interface ThemesScreenProps {
  showBack?: boolean;
  onBack?: () => void;
  onThemeChange?: (theme: ThemeId) => void;
  onPush?: (route: ShellRoute) => void;
}

export const ThemesScreen: React.FC<ThemesScreenProps> = ({
  showBack = false,
  onBack,
  onThemeChange,
  onPush
}) => {
  const { t, language } = useLanguage();
  const [active, setActive] = useState<ThemeId>(() => getActiveTheme());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customThemes, setCustomThemes] = useState<CustomThemeData[]>(() => loadCustomThemes());

  const themeMap = useMemo(
    () => Object.fromEntries(BUILT_IN_THEMES.map((th) => [th.id, th])) as Record<
      string,
      ThemeCatalogueEntry
    >,
    []
  );

  const activeBuiltIn = isCustomThemeId(String(active)) ? null : getBuiltInTheme(String(active));
  const activeZone = activeBuiltIn ? getThemeZoneForId(activeBuiltIn.id) : null;
  const activeLabel = activeBuiltIn
    ? language === 'pt'
      ? activeBuiltIn.labelPt
      : activeBuiltIn.labelEn
    : customThemes.find((c) => c.id === active)?.name || String(active);

  const applyTheme = (theme: ThemeId) => {
    setActiveTheme(theme);
    const next = getActiveTheme();
    setActive(next);
    onThemeChange?.(next);
  };

  const toggleLore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteCustom = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteCustomTheme(id);
      setCustomThemes(loadCustomThemes());
      if (active === id) applyTheme('classic');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active]
  );

  const renderBuiltInCard = (theme: ThemeCatalogueEntry) => {
    const isActive = active === theme.id;
    const name = language === 'pt' ? theme.labelPt : theme.labelEn;
    return (
      <li key={theme.id} className="themes-list-item">
        <div
          className={`themes-card shell-panel ${isActive ? 'themes-card--active' : ''}`}
          data-testid={`theme-card-${theme.id}`}
          data-active={isActive ? 'true' : 'false'}
        >
          <button
            type="button"
            className="themes-card-select"
            onClick={() => applyTheme(theme.id)}
            aria-pressed={isActive}
            data-testid={`theme-select-${theme.id}`}
          >
            <ThemePreviewChip themeId={theme.id} />
            <span className="themes-card-meta">
              <span className="themes-card-name">{name}</span>
              {isActive && <span className="themes-card-badge">{t.themesScreen.active}</span>}
            </span>
          </button>
          {theme.lorePt && (
            <button
              type="button"
              className={`themes-card-info ${expandedId === theme.id ? 'themes-card-info--open' : ''}`}
              onClick={(e) => toggleLore(theme.id, e)}
              aria-label={language === 'pt' ? 'Lore do tema' : 'Theme lore'}
              aria-expanded={expandedId === theme.id}
            >
              ℹ
            </button>
          )}
        </div>
        {expandedId === theme.id && theme.lorePt && (
          <p className="themes-card-lore">
            {theme.lorePt.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </p>
        )}
      </li>
    );
  };

  const renderCustomCard = (theme: CustomThemeData) => {
    const isActive = active === theme.id;
    return (
      <li key={theme.id} className="themes-list-item">
        <div
          className={`themes-card shell-panel ${isActive ? 'themes-card--active' : ''}`}
          data-testid={`theme-card-${theme.id}`}
          data-active={isActive ? 'true' : 'false'}
        >
          <button
            type="button"
            className="themes-card-select"
            onClick={() => applyTheme(theme.id as ThemeId)}
            aria-pressed={isActive}
          >
            <ThemePreviewChip
              themeId={theme.id}
              customColors={{
                bgTop: theme.colors.bgTop,
                bgBottom: theme.colors.bgBottom,
                accent: theme.colors.accent,
                felt: theme.colors.felt,
                textTitle: theme.colors.textTitle
              }}
            />
            <span className="themes-card-meta">
              <span className="themes-card-name">{theme.name}</span>
              {isActive && <span className="themes-card-badge">{t.themesScreen.active}</span>}
            </span>
          </button>
          <button
            type="button"
            className={`themes-card-info ${expandedId === theme.id ? 'themes-card-info--open' : ''}`}
            onClick={(e) => toggleLore(theme.id, e)}
            aria-label="Lore"
          >
            ℹ
          </button>
          <button
            type="button"
            className="themes-card-edit"
            onClick={() =>
              onPush?.({
                tab: 'personalize',
                screen: { type: 'themeEditor', themeId: theme.id }
              })
            }
            aria-label={language === 'pt' ? 'Editar' : 'Edit'}
          >
            ✏
          </button>
          <button
            type="button"
            className="themes-card-delete"
            onClick={(e) => handleDeleteCustom(theme.id, e)}
            aria-label={language === 'pt' ? 'Apagar' : 'Delete'}
          >
            ×
          </button>
        </div>
        {expandedId === theme.id && theme.lore && (
          <p className="themes-card-lore">{theme.lore}</p>
        )}
      </li>
    );
  };

  return (
    <div className="shell-screen screen-themes" data-testid="themes-screen">
      <ShellHeader
        title={t.themesScreen.title}
        subtitle={t.themesScreen.subtitle}
        showBack={showBack}
        onBack={onBack}
      />

      <div className="themes-current" data-testid="themes-current">
        <ThemePreviewChip
          themeId={String(active)}
          customColors={
            isCustomThemeId(String(active))
              ? (() => {
                  const c = customThemes.find((x) => x.id === active);
                  return c
                    ? {
                        bgTop: c.colors.bgTop,
                        bgBottom: c.colors.bgBottom,
                        accent: c.colors.accent,
                        felt: c.colors.felt,
                        textTitle: c.colors.textTitle
                      }
                    : undefined;
                })()
              : undefined
          }
        />
        <div className="themes-current-text">
          <span className="themes-current-label">{t.themesScreen.currentLabel}</span>
          <span className="themes-current-name">{activeLabel}</span>
          {activeZone && (
            <span className="themes-current-zone">
              {language === 'pt' ? activeZone.zone.zonePt : activeZone.zone.zoneEn}
              {activeZone.zone.subzones.length > 1
                ? ` · ${language === 'pt' ? activeZone.subzone.subPt : activeZone.subzone.subEn}`
                : ''}
            </span>
          )}
        </div>
      </div>

      <ul className="shell-list themes-list">
        {(customThemes.length > 0 || onPush) && (
          <React.Fragment>
            <li className="themes-group-header themes-group-header--custom">
              {language === 'pt' ? 'Personalizados' : 'Custom'}
              {onPush && (
                <button
                  type="button"
                  className="themes-create-btn"
                  onClick={() => onPush({ tab: 'personalize', screen: { type: 'themeEditor' } })}
                >
                  + {language === 'pt' ? 'Criar' : 'Create'}
                </button>
              )}
            </li>
            {customThemes.map((theme) => renderCustomCard(theme))}
            {customThemes.length === 0 && (
              <li className="themes-custom-empty">
                {language === 'pt' ? 'Ainda não criaste nenhum tema.' : 'No custom themes yet.'}
              </li>
            )}
          </React.Fragment>
        )}

        {THEME_ZONES.map((zone) => (
          <React.Fragment key={zone.zoneEn}>
            <li className="themes-zone-header">
              {language === 'pt' ? zone.zonePt : zone.zoneEn}
            </li>
            {zone.subzones.map((sub) => (
              <React.Fragment key={sub.subEn}>
                {zone.subzones.length > 1 && (
                  <li className="themes-subzone-header">
                    {language === 'pt' ? sub.subPt : sub.subEn}
                  </li>
                )}
                {sub.ids.map((id) => themeMap[id] && renderBuiltInCard(themeMap[id]))}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </ul>

      <p className="shell-empty">{t.themesScreen.iapNote}</p>
    </div>
  );
};
