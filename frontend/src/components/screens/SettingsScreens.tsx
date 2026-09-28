import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import {
  loadHandPreferences,
  saveHandPreferences,
  SUIT_ORDER_PRESETS,
  SuitOrderPresetId,
  TrumpPosition
} from '../../constants/handPreferences';
import {
  CARD_BACKS,
  CARD_DECKS,
  readActiveThemeIdFromDom,
  resolveCardBackForTheme,
  resolveEffectiveDeck
} from '../../constants/cardDeckRegistry';
import {
  loadCardSkinPreferences,
  saveCardSkinPreferences,
  SELECTABLE_CARD_BACK_IDS,
  SELECTABLE_CARD_FRONT_IDS,
  type CardBackPreference,
  type CardFrontPreference
} from '../../constants/cardSkinPreferences';
import {
  DEAL_ANIMATION_SPEEDS,
  loadDealAnimationSpeed,
  saveDealAnimationSpeed,
  type DealAnimationSpeed
} from '../../constants/dealAnimationPreferences';
import { getCardBackPath, getPublicAssetPath, CARD_BACK_PATH } from '../../constants/cardAssets';
import { loadAutoPauseTrick, saveAutoPauseTrick } from '../../utils/trickAutoContinue';
import {
  getMusicVolumeLevel,
  getSfxVolumeLevel,
  setMusicVolumeLevel,
  setSfxVolumeLevel
} from '../../services/audioService';
import type { AudioVolumeLevel } from '../../constants/audioVolumePreferences';
import { ShellHeader } from '../navigation/ShellHeader';
import { ShellHubList } from '../navigation/ShellHubList';
import { MusicSettingsControls } from './MusicSettingsControls';
import { AudioVolumeControl } from './AudioVolumeControl';
import '../../styles/shell-screens.css';
import './MoreScreen.css';
import './HandCardsScreen.css';
import './AudioVolumeControl.css';

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

/** Mais → Definições → Geral — Idioma only (audio lives under Personalizar → Música e Som). */
export const SettingsGeneralScreen: React.FC<SettingsGeneralScreenProps> = ({
  showBack,
  onBack
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="shell-screen screen-settings" data-testid="settings-general-screen">
      <ShellHeader
        title={t.settingsScreen.hubGeneral}
        showBack={showBack}
        onBack={onBack}
      />
      <section className="shell-panel">
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

interface SettingsAudioScreenProps {
  showBack: boolean;
  onBack: () => void;
}

/** Personalizar → Música e Som — audio only (no Idioma / auto-pause). */
export const SettingsAudioScreen: React.FC<SettingsAudioScreenProps> = ({
  showBack,
  onBack
}) => {
  const { language, t } = useLanguage();
  const [musicLevel, setMusicLevel] = useState<AudioVolumeLevel>(() =>
    getMusicVolumeLevel()
  );
  const [sfxLevel, setSfxLevel] = useState<AudioVolumeLevel>(() => getSfxVolumeLevel());

  return (
    <div className="shell-screen screen-settings" data-testid="audio-settings-screen">
      <ShellHeader
        title={language === 'pt' ? 'Música e Som' : 'Music & Sound'}
        subtitle={
          language === 'pt'
            ? 'Volumes e preferências de música'
            : 'Volumes and music preferences'
        }
        showBack={showBack}
        onBack={onBack}
      />
      <section className="shell-panel">
        <AudioVolumeControl
          label={language === 'pt' ? 'Música' : 'Music'}
          value={musicLevel}
          testIdPrefix="music-volume"
          onChange={(level) => {
            setMusicVolumeLevel(level);
            setMusicLevel(getMusicVolumeLevel());
          }}
        />
        <AudioVolumeControl
          label={language === 'pt' ? 'Efeitos sonoros' : 'Sound effects'}
          value={sfxLevel}
          testIdPrefix="sfx-volume"
          onChange={(level) => {
            setSfxVolumeLevel(level);
            setSfxLevel(getSfxVolumeLevel());
          }}
        />
        <p className="hand-cards-hint" style={{ marginTop: 8 }}>
          {language === 'pt'
            ? '0 = silêncio nesse canal. Música e efeitos são independentes.'
            : '0 = mute for that channel. Music and effects are independent.'}
        </p>
        <MusicSettingsControls />
      </section>
    </div>
  );
};

interface SettingsHandScreenProps {
  showBack: boolean;
  onBack: () => void;
}

const FRONT_SAMPLE: Array<{ rank: string; suit: string }> = [
  { rank: 'Ace', suit: 'Spades' },
  { rank: '7', suit: 'Hearts' },
  { rank: 'King', suit: 'Clubs' }
];

function facePreviewSrc(deckId: string, rank: string, suit: string): string {
  const dir = resolveEffectiveDeck(null, '', deckId).facePath;
  const ext = CARD_BACK_PATH.includes('.') ? CARD_BACK_PATH.split('.').pop()! : 'png';
  return getPublicAssetPath(`${dir}/${rank}_of_${suit}.${ext}`);
}

/**
 * Personalizar → Mão e Cartas.
 * Global presentation prefs only — not Sueca dealing method/direction/rules.
 */
export const SettingsHandScreen: React.FC<SettingsHandScreenProps> = ({
  showBack,
  onBack
}) => {
  const { language, t } = useLanguage();
  const [handPrefs, setHandPrefs] = useState(() => loadHandPreferences());
  const [skins, setSkins] = useState(() => loadCardSkinPreferences());
  const [dealSpeed, setDealSpeed] = useState(() => loadDealAnimationSpeed());
  const [autoPauseTrick, setAutoPauseTrick] = useState(() => loadAutoPauseTrick());
  const themeId = readActiveThemeIdFromDom();

  const updateHandPrefs = (patch: Parameters<typeof saveHandPreferences>[0]) => {
    saveHandPreferences(patch);
    setHandPrefs(loadHandPreferences());
  };

  const setFront = (cardFrontId: CardFrontPreference) => {
    saveCardSkinPreferences({ cardFrontId });
    setSkins(loadCardSkinPreferences());
  };

  const setBack = (cardBackId: CardBackPreference) => {
    saveCardSkinPreferences({ cardBackId });
    setSkins(loadCardSkinPreferences());
  };

  const setSpeed = (speed: DealAnimationSpeed) => {
    saveDealAnimationSpeed(speed);
    setDealSpeed(loadDealAnimationSpeed());
  };

  const suitPresetOptions = Object.entries(SUIT_ORDER_PRESETS) as [
    SuitOrderPresetId,
    (typeof SUIT_ORDER_PRESETS)[SuitOrderPresetId]
  ][];

  const themeBack = resolveCardBackForTheme(themeId);
  const speedLabels: Record<DealAnimationSpeed, string> = {
    fast: language === 'pt' ? 'Rápida' : 'Fast',
    normal: language === 'pt' ? 'Normal' : 'Normal',
    paused: language === 'pt' ? 'Pausada' : 'Paused'
  };

  return (
    <div className="shell-screen screen-settings" data-testid="hand-cards-screen">
      <ShellHeader
        title={t.settingsScreen.hubHand}
        subtitle={t.settingsScreen.hubHandHint}
        showBack={showBack}
        onBack={onBack}
      />
      <section className="shell-panel">
        <div className="hand-cards-section">
          <h3 className="hand-cards-section-title">
            {language === 'pt' ? 'Frente do baralho' : 'Card faces'}
          </h3>
          <div className="hand-cards-option-grid" role="listbox" aria-label="Card faces">
            <button
              type="button"
              className={`hand-cards-option${skins.cardFrontId === 'theme' ? ' hand-cards-option--active' : ''}`}
              data-testid="card-front-theme"
              data-active={skins.cardFrontId === 'theme' ? 'true' : 'false'}
              onClick={() => setFront('theme')}
            >
              <span className="hand-cards-theme-chip">
                {language === 'pt' ? 'Tema' : 'Theme'}
              </span>
              <span>{language === 'pt' ? 'Seguir tema' : 'Follow theme'}</span>
            </button>
            {SELECTABLE_CARD_FRONT_IDS.map((id) => {
              const deck = CARD_DECKS[id];
              const active = skins.cardFrontId === id;
              const frontLabel =
                language === 'pt'
                  ? (
                      {
                        cardmeister: 'CardMeister',
                        'pd-ornate': 'Ornate',
                        woodcut: 'Woodcut',
                        'jumbo-2': 'Jumbo',
                        fourcolour: '4 Cores',
                        accessible: 'Acessível'
                      } as const
                    )[id]
                  : deck.label;
              return (
                <button
                  key={id}
                  type="button"
                  className={`hand-cards-option${active ? ' hand-cards-option--active' : ''}`}
                  data-testid={`card-front-${id}`}
                  data-active={active ? 'true' : 'false'}
                  onClick={() => setFront(id)}
                >
                  <span className="hand-cards-front-preview">
                    {FRONT_SAMPLE.map((s) => (
                      <img
                        key={`${id}-${s.rank}-${s.suit}`}
                        src={facePreviewSrc(id, s.rank, s.suit)}
                        alt=""
                        draggable={false}
                      />
                    ))}
                  </span>
                  <span>{frontLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hand-cards-section">
          <h3 className="hand-cards-section-title">
            {language === 'pt' ? 'Verso do baralho' : 'Card backs'}
          </h3>
          <div className="hand-cards-option-grid" role="listbox" aria-label="Card backs">
            <button
              type="button"
              className={`hand-cards-option${skins.cardBackId === 'theme' ? ' hand-cards-option--active' : ''}`}
              data-testid="card-back-theme"
              data-active={skins.cardBackId === 'theme' ? 'true' : 'false'}
              onClick={() => setBack('theme')}
            >
              <img
                className="hand-cards-back-preview"
                src={getCardBackPath(themeId, 'theme')}
                alt=""
                draggable={false}
              />
              <span>
                {language === 'pt' ? `Tema (${themeBack.label})` : `Theme (${themeBack.label})`}
              </span>
            </button>
            {SELECTABLE_CARD_BACK_IDS.map((id) => {
              const active = skins.cardBackId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`hand-cards-option${active ? ' hand-cards-option--active' : ''}`}
                  data-testid={`card-back-${id}`}
                  data-active={active ? 'true' : 'false'}
                  onClick={() => setBack(id)}
                >
                  <img
                    className="hand-cards-back-preview"
                    src={getCardBackPath(themeId, id)}
                    alt=""
                    draggable={false}
                  />
                  <span>{CARD_BACKS[id].label}</span>
                </button>
              );
            })}
          </div>
          <p className="hand-cards-hint">
            {language === 'pt'
              ? 'Frente e verso são independentes.'
              : 'Faces and backs are independent.'}
          </p>
        </div>

        <div className="hand-cards-section">
          <h3 className="hand-cards-section-title">
            {language === 'pt' ? 'Mão' : 'Hand'}
          </h3>
          <label className="more-toggle">
            <input
              type="checkbox"
              checked={handPrefs.sortEnabled}
              data-testid="hand-sort-toggle"
              onChange={() => updateHandPrefs({ sortEnabled: !handPrefs.sortEnabled })}
            />
            <span>{t.moreScreen.sortHand}</span>
          </label>
          <label className="more-field" htmlFor="settings-suit-order">
            <span>{t.moreScreen.suitOrder}</span>
            <select
              id="settings-suit-order"
              className="more-select form-input"
              data-testid="hand-suit-order"
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
              data-testid="hand-trump-position"
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
          <p className="hand-cards-hint">
            {language === 'pt'
              ? 'A ordenação só afecta a apresentação da mão, não a jogada legal.'
              : 'Sorting only affects hand presentation, not legal play.'}
          </p>
        </div>

        <div className="hand-cards-section">
          <h3 className="hand-cards-section-title">
            {language === 'pt' ? 'Ritmo' : 'Pace'}
          </h3>
          <p className="hand-cards-hint" style={{ marginBottom: 8 }}>
            {language === 'pt' ? 'Animação da distribuição' : 'Dealing animation'}
          </p>
          <div className="hand-cards-speed-row" role="radiogroup" aria-label="Deal animation">
            {DEAL_ANIMATION_SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                className={`hand-cards-speed-btn${dealSpeed === speed ? ' hand-cards-speed-btn--active' : ''}`}
                data-testid={`deal-speed-${speed}`}
                data-active={dealSpeed === speed ? 'true' : 'false'}
                onClick={() => setSpeed(speed)}
              >
                {speedLabels[speed]}
              </button>
            ))}
          </div>
          <p className="hand-cards-hint">
            {language === 'pt'
              ? 'Só afecta o ritmo visual/áudio — nunca a ordem, o trunfo ou quem joga.'
              : 'Affects visual/audio cadence only — never order, trump, or who leads.'}
          </p>
          <label className="more-toggle" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={autoPauseTrick}
              data-testid="hand-auto-pause"
              onChange={() => {
                const next = !autoPauseTrick;
                setAutoPauseTrick(next);
                saveAutoPauseTrick(next);
              }}
            />
            <span>{t.moreScreen.autoPauseTrick}</span>
          </label>
        </div>
      </section>
    </div>
  );
};
