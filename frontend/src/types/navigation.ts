import { GameVariant } from './game';
import type { RulesPresetId } from '../constants/rulesPresets';

/** Primary bottom-nav destinations (REL-HOME-01). */
export type AppTab = 'home' | 'activity' | 'personalize' | 'more';

export type AppScreen = 'landing' | 'shell' | 'game';

export type HomeSubScreen =
  | { type: 'list' }
  | { type: 'setup'; variant: GameVariant; rulesPresetId?: RulesPresetId };

export const HOME_LIST: HomeSubScreen = { type: 'list' };

export function homeSetup(
  variant: GameVariant,
  rulesPresetId?: RulesPresetId
): HomeSubScreen {
  return rulesPresetId
    ? { type: 'setup', variant, rulesPresetId }
    : { type: 'setup', variant };
}

export type HistoryScreenId = 'hub' | 'continue' | 'pinned' | 'finished';

export type RulesScreenId = 'hub' | { type: 'detail'; variant: GameVariant };

export type SettingsScreenId = 'hub' | 'general' | 'hand';

export type ProfileScreenId = 'hub' | 'name' | 'credits';

export type ActivityScreenId =
  | 'hub'
  | 'stats'
  | { type: 'history'; section: HistoryScreenId };

export type PersonalizeScreenId =
  | 'hub'
  | { type: 'themes' }
  | { type: 'themeEditor'; themeId?: string }
  | 'audio'
  | 'hand';

export type MoreScreenId =
  | 'hub'
  | 'online'
  | { type: 'rules'; screen: RulesScreenId }
  | { type: 'settings'; screen: SettingsScreenId }
  | { type: 'profile'; screen: ProfileScreenId };

export type ShellRoute =
  | { tab: 'home'; screen: HomeSubScreen }
  | { tab: 'activity'; screen: ActivityScreenId }
  | { tab: 'personalize'; screen: PersonalizeScreenId }
  | { tab: 'more'; screen: MoreScreenId };

export const HOME_ROUTE: ShellRoute = { tab: 'home', screen: HOME_LIST };

/** Home → Setup subflow (hide primary bottom nav). */
export function isHomeSetupRoute(route: ShellRoute): boolean {
  return (
    route.tab === 'home' &&
    typeof route.screen === 'object' &&
    route.screen !== null &&
    'type' in route.screen &&
    route.screen.type === 'setup'
  );
}

export const ACTIVITY_HUB: ShellRoute = { tab: 'activity', screen: 'hub' };
export const PERSONALIZE_HUB: ShellRoute = { tab: 'personalize', screen: 'hub' };
export const MORE_HUB: ShellRoute = { tab: 'more', screen: 'hub' };

export const PRIMARY_TABS: AppTab[] = ['home', 'activity', 'personalize', 'more'];
