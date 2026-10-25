import { Link } from 'react-router-dom';
import { config } from '../config';
import { getDailySet } from '../content/daily';
import { FAMILIES, getFormat, type PuzzleFormat } from '../content/formats';
import { LEVEL_NAME } from '../content/schedule';
import { compactDate, formatIssue, longDate, longWeekday } from '../lib/date';
import { GemChip } from '../components/GemChip';
import { SettingsIcon } from '../components/Icons';
import { RegionQuestion } from '../components/RegionQuestion';
import { getPuzzle } from '../content/puzzles';
import { dayProgress, linkOutcome } from '../state/day';
import { recordKey } from '../state/progress';
import { useStore } from '../state/store';
import { useToday } from '../state/useToday';
import './today.css';

export function Today() {
  const today = useToday();
  const { data } = useStore();
  const set = getDailySet(today);
  const formats = set.formats.map((id) => getFormat(id)).filter((f): f is PuzzleFormat => !!f);
  const done = (f: PuzzleFormat) => data.progress[recordKey(today, f.id)];
  const doneCount = formats.filter(done).length;
  const [featured, ...others] = formats;
  const featuredDone = done(featured);
  const issue = formatIssue(set.issue);
  const playPath = (f: PuzzleFormat) => `/play/${f.id}`;
  const { complete } = dayProgress(set, data.progress);
  const linkDone = set.link && linkOutcome(set.link, data.links[today]).over;
  const keys = set.formats.map((id) => (data.progress[recordKey(today, id)] ? getPuzzle(today, id)?.linkKey : undefined));

  return (
    <div className="screen today">
      <div className="today-head mobile-only">
        <Link to="/" className="logo" aria-label="Then Again, today">then again<span>.</span></Link>
        <div className="today-head__right">
          {config.gemsEnabled && <GemChip />}
          <div className="kicker today-head__date">{issue}<br />{compactDate(today)}</div>
          <Link to="/settings" className="icon-btn" aria-label="Settings"><SettingsIcon /></Link>
        </div>
      </div>

      {data.settings.region === undefined && <RegionQuestion />}

      <div className="today-grid">
        <div className="today-hero">
          <p className="kicker desktop-only">{issue} · {longDate(today)} · {set.theme.name}</p>
          <h1 className="display">{set.theme.headline}</h1>
          {set.level && (
            <p className="today-level">
              <span className="kicker">{longWeekday(today)} · {LEVEL_NAME[set.level]}</span>
              <span className="small muted">Puzzles build from easy on Monday to hard on Saturday.</span>
            </p>
          )}

          <div className={`ticket fam-${featured.family}`}>
            <span className="kicker">Featured · {FAMILIES[featured.family].kicker} · {featured.minutes} min</span>
            <span className="ticket__name">{featured.name}</span>
            <span className="today-hero__desc">{featured.description}</span>
            {featured.engine === 'letter-guess' && (
              <span className="tiles" aria-hidden="true">
                <span /><span /><span /><span /><span />
              </span>
            )}
            <Link to={playPath(featured)} className="btn btn--on-family btn--start">
              {featuredDone ? 'See your result' : 'Play now'} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <aside className="today-side">
          <div className="progress-row mobile-only">
            <span className="kicker">Today {doneCount}/{formats.length}</span>
            <div className="segments" role="img" aria-label={`${doneCount} of ${formats.length} puzzles completed`}>
              {formats.map((f) => (
                <span key={f.id} className={`fam-edge-${f.family}${done(f) ? ' is-done' : ''}`} />
              ))}
            </div>
          </div>

          {(set.link || complete) && (
            <Link to="/day" className="card card--strong today-day">
              <span className="kicker today-day__kicker">{complete ? 'Day complete' : 'Today’s hidden link'}</span>
              <span className="today-day__title">
                {!complete ? 'Each puzzle hides a clue. What links them?' : set.link && !linkDone ? 'Now find what links your four clues' : 'See your day and share it'}
              </span>
              {set.link && (
                <span className="today-day__keys" aria-label={`${keys.filter(Boolean).length} of 4 clues found`}>
                  {keys.map((k, i) => <span key={i} aria-hidden="true">{k ?? '?'}</span>)}
                </span>
              )}
              <span className="card__meta">{complete ? 'Open' : 'See your clues'} <span aria-hidden="true">→</span></span>
            </Link>
          )}

          <div className="card card--strong today-list desktop-only">
            <span className="kicker today-list__kicker">Today {doneCount} of {formats.length}</span>
            <ul>
              {formats.map((f) => {
                const r = done(f);
                return (
                  <li key={f.id}>
                    <Link to={playPath(f)}>
                      <span className="today-list__name">
                        <span className={`today-list__dot fam-edge-${f.family}${r ? ' is-done' : ''}`} aria-hidden="true" />
                        {f.name}
                      </span>
                      <span className="mono small">{r ? `✓ ${r.score}` : `${f.minutes} MIN`}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mosaic mobile-only">
            {others.map((f, i) => (
              <Link key={f.id} to={playPath(f)} className={`card fam-${f.family}${i === 0 ? ' mosaic__tall' : ''}`}>
                <span className="kicker">{FAMILIES[f.family].shortKicker} · {f.minutes} min</span>
                <span className="mosaic__name">{f.name}</span>
                <span className="mosaic__meta">{done(f) ? `✓ Solved · ${done(f)!.score}` : f.description}</span>
              </Link>
            ))}
          </div>

          <Link to="/themes" className="card card--outline theme-link">
            <span className="kicker">This week’s theme</span>
            <span className="theme-link__row">
              <span className="theme-link__name">{set.theme.name}</span>
              <span className="theme-link__more">All week <span aria-hidden="true">→</span></span>
            </span>
          </Link>
        </aside>
      </div>

      <section className="section desktop-only">
        <h2 className="title today-more__title">Keep playing</h2>
        <div className="cards-grid">
          {others.map((f) => (
            <Link key={f.id} to={playPath(f)} className={`card fam-${f.family}`}>
              <span className="kicker">{FAMILIES[f.family].shortKicker} · {f.minutes} min</span>
              <span className="card__name">{f.name}</span>
              <span>{f.description}</span>
              <span className="card__meta" style={{ marginTop: 'auto' }}>
                {done(f) ? `✓ Solved · ${done(f)!.score}` : 'Start'} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
          <Link to="/library" className="card card--dashed">
            <span className="kicker">Library</span>
            <span className="card__name">More puzzles</span>
            <span>Every format in one place.</span>
            <span className="card__meta" style={{ marginTop: 'auto', color: 'var(--ink)' }}>Browse <span aria-hidden="true">→</span></span>
          </Link>
        </div>
      </section>
    </div>
  );
}
