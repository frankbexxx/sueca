import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/design-tokens.css';
import './styles/sueca-buttons.css';
import './styles/dobo-ui.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

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
