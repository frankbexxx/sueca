import React from 'react';
import {
  AppTab,
  homeSetup,
  HOME_LIST,
  ShellRoute
} from '../types/navigation';
import { GameConfig } from '../types/gameConfig';
import { GameVariant } from '../types/game';
import { SavedGameSession } from '../services/gameSessionStorage';
import { ThemeId } from '../services/billingService';
import { HomeDashboard } from '../components/screens/HomeDashboard';
import { GameSetupScreen } from '../components/screens/GameSetupScreen';
import { StatsScreen } from '../components/screens/StatsScreen';
import { HistoryHubScreen, HistoryListScreen } from '../components/screens/HistoryScreens';
import { ThemesScreen } from '../components/screens/ThemesScreen';
import { RulesHubScreen } from '../components/screens/RulesHubScreen';
import { RulesDetailScreen } from '../components/screens/RulesDetailScreen';
import {
  SettingsGeneralScreen,
  SettingsHandScreen,
  SettingsHubScreen
} from '../components/screens/SettingsScreens';
import { ProfileHubScreen } from '../components/screens/ProfileHubScreen';
import { ProfileNameScreen } from '../components/screens/ProfileNameScreen';
import { ProfileCreditsScreen } from '../components/screens/ProfileCreditsScreen';

export interface ShellRouterProps {
  route: ShellRoute;
  canGoBack: boolean;
  onBack: () => void;
  onPush: (route: ShellRoute) => void;
  onThemeChange: (theme: ThemeId) => void;
  onStartGame: (config: GameConfig, session?: SavedGameSession | null) => void;
  onContinue: (variant: GameVariant, session?: SavedGameSession | null) => void;
  onPlayVariant: (variant: GameVariant) => void;
}

export const ShellRouter: React.FC<ShellRouterProps> = ({
  route,
  canGoBack,
  onBack,
  onPush,
  onThemeChange,
  onStartGame,
  onContinue,
  onPlayVariant
}) => {
  const pushTab = (tab: AppTab, screen: ShellRoute['screen']) => {
    onPush({ tab, screen } as ShellRoute);
  };

  if (route.tab === 'home') {
    if (route.screen.type === 'setup') {
      return (
        <GameSetupScreen
          key={route.screen.variant}
          initialVariant={route.screen.variant}
          lockVariant
          showBack={canGoBack}
          onBack={onBack}
          onStartGame={(config) => onStartGame(config)}
        />
      );
    }
    return (
      <HomeDashboard
        onContinue={(variant) => onContinue(variant)}
        onPlayVariant={onPlayVariant}
        onConfigureVariant={(variant) =>
          onPush({ tab: 'home', screen: homeSetup(variant) })
        }
      />
    );
  }

  if (route.tab === 'stats') {
    return <StatsScreen showBack={canGoBack} onBack={onBack} />;
  }

  if (route.tab === 'history') {
    if (route.screen === 'hub') {
      return (
        <HistoryHubScreen
          showBack={canGoBack}
          onBack={onBack}
          onOpenSection={(section) => pushTab('history', section)}
        />
      );
    }
    return (
      <HistoryListScreen
        section={route.screen}
        showBack={canGoBack}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  }

  if (route.tab === 'themes') {
    return (
      <ThemesScreen showBack={canGoBack} onBack={onBack} onThemeChange={onThemeChange} />
    );
  }

  if (route.tab === 'rules') {
    if (route.screen === 'hub') {
      return (
        <RulesHubScreen
          showBack={canGoBack}
          onBack={onBack}
          onOpenGame={(variant) =>
            onPush({ tab: 'rules', screen: { type: 'detail', variant } })
          }
        />
      );
    }
    return (
      <RulesDetailScreen
        variant={route.screen.variant}
        showBack={canGoBack}
        onBack={onBack}
      />
    );
  }

  if (route.tab === 'settings') {
    if (route.screen === 'hub') {
      return (
        <SettingsHubScreen
          showBack={canGoBack}
          onBack={onBack}
          onOpenSection={(section) => pushTab('settings', section)}
        />
      );
    }
    if (route.screen === 'general') {
      return (
        <SettingsGeneralScreen
          showBack={canGoBack}
          onBack={onBack}
        />
      );
    }
    return <SettingsHandScreen showBack={canGoBack} onBack={onBack} />;
  }

  if (route.tab === 'profile') {
    if (route.screen === 'hub') {
      return (
        <ProfileHubScreen
          showBack={canGoBack}
          onBack={onBack}
          onOpenSection={(section) => pushTab('profile', section)}
        />
      );
    }
    if (route.screen === 'name') {
      return <ProfileNameScreen showBack={canGoBack} onBack={onBack} />;
    }
    return (
      <ProfileCreditsScreen showBack={canGoBack} onBack={onBack} />
    );
  }

  return null;
};

export { HOME_LIST };
