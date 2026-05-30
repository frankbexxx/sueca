import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import {
  loadHandPreferences,
  saveHandPreferences,
  SUIT_ORDER_PRESETS,
  SuitOrderPresetId,
  TrumpPosition
} from '../../constants/handPreferences';
import { loadAutoPauseTrick, saveAutoPauseTrick } from '../../utils/trickAutoContinue';
import { isSoundEnabled, setSoundEnabled } from '../../services/audioService';
import { ShellHeader } from '../navigation/ShellHeader';
import { ShellHubList } from '../navigation/ShellHubList';
import '../../styles/shell-screens.css';
import './MoreScreen.css';

interface SettingsHubScreenProps {
  showBack: boolean;
  onBack: () => void;
  onOpenSection: (section: 'general' | 'hand') => void;
}

export const SettingsHubScreen: React.FC<SettingsHubScreenProps> = ({
  showBack,
  onBack,
  onOpenSection
}) => {
  const { t } = useLanguage();

  return (
    <div className="shell-screen screen-settings">
      <ShellHeader
        title={t.settingsScreen.title}
        subtitle={t.settingsScreen.subtitle}
        showBack={showBack}
        onBack={onBack}
      />
      <ShellHubList
        items={[
          {
            id: 'general',
            label: t.settingsScreen.hubGeneral,
            hint: t.settingsScreen.hubGeneralHint,
            onClick: () => onOpenSection('general')
          },
          {
            id: 'hand',
            label: t.settingsScreen.hubHand,
            hint: t.settingsScreen.hubHandHint,
            onClick: () => onOpenSection('hand')
          }
        ]}
      />
    </div>
  );
};

interface SettingsGeneralScreenProps {
  showBack: boolean;
  onBack: () => void;
}

export const SettingsGeneralScreen: React.FC<SettingsGeneralScreenProps> = ({
  showBack,
  onBack
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const [autoPauseTrick, setAutoPauseTrick] = useState(() => loadAutoPauseTrick());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
  };

  return (
    <div className="shell-screen screen-settings">
      <ShellHeader
        title={t.settingsScreen.hubGeneral}
        showBack={showBack}
        onBack={onBack}
      />
      <section className="shell-panel">
        <label className="more-toggle">
          <input type="checkbox" checked={soundEnabled} onChange={toggleSound} />
          <span>{t.moreScreen.sound}</span>
        </label>
        <label className="more-toggle">
          <input
            type="checkbox"
            checked={autoPauseTrick}
            onChange={() => {
              const next = !autoPauseTrick;
              setAutoPauseTrick(next);
              saveAutoPauseTrick(next);
            }}
          />
          <span>{t.moreScreen.autoPauseTrick}</span>
        </label>
        <div className="more-lang">
          <span>{t.moreScreen.language}</span>
          <div className="language-selector">
            <button
              type="button"
              className={`lang-btn ${language === 'pt' ? 'active' : ''}`}
              onClick={() => setLanguage('pt')}
            >
              PT
            </button>
            <button
              type="button"
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

interface SettingsHandScreenProps {
  showBack: boolean;
  onBack: () => void;
}

export const SettingsHandScreen: React.FC<SettingsHandScreenProps> = ({
  showBack,
  onBack
}) => {
  const { language, t } = useLanguage();
  const [handPrefs, setHandPrefs] = useState(() => loadHandPreferences());

  const updateHandPrefs = (patch: Parameters<typeof saveHandPreferences>[0]) => {
    saveHandPreferences(patch);
    setHandPrefs(loadHandPreferences());
  };

  const suitPresetOptions = Object.entries(SUIT_ORDER_PRESETS) as [
    SuitOrderPresetId,
    (typeof SUIT_ORDER_PRESETS)[SuitOrderPresetId]
  ][];

  return (
    <div className="shell-screen screen-settings">
      <ShellHeader title={t.settingsScreen.hubHand} showBack={showBack} onBack={onBack} />
      <section className="shell-panel">
        <label className="more-toggle">
          <input
            type="checkbox"
            checked={handPrefs.sortEnabled}
            onChange={() => updateHandPrefs({ sortEnabled: !handPrefs.sortEnabled })}
          />
          <span>{t.moreScreen.sortHand}</span>
        </label>
        <label className="more-field" htmlFor="settings-suit-order">
          <span>{t.moreScreen.suitOrder}</span>
          <select
            id="settings-suit-order"
            className="more-select form-input"
            value={handPrefs.suitOrderPreset}
            onChange={(e) =>
              updateHandPrefs({ suitOrderPreset: e.target.value as SuitOrderPresetId })
            }
          >
            {suitPresetOptions.map(([id, preset]) => (
              <option key={id} value={id}>
                {language === 'pt' ? preset.labelPt : preset.labelEn}
              </option>
            ))}
          </select>
        </label>
        <label className="more-field" htmlFor="settings-trump-position">
          <span>{t.moreScreen.trumpPosition}</span>
          <select
            id="settings-trump-position"
            className="more-select form-input"
            value={handPrefs.trumpPosition}
            onChange={(e) =>
              updateHandPrefs({ trumpPosition: e.target.value as TrumpPosition })
            }
          >
            <option value="left">{t.moreScreen.trumpLeft}</option>
            <option value="right">{t.moreScreen.trumpRight}</option>
            <option value="natural">{t.moreScreen.trumpNatural}</option>
          </select>
        </label>
      </section>
    </div>
  );
};
