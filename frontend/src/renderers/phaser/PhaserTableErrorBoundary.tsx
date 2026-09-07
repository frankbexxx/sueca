import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  onFallback?: (error: Error) => void;
}

interface State {
  hasError: boolean;
}

/**
 * Catches Sueca Phaser mount/render failures and swaps to DOM without crashing.
 */
export class PhaserTableErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Phaser renderer failed, falling back to DOM', error);
    }
    this.props.onFallback?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
