import { HOME_ROUTE, homeSetup, ACTIVITY_HUB, PERSONALIZE_HUB, MORE_HUB } from '../types/navigation';
import {
  popToTabRoot,
  routesEqual,
  shellNavigationReducer,
  tabRootRoute
} from './shellNavigation';

describe('shellNavigation (REL-HOME-01 primary tabs)', () => {
  it('routesEqual compares routes', () => {
    expect(routesEqual(HOME_ROUTE, HOME_ROUTE)).toBe(true);
    expect(
      routesEqual(HOME_ROUTE, { tab: 'home', screen: homeSetup('sueca') })
    ).toBe(false);
  });

  it('tab roots are hubs for activity / personalize / more', () => {
    expect(tabRootRoute('activity')).toEqual(ACTIVITY_HUB);
    expect(tabRootRoute('personalize')).toEqual(PERSONALIZE_HUB);
    expect(tabRootRoute('more')).toEqual(MORE_HUB);
  });

  it('push adds route to stack', () => {
    const next = shellNavigationReducer([HOME_ROUTE], {
      type: 'push',
      route: tabRootRoute('activity')
    });
    expect(next).toHaveLength(2);
    expect(next[1]).toEqual(ACTIVITY_HUB);
  });

  it('pop removes one level', () => {
    const stack = [HOME_ROUTE, ACTIVITY_HUB];
    expect(shellNavigationReducer(stack, { type: 'pop' })).toEqual([HOME_ROUTE]);
  });

  it('resetToHome clears stack', () => {
    const stack = [
      HOME_ROUTE,
      MORE_HUB,
      { tab: 'more' as const, screen: { type: 'settings' as const, screen: 'hand' as const } }
    ];
    expect(shellNavigationReducer(stack, { type: 'resetToHome' })).toEqual([HOME_ROUTE]);
  });

  it('navigateTabRoot home resets stack', () => {
    const stack = [HOME_ROUTE, ACTIVITY_HUB];
    expect(shellNavigationReducer(stack, { type: 'navigateTabRoot', tab: 'home' })).toEqual([
      HOME_ROUTE
    ]);
  });

  it('navigateTabRoot on same tab pops to tab root', () => {
    const stack = [
      HOME_ROUTE,
      MORE_HUB,
      { tab: 'more' as const, screen: { type: 'settings' as const, screen: 'hand' as const } }
    ];
    const next = shellNavigationReducer(stack, { type: 'navigateTabRoot', tab: 'more' });
    expect(next).toEqual([HOME_ROUTE, MORE_HUB]);
  });

  it('navigateTabRoot resets stack when switching tabs', () => {
    const stack = [
      HOME_ROUTE,
      MORE_HUB,
      { tab: 'more' as const, screen: { type: 'settings' as const, screen: 'hand' as const } }
    ];
    const next = shellNavigationReducer(stack, {
      type: 'navigateTabRoot',
      tab: 'activity'
    });
    expect(next).toEqual([ACTIVITY_HUB]);
  });

  it('popToTabRoot stops at tab root', () => {
    const stack = [
      HOME_ROUTE,
      ACTIVITY_HUB,
      { tab: 'activity' as const, screen: 'stats' as const }
    ];
    expect(popToTabRoot(stack, 'activity')).toEqual([HOME_ROUTE, ACTIVITY_HUB]);
  });

  it('homeSetup can carry King synthetic preset', () => {
    expect(homeSetup('king', 'king-pt-synthetic')).toEqual({
      type: 'setup',
      variant: 'king',
      rulesPresetId: 'king-pt-synthetic'
    });
  });
});
