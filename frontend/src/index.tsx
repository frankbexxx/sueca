import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/design-tokens.css';
import './styles/sueca-buttons.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CARD_INTELLIGENCE_DEBUG, CARD_INTELLIGENCE_DEV_LAB } from './config/features';
import { ensureAuthInitialized, restoreAuthSession } from './services/authState';

// AUTH-01A/C: durable LocalGuest before render — offline, sync, no UI delay.
try {
  ensureAuthInitialized();
} catch {
  /* app remains playable; auth helpers retry on demand */
}

// AUTH-01C: async session restore (refresh+/me). Guest stays usable if it fails.
void restoreAuthSession().catch(() => {
  /* ignore — remain guest */
});

if (CARD_INTELLIGENCE_DEBUG) {
  void import('./cardIntelligence/debug/debugConsole').then(({ installCardIntelligenceDebugConsole }) => {
    installCardIntelligenceDebugConsole();
  });
}

if (CARD_INTELLIGENCE_DEBUG && CARD_INTELLIGENCE_DEV_LAB) {
  void import('./cardIntelligence/debug/devLabConsole').then(({ installCardIntelligenceDevLabConsole }) => {
    installCardIntelligenceDevLabConsole();
  });
}

// Error boundary for production
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

// Wrap in try-catch for better error handling
try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial;">
      <h1>Erro ao carregar o jogo</h1>
      <p>Por favor, recarrega a página.</p>
      <p style="color: red; font-size: 12px;">${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
    </div>
  `;
}
