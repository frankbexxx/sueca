import React, { useState, useEffect } from 'react';
import './GameMenu.css';
import { AIDifficulty } from '../types/game';

/**
 * Props interface for GameMenu component
 * Handles all game configuration and control actions
 */
interface GameMenuProps {
  playerNames: string[];
  onPlayerNamesChange: (names: string[]) => void;
  aiDifficulty: AIDifficulty;
  onAIDifficultyChange: (difficulty: AIDifficulty) => void;
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
  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  // Temporary state for settings form (not applied until "Save" clicked)
  const [tempNames, setTempNames] = useState<string[]>(playerNames);
  const [tempDifficulty, setTempDifficulty] = useState<AIDifficulty>(aiDifficulty);

  /**
   * Sync temporary names with prop changes
   * Updates temp state when playerNames prop changes externally
   */
  useEffect(() => {
    setTempNames(playerNames);
  }, [playerNames]);

  /**
   * Saves settings changes
   * Cleans player names (trims whitespace, provides defaults)
   * Applies changes to parent component and closes settings panel
   */
  const handleSaveSettings = () => {
    const cleaned = tempNames.map((n, idx) => (n.trim() || `Player ${idx + 1}`));
    onPlayerNamesChange(cleaned);
    onAIDifficultyChange(tempDifficulty);
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
          <h1 className="game-title">🃏 Sueca</h1>
          {playerNames[0] && (
            <div className="player-name-display">
              <span className="player-label">Jogador:</span>
              <span className="player-name-value">{playerNames[0]}</span>
            </div>
          )}
        </div>
        <div className="menu-right">
          <button 
            className="icon-btn settings-icon-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Configurações"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-content">
            <h3>Configurações</h3>
            <div className="setting-item">
              <label>Nome dos Jogadores:</label>
              {[0,1,2,3].map(idx => (
                <input
                  key={idx}
                  type="text"
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
                  style={{ marginBottom: '6px' }}
                />
              ))}
            </div>
            <div className="setting-item">
              <label htmlFor="ai-difficulty">Dificuldade da AI:</label>
              {isGameActive && !isGameOver ? (
                <>
                  <select
                    id="ai-difficulty"
                    value={tempDifficulty}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                  <div className="difficulty-description" style={{ fontSize: '0.85em', color: '#ff9800', marginTop: '4px' }}>
                    ⚠️ Alterar dificuldade apenas no menu inicial
                  </div>
                </>
              ) : (
                <>
                  <select
                    id="ai-difficulty"
                    value={tempDifficulty}
                    onChange={(e) => setTempDifficulty(e.target.value as AIDifficulty)}
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                  <div className="difficulty-description">
                    {tempDifficulty === 'easy' && <span>AI joga mais aleatoriamente</span>}
                    {tempDifficulty === 'medium' && <span>AI usa estratégia básica</span>}
                    {tempDifficulty === 'hard' && <span>AI usa estratégia avançada com coordenação</span>}
                  </div>
                </>
              )}
            </div>
            <div className="setting-item setting-inline">
              <label htmlFor="show-grid">Mostrar grelha (debug)</label>
              <div className="setting-toggle">
                <input
                  id="show-grid"
                  type="checkbox"
                  checked={showGrid}
                  onChange={onToggleGrid}
                />
                <span>{showGrid ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
            <div className="setting-item">
              <label htmlFor="dark-mode" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  id="dark-mode"
                  type="checkbox"
                  checked={darkMode}
                  onChange={handleDarkModeToggle}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span>Modo Escuro</span>
              </label>
            </div>
            
            {/* Game control buttons moved to settings panel */}
            <div className="setting-item" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '8px' }}>
              <label style={{ marginBottom: '8px', display: 'block' }}>Controles do Jogo:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!isGameOver && isGameActive && (
                  <>
                    {isPaused ? (
                      <button 
                        className="menu-btn pause-btn"
                        onClick={() => {
                          onResume();
                          setShowSettings(false);
                        }}
                        title="Retomar jogo"
                        style={{ flex: '1', minWidth: '120px' }}
                      >
                        ▶️ Retomar
                      </button>
                    ) : (
                      <button 
                        className="menu-btn pause-btn"
                        onClick={() => {
                          onPause();
                          setShowSettings(false);
                        }}
                        title="Pausar jogo"
                        style={{ flex: '1', minWidth: '120px' }}
                      >
                        ⏸️ Pausar
                      </button>
                    )}
                  </>
                )}
                
                {isGameActive && (
                  <button 
                    className="menu-btn quit-btn"
                    onClick={() => {
                      onQuit();
                      setShowSettings(false);
                    }}
                    title="Sair do jogo atual"
                    style={{ flex: '1', minWidth: '120px' }}
                  >
                    🚪 Sair
                  </button>
                )}
              </div>
            </div>
            
            <div className="setting-buttons">
              <button className="save-btn" onClick={handleSaveSettings}>
                Guardar
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setTempNames(playerNames);
                  setTempDifficulty(aiDifficulty);
                  setShowSettings(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="game-over-banner">
          <span>Jogo Terminado</span>
          <button className="new-game-btn" onClick={onNewGame}>
            Novo Jogo
          </button>
        </div>
      )}
    </div>
  );
};

