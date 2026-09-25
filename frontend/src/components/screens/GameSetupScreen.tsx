import React, { useRef, useState } from 'react';
import { AIDifficulty, DealingMethod, GameVariant } from '../../types/game';
import { GameConfig } from '../../types/gameConfig';
import { useLanguage } from '../../i18n/useLanguage';
import { useGameSetup } from '../../hooks/useGameSetup';
import { saveLastConfig } from '../../services/gameSessionStorage';
import { getGameMetadata } from '../../constants/gameMetadata';
import { getPreset, type RulesPresetId } from '../../constants/rulesPresets';
import { setP1Name } from '../../services/setupPreferences';
import './PlaySetup.css';

interface GameSetupScreenProps {
  onStartGame: (config: GameConfig) => void;
  initialVariant?: GameVariant | null;
  initialRulesPresetId?: RulesPresetId;
  lockVariant?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

const DIFF_OPTIONS: { id: AIDifficulty; labelPt: string; labelEn: string }[] = [
  { id: 'easy', labelPt: 'Fácil', labelEn: 'Easy' },
  { id: 'medium', labelPt: 'Médio', labelEn: 'Medium' },
  { id: 'hard', labelPt: 'Difícil', labelEn: 'Hard' }
];

/** Labels from suecaDeal.ts — not invented. */
const DEALING_OPTIONS: {
  id: DealingMethod;
  titlePt: string;
  hintPt: string;
  titleEn: string;
  hintEn: string;
}[] = [
  {
    id: 'A',
    titlePt: 'Padrão',
    hintPt: 'Uma a uma à volta da mesa; a última carta define o trunfo',
    titleEn: 'Standard',
    hintEn: 'One by one around the table; the last card sets trump'
  },
  {
    id: 'B',
    titlePt: 'Dealer recebe primeiro',
    hintPt: 'O dealer recebe a primeira carta (trunfo), depois o resto da mão',
    titleEn: 'Dealer first',
    hintEn: 'Dealer receives the first card (trump), then the rest of the hand'
  }
];

function kingModeSummary(presetId: RulesPresetId): { chip: string; sub: string } | null {
  if (presetId === 'king-pt-synthetic') {
    return {
      chip: getPreset('king-pt-synthetic').namePt,
      sub: 'Todos os negativos + 4 Festas'
    };
  }
  if (presetId === 'king-pt-normal') {
    return {
      chip: getPreset('king-pt-normal').namePt,
      sub: '6 negativos + 4 Festas'
    };
  }
  return null;
}

export const GameSetupScreen: React.FC<GameSetupScreenProps> = ({
  onStartGame,
  initialVariant,
  initialRulesPresetId,
  lockVariant = false,
  showBack = false,
  onBack
}) => {
  const { t, language } = useLanguage();
  const setup = useGameSetup(initialVariant ?? undefined, initialRulesPresetId);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startingRef = useRef(false);
  const isPt = language !== 'en';
  const gameName = getGameMetadata(setup.gameVariant).name;
  const kingSummary =
    setup.gameVariant === 'king' ? kingModeSummary(setup.rulesPresetId) : null;
  const showSpadesRules = setup.gameVariant === 'spades';
  const showSuecaRules = setup.gameVariant === 'sueca';
  const showRules = showSpadesRules || showSuecaRules;
  const canStart = Boolean(setup.playerNames[0]?.trim());

  const handleStart = () => {
    if (startingRef.current) return;
    setError(null);
    if (!setup.playerNames[0]?.trim()) {
      setError(t.startMenu.errorPlayer1Required);
      return;
    }
    startingRef.current = true;
    const config: GameConfig = {
      ...setup.buildConfig(),
      multiplayerEnabled: false,
      multiplayerSessionId: undefined,
      localPlayerIndex: undefined,
      multiplayerSlots: undefined
    };
    setP1Name(config.playerNames[0]);
    saveLastConfig(config);
    onStartGame(config);
  };

  const updateSeatName = (index: number, value: string) => {
    const copy = [...setup.playerNames];
    copy[index] = value;
    setup.setPlayerNames(copy);
    if (index === 0) setError(null);
  };

  const commitSeatEdit = (index: number) => {
    const trimmed = setup.playerNames[index]?.trim() ?? '';
    if (index === 0) {
      const next = trimmed || 'Player 1';
      updateSeatName(0, next);
      setP1Name(next);
    } else if (!trimmed) {
      updateSeatName(index, `Player ${index + 1}`);
    } else {
      updateSeatName(index, trimmed);
    }
    setEditingPlayerIndex(null);
  };

  return (
    <div className="screen-setup shell-screen" data-setup-variant={setup.gameVariant}>
      <header className="setup-header">
        {showBack && (
          <button
            type="button"
            className="setup-back"
            onClick={onBack}
            aria-label="Voltar"
          >
            ←
          </button>
        )}
        <div className="setup-header-copy">
          <p className="setup-kicker">Preparar a mesa</p>
          <h1 className="setup-game-title">{gameName}</h1>
          {kingSummary && (
            <div className="setup-mode" aria-label="Modo seleccionado">
              <span className="setup-mode-chip">{kingSummary.chip}</span>
              <p className="setup-mode-sub">{kingSummary.sub}</p>
            </div>
          )}
          {!lockVariant && (
            <p className="setup-unlock-hint">{t.playSetup.subtitle}</p>
          )}
        </div>
      </header>

      <div className="setup-scroll">
        <section className="setup-section" aria-labelledby="setup-players-heading">
          <h2 id="setup-players-heading" className="setup-section-label">
            Jogadores
          </h2>
          <div className="setup-seats">
            {[0, 1, 2, 3].map((index) => {
              const isYou = index === 0;
              const isEditing = editingPlayerIndex === index;
              // P1 always from global identity; bots from per-game seats.
              const name = isYou
                ? setup.playerNames[0]?.trim() || 'Player 1'
                : setup.playerNames[index]?.trim() || `Player ${index + 1}`;
              const roleBadge = isYou ? 'TU' : 'IA';
              return (
                <div
                  key={index}
                  className={`setup-seat${isYou ? ' setup-seat--you' : ''}${
                    isEditing ? ' is-editing' : ''
                  }`}
                  data-seat-role={isYou ? 'you' : 'ai'}
                >
                  {isEditing ? (
                    <div className="setup-seat-edit-row">
                      <input
                        className="setup-seat-input"
                        value={setup.playerNames[index] || ''}
                        maxLength={20}
                        autoFocus
                        aria-label={
                          isYou
                            ? t.moreScreen?.playerName ?? 'O teu nome'
                            : `Nome do jogador ${index + 1}`
                        }
                        onChange={(e) => updateSeatName(index, e.target.value)}
                        onBlur={() => commitSeatEdit(index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitSeatEdit(index);
                          if (e.key === 'Escape') setEditingPlayerIndex(null);
                        }}
                      />
                      <span
                        className={`setup-badge${
                          isYou ? ' setup-badge--you' : ' setup-badge--ai'
                        }`}
                        aria-hidden="true"
                      >
                        {roleBadge}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="setup-seat-btn"
                      onClick={() => setEditingPlayerIndex(index)}
                    >
                      <span className="setup-seat-name">{name}</span>
                      <span
                        className={`setup-badge${
                          isYou ? ' setup-badge--you' : ' setup-badge--ai'
                        }`}
                      >
                        {roleBadge}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="setup-section" aria-labelledby="setup-diff-heading">
          <h2 id="setup-diff-heading" className="setup-section-label">
            Dificuldade
          </h2>
          <div
            className="setup-segment"
            role="radiogroup"
            aria-label={t.startMenu.aiDifficulty}
          >
            {DIFF_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={setup.aiDifficulty === d.id}
                className={`setup-segment-btn${
                  setup.aiDifficulty === d.id ? ' is-selected' : ''
                }`}
                onClick={() => setup.setAIDifficulty(d.id)}
              >
                {isPt ? d.labelPt : d.labelEn}
              </button>
            ))}
          </div>
        </section>

        {showRules && (
          <section className="setup-section" aria-labelledby="setup-rules-heading">
            <h2 id="setup-rules-heading" className="setup-section-label">
              Regras
            </h2>

            {showSpadesRules && (
              <>
                <p className="setup-rules-intro">{t.playSetup.rulesPreset}</p>
                <div
                  className="setup-dealing"
                  role="radiogroup"
                  aria-label={t.playSetup.rulesPreset}
                >
                  {setup.presetOptions.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      role="radio"
                      aria-checked={setup.rulesPresetId === preset.id}
                      className={`setup-deal-option${
                        setup.rulesPresetId === preset.id ? ' is-selected' : ''
                      }`}
                      onClick={() => setup.setRulesPresetId(preset.id)}
                    >
                      <span className="setup-deal-title">{preset.namePt}</span>
                      <span className="setup-deal-hint">
                        {isPt ? preset.descriptionPt : preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {showSuecaRules && (
              <>
                <p className="setup-rules-intro">Distribuição</p>
                <div
                  className="setup-dealing"
                  role="radiogroup"
                  aria-label={t.startMenu.dealingMethod}
                >
                  {DEALING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={setup.dealingMethod === opt.id}
                      className={`setup-deal-option${
                        setup.dealingMethod === opt.id ? ' is-selected' : ''
                      }`}
                      onClick={() => setup.setDealingMethod(opt.id)}
                    >
                      <span className="setup-deal-title">
                        {isPt ? opt.titlePt : opt.titleEn}
                      </span>
                      <span className="setup-deal-hint">
                        {isPt ? opt.hintPt : opt.hintEn}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {error && (
          <div className="setup-error" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="setup-cta-bar">
        <button
          type="button"
          className="setup-cta"
          onClick={handleStart}
          disabled={!canStart}
        >
          Começar
        </button>
      </div>
    </div>
  );
};

/** @deprecated Use GameSetupScreen */
export const PlaySetup = GameSetupScreen;
