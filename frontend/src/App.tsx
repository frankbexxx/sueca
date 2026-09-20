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
  buildSoloConfigForVariant,
  clearMultiplayerLocalStorage,
  stripMultiplayerFields,
  isOfflineMultiplayerSession
} from './services/gameSessionStorage';
import { endSession } from './services/multiplayerClient';
import { consumeLandingReturnFlag } from './services/appLifecycle';
import { getActiveTheme, ThemeId } from './services/billingService';
import { useLanguage } from './i18n/useLanguage';
import {
  applyMusicFromSettings,
  playMusic,
  playUiClick,
  preloadMusic,
  preloadSfx,
  syncMusicToTheme
} from './services/audioService';
import { useShellNavigation } from './navigation/useShellNavigation';
import { bindCapacitorBackButton, useShellBrowserBack } from './navigation/useShellBrowserBack';
import { useCustomThemeCSS } from './hooks/useCustomThemeCSS';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { parseDevKingFestaParams } from './dev/kingFestaJump';
import { parseDevKingNegParams } from './dev/kingNegativeJump';
import './App.css';
import './styles/app-shell.css';
import './styles/shell-screens.css';
import './styles/themes.css';

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
  const [pendingPlayVariant, setPendingPlayVariant] = useState<GameVariant | null>(null);

  useEffect(() => {
    consumeLandingReturnFlag();
  }, []);

  useEffect(() => {
    preloadSfx();
    preloadMusic();
    void applyMusicFromSettings();
    const onClick = (event: MouseEvent) => {
      playMusic();
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
    const soloConfig = config.multiplayerEnabled ? config : stripMultiplayerFields(config);
    saveLastConfig(soloConfig);
    setGameConfig(config);
    setResumeSession(session ?? null);
    setScreen('game');
  }, []);

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const festaJump = parseDevKingFestaParams(search);
    const negJump = parseDevKingNegParams(search);
    if (!festaJump && !negJump) return;
    clearGameSession('king');
    clearMultiplayerLocalStorage();
    startGame({
      ...buildSoloConfigForVariant('king'),
      rulesPresetId: 'king-pt-normal',
      multiplayerEnabled: false
    });
  }, [startGame]);

  const exitGame = useCallback(() => {
    setGameConfig((current) => {
      if (current?.multiplayerEnabled && current.multiplayerSessionId) {
        if ((current.localPlayerIndex ?? 0) === 0) {
          void endSession(current.multiplayerSessionId).catch(() => undefined);
        }
        clearMultiplayerLocalStorage();
        saveLastConfig(buildSoloConfigForVariant(current.gameVariant));
      }
      return null;
    });
    setResumeSession(null);
    setScreen('shell');
    resetToHome();
    handleHistoryReset();
  }, [resetToHome, handleHistoryReset]);

  const restartSoloGame = useCallback(
    (variant: GameVariant) => {
      clearMultiplayerLocalStorage();
      clearGameSession(variant);
      startGame(buildSoloConfigForVariant(variant));
    },
    [startGame]
  );

  const handleContinue = useCallback(
    (variant: GameVariant, session?: SavedGameSession | null) => {
      const saved = session ?? loadGameSession(variant);
      if (!saved) return;
      if (isOfflineMultiplayerSession(saved)) {
        clearGameSession(variant);
        window.alert(t.dashboard.multiplayerOfflineContinueBlocked);
        return;
      }
      startGame(saved.config, saved);
    },
    [startGame, t.dashboard.multiplayerOfflineContinueBlocked]
  );

  const handlePlayVariant = useCallback((variant: GameVariant) => {
    const saved = loadGameSession(variant);
    if (saved) {
      setPendingPlayVariant(variant);
      return;
    }
    startGame(buildSoloConfigForVariant(variant));
  }, [startGame]);

  const cancelPendingPlayVariant = useCallback(() => {
    setPendingPlayVariant(null);
  }, []);

  const confirmPendingPlayVariant = useCallback(() => {
    if (!pendingPlayVariant) return;
    const variant = pendingPlayVariant;
    setPendingPlayVariant(null);
    clearGameSession(variant);
    startGame(buildSoloConfigForVariant(variant));
  }, [pendingPlayVariant, startGame]);

  const handleTabChange = useCallback(
    (tab: AppTab) => {
      if (tab === 'home') {
        resetToHome();
        handleHistoryReset();
        return;
      }
      navigateTabRoot(tab);
      handleHistoryReset();
    },
    [navigateTabRoot, resetToHome, handleHistoryReset]
  );

  useCustomThemeCSS(activeTheme);

  const handleThemeChange = useCallback((theme: ThemeId) => {
    setActiveTheme(theme);
    syncMusicToTheme(theme);
  }, []);

  const handleShellBack = useCallback(() => {
    goBack();
  }, [goBack]);

  if (screen === 'landing') {
    return (
      <div className="App app-shell app-shell--landing" data-theme={activeTheme}>
        <LandingPage onStart={enterShell} />
      </div>
    );
  }

  if (screen === 'game' && gameConfig) {
    return (
      <div
        className="App app-shell app-shell--game"
        data-theme={activeTheme}
      >
        <GameBoard
          config={gameConfig}
          resumeSession={resumeSession}
          onExit={exitGame}
          onRestartAsSolo={restartSoloGame}
        />
      </div>
    );
  }

  return (
    <div
      className="App app-shell"
      data-theme={activeTheme}
    >
      <main className="app-shell-content">
        <ShellRouter
          route={current}
          canGoBack={canGoBack}
          onBack={handleShellBack}
          onPush={push}
          onThemeChange={handleThemeChange}
          onStartGame={startGame}
          onContinue={handleContinue}
          onPlayVariant={handlePlayVariant}
        />
      </main>
      <BottomNav activeTab={current.tab} onChange={handleTabChange} />
      <ConfirmDialog
        open={pendingPlayVariant != null}
        title={t.inGame.newGame}
        message={t.dashboard.playNewGameConfirm}
        confirmLabel={t.inGame.newGame}
        cancelLabel={t.gameMenu.cancel}
        destructive
        onConfirm={confirmPendingPlayVariant}
        onCancel={cancelPendingPlayVariant}
      />
    </div>
  );
}

export default App;
