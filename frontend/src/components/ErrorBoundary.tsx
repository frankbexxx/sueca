import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Sueca UI error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 400,
            margin: '40px auto',
          }}
          role="alert"
        >
          <h1 style={{ fontSize: '1.25rem' }}>Algo correu mal</h1>
          <p>Recarrega a página para continuar.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              minHeight: 48,
              minWidth: 48,
              padding: '12px 24px',
              borderRadius: 10,
              border: 'none',
              background: '#6c5ce7',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
