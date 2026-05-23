import React, { useState, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { GameBoard } from './components/GameBoard';
import { BottomNav } from './components/navigation/BottomNav';
import { HomeDashboard } from './components/screens/HomeDashboard';
import { PlaySetup } from './components/screens/PlaySetup';
import { RulesHub } from './components/screens/RulesHub';
import { MoreScreen } from './components/screens/MoreScreen';
import { AppScreen, AppTab } from './types/navigation';
import { GameConfig } from './types/gameConfig';
import { GameVariant } from './types/game';
import {
  SavedGameSession,
  loadGameSession,
  loadLastConfig,
  saveLastConfig,
  clearGameSession
} from './services/gameSessionStorage';
import { STORAGE_KEYS } from './constants/gameConstants';
import './App.css';
import './styles/app-shell.css';

function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [resumeSession, setResumeSession] = useState<SavedGameSession | null>(null);
  const [playInitialVariant, setPlayInitialVariant] = useState<GameVariant | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return saved ? saved === 'true' : false;
  });

  const enterShell = useCallback(() => {
    setScreen('shell');
    setActiveTab('home');
  }, []);

  const startGame = useCallback((config: GameConfig, session?: SavedGameSession | null) => {
    saveLastConfig(config);
    setGameConfig(config);
    setResumeSession(session ?? null);
    setScreen('game');
  }, []);

  const exitGame = useCallback(() => {
    clearGameSession();
    setGameConfig(null);
    setResumeSession(null);
    setScreen('shell');
    setActiveTab('home');
  }, []);

  const handleTabChange = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    if (tab !== 'play') {
      setPlayInitialVariant(null);
    }
  }, []);

  if (screen === 'landing') {
    return (
      <div className="App App--full">
        <LandingPage onStart={enterShell} />
      </div>
    );
  }

  if (screen === 'game' && gameConfig) {
    return (
      <div className={`App app-shell app-shell--game ${darkMode ? 'dark-mode' : ''}`}>
        <GameBoard
          config={gameConfig}
          resumeSession={resumeSession}
          darkMode={darkMode}
          onExit={exitGame}
        />
      </div>
    );
  }

  return (
    <div className={`App app-shell ${darkMode ? 'dark-mode' : ''}`}>
      <main className="app-shell-content">
        {activeTab === 'home' && (
          <HomeDashboard
            onContinue={() => {
              const saved = loadGameSession();
              if (saved) startGame(saved.config, saved);
            }}
            onPlayLast={() => {
              const last = loadLastConfig();
              if (last) startGame(last);
            }}
            onChooseGame={() => {
              setPlayInitialVariant(null);
              setActiveTab('play');
            }}
            onPickVariant={(variant) => {
              setPlayInitialVariant(variant);
              setActiveTab('play');
            }}
            onOpenProfile={() => setActiveTab('more')}
          />
        )}
        {activeTab === 'play' && (
          <PlaySetup
            key={playInitialVariant ?? 'default'}
            initialVariant={playInitialVariant}
            onStartGame={(c) => startGame(c)}
          />
        )}
        {activeTab === 'rules' && <RulesHub />}
        {activeTab === 'more' && (
          <MoreScreen
            darkMode={darkMode}
            onDarkModeChange={(mode) => {
              setDarkMode(mode);
              localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(mode));
            }}
          />
        )}
      </main>
      <BottomNav activeTab={activeTab} onChange={handleTabChange} />
    </div>
  );
}

export default App;
