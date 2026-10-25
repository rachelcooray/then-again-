import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { config } from './config';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { compareVersions, APP_VERSION } from './lib/platform';
import { useRemoteConfig } from './lib/remoteConfig';
import { useCloudSync } from './lib/sync';
import { UpdateRequired } from './screens/UpdateRequired';
import { Help } from './screens/Help';
import { Catalogue } from './screens/Catalogue';
import { Account } from './screens/Account';
import { Admin } from './screens/Admin';
import { Collection } from './screens/Collection';
import { DayComplete } from './screens/DayComplete';
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
  [/^\/help/, 'Help'],
  [/^\/play/, 'Puzzle'],
  [/^\/day/, 'Your day'],
  [/^\/account/, 'Account'],
  [/^\/admin/, 'Admin'],
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
  const { data, importData } = useStore();
  const { pathname } = useLocation();
  useCloudSync(data, importData);
  const remote = useRemoteConfig();
  useApplySettings(data.settings);
  if (compareVersions(APP_VERSION, remote.min_version) < 0) return <UpdateRequired />;
  return (
    <ErrorBoundary resetKey={pathname}>
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
          <Route path="gems" element={config.gemsEnabled ? <Gems /> : <Navigate to="/collection" replace />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="play/:formatId" element={<Play />} />
          <Route path="day" element={<DayComplete />} />
          <Route path="account" element={<Account />} />
          <Route path="admin" element={<Admin />} />
          <Route path="admin/day/:date" element={<Admin />} />
          <Route path="admin/:tab" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
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
