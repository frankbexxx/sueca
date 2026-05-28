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
