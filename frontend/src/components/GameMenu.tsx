import React, { useState, useEffect } from 'react';
import './GameMenu.css';
import { AIDifficulty, DealingMethod } from '../types/game';
import { CreditsModal } from './CreditsModal';
import { useLanguage } from '../i18n/useLanguage';

/**
 * Props interface for GameMenu component
 * Handles all game configuration and control actions
 */
interface GameMenuProps {
  playerNames: string[];
  onPlayerNamesChange: (names: string[]) => void;
  aiDifficulty: AIDifficulty;
  onAIDifficultyChange: (difficulty: AIDifficulty) => void;
  dealingMethod: DealingMethod;
  onDealingMethodChange: (method: DealingMethod) => void;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
  onNewGame: () => void;
  isGameOver: boolean;
  isGameActive: boolean;
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}

/**
 * Game menu component - top bar with game title, player name, and control buttons
 * Manages settings panel, pause/resume, quit, and dark mode toggle
 */
export const GameMenu: React.FC<GameMenuProps> = ({
  playerNames,
  onPlayerNamesChange,
  aiDifficulty,
  onAIDifficultyChange,
  dealingMethod,
  onDealingMethodChange,
  isPaused,
  onPause,
  onResume,
  onQuit,
  onNewGame,
  isGameOver,
  isGameActive,
  darkMode,
  onDarkModeChange,
  showGrid,
  onToggleGrid
}) => {
  const { t } = useLanguage();
  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  // Temporary state for settings form (not applied until "Save" clicked)
  const [tempNames, setTempNames] = useState<string[]>(playerNames);
  const [tempDifficulty, setTempDifficulty] = useState<AIDifficulty>(aiDifficulty);
  const [tempDealingMethod, setTempDealingMethod] = useState<DealingMethod>(dealingMethod);

  /**
   * Sync temporary names with prop changes
   * Updates temp state when playerNames prop changes externally
   */
  useEffect(() => {
    setTempNames(playerNames);
  }, [playerNames]);

  /**
   * Sync temporary dealing method with prop changes
   */
  useEffect(() => {
    setTempDealingMethod(dealingMethod);
  }, [dealingMethod]);

  /**
   * Saves settings changes
   * Cleans player names (trims whitespace, provides defaults)
   * Applies changes to parent component and closes settings panel
   */
  const handleSaveSettings = () => {
    const cleaned = tempNames.map((n, idx) => (n.trim() || `Player ${idx + 1}`));
    onPlayerNamesChange(cleaned);
    onAIDifficultyChange(tempDifficulty);
    onDealingMethodChange(tempDealingMethod);
    setShowSettings(false);
  };

  /**
   * Toggles dark mode and persists to localStorage
   * Updates both parent state and browser storage
   */
  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    onDarkModeChange(newDarkMode);
    localStorage.setItem('sueca-dark-mode', String(newDarkMode));
  };

  return (
    <div className="game-menu">
      <div className="menu-header">
        <div className="menu-left">
          <h1 className="game-title">{t.gameMenu.title}</h1>
          {playerNames[0] && (
            <div className="player-name-display">
              <span className="player-label">{t.gameMenu.player}</span>
              <span className="player-name-value">{playerNames[0]}</span>
            </div>
          )}
        </div>
        <div className="menu-right">
          <button 
            className="icon-btn settings-icon-btn"
            onClick={() => setShowSettings(!showSettings)}
            title={t.gameMenu.settings}
          >
            ⚙️
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-content">
            <h3>{t.gameMenu.settings}</h3>
            <div className="setting-item">
              <div style={{ fontWeight: 600, fontSize: '1em', color: '#cfdffc', marginBottom: '4px' }}>{t.gameMenu.playerNames}</div>
              {[0,1,2,3].map(idx => {
                const inputId = `settings-player-${idx}`;
                return (
                <label key={idx} htmlFor={inputId} style={{ display: 'block', marginBottom: '6px' }}>
                  <input
                    id={inputId}
                    type="text"
                    name={inputId}
                    value={tempNames[idx] || ''}
                    onChange={(e) => {
                      const copy = [...tempNames];
                      copy[idx] = e.target.value;
                      setTempNames(copy);
                    }}
                    placeholder={`Player ${idx + 1}`}
                    maxLength={20}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveSettings();
                      }
                    }}
                    aria-label={t.aria.playerNameInput(idx)}
                    style={{ width: '100%' }}
                  />
                </label>
                );
              })}
            </div>
            <div className="setting-item">
              <label htmlFor="ai-difficulty">{t.gameMenu.aiDifficulty}</label>
              {isGameActive && !isGameOver ? (
                <>
                  <select
                    id="ai-difficulty"
                    value={tempDifficulty}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  >
                    <option value="easy">{t.startMenu.difficultyEasy}</option>
                    <option value="medium">{t.startMenu.difficultyMedium}</option>
                    <option value="hard">{t.startMenu.difficultyHard}</option>
                  </select>
                  <div className="difficulty-description" style={{ fontSize: '0.85em', color: '#ff9800', marginTop: '4px' }}>
                    {t.gameMenu.difficultyChangeNote}
                  </div>
                </>
              ) : (
                <>
                  <select
                    id="ai-difficulty"
                    value={tempDifficulty}
                    onChange={(e) => setTempDifficulty(e.target.value as AIDifficulty)}
                  >
                    <option value="easy">{t.startMenu.difficultyEasy}</option>
                    <option value="medium">{t.startMenu.difficultyMedium}</option>
                    <option value="hard">{t.startMenu.difficultyHard}</option>
                  </select>
                  <div className="difficulty-description">
                    {tempDifficulty === 'easy' && <span>{t.startMenu.difficultyDescEasy}</span>}
                    {tempDifficulty === 'medium' && <span>{t.startMenu.difficultyDescMedium}</span>}
                    {tempDifficulty === 'hard' && <span>{t.startMenu.difficultyDescHard}</span>}
                  </div>
                </>
              )}
            </div>
            <div className="setting-item">
              <div style={{ fontWeight: 600, fontSize: '1em', color: '#cfdffc', marginBottom: '8px' }}>{t.gameMenu.dealingMethod}</div>
              {isGameActive && !isGameOver ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px', opacity: 0.6, cursor: 'not-allowed' }}>
                      <input
                        type="radio"
                        name="dealing-method-disabled"
                        value="A"
                        checked={tempDealingMethod === 'A'}
                        disabled
                        style={{ cursor: 'not-allowed' }}
                      />
                      <span>{t.startMenu.methodA}</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px', opacity: 0.6, cursor: 'not-allowed' }}>
                      <input
                        type="radio"
                        name="dealing-method-disabled"
                        value="B"
                        checked={tempDealingMethod === 'B'}
                        disabled
                        style={{ cursor: 'not-allowed' }}
                      />
                      <span>{t.startMenu.methodB}</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => {
                        if (!isGameActive || isGameOver) {
                          e.currentTarget.style.borderColor = 'rgba(108, 92, 231, 0.5)';
                          e.currentTarget.style.background = 'rgba(108, 92, 231, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isGameActive || isGameOver) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="dealing-method"
                        value="A"
                        checked={tempDealingMethod === 'A'}
                        onChange={(e) => setTempDealingMethod(e.target.value as DealingMethod)}
                      />
                      <span>{t.startMenu.methodA}</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => {
                        if (!isGameActive || isGameOver) {
                          e.currentTarget.style.borderColor = 'rgba(108, 92, 231, 0.5)';
                          e.currentTarget.style.background = 'rgba(108, 92, 231, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isGameActive || isGameOver) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="dealing-method"
                        value="B"
                        checked={tempDealingMethod === 'B'}
                        onChange={(e) => setTempDealingMethod(e.target.value as DealingMethod)}
                      />
                      <span>{t.startMenu.methodB}</span>
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="setting-item setting-inline">
              <label htmlFor="show-grid">{t.gameMenu.showGrid}</label>
              <div className="setting-toggle">
                <input
                  id="show-grid"
                  type="checkbox"
                  checked={showGrid}
                  onChange={onToggleGrid}
                />
                <span>{showGrid ? t.gameMenu.active : t.gameMenu.inactive}</span>
              </div>
            </div>
            <div className="setting-item">
              <label htmlFor="dark-mode" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  id="dark-mode"
                  name="dark-mode"
                  type="checkbox"
                  checked={darkMode}
                  onChange={handleDarkModeToggle}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span>{t.gameMenu.darkMode}</span>
              </label>
            </div>
            
            <div className="setting-item" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '8px' }}>
              <button
                className="credits-btn"
                onClick={() => {
                  setShowCredits(true);
                  setShowSettings(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '0.95em',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%)',
                  color: '#e9eef7',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.15) 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%)';
                }}
              >
                {t.gameMenu.thanks}
              </button>
            </div>
            
            {/* Game control buttons moved to settings panel */}
            <div className="setting-item" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '8px' }}>
              <div style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '1em', color: '#cfdffc' }}>{t.gameMenu.gameControls}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {!isGameOver && isGameActive && (
                  <>
                    {isPaused ? (
                      <button 
                        className="menu-btn pause-btn"
                        onClick={() => {
                          onResume();
                          setShowSettings(false);
                        }}
                        title={t.gameMenu.resume}
                      >
                        ▶️ {t.gameMenu.resume}
                      </button>
                    ) : (
                      <button 
                        className="menu-btn pause-btn"
                        onClick={() => {
                          onPause();
                          setShowSettings(false);
                        }}
                        title={t.gameMenu.pause}
                      >
                        ⏸️ {t.gameMenu.pause}
                      </button>
                    )}
                  </>
                )}
                
                {isGameActive && (
                  <button 
                    className="menu-btn quit-btn"
                    onClick={() => {
                      if (window.confirm(t.gameMenu.quitConfirm)) {
                        onQuit();
                        setShowSettings(false);
                      }
                    }}
                    title={t.gameMenu.quit}
                  >
                    🚪 {t.gameMenu.quit}
                  </button>
                )}
                
                <button className="menu-btn save-btn" onClick={handleSaveSettings}>
                  {t.gameMenu.save}
                </button>
                <button 
                  className="menu-btn cancel-btn" 
                  onClick={() => {
                    setTempNames(playerNames);
                    setTempDifficulty(aiDifficulty);
                    setTempDealingMethod(dealingMethod);
                    setShowSettings(false);
                  }}
                >
                  {t.gameMenu.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="game-over-banner">
          <span>{t.gameMenu.gameOver}</span>
          <button className="new-game-btn" onClick={onNewGame}>
            {t.gameMenu.newGame}
          </button>
        </div>
      )}

      {showCredits && (
        <CreditsModal
          onClose={() => setShowCredits(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

