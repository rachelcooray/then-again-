import { config } from '../config';
import { APP_VERSION, PLATFORM } from '../lib/platform';

/** Shown when this version is older than the minimum the server asks for. */
export function UpdateRequired() {
  const store = PLATFORM === 'ios' ? config.appStoreUrl : PLATFORM === 'android' ? config.playStoreUrl : '';
  return (
    <main className="app__main">
      <div className="screen" role="alert">
        <span className="logo">then again<span>.</span></span>
        <h1 className="display">Time for an update</h1>
        <p>This version of Then Again ({APP_VERSION}) is too old to load today’s puzzles. Updating takes a minute, and your progress stays on this device.</p>
        {store ? (
          <a className="btn btn--start" href={store} target="_blank" rel="noreferrer">Update Then Again</a>
        ) : (
          <button type="button" className="btn btn--start" onClick={() => location.reload()}>Reload</button>
        )}
      </div>
    </main>
  );
}
