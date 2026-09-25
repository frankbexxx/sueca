import React from 'react';
import {
  homeSetup,
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
import { ThemeEditorScreen } from '../components/screens/ThemeEditorScreen';
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
import { OnlineScreen } from '../components/screens/OnlineScreen';
import {
  ActivityHubScreen,
  MoreHubScreen,
  PersonalizeHubScreen
} from '../components/screens/PrimaryHubScreens';
import type { RulesPresetId } from '../constants/rulesPresets';

export interface ShellRouterProps {
  route: ShellRoute;
  canGoBack: boolean;
  onBack: () => void;
  onPush: (route: ShellRoute) => void;
  onThemeChange: (theme: ThemeId) => void;
  onStartGame: (config: GameConfig, session?: SavedGameSession | null) => void;
  onContinue: (variant: GameVariant, session?: SavedGameSession | null) => void;
}

export const ShellRouter: React.FC<ShellRouterProps> = ({
  route,
  canGoBack,
  onBack,
  onPush,
  onThemeChange,
  onStartGame,
  onContinue
}) => {
  if (route.tab === 'home') {
    if (route.screen.type === 'setup') {
      return (
        <GameSetupScreen
          key={`${route.screen.variant}-${route.screen.rulesPresetId ?? 'default'}`}
          initialVariant={route.screen.variant}
          initialRulesPresetId={route.screen.rulesPresetId}
          lockVariant
          showBack={canGoBack}
          onBack={onBack}
          onStartGame={(config) => onStartGame(config)}
        />
      );
    }
    return (
      <HomeDashboard
        onContinue={(variant, session) => onContinue(variant, session)}
        onOpenSetup={(variant, rulesPresetId) =>
          onPush({ tab: 'home', screen: homeSetup(variant, rulesPresetId) })
        }
        onOpenActivity={() => onPush({ tab: 'activity', screen: 'hub' })}
      />
    );
  }

  if (route.tab === 'activity') {
    if (route.screen === 'hub') {
      return (
        <ActivityHubScreen
          showBack={canGoBack}
          onBack={onBack}
          onOpenStats={() => onPush({ tab: 'activity', screen: 'stats' })}
          onOpenHistory={() =>
            onPush({ tab: 'activity', screen: { type: 'history', section: 'hub' } })
          }
        />
      );
    }
    if (route.screen === 'stats') {
      return <StatsScreen showBack={canGoBack} onBack={onBack} />;
    }
    const section = route.screen.section;
    if (section === 'hub') {
      return (
        <HistoryHubScreen
          showBack={canGoBack}
          onBack={onBack}
          onOpenSection={(s) =>
            onPush({ tab: 'activity', screen: { type: 'history', section: s } })
          }
        />
      );
    }
    return (
      <HistoryListScreen
        section={section}
        showBack={canGoBack}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  }

  if (route.tab === 'personalize') {
    if (route.screen === 'hub') {
      return (
        <PersonalizeHubScreen
          showBack={canGoBack}
          onBack={onBack}
          onOpenThemes={() => onPush({ tab: 'personalize', screen: { type: 'themes' } })}
          onOpenAudio={() => onPush({ tab: 'personalize', screen: 'audio' })}
          onOpenHand={() => onPush({ tab: 'personalize', screen: 'hand' })}
        />
      );
    }
    if (route.screen === 'audio') {
      return <SettingsGeneralScreen showBack={canGoBack} onBack={onBack} />;
    }
    if (route.screen === 'hand') {
      return <SettingsHandScreen showBack={canGoBack} onBack={onBack} />;
    }
    if (route.screen.type === 'themeEditor') {
      return (
        <ThemeEditorScreen
          themeId={route.screen.themeId}
          showBack={canGoBack}
          onBack={onBack}
          onSaved={(id) => {
            onThemeChange(id as ThemeId);
            onBack();
          }}
        />
      );
    }
    return (
      <ThemesScreen
        showBack={canGoBack}
        onBack={onBack}
        onThemeChange={onThemeChange}
        onPush={onPush}
      />
    );
  }

  if (route.tab === 'more') {
    if (route.screen === 'hub') {
      return (
        <MoreHubScreen
          showBack={canGoBack}
          onBack={onBack}
          onOpenOnline={() => onPush({ tab: 'more', screen: 'online' })}
          onOpenRules={() =>
            onPush({ tab: 'more', screen: { type: 'rules', screen: 'hub' } })
          }
          onOpenSettings={() =>
            onPush({ tab: 'more', screen: { type: 'settings', screen: 'hub' } })
          }
          onOpenProfile={() =>
            onPush({ tab: 'more', screen: { type: 'profile', screen: 'hub' } })
          }
        />
      );
    }
    if (route.screen === 'online') {
      return (
        <OnlineScreen
          showBack={canGoBack}
          onBack={onBack}
          onStartGame={(config) => onStartGame(config)}
        />
      );
    }
    if (route.screen.type === 'rules') {
      if (route.screen.screen === 'hub') {
        return (
          <RulesHubScreen
            showBack={canGoBack}
            onBack={onBack}
            onOpenGame={(variant) =>
              onPush({
                tab: 'more',
                screen: { type: 'rules', screen: { type: 'detail', variant } }
              })
            }
          />
        );
      }
      return (
        <RulesDetailScreen
          variant={route.screen.screen.variant}
          showBack={canGoBack}
          onBack={onBack}
        />
      );
    }
    if (route.screen.type === 'settings') {
      if (route.screen.screen === 'hub') {
        return (
          <SettingsHubScreen
            showBack={canGoBack}
            onBack={onBack}
            onOpenSection={(section) =>
              onPush({ tab: 'more', screen: { type: 'settings', screen: section } })
            }
          />
        );
      }
      if (route.screen.screen === 'general') {
        return <SettingsGeneralScreen showBack={canGoBack} onBack={onBack} />;
      }
      return <SettingsHandScreen showBack={canGoBack} onBack={onBack} />;
    }
    if (route.screen.type === 'profile') {
      if (route.screen.screen === 'hub') {
        return (
          <ProfileHubScreen
            showBack={canGoBack}
            onBack={onBack}
            onOpenSection={(section) =>
              onPush({ tab: 'more', screen: { type: 'profile', screen: section } })
            }
          />
        );
      }
      if (route.screen.screen === 'name') {
        return <ProfileNameScreen showBack={canGoBack} onBack={onBack} />;
      }
      return <ProfileCreditsScreen showBack={canGoBack} onBack={onBack} />;
    }
  }

  return null;
};

export type { RulesPresetId };
