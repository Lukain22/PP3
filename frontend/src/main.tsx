import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { PreferencesProvider } from './app/PreferencesProvider';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreferencesProvider>
      <App />
    </PreferencesProvider>
  </React.StrictMode>
);
