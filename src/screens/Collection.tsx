import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getFormat } from '../content/formats';
import { getTheme } from '../content/themes';
import { formatIssue } from '../lib/date';
import { playedDates, solvedCount } from '../state/progress';
import { useStore } from '../state/store';

type Tab = 'solved' | 'stories' | 'mine';

const TABS: [Tab, string][] = [
  ['solved', 'Solved'],
  ['stories', 'Stories'],
  ['mine', 'My memories'],
];

export function Collection() {
  const { data } = useStore();
  const [tab, setTab] = useState<Tab>('solved');
  const records = Object.values(data.progress).sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return (
    <div className="screen">
      <div className="screen__head">
        <h1 className="display">My collection</h1>
        <nav className="chip-row" aria-label="Collection">
          <Link to="/rewards" className="chip chip--solid">Rewards &amp; badges</Link>
          <Link to="/gems" className="chip chip--outline">Gems</Link>
          <Link to="/reminders" className="chip chip--outline">Reminders</Link>
          <Link to="/settings" className="chip chip--outline">Settings</Link>
        </nav>
      </div>

      <div className="stats">
        <div className="stat stat--strong"><span className="stat__n">{solvedCount(data.progress)}</span><span className="stat__label">puzzles solved</span></div>
        <div className="stat"><span className="stat__n">{playedDates(data.progress).size}</span><span className="stat__label">days played</span></div>
        <div className="stat"><span className="stat__n">0</span><span className="stat__label">stories saved</span></div>
      </div>

      <div className="segmented" role="tablist" aria-label="Collection sections">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls="collection-panel"
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="collection-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="section">
        {tab === 'solved' &&
          (records.length ? (
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
          ))}

        {tab === 'stories' && (
          <div className="panel card--outline">
            <span className="panel__title">Stories you save</span>
            <span className="muted">Each result card ends with a short memory or fact. Save the ones you like and they collect here.</span>
          </div>
        )}

        {tab === 'mine' && (
          <div className="panel card--dashed" style={{ color: 'var(--ink)' }}>
            <span className="panel__title">Your memories live here</span>
            <span className="muted">After Rewind, you can write a line about your own life. It stays private on this device.</span>
            <Link to="/play/rewind" className="btn btn--start">Play Rewind <span aria-hidden="true">→</span></Link>
          </div>
        )}
      </div>
    </div>
  );
}
