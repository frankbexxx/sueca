import { GameVariant } from './game';

export type AppTab =
  | 'home'
  | 'stats'
  | 'history'
  | 'themes'
  | 'rules'
  | 'settings'
  | 'profile';

export type AppScreen = 'landing' | 'shell' | 'game';

export type HomeSubScreen =
  | { type: 'list' }
  | { type: 'setup'; variant: GameVariant };

export const HOME_LIST: HomeSubScreen = { type: 'list' };

export function homeSetup(variant: GameVariant): HomeSubScreen {
  return { type: 'setup', variant };
}

export type HistoryScreenId = 'hub' | 'continue' | 'pinned' | 'finished';

export type RulesScreenId = 'hub' | { type: 'detail'; variant: GameVariant };

export type SettingsScreenId = 'hub' | 'general' | 'hand';

export type ProfileScreenId = 'hub' | 'name' | 'credits';

export type ShellRoute =
  | { tab: 'home'; screen: HomeSubScreen }
  | { tab: 'stats'; screen: { type: 'main' } }
  | { tab: 'history'; screen: HistoryScreenId }
  | { tab: 'themes'; screen: { type: 'main' } }
  | { tab: 'rules'; screen: RulesScreenId }
  | { tab: 'settings'; screen: SettingsScreenId }
  | { tab: 'profile'; screen: ProfileScreenId };

export const HOME_ROUTE: ShellRoute = { tab: 'home', screen: HOME_LIST };
