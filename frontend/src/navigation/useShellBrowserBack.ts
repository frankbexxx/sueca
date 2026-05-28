import { useEffect, useRef } from 'react';

const HISTORY_STATE_KEY = 'suecaShellNav';

interface UseShellBrowserBackOptions {
  enabled: boolean;
  canGoBack: boolean;
  onPop: () => void;
}

export function useShellBrowserBack({
  enabled,
  canGoBack,
  onPop
}: UseShellBrowserBackOptions): { goBack: () => void } {
  const canGoBackRef = useRef(canGoBack);
  canGoBackRef.current = canGoBack;

  useEffect(() => {
    if (!enabled) return;

    window.history.replaceState({ [HISTORY_STATE_KEY]: 1 }, '');

    const onPopState = () => {
      if (canGoBackRef.current) {
        onPop();
      } else {
        window.history.pushState({ [HISTORY_STATE_KEY]: 1 }, '');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled, onPop]);

  const goBack = () => {
    if (!canGoBackRef.current) return;
    if (window.history.state?.[HISTORY_STATE_KEY]) {
      window.history.back();
      return;
    }
    onPop();
  };

  return { goBack };
}

export async function bindCapacitorBackButton(
  goBack: () => void,
  canGoBack: () => boolean
): Promise<(() => void) | undefined> {
  try {
    const { App } = await import('@capacitor/app');
    const handle = await App.addListener('backButton', () => {
      if (canGoBack()) {
        goBack();
      } else {
        App.exitApp();
      }
    });
    return () => {
      void handle.remove();
    };
  } catch {
    return undefined;
  }
}
