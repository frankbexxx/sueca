import { HOME_ROUTE, homeSetup } from '../types/navigation';
import {
  popToTabRoot,
  routesEqual,
  shellNavigationReducer,
  tabRootRoute
} from './shellNavigation';

describe('shellNavigation', () => {
  it('routesEqual compares routes', () => {
    expect(routesEqual(HOME_ROUTE, HOME_ROUTE)).toBe(true);
    expect(
      routesEqual(HOME_ROUTE, { tab: 'home', screen: homeSetup('sueca') })
    ).toBe(false);
  });

  it('push adds route to stack', () => {
    const next = shellNavigationReducer([HOME_ROUTE], {
      type: 'push',
      route: tabRootRoute('stats')
    });
    expect(next).toHaveLength(2);
    expect(next[1]).toEqual(tabRootRoute('stats'));
  });

  it('pop removes one level', () => {
    const stack = [HOME_ROUTE, tabRootRoute('stats')];
    expect(shellNavigationReducer(stack, { type: 'pop' })).toEqual([HOME_ROUTE]);
  });

  it('pop does not go below home root', () => {
    expect(shellNavigationReducer([HOME_ROUTE], { type: 'pop' })).toEqual([HOME_ROUTE]);
  });

  it('resetToHome clears stack', () => {
    const stack = [HOME_ROUTE, tabRootRoute('settings'), { tab: 'settings', screen: 'hand' }];
    expect(shellNavigationReducer(stack, { type: 'resetToHome' })).toEqual([HOME_ROUTE]);
  });

  it('navigateTabRoot from home pushes tab root', () => {
    const next = shellNavigationReducer([HOME_ROUTE], {
      type: 'navigateTabRoot',
      tab: 'rules'
    });
    expect(next).toEqual([HOME_ROUTE, tabRootRoute('rules')]);
  });

  it('navigateTabRoot home resets stack', () => {
    const stack = [HOME_ROUTE, tabRootRoute('stats')];
    expect(shellNavigationReducer(stack, { type: 'navigateTabRoot', tab: 'home' })).toEqual([
      HOME_ROUTE
    ]);
  });

  it('navigateTabRoot on same tab pops to tab root', () => {
    const stack = [
      HOME_ROUTE,
      tabRootRoute('settings'),
      { tab: 'settings', screen: 'hand' as const }
    ];
    const next = shellNavigationReducer(stack, { type: 'navigateTabRoot', tab: 'settings' });
    expect(next).toEqual([HOME_ROUTE, tabRootRoute('settings')]);
  });

  it('navigateTabRoot preserves history when switching tabs', () => {
    const stack = [
      HOME_ROUTE,
      tabRootRoute('settings'),
      { tab: 'settings', screen: 'hand' as const }
    ];
    const next = shellNavigationReducer(stack, { type: 'navigateTabRoot', tab: 'history' });
    expect(next).toEqual([
      HOME_ROUTE,
      tabRootRoute('settings'),
      { tab: 'settings', screen: 'hand' },
      tabRootRoute('history')
    ]);
  });

  it('popToTabRoot stops at tab root', () => {
    const stack = [
      HOME_ROUTE,
      tabRootRoute('history'),
      { tab: 'history', screen: 'pinned' as const }
    ];
    expect(popToTabRoot(stack, 'history')).toEqual([HOME_ROUTE, tabRootRoute('history')]);
  });
});
