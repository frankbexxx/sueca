import React from 'react';
import { AppTab, HomeSubScreen, HOME_LIST } from '../types/navigation';
import { GameConfig } from '../types/gameConfig';
import { GameVariant } from '../types/game';
import { SavedGameSession } from '../services/gameSessionStorage';
import { ThemeId } from '../services/billingService';
import { HomeDashboard } from '../components/screens/HomeDashboard';
import { GameSetupScreen } from '../components/screens/GameSetupScreen';
import { StatsScreen } from '../components/screens/StatsScreen';
import { HistoryScreen } from '../components/screens/HistoryScreen';
import { ThemesScreen } from '../components/screens/ThemesScreen';
import { RulesHub } from '../components/screens/RulesHub';
import { SettingsScreen } from '../components/screens/SettingsScreen';
import { ProfileScreen } from '../components/screens/ProfileScreen';

export interface ShellRouterProps {
  activeTab: AppTab;
  homeSubScreen: HomeSubScreen;
  onHomeSubScreenChange: (sub: HomeSubScreen) => void;
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
  onThemeChange: (theme: ThemeId) => void;
  onStartGame: (config: GameConfig, session?: SavedGameSession | null) => void;
  onContinue: (variant: GameVariant, session?: SavedGameSession | null) => void;
  onPlayVariant: (variant: GameVariant) => void;
}

export const ShellRouter: React.FC<ShellRouterProps> = ({
  activeTab,
  homeSubScreen,
  onHomeSubScreenChange,
  darkMode,
  onDarkModeChange,
  onThemeChange,
  onStartGame,
  onContinue,
  onPlayVariant
}) => {
  if (activeTab === 'home') {
    if (homeSubScreen.type === 'setup') {
      return (
        <GameSetupScreen
          key={homeSubScreen.variant}
          initialVariant={homeSubScreen.variant}
          lockVariant
          onBack={() => onHomeSubScreenChange(HOME_LIST)}
          onStartGame={(config) => onStartGame(config)}
        />
      );
    }
    return (
      <HomeDashboard
        onContinue={(variant) => onContinue(variant)}
        onPlayVariant={onPlayVariant}
        onConfigureVariant={(variant) =>
          onHomeSubScreenChange({ type: 'setup', variant })
        }
      />
    );
  }

  if (activeTab === 'stats') return <StatsScreen />;
  if (activeTab === 'history') {
    return (
      <HistoryScreen
        onContinue={(variant, session) => onContinue(variant, session)}
      />
    );
  }
  if (activeTab === 'themes') return <ThemesScreen onThemeChange={onThemeChange} />;
  if (activeTab === 'rules') return <RulesHub />;
  if (activeTab === 'settings') {
    return <SettingsScreen darkMode={darkMode} onDarkModeChange={onDarkModeChange} />;
  }
  if (activeTab === 'profile') return <ProfileScreen darkMode={darkMode} />;
  return null;
};
