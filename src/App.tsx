import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { config } from './config';
import { Layout } from './components/Layout';
import { Catalogue } from './screens/Catalogue';
import { Collection } from './screens/Collection';
import { Gems } from './screens/Gems';
import { Library } from './screens/Library';
import { NotFound } from './screens/NotFound';
import { Play } from './screens/Play';
import { Reminders } from './screens/Reminders';
import { Rewards } from './screens/Rewards';
import { Settings } from './screens/Settings';
import { Themes } from './screens/Themes';
import { Today } from './screens/Today';
import { StoreProvider, useStore, type AppData } from './state/store';
import { useApplySettings } from './state/useApplySettings';

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Today'],
  [/^\/library\/catalogue/, 'Full catalogue'],
  [/^\/library/, 'Library'],
  [/^\/themes/, 'Themes'],
  [/^\/collection/, 'My collection'],
  [/^\/rewards/, 'Rewards'],
  [/^\/gems/, 'Gems'],
  [/^\/reminders/, 'Reminders'],
  [/^\/settings/, 'Settings'],
  [/^\/play/, 'Puzzle'],
];

/** Per-route document title, scroll reset and focus for screen-reader users. */
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = TITLES.find(([re]) => re.test(pathname))?.[1];
    document.title = title ? `${title} · Then Again` : 'Then Again';
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const { data } = useStore();
  useApplySettings(data.settings);
  return (
    <>
      <RouteEffects />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Today />} />
          <Route path="library" element={<Library />} />
          <Route
            path="library/catalogue"
            element={config.showCatalogue ? <Catalogue /> : <Navigate to="/library" replace />}
          />
          <Route path="themes" element={<Themes />} />
          <Route path="collection" element={<Collection />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="gems" element={<Gems />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="settings" element={<Settings />} />
          <Route path="play/:formatId" element={<Play />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export function App({ initialData }: { initialData?: AppData }) {
  return (
    <StoreProvider initial={initialData}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  );
}
