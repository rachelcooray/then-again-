import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmButton } from '../components/ConfirmButton';
import { useSession } from '../lib/auth';
import { useAccess } from '../state/access';
import { config } from '../config';
import { getFormat } from '../content/formats';
import { getTheme } from '../content/themes';
import { formatIssue } from '../lib/date';
import { getDailySet, issueNumber } from '../content/daily';
import { fullSetsCompleted, playedDates, solvedCount } from '../state/progress';
import { useStore, type SavedMemory } from '../state/store';

export function Collection() {
  const { data } = useStore();
  const session = useSession();
  const access = useAccess();
  const records = Object.values(data.progress).sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return (
    <div className="screen">
      <div className="screen__head">
        <h1 className="display">My collection</h1>
        <nav className="chip-row" aria-label="Collection">
          <Link to="/rewards" className="chip chip--solid">Rewards &amp; badges</Link>
          <Link to="/account" className="chip chip--outline">{session ? 'Account' : 'Sign in'}</Link>
          {access.on && <Link to="/plus" className="chip chip--outline">{access.plus ? 'Plus' : 'Get Plus'}</Link>}
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

      <section className="section" aria-labelledby="memories-title" id="memories">
        <h2 className="kicker" id="memories-title">My memories</h2>
        {data.memories.length ? (
          <ul className="memory-list">
            {data.memories.map((m) => <MemoryItem key={m.id} memory={m} />)}
          </ul>
        ) : (
          <div className="panel card--outline">
            <span className="panel__title">No stories saved yet</span>
            <span className="muted">After a puzzle, tap “Save this story” to keep it here, and add your own memory alongside it. They stay on this phone.</span>
          </div>
        )}
      </section>
    </div>
  );
}

/** A saved story with the player's own words, which they can add to or change. */
function MemoryItem({ memory }: { memory: SavedMemory }) {
  const { saveMemory, removeMemory } = useStore();
  const [draft, setDraft] = useState(memory.note);
  const [status, setStatus] = useState('');
  const f = getFormat(memory.formatId);
  const id = `note-${memory.id}`;
  return (
    <li className={`card card--outline memory-item fam-edge-${f?.family ?? 'word'}`}>
      <span className="kicker">{f?.name ?? 'Puzzle'} · {formatIssueForDate(memory.date)}</span>
      {memory.title && <span className="memory-item__title">{memory.title}</span>}
      <span>{memory.text}</span>
      <label htmlFor={id} className="small" style={{ fontWeight: 700 }}>Your own memory</label>
      <textarea id={id} className="input memory-item__note" rows={3} value={draft} maxLength={1000}
        placeholder="What does it bring back for you?" onChange={(e) => { setDraft(e.target.value); setStatus(''); }} />
      <div className="grid-2">
        <button type="button" className="btn" disabled={draft === memory.note} onClick={() => { saveMemory({ ...memory, note: draft.trim() }); setStatus('Saved on this phone.'); }}>Save</button>
        <ConfirmButton label="Remove" question="Remove this story?" detail="Your own words with it will go too." confirmLabel="Remove" onConfirm={() => removeMemory(memory.id)} />
      </div>
      <span className="small" role="status" aria-live="polite">{status}</span>
    </li>
  );
}

const formatIssueForDate = (date: string) => formatIssue(issueNumber(date));
