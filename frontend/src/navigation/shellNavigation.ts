import {
  AppTab,
  HOME_ROUTE,
  ShellRoute
} from '../types/navigation';

export type ShellNavAction =
  | { type: 'push'; route: ShellRoute }
  | { type: 'pop' }
  | { type: 'resetToHome' }
  | { type: 'navigateTabRoot'; tab: AppTab };

export function routesEqual(a: ShellRoute, b: ShellRoute): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function tabRootRoute(tab: AppTab): ShellRoute {
  switch (tab) {
    case 'home':
      return HOME_ROUTE;
    case 'stats':
      return { tab: 'stats', screen: { type: 'main' } };
    case 'history':
      return { tab: 'history', screen: 'hub' };
    case 'themes':
      return { tab: 'themes', screen: { type: 'main' } };
    case 'rules':
      return { tab: 'rules', screen: 'hub' };
    case 'settings':
      return { tab: 'settings', screen: 'hub' };
    case 'profile':
      return { tab: 'profile', screen: 'hub' };
  }
}

export function popToTabRoot(stack: ShellRoute[], tab: AppTab): ShellRoute[] {
  const root = tabRootRoute(tab);
  let result = [...stack];
  while (result.length > 1) {
    const top = result[result.length - 1];
    if (top.tab !== tab) break;
    if (routesEqual(top, root)) break;
    result = result.slice(0, -1);
  }
  return result;
}

export function shellNavigationReducer(
  stack: ShellRoute[],
  action: ShellNavAction
): ShellRoute[] {
  switch (action.type) {
    case 'push': {
      const top = stack[stack.length - 1];
      if (routesEqual(top, action.route)) return stack;
      return [...stack, action.route];
    }
    case 'pop':
      return stack.length <= 1 ? stack : stack.slice(0, -1);
    case 'resetToHome':
      return [HOME_ROUTE];
    case 'navigateTabRoot': {
      if (action.tab === 'home') return [HOME_ROUTE];
      const current = stack[stack.length - 1];
      if (current.tab === action.tab) {
        return popToTabRoot(stack, action.tab);
      }
      const root = tabRootRoute(action.tab);
      if (routesEqual(current, root)) return stack;
      return [...stack, root];
    }
    default:
      return stack;
  }
}

export function getCurrentRoute(stack: ShellRoute[]): ShellRoute {
  return stack[stack.length - 1] ?? HOME_ROUTE;
}

export function canGoBack(stack: ShellRoute[]): boolean {
  return stack.length > 1;
}
