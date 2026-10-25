import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { BackHeader } from '../components/BackHeader';
import { ConfirmButton } from '../components/ConfirmButton';
import { answerSummary } from '../content/answers';
import { getDailySet } from '../content/daily';
import { FORMATS, getFormat } from '../content/formats';
import { LEVEL_NAME, loadWholeSchedule, scheduledDates, scheduledDay, scheduleRange } from '../content/schedule';
import { getTheme } from '../content/themes';
import type { Puzzle } from '../engines/types';
import {
  decide,
  deletePlayer,
  findPlayer,
  listErrors,
  listFeedback,
  markHandled,
  saveSwitch,
  usageSummary,
  useAdminAccess,
  useDecisions,
  type ErrorRow,
  type FeedbackRow,
  type PlayerRecord,
  type UsageSummary,
} from '../lib/admin';
import { authPreview } from '../lib/auth';
import { compactDate, daysBetween, longDate, toDateKey, weekdayIndex } from '../lib/date';
import { useRemoteConfig } from '../lib/remoteConfig';
import './admin.css';

const TABS: [string, string][] = [
  ['overview', 'Overview'],
  ['calendar', 'Calendar'],
  ['review', 'Review'],
  ['players', 'Players'],
  ['feedback', 'Feedback'],
  ['switches', 'Switches'],
];

/** The team's pages: content, players, feedback and switches. Not linked from the player's app. */
export function Admin() {
  const { tab = 'overview', date } = useParams();
  const access = useAdminAccess();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (access === 'preview' || access === 'admin') void loadWholeSchedule().then(() => setReady(true));
  }, [access]);

  let body;
  if (access === 'checking') body = <p className="muted" role="status">Checking your access…</p>;
  else if (access === 'signed-out') body = (
    <div className="panel card--outline">
      <span className="panel__title">Sign in to continue</span>
      <span className="muted">These pages are for the Then Again team.</span>
      <Link to="/account" className="btn btn--start">Sign in</Link>
    </div>
  );
  else if (access === 'denied') body = (
    <div className="panel card--outline">
      <span className="panel__title">This page is for the Then Again team</span>
      <span className="muted">Your account doesn’t have access. If it should, ask for it to be added.</span>
    </div>
  );
  else if (!ready) body = <p className="muted" role="status">Loading the calendar…</p>;
  else if (date) body = <DayDetail date={date} />;
  else body = (
    <>
      {tab === 'overview' && <Overview />}
      {tab === 'calendar' && <Calendar />}
      {tab === 'review' && <ReviewQueue />}
      {tab === 'players' && <Players />}
      {tab === 'feedback' && <Feedback />}
      {tab === 'switches' && <Switches />}
    </>
  );

  return (
    <>
      <BackHeader title="Admin" fallback="/" backLabel="Back to the app" />
      <div className="screen admin">
        {authPreview && (
          <p className="panel card--dashed admin-preview" role="note">
            <span className="kicker">Preview</span>
            <span className="small">The server isn’t connected, so this runs on the calendar bundled with the app. Review decisions are kept in this browser only. Once Supabase is connected, only admins can open these pages.</span>
          </p>
        )}
        {(access === 'preview' || access === 'admin') && (
          <nav className="chip-row admin-tabs" aria-label="Admin sections">
            {TABS.map(([id, label]) => (
              <NavLink key={id} to={`/admin/${id}`} className={() => `chip ${(!date && tab === id) || (date && id === 'calendar') ? 'chip--solid' : 'chip--outline'}`}
                aria-current={!date && tab === id ? 'page' : undefined}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        {body}
      </div>
    </>
  );
}

const fmtTime = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Every scheduled puzzle that carries hand-written text. */
function useReviewItems() {
  return useMemo(
    () => scheduledDates().flatMap((date) => Object.values(scheduledDay(date)?.puzzles ?? {}).filter((p) => p.review).map((p) => ({ date, puzzle: p }))),
    [],
  );
}

// ---------------------------------------------------------------- Overview

function Overview() {
  const today = toDateKey();
  const left = daysBetween(today, scheduleRange.last);
  const items = useReviewItems();
  const decisions = useDecisions();
  const approved = items.filter((i) => decisions[i.puzzle.id]?.decision === 'approved').length;
  const changes = items.filter((i) => decisions[i.puzzle.id]?.decision === 'changes').length;
  const set = getDailySet(today);

  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [usageError, setUsageError] = useState('');
  useEffect(() => {
    if (authPreview) return;
    usageSummary().then(setUsage, (e: Error) => setUsageError(e.message));
  }, []);

  const stat = (n: number | string, label: string) => (
    <div className="stat"><span className="stat__n">{n}</span><span className="stat__label">{label}</span></div>
  );

  return (
    <>
      <div className={`panel ${left < 30 ? 'fam-word' : 'card--strong'}`}>
        <span className="kicker">Puzzle calendar</span>
        <span className="panel__title">Scheduled through {longDate(scheduleRange.last)}</span>
        <span>{left < 0 ? 'The calendar has run out: players are getting the design puzzles. Run npm run content.' : `${left} days left.${left < 30 ? ' Run npm run content soon.' : ''}`}</span>
      </div>

      <section className="section" aria-labelledby="review-title">
        <h2 className="kicker" id="review-title">Content review</h2>
        <div className="stats">
          {stat(items.length - approved - changes, 'waiting')}
          {stat(approved, 'approved')}
          {stat(changes, 'need changes')}
        </div>
        <Link to="/admin/review" className="btn btn--outline btn--block">Review puzzles</Link>
      </section>

      <section className="section" aria-labelledby="today-title">
        <h2 className="kicker" id="today-title">Today · {set.theme.name}{set.level ? ` · ${LEVEL_NAME[set.level]}` : ''}</h2>
        <p>{set.formats.map((f) => getFormat(f)!.name).join(', ')}{set.link ? `. Hidden link: ${set.link.answer}.` : '.'}</p>
        <Link to={`/admin/day/${today}`} className="btn btn--outline btn--block">See today’s puzzles</Link>
      </section>

      <section className="section" aria-labelledby="usage-title">
        <h2 className="kicker" id="usage-title">Pilot numbers · last 30 days</h2>
        {authPreview ? (
          <p className="muted small">These appear once Supabase is connected: new players, visits, puzzles finished, full days, hidden links found, day-7 returns, accounts, open feedback and errors.</p>
        ) : usage ? (
          <div className="stats admin-stats">
            {stat(usage.first_opens, 'new players')}
            {stat(usage.visits, 'daily visits')}
            {stat(usage.puzzles, 'puzzles finished')}
            {stat(usage.full_days, 'full days')}
            {stat(usage.links_tried ? `${Math.round((usage.links_found / usage.links_tried) * 100)}%` : '–', 'links found')}
            {stat(usage.day7_returns, 'day-7 returns')}
            {stat(usage.accounts, 'accounts')}
            {stat(usage.feedback_open, 'open feedback')}
            {stat(usage.errors_7d, 'errors this week')}
          </div>
        ) : (
          <p className="muted small" role="status">{usageError || 'Loading…'}</p>
        )}
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Calendar

function Calendar() {
  const dates = scheduledDates();
  const decisions = useDecisions();
  const weeks = useMemo(() => {
    const out: string[][] = [];
    for (const d of dates) {
      if (!out.length || weekdayIndex(d) === 0) out.push([]);
      out[out.length - 1].push(d);
    }
    return out;
  }, [dates]);

  return (
    <>
      <p className="muted small">{dates.length} days, {compactDate(dates[0])} to {compactDate(dates[dates.length - 1])}. Tap a day to see and review its puzzles.</p>
      {weeks.map((week) => {
        const theme = getTheme(scheduledDay(week[0])!.themeId);
        return (
          <section key={week[0]} className="section" aria-label={`Week of ${compactDate(week[0])}`}>
            <h2 className="kicker">Week of {compactDate(week[0])} · {theme?.name}</h2>
            <ul className="admin-days">
              {week.map((d) => {
                const day = scheduledDay(d)!;
                const waiting = Object.values(day.puzzles).filter((p) => p.review && !decisions[p.id]).length;
                return (
                  <li key={d}>
                    <Link to={`/admin/day/${d}`} className="admin-day">
                      <span className="admin-day__date mono">{compactDate(d)}</span>
                      <span className="admin-day__body">
                        <span className="small"><strong>{LEVEL_NAME[day.level]}</strong> · {day.formats.map((f) => getFormat(f)!.name).join(', ')}</span>
                        <span className="small muted">
                          {day.link ? `Link: ${day.link.answer} · ` : ''}
                          {waiting ? `${waiting} to review` : 'Nothing waiting'}
                        </span>
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function DayDetail({ date }: { date: string }) {
  const day = scheduledDay(date);
  if (!day) return <p className="muted">Nothing is scheduled on {date}.</p>;
  const four = day.formats.map((f) => day.puzzles[f]);
  const rest = Object.values(day.puzzles).filter((p) => !day.formats.includes(p.formatId));
  return (
    <>
      <div className="panel card--strong">
        <span className="kicker admin-strong-kicker">{longDate(date)} · {LEVEL_NAME[day.level]}</span>
        <span className="panel__title">{getTheme(day.themeId)?.name}</span>
        {day.link && (
          <span>
            Hidden link: <strong>{day.link.answer}</strong> (choices {day.link.options.join(', ')}). {day.link.explain}
          </span>
        )}
      </div>
      <section className="section" aria-labelledby="four-title">
        <h2 className="kicker" id="four-title">The day’s four</h2>
        <ul className="admin-puzzles">{four.map((p) => <PuzzleReview key={p.id} puzzle={p} />)}</ul>
      </section>
      <section className="section" aria-labelledby="library-title">
        <h2 className="kicker" id="library-title">In the Library that day</h2>
        <ul className="admin-puzzles">{rest.map((p) => <PuzzleReview key={p.id} puzzle={p} />)}</ul>
      </section>
      <Link to="/admin/calendar" className="btn btn--outline btn--block">Back to the calendar</Link>
    </>
  );
}

function PuzzleReview({ puzzle, showDate }: { puzzle: Puzzle; showDate?: string }) {
  const f = getFormat(puzzle.formatId)!;
  const decisions = useDecisions();
  const d = decisions[puzzle.id];
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const s = answerSummary(puzzle);
  const noteId = `note-${puzzle.id}`;

  const act = async (decision: 'approved' | 'changes') => {
    setError('');
    setBusy(true);
    try {
      await decide(puzzle.id, decision, note);
      setNote('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`card card--outline admin-puzzle fam-edge-${f.family}`}>
      <span className="kicker">
        {showDate ? `${compactDate(showDate)} · ` : ''}{f.name}{puzzle.level ? ` · ${LEVEL_NAME[puzzle.level]}` : ''}{puzzle.linkKey ? ` · Link clue ${puzzle.linkKey}` : ''}
      </span>
      <details className="admin-answer">
        <summary>Show the answer</summary>
        <p className="mono small">{s.answer}</p>
      </details>
      {s.wording.map((w, i) => <p key={i} className="small">{w}</p>)}
      <p className="small"><strong>Result card:</strong> {puzzle.memory.title ? `${puzzle.memory.title}. ` : ''}{puzzle.memory.text}</p>
      {puzzle.review ? (
        <>
          <p className="small admin-status" role="status">
            {d ? (d.decision === 'approved' ? `✓ Approved ${fmtTime(d.at)}` : `Changes requested ${fmtTime(d.at)}${d.note ? `: ${d.note}` : ''}`) : `Waiting for review. ${puzzle.review}`}
          </p>
          <label htmlFor={noteId} className="small"><strong>Note</strong> (needed for changes)</label>
          <textarea id={noteId} className="input" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should change?" />
          <div className="grid-2">
            <button type="button" className="btn" disabled={busy} onClick={() => void act('approved')}>Approve</button>
            <button type="button" className="btn btn--outline" disabled={busy || !note.trim()} onClick={() => void act('changes')}>Needs changes</button>
          </div>
          <p className="small admin-error" role="alert">{error}</p>
        </>
      ) : (
        <p className="small muted">Made from the dictionary and checked by the solver. No review needed.</p>
      )}
    </li>
  );
}

// ---------------------------------------------------------------- Review queue

type Filter = 'waiting' | 'approved' | 'changes';

function ReviewQueue() {
  const items = useReviewItems();
  const decisions = useDecisions();
  const [filter, setFilter] = useState<Filter>('waiting');
  const [shown, setShown] = useState(20);
  const [downloaded, setDownloaded] = useState('');
  const matching = items.filter(({ puzzle }) => {
    const d = decisions[puzzle.id];
    return filter === 'waiting' ? !d : d?.decision === filter;
  });
  const count = (f: Filter) => items.filter(({ puzzle }) => (f === 'waiting' ? !decisions[puzzle.id] : decisions[puzzle.id]?.decision === f)).length;

  const download = () => {
    const blob = new Blob([JSON.stringify(decisions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'then-again-review-decisions.json';
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded('Saved as then-again-review-decisions.json in your downloads.');
  };

  return (
    <>
      <p className="muted small">Puzzles with hand-written text: theme clues, link days and nonogram pictures. Everything else is made from the dictionary and checked by a solver.</p>
      <div className="chip-row" role="group" aria-label="Show">
        {(['waiting', 'approved', 'changes'] as Filter[]).map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => { setFilter(f); setShown(20); }}>
            {f === 'waiting' ? 'Waiting' : f === 'approved' ? 'Approved' : 'Need changes'} · {count(f)}
          </button>
        ))}
      </div>
      {matching.length ? (
        <ul className="admin-puzzles">
          {matching.slice(0, shown).map(({ date, puzzle }) => <PuzzleReview key={puzzle.id} puzzle={puzzle} showDate={date} />)}
        </ul>
      ) : (
        <p className="muted">Nothing here.</p>
      )}
      {matching.length > shown && (
        <button type="button" className="btn btn--outline btn--block" onClick={() => setShown((n) => n + 20)}>Show {Math.min(20, matching.length - shown)} more</button>
      )}
      <button type="button" className="btn btn--outline btn--block" onClick={download}>Download decisions</button>
      <p className="small" role="status" aria-live="polite">{downloaded}</p>
    </>
  );
}

// ---------------------------------------------------------------- Players

function Players() {
  const [email, setEmail] = useState('');
  const [player, setPlayer] = useState<PlayerRecord | null | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (authPreview) return setMessage('Player search works once Supabase is connected.');
    setBusy(true);
    try {
      setPlayer(await findPlayer(email));
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: PlayerRecord) => {
    try {
      await deletePlayer(p.id);
      setPlayer(undefined);
      setMessage(`${p.email}’s account and saved progress are deleted.`);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <>
      <p className="muted small">For a player who asks what you hold about them, or asks to be deleted. Only players who signed in have a record; everyone else’s progress lives only on their phone.</p>
      <form className="admin-search" onSubmit={search}>
        <label htmlFor="player-email" className="kicker">Player’s email</label>
        <input id="player-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="btn btn--block" disabled={busy || !email.trim()}>{busy ? 'Searching…' : 'Find player'}</button>
      </form>
      <p className="small" role="status" aria-live="polite">{message}</p>
      {player === null && <p className="muted">No account uses that email.</p>}
      {player && (
        <div className="card card--outline admin-player">
          <span className="panel__title">{player.email}</span>
          <span className="small">Joined {fmtTime(player.joined)}{player.last_sign_in ? ` · last signed in ${fmtTime(player.last_sign_in)}` : ''}</span>
          <span className="small">{player.results} results saved{player.saved_at ? `, last saved ${fmtTime(player.saved_at)}` : ''}</span>
          <ConfirmButton className="btn btn--outline btn--block" label="Delete this player" question={`Delete ${player.email}?`}
            detail="Their account and saved progress are deleted for good. Anything on their phone stays there." confirmLabel="Delete" onConfirm={() => void remove(player)} />
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Feedback and errors

function Feedback() {
  const [feedback, setFeedback] = useState<FeedbackRow[] | null>(null);
  const [errors, setErrors] = useState<ErrorRow[] | null>(null);
  const [showHandled, setShowHandled] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (authPreview) return;
    void listFeedback().then(setFeedback);
    void listErrors().then(setErrors);
  }, []);

  if (authPreview) {
    return <p className="muted">Messages sent from Help and error reports from players’ phones appear here once Supabase is connected.</p>;
  }

  const handle = async (id: number) => {
    try {
      await markHandled(id);
      setFeedback((rows) => rows?.map((r) => (r.id === id ? { ...r, handled_at: new Date().toISOString() } : r)) ?? null);
    } catch (e) {
      setNote((e as Error).message);
    }
  };
  const visible = (feedback ?? []).filter((r) => showHandled || !r.handled_at);

  return (
    <>
      <section className="section" aria-labelledby="fb-title">
        <h2 className="kicker" id="fb-title">Messages from players</h2>
        <button type="button" className="chip" aria-pressed={showHandled} onClick={() => setShowHandled((v) => !v)}>Show handled</button>
        <p className="small" role="status">{note}</p>
        {feedback === null ? <p className="muted">Couldn’t load messages.</p> : visible.length ? (
          <ul className="admin-puzzles">
            {visible.map((r) => (
              <li key={r.id} className="card card--outline admin-feedback">
                <span className="kicker">{r.kind} · {fmtTime(r.created_at)} · {r.platform} {r.app_version}</span>
                <p>{r.message}</p>
                {r.reply_to && <p className="small">Reply to: <a href={`mailto:${r.reply_to}`}>{r.reply_to}</a></p>}
                {r.handled_at ? <p className="small muted">Handled {fmtTime(r.handled_at)}</p> : (
                  <button type="button" className="btn btn--outline" onClick={() => void handle(r.id)}>Mark as handled</button>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="muted">No messages waiting.</p>}
      </section>
      <section className="section" aria-labelledby="err-title">
        <h2 className="kicker" id="err-title">Errors on players’ phones</h2>
        {errors === null ? <p className="muted">Couldn’t load errors.</p> : errors.length ? (
          <ul className="admin-errors">
            {errors.map((r) => (
              <li key={r.id} className="small"><span className="mono">{fmtTime(r.received_at)}</span> · {r.route ?? '?'} · {r.platform} {r.app_version}<br />{r.message}</li>
            ))}
          </ul>
        ) : <p className="muted">No errors reported.</p>}
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Switches

function Switches() {
  const remote = useRemoteConfig();
  const [paused, setPaused] = useState<string[]>(remote.paused_formats);
  const [banner, setBanner] = useState(remote.banner?.text ?? '');
  const [threshold, setThreshold] = useState(String(remote.vote_percent_after));
  const [minVersion, setMinVersion] = useState(remote.min_version);
  const [latest, setLatest] = useState(remote.latest_version);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (authPreview) return setMessage('Switches can be saved once Supabase is connected.');
    const n = Number(threshold);
    if (!Number.isInteger(n) || n < 1) return setMessage('The number of answers must be a whole number above zero.');
    setBusy(true);
    try {
      await saveSwitch('paused_formats', paused);
      await saveSwitch('banner', banner.trim() ? { text: banner.trim() } : null);
      await saveSwitch('vote_percent_after', n);
      await saveSwitch('min_version', minVersion.trim());
      await saveSwitch('latest_version', latest.trim());
      setMessage('Saved. Players get the change next time the app checks, within an hour.');
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => setPaused((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <form className="admin-switches" onSubmit={save}>
      <p className="muted small">Changes reach players without a new release.</p>
      <fieldset className="admin-fieldset">
        <legend className="kicker">Pause a puzzle type</legend>
        <span className="small muted">For example while a bad puzzle is replaced.</span>
        <div className="admin-checks">
          {FORMATS.map((f) => (
            <label key={f.id} className="admin-check">
              <input type="checkbox" checked={paused.includes(f.id)} onChange={() => toggle(f.id)} /> {f.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor="sw-banner" className="kicker">Message on Today</label>
      <input id="sw-banner" className="input" value={banner} maxLength={160} onChange={(e) => setBanner(e.target.value)} placeholder="Leave empty for none" />
      <label htmlFor="sw-threshold" className="kicker">“Did you have one?” shows a percentage after this many answers</label>
      <input id="sw-threshold" className="input" inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
      <div className="grid-2">
        <span className="admin-field">
          <label htmlFor="sw-min" className="kicker">Oldest version allowed</label>
          <input id="sw-min" className="input" value={minVersion} onChange={(e) => setMinVersion(e.target.value)} />
        </span>
        <span className="admin-field">
          <label htmlFor="sw-latest" className="kicker">Latest version</label>
          <input id="sw-latest" className="input" value={latest} onChange={(e) => setLatest(e.target.value)} />
        </span>
      </div>
      <button type="submit" className="btn btn--block" disabled={busy}>{busy ? 'Saving…' : 'Save switches'}</button>
      <p className="small" role="status" aria-live="polite">{message}</p>
    </form>
  );
}
