import { Link } from 'react-router-dom';
import { getDailySet } from '../content/daily';
import { FAMILIES, getFormat, type PuzzleFormat } from '../content/formats';
import { compactDate, formatIssue, longDate } from '../lib/date';
import { GemChip } from '../components/GemChip';
import { SettingsIcon } from '../components/Icons';
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

  return (
    <div className="screen today">
      <div className="today-head mobile-only">
        <Link to="/" className="logo" aria-label="Then Again, today">then again<span>.</span></Link>
        <div className="today-head__right">
          <GemChip />
          <div className="kicker today-head__date">{issue}<br />{compactDate(today)}</div>
          <Link to="/settings" className="icon-btn" aria-label="Settings"><SettingsIcon /></Link>
        </div>
      </div>

      <div className="today-grid">
        <div className="today-hero">
          <p className="kicker desktop-only">{issue} · {longDate(today)} · {set.theme.name}</p>
          <h1 className="display">{set.theme.headline}</h1>

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
              <span className="theme-link__more">{set.theme.formats.length} puzzle types <span aria-hidden="true">→</span></span>
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
