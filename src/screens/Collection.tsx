import { Link } from 'react-router-dom';
import { config } from '../config';
import { getFormat } from '../content/formats';
import { getTheme } from '../content/themes';
import { formatIssue } from '../lib/date';
import { getDailySet } from '../content/daily';
import { fullSetsCompleted, playedDates, solvedCount } from '../state/progress';
import { useStore } from '../state/store';

export function Collection() {
  const { data } = useStore();
  const records = Object.values(data.progress).sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return (
    <div className="screen">
      <div className="screen__head">
        <h1 className="display">My collection</h1>
        <nav className="chip-row" aria-label="Collection">
          <Link to="/rewards" className="chip chip--solid">Rewards &amp; badges</Link>
          {config.gemsEnabled && <Link to="/gems" className="chip chip--outline">Gems</Link>}
          <Link to="/reminders" className="chip chip--outline">Reminders</Link>
          <Link to="/settings" className="chip chip--outline">Settings</Link>
        </nav>
      </div>

      <div className="stats">
        <div className="stat stat--strong"><span className="stat__n">{solvedCount(data.progress)}</span><span className="stat__label">puzzles solved</span></div>
        <div className="stat"><span className="stat__n">{playedDates(data.progress).size}</span><span className="stat__label">days played</span></div>
        <div className="stat"><span className="stat__n">{fullSetsCompleted(data.progress, (d) => getDailySet(d).formats.length)}</span><span className="stat__label">full days</span></div>
      </div>

      <section className="section" aria-labelledby="solved-title">
        <h2 className="kicker" id="solved-title">Solved</h2>
        {records.length ? (
            <ul className="collection-list">
              {records.map((r) => {
                const f = getFormat(r.formatId);
                const theme = getTheme(r.themeId);
                return (
                  <li key={`${r.date}:${r.formatId}`} className="list__row">
                    <span className={`dot fam-edge-${f?.family ?? 'word'}`} aria-hidden="true" />
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{f?.name ?? r.formatId}</span>
                      <span className="small muted">{theme?.name ?? 'Daily set'} · {formatIssue(r.issue)}</span>
                    </span>
                    <span className="mono small">{r.solved ? `✓ ${r.score}` : `✗ ${r.score}`}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="panel card--outline">
              <span className="panel__title">Nothing solved yet</span>
              <span className="muted">Your finished puzzles appear here, with your score for each.</span>
              <Link to="/" className="btn btn--start">Go to today’s puzzles <span aria-hidden="true">→</span></Link>
            </div>
          )}
      </section>
    </div>
  );
}
