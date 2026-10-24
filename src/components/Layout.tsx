import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { config } from '../config';
import { CollectionIcon, LibraryIcon, SettingsIcon, ThemesIcon, TodayIcon } from './Icons';
import { GemChip } from './GemChip';

const DESTINATIONS = [
  { to: '/', label: 'Today', Icon: TodayIcon, end: true },
  { to: '/library', label: 'Library', Icon: LibraryIcon, end: false },
  { to: '/themes', label: 'Themes', Icon: ThemesIcon, end: false },
  { to: '/collection', label: 'Collection', Icon: CollectionIcon, end: false },
];

/** Screens that show the mobile bottom navigation; sub screens use a back button instead. */
const MAIN_PATHS = ['/', '/library', '/themes', '/collection'];

export function Layout() {
  const { pathname } = useLocation();
  const withNav = MAIN_PATHS.includes(pathname);

  return (
    <div className={withNav ? 'app app--with-nav' : 'app'}>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          // The router uses the URL hash, so move focus without changing it.
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="logo" aria-label="Then Again, today">then again<span>.</span></NavLink>
          <div className="topbar__right">
            <nav aria-label="Main" className="pill-nav">
              {DESTINATIONS.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}>{label}</NavLink>
              ))}
            </nav>
            {config.gemsEnabled && <GemChip />}
            <NavLink to="/settings" className="icon-btn" aria-label="Settings"><SettingsIcon /></NavLink>
          </div>
        </div>
      </header>

      <main id="main" className="app__main" tabIndex={-1}>
        <Outlet />
      </main>

      {withNav && (
        <nav aria-label="Main" className="bottom-nav">
          {DESTINATIONS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
