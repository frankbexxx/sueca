import { useCallback, useReducer } from 'react';
import { AppTab, HOME_ROUTE, ShellRoute } from '../types/navigation';
import {
  canGoBack as stackCanGoBack,
  getCurrentRoute,
  shellNavigationReducer
} from './shellNavigation';

export function useShellNavigation(initialStack: ShellRoute[] = [HOME_ROUTE]) {
  const [stack, dispatch] = useReducer(shellNavigationReducer, initialStack);

  const current = getCurrentRoute(stack);
  const canGoBack = stackCanGoBack(stack);

  const push = useCallback((route: ShellRoute) => {
    dispatch({ type: 'push', route });
  }, []);

  const pop = useCallback(() => {
    dispatch({ type: 'pop' });
  }, []);

  const resetToHome = useCallback(() => {
    dispatch({ type: 'resetToHome' });
  }, []);

  const navigateTabRoot = useCallback((tab: AppTab) => {
    dispatch({ type: 'navigateTabRoot', tab });
  }, []);

  return {
    stack,
    current,
    canGoBack,
    push,
    pop,
    resetToHome,
    navigateTabRoot
  };
}

export type ShellNavigation = ReturnType<typeof useShellNavigation>;
