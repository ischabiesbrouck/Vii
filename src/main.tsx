import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource-variable/inter';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import './index.css';
import './i18n';
import { App } from './App';
import { IS_ARTIFACT_PREVIEW } from './config';

// Service worker: precaches the app shell, fonts and all content JSON.
// autoUpdate: a new version activates silently on next load.
if (!IS_ARTIFACT_PREVIEW) registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
