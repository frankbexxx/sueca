import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { GameBoard } from './components/GameBoard';
import { BottomNav } from './components/navigation/BottomNav';
import { ShellRouter } from './navigation/ShellRouter';
import { AppScreen, AppTab } from './types/navigation';
import { GameConfig } from './types/gameConfig';
import { GameVariant } from './types/game';
import {
  SavedGameSession,
  loadGameSession,
  saveLastConfig,
  clearGameSession,
  buildQuickConfigForVariant
} from './services/gameSessionStorage';
import { consumeLandingReturnFlag } from './services/appLifecycle';
import { getActiveTheme, ThemeId } from './services/billingService';
import { useLanguage } from './i18n/useLanguage';
import { STORAGE_KEYS } from './constants/gameConstants';
import { playUiClick, preloadAmbiance, preloadSfx, startAmbiance } from './services/audioService';
import { useShellNavigation } from './navigation/useShellNavigation';
import { bindCapacitorBackButton, useShellBrowserBack } from './navigation/useShellBrowserBack';
import './App.css';
import './styles/app-shell.css';
import './styles/shell-screens.css';

const UI_CLICK_SELECTOR = '.sueca-btn, .dobo-btn, .lang-btn';

function App() {
  const { t } = useLanguage();
  const [screen, setScreen] = useState<AppScreen>('landing');
  const navigation = useShellNavigation();
  const { current, canGoBack, push, pop, resetToHome, navigateTabRoot, stack } = navigation;
  const stackLengthRef = useRef(stack.length);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [resumeSession, setResumeSession] = useState<SavedGameSession | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => getActiveTheme());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    consumeLandingReturnFlag();
  }, []);

  useEffect(() => {
    preloadSfx();
    preloadAmbiance();
    const onClick = (event: MouseEvent) => {
      startAmbiance();
      const target = (event.target as Element | null)?.closest(UI_CLICK_SELECTOR);
      if (!target) return;
      if (target instanceof HTMLButtonElement && target.disabled) return;
      if (target.classList.contains('disabled')) return;
      playUiClick();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (stack.length > stackLengthRef.current && screen === 'shell') {
      window.history.pushState({ suecaShellNav: stack.length }, '');
    }
    stackLengthRef.current = stack.length;
  }, [stack.length, screen]);

  const handleHistoryReset = useCallback(() => {
    window.history.replaceState({ suecaShellNav: 1 }, '');
    stackLengthRef.current = 1;
  }, []);

  const { goBack } = useShellBrowserBack({
    enabled: screen === 'shell',
    canGoBack,
    onPop: pop
  });

  useEffect(() => {
    if (screen !== 'shell') return;
    let cleanup: (() => void) | undefined;
    void bindCapacitorBackButton(goBack, () => canGoBack).then((remove) => {
      cleanup = remove;
    });
    return () => cleanup?.();
  }, [screen, goBack, canGoBack]);

  const enterShell = useCallback(() => {
    setScreen('shell');
    resetToHome();
    handleHistoryReset();
  }, [resetToHome, handleHistoryReset]);

  const startGame = useCallback((config: GameConfig, session?: SavedGameSession | null) => {
    saveLastConfig(config);
    setGameConfig(config);
    setResumeSession(session ?? null);
    setScreen('game');
  }, []);

  const exitGame = useCallback(() => {
    setGameConfig(null);
    setResumeSession(null);
    setScreen('shell');
    resetToHome();
    handleHistoryReset();
  }, [resetToHome, handleHistoryReset]);

  const handleContinue = useCallback(
    (variant: GameVariant, session?: SavedGameSession | null) => {
      const saved = session ?? loadGameSession(variant);
      if (saved) startGame(saved.config, saved);
    },
    [startGame]
  );

  const handlePlayVariant = useCallback(
    (variant: GameVariant) => {
      const saved = loadGameSession(variant);
      if (saved) {
        if (window.confirm(t.dashboard.playSavedConfirm)) {
          startGame(saved.config, saved);
          return;
        }
        if (window.confirm(t.dashboard.playNewConfirm)) {
          clearGameSession(variant);
          startGame(buildQuickConfigForVariant(variant));
        }
        return;
      }
      startGame(buildQuickConfigForVariant(variant));
    },
    [startGame, t.dashboard.playNewConfirm, t.dashboard.playSavedConfirm]
  );

  const handleTabChange = useCallback(
    (tab: AppTab) => {
      if (tab === 'home') {
        resetToHome();
        handleHistoryReset();
        return;
      }
      navigateTabRoot(tab);
    },
    [navigateTabRoot, resetToHome, handleHistoryReset]
  );

  const handleThemeChange = useCallback((theme: ThemeId) => {
    setActiveTheme(theme);
  }, []);

  const handleShellBack = useCallback(() => {
    goBack();
  }, [goBack]);

  if (screen === 'landing') {
    return (
      <div className="App App--full">
        <LandingPage onStart={enterShell} />
      </div>
    );
  }

  if (screen === 'game' && gameConfig) {
    return (
      <div
        className={`App app-shell app-shell--game ${darkMode ? 'dark-mode' : ''}`}
        data-theme={activeTheme}
      >
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
    <div
      className={`App app-shell ${darkMode ? 'dark-mode' : ''}`}
      data-theme={activeTheme}
    >
      <main className="app-shell-content">
        <ShellRouter
          route={current}
          canGoBack={canGoBack}
          onBack={handleShellBack}
          onPush={push}
          darkMode={darkMode}
          onDarkModeChange={setDarkMode}
          onThemeChange={handleThemeChange}
          onStartGame={startGame}
          onContinue={handleContinue}
          onPlayVariant={handlePlayVariant}
        />
      </main>
      <BottomNav activeTab={current.tab} onChange={handleTabChange} />
    </div>
  );
}

export default App;
