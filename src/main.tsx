import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled so the app works offline inside the native wrapper.
import '@fontsource/bricolage-grotesque/latin-800.css';
import '@fontsource/figtree/latin-400.css';
import '@fontsource/figtree/latin-600.css';
import '@fontsource/figtree/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './App';
import { loadScheduleAround } from './content/schedule';
import { toDateKey } from './lib/date';
import { startOutbox } from './lib/backend';
import { setUsageSharing, startAnalytics } from './lib/analytics';
import { startErrorReporting } from './lib/errors';
import { loadData } from './state/store';

startErrorReporting();
startOutbox();
setUsageSharing(loadData().settings.shareUsage);
startAnalytics();

// Today's puzzles are a small local file; wait for them so the first screen shows the right day.
void loadScheduleAround(toDateKey()).finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
