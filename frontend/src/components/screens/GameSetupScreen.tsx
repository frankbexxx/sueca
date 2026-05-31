import React, { useState } from 'react';
import { AIDifficulty, DealingMethod, GameVariant } from '../../types/game';
import { GameConfig } from '../../types/gameConfig';
import { GameSelector } from '../GameSelector';
import { useLanguage } from '../../i18n/useLanguage';
import { useGameSetup } from '../../hooks/useGameSetup';
import { USE_LOCAL_AI_ONLY } from '../../config/features';
import { saveLastConfig } from '../../services/gameSessionStorage';
import { getAvailableGames } from '../../constants/gameMetadata';
import '../screens/PlaySetup.css';
import { ShellHeader } from '../navigation/ShellHeader';

interface GameSetupScreenProps {
  onStartGame: (config: GameConfig) => void;
  initialVariant?: GameVariant | null;
  lockVariant?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export const GameSetupScreen: React.FC<GameSetupScreenProps> = ({
  onStartGame,
  initialVariant,
  lockVariant = false,
  showBack = false,
  onBack
}) => {
  const { t } = useLanguage();
  const setup = useGameSetup(initialVariant ?? undefined);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gameName =
    getAvailableGames().find((g) => g.variant === setup.gameVariant)?.name ?? setup.gameVariant;

  const handleStart = () => {
    setError(null);
    if (!setup.playerNames[0]?.trim()) {
      setError(t.startMenu.errorPlayer1Required);
      return;
    }
    const config = { ...setup.buildConfig(), multiplayerEnabled: false };
    saveLastConfig(config);
    onStartGame(config);
  };

  return (
    <div className="screen-play shell-screen">
      <ShellHeader
        title={lockVariant ? gameName : t.playSetup.title}
        subtitle={
          lockVariant ? t.playSetup.subtitleVariant(gameName) : t.playSetup.subtitle
        }
        showBack={showBack}
        onBack={onBack}
      />

      <div className="play-setup-card shell-panel">
        {!lockVariant && (
          <GameSelector selectedGame={setup.gameVariant} onSelectGame={setup.setGameVariant} />
        )}

        <div className="play-setup-section">
          <div className="play-setup-label">{t.startMenu.playerNames}</div>
          <div className="player-buttons-row">
            {[0, 1, 2, 3].map((index) => {
              const inputId = `play-player-${index}`;
              const isEditing = editingPlayerIndex === index;
              return (
                <div key={index} className="player-name-item">
                  {!isEditing ? (
                    <button
                      type="button"
                      className="player-name-button"
                      onClick={() => setEditingPlayerIndex(index)}
                    >
                      {setup.playerNames[index] || t.startMenu.playerPlaceholder(index)}
                    </button>
                  ) : (
                    <input
                      id={inputId}
                      type="text"
                      className="form-input player-name-input"
                      value={setup.playerNames[index] || ''}
                      onChange={(e) => {
                        const copy = [...setup.playerNames];
                        copy[index] = e.target.value;
                        setup.setPlayerNames(copy);
                        setError(null);
                      }}
                      placeholder={t.startMenu.playerPlaceholder(index)}
                      maxLength={20}
                      onBlur={() => setEditingPlayerIndex(null)}
                      autoFocus
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="play-setup-section">
          <label className="play-setup-label" htmlFor="play-ai-difficulty">
            {t.startMenu.aiDifficulty}
          </label>
          <select
            id="play-ai-difficulty"
            className="form-select"
            value={setup.aiDifficulty}
            onChange={(e) => setup.setAIDifficulty(e.target.value as AIDifficulty)}
          >
            <option value="easy">{t.startMenu.difficultyEasy}</option>
            <option value="medium">{t.startMenu.difficultyMedium}</option>
            <option value="hard">{t.startMenu.difficultyHard}</option>
          </select>
          {!USE_LOCAL_AI_ONLY && setup.gameVariant === 'sueca' && setup.aiDifficulty === 'hard' && (
            <p className="play-setup-ai-hint">
              ★ Hard — Dedicated AI
            </p>
          )}
        </div>

        {setup.presetOptions.length > 1 && (
          <div className="play-setup-section">
            <label className="play-setup-label" htmlFor="play-rules-preset">
              {t.playSetup.rulesPreset}
            </label>
            <select
              id="play-rules-preset"
              className="form-select"
              value={setup.rulesPresetId}
              onChange={(e) => setup.setRulesPresetId(e.target.value as typeof setup.rulesPresetId)}
            >
              {setup.presetOptions.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.namePt}
                </option>
              ))}
            </select>
          </div>
        )}

        {setup.gameVariant === 'sueca' && (
          <div className="play-setup-section">
            <div className="play-setup-label">{t.startMenu.dealingMethod}</div>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="play-dealing"
                  value="A"
                  checked={setup.dealingMethod === 'A'}
                  onChange={() => setup.setDealingMethod('A' as DealingMethod)}
                />
                <span>{t.startMenu.methodA}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="play-dealing"
                  value="B"
                  checked={setup.dealingMethod === 'B'}
                  onChange={() => setup.setDealingMethod('B' as DealingMethod)}
                />
                <span>{t.startMenu.methodB}</span>
              </label>
            </div>
          </div>
        )}

        {error && <div className="play-setup-error">{error}</div>}

        <button
          type="button"
          className="play-start-btn sueca-btn sueca-btn--primary sueca-btn--block"
          onClick={handleStart}
        >
          {t.startMenu.startGame}
        </button>
      </div>
    </div>
  );
};

/** @deprecated Use GameSetupScreen */
export const PlaySetup = GameSetupScreen;
