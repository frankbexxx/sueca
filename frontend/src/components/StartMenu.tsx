import React, { useState, useEffect } from 'react';
import { AIDifficulty, DealingMethod } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import './StartMenu.css';

/**
 * Configuration interface for starting a new game
 */
export interface GameConfig {
  playerNames: string[];
  aiDifficulty: AIDifficulty;
  dealingMethod: DealingMethod;
}

/**
 * Props interface for StartMenu component
 */
interface StartMenuProps {
  onStartGame: (config: GameConfig) => void;
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}

/**
 * Start menu component - appears before game starts, after game ends, and when quitting
 * Allows configuration of player names, AI difficulty, and dealing method
 */
export const StartMenu: React.FC<StartMenuProps> = ({
  onStartGame,
  darkMode,
  onDarkModeChange
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  
  // Load saved values from localStorage or use defaults
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('sueca-player-names');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing saved player names:', e);
      }
    }
    return ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  });

  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>(() => {
    const saved = localStorage.getItem('sueca-ai-difficulty');
    if (saved === 'easy' || saved === 'medium' || saved === 'hard') {
      return saved;
    }
    return 'medium';
  });

  const [dealingMethod, setDealingMethod] = useState<DealingMethod>(() => {
    const saved = localStorage.getItem('sueca-dealing-method');
    if (saved === 'A' || saved === 'B') {
      return saved;
    }
    return 'A';
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save to localStorage whenever values change
  useEffect(() => {
    localStorage.setItem('sueca-player-names', JSON.stringify(playerNames));
  }, [playerNames]);

  useEffect(() => {
    localStorage.setItem('sueca-ai-difficulty', aiDifficulty);
  }, [aiDifficulty]);

  useEffect(() => {
    localStorage.setItem('sueca-dealing-method', dealingMethod);
  }, [dealingMethod]);

  /**
   * Handles form submission and starts the game
   * Validates that Player 1 has a name before starting
   */
  const handleStart = () => {
    setError(null);
    
    // Validate Player 1 name
    if (!playerNames[0]?.trim()) {
      setError(t.startMenu.errorPlayer1Required);
      return;
    }

    // Clean player names (trim and provide defaults)
    const cleanedNames = playerNames.map((name, index) => {
      const trimmed = name.trim();
      return trimmed || `Player ${index + 1}`;
    });

    const config: GameConfig = {
      playerNames: cleanedNames,
      aiDifficulty,
      dealingMethod
    };

    // Save final config to localStorage
    localStorage.setItem('sueca-player-names', JSON.stringify(cleanedNames));
    localStorage.setItem('sueca-ai-difficulty', aiDifficulty);
    localStorage.setItem('sueca-dealing-method', dealingMethod);

    onStartGame(config);
  };

  /**
   * Handles dark mode toggle
   */
  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    onDarkModeChange(newDarkMode);
    localStorage.setItem('sueca-dark-mode', String(newDarkMode));
  };

  return (
    <div className={`start-menu-overlay ${darkMode ? 'dark-mode' : ''}`}>
      <div className="start-menu-card">
        <div className="start-menu-header">
          <h1 className="start-menu-title">{t.startMenu.title}</h1>
          {/* Language Selector */}
          <div className="language-selector">
            <button
              className={`lang-btn ${language === 'pt' ? 'active' : ''}`}
              onClick={() => setLanguage('pt')}
              title="Português"
            >
              PT
            </button>
            <button
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
              title="English"
            >
              EN
            </button>
          </div>
        </div>
        
        <div className="start-menu-form">
          {/* Player Names - Botões que abrem input */}
          <div className="form-section">
            <div className="form-label">{t.startMenu.playerNames}</div>
            <div className="player-buttons-row">
              {[0, 1, 2, 3].map((index) => {
                const inputId = `player-name-${index}`;
                const isEditing = editingPlayerIndex === index;
                return (
                  <div key={index} className="player-name-item">
                    {!isEditing ? (
                      <button
                        type="button"
                        className="player-name-button"
                        onClick={() => setEditingPlayerIndex(index)}
                        aria-label={`${t.startMenu.playerNames} ${index + 1}`}
                      >
                        {playerNames[index] || t.startMenu.playerPlaceholder(index)}
                      </button>
                    ) : (
                      <input
                        id={inputId}
                        name={inputId}
                        type="text"
                        className={`form-input player-name-input ${index === 0 ? 'required' : ''}`}
                        value={playerNames[index] || ''}
                        onChange={(e) => {
                          const copy = [...playerNames];
                          copy[index] = e.target.value;
                          setPlayerNames(copy);
                          setError(null);
                        }}
                        placeholder={t.startMenu.playerPlaceholder(index)}
                        maxLength={20}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setEditingPlayerIndex(null);
                            if (index === 3) {
                              handleStart();
                            }
                          }
                        }}
                        onBlur={() => setEditingPlayerIndex(null)}
                        autoFocus
                        aria-label={t.aria.playerNameInput(index)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Difficulty */}
          <div className="form-section">
            <label className="form-label" htmlFor="ai-difficulty">
              {t.startMenu.aiDifficulty}
            </label>
            <select
              id="ai-difficulty"
              className="form-select"
              value={aiDifficulty}
              onChange={(e) => setAIDifficulty(e.target.value as AIDifficulty)}
            >
              <option value="easy">{t.startMenu.difficultyEasy}</option>
              <option value="medium">{t.startMenu.difficultyMedium}</option>
              <option value="hard">{t.startMenu.difficultyHard}</option>
            </select>
            <div className="difficulty-description">
              {aiDifficulty === 'easy' && (
                <span>{t.startMenu.difficultyDescEasy}</span>
              )}
              {aiDifficulty === 'medium' && (
                <span>{t.startMenu.difficultyDescMedium}</span>
              )}
              {aiDifficulty === 'hard' && (
                <span>{t.startMenu.difficultyDescHard}</span>
              )}
            </div>
          </div>

          {/* Dealing Method */}
          <div className="form-section">
            <div className="form-label">{t.startMenu.dealingMethod}</div>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="dealing-method"
                  value="A"
                  checked={dealingMethod === 'A'}
                  onChange={(e) => setDealingMethod(e.target.value as DealingMethod)}
                />
                <span>{t.startMenu.methodA}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="dealing-method"
                  value="B"
                  checked={dealingMethod === 'B'}
                  onChange={(e) => setDealingMethod(e.target.value as DealingMethod)}
                />
                <span>{t.startMenu.methodB}</span>
              </label>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Start Game Button */}
          <button
            className="start-game-button"
            onClick={handleStart}
          >
            {t.startMenu.startGame}
          </button>

          {/* Advanced Settings Toggle */}
          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} {t.startMenu.advancedSettings}
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="advanced-settings">
              <div className="form-section">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} htmlFor="advanced-dark-mode">
                  <input
                    id="advanced-dark-mode"
                    name="advanced-dark-mode"
                    type="checkbox"
                    checked={darkMode}
                    onChange={handleDarkModeToggle}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span>{t.startMenu.darkMode}</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

