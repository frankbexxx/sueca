import React, { useRef, useState } from 'react';
import { AIDifficulty, GameVariant, PlayDirection } from '../../types/game';
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

/** ARCH-SUECA-06 — session play direction (not Method A/B). */
const PLAY_DIRECTION_OPTIONS: {
  id: PlayDirection;
  titlePt: string;
  hintPt: string;
  titleEn: string;
  hintEn: string;
}[] = [
  {
    id: 'right',
    titlePt: 'Pela direita',
    hintPt: 'Sentido anti-horário',
    titleEn: 'To the right',
    hintEn: 'Anti-clockwise'
  },
  {
    id: 'left',
    titlePt: 'Pela esquerda',
    hintPt: 'Sentido horário',
    titleEn: 'To the left',
    hintEn: 'Clockwise'
  }
];

function kingModeSummary(
  presetId: RulesPresetId,
  isPt: boolean,
  labels: { synthetic: string; normal: string }
): { chip: string; sub: string } | null {
  if (presetId !== 'king-pt-synthetic' && presetId !== 'king-pt-normal') return null;
  const preset = getPreset(presetId);
  const chip = isPt ? preset.namePt : preset.name;
  return {
    chip,
    sub: presetId === 'king-pt-synthetic' ? labels.synthetic : labels.normal
  };
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
    setup.gameVariant === 'king'
      ? kingModeSummary(setup.rulesPresetId, isPt, {
          synthetic: t.playSetup.kingSyntheticMode,
          normal: t.playSetup.kingNormalMode
        })
      : null;
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
            aria-label={t.playSetup.back}
          >
            ←
          </button>
        )}
        <div className="setup-header-copy">
          <p className="setup-kicker">{t.playSetup.kicker}</p>
          <h1 className="setup-game-title">{gameName}</h1>
          {kingSummary && (
            <div className="setup-mode" aria-label={t.playSetup.selectedMode}>
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
            {t.playSetup.players}
          </h2>
          <div className="setup-seats">
            {[0, 1, 2, 3].map((index) => {
              const isYou = index === 0;
              const isEditing = editingPlayerIndex === index;
              // P1 always from global identity; bots from per-game seats.
              const name = isYou
                ? setup.playerNames[0]?.trim() || 'Player 1'
                : setup.playerNames[index]?.trim() || `Player ${index + 1}`;
              const roleBadge = isYou ? t.playSetup.youBadge : t.playSetup.aiBadge;
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
                            : t.playSetup.seatName(index)
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
            {t.playSetup.difficulty}
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
              {t.playSetup.rules}
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
                      <span className="setup-deal-option__copy">
                        <span className="setup-deal-title">
                          {isPt ? preset.namePt : preset.name}
                        </span>
                        <span className="setup-deal-hint">
                          {isPt ? preset.descriptionPt : preset.description}
                        </span>
                      </span>
                      {setup.rulesPresetId === preset.id ? (
                        <span className="setup-deal-check" aria-hidden="true">
                          ✓
                        </span>
                      ) : (
                        <span
                          className="setup-deal-check setup-deal-check--empty"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {showSuecaRules && (
              <>
                <p className="setup-rules-intro">{t.playSetup.suecaDealSummary}</p>
                <p className="setup-rules-intro">{t.startMenu.playDirection}</p>
                <div
                  className="setup-dealing"
                  role="radiogroup"
                  aria-label={t.startMenu.playDirection}
                >
                  {PLAY_DIRECTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={setup.playDirection === opt.id}
                      className={`setup-deal-option${
                        setup.playDirection === opt.id ? ' is-selected' : ''
                      }`}
                      onClick={() => setup.setPlayDirection(opt.id)}
                    >
                      <span className="setup-deal-option__copy">
                        <span className="setup-deal-title">
                          {isPt ? opt.titlePt : opt.titleEn}
                        </span>
                        <span className="setup-deal-hint">
                          {isPt ? opt.hintPt : opt.hintEn}
                        </span>
                      </span>
                      {setup.playDirection === opt.id ? (
                        <span className="setup-deal-check" aria-hidden="true">
                          ✓
                        </span>
                      ) : (
                        <span
                          className="setup-deal-check setup-deal-check--empty"
                          aria-hidden="true"
                        />
                      )}
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
          {t.playSetup.start}
        </button>
      </div>
    </div>
  );
};

/** @deprecated Use GameSetupScreen */
export const PlaySetup = GameSetupScreen;
