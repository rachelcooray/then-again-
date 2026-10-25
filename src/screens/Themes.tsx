import { Link } from 'react-router-dom';
import { getDailySet } from '../content/daily';
import { earlierThemes } from '../content/themes';
import { addDays, formatIssue, weekStart, type DateKey } from '../lib/date';
import { playedDates, type ProgressMap } from '../state/progress';
import { useStore } from '../state/store';
import { useToday } from '../state/useToday';

const CARD_STYLES = ['fam-word', 'fam-logic', 'fam-search', 'fam-connect', 'card--outline', 'card--outline'];

/** Days played in the week starting on a Monday. */
function daysPlayedInWeek(progress: ProgressMap, monday: DateKey): number {
  const played = playedDates(progress);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => played.has(d)).length;
}

const playedLine = (n: number) => (n === 0 ? 'Not played' : `${n} of 7 days played`);

export function Themes() {
  const today = useToday();
  const { data } = useStore();
  const { theme, issue } = getDailySet(today);
  const past = earlierThemes(today);

  return (
    <div className="screen">
      <div className="screen__head">
        <h1 className="display">Themes</h1>
        <p className="muted">Each theme runs for a week, Monday to Sunday. Its words turn up in the puzzles, and the puzzles get harder as the week goes on.</p>
      </div>

      <Link to="/" className="ticket ticket--strong">
        <span className="kicker">This week · {formatIssue(issue)}</span>
        <span className="ticket__name">{theme.name}</span>
        <span>{theme.description} {playedLine(daysPlayedInWeek(data.progress, weekStart(today)))}.</span>
        <span className="card__meta">Go to today’s puzzles <span aria-hidden="true">→</span></span>
      </Link>

      <section className="section">
        <h2 className="kicker">Earlier themes</h2>
        <div className="grid-2 grid-2--stack-narrow">
          {past.map(({ theme: t, weekOf }, i) => (
            <div key={weekOf} className={`card theme-card ${CARD_STYLES[i % CARD_STYLES.length]}`}>
              <span className="kicker">{formatIssue(t.issue)}</span>
              <span className="theme-card__name">{t.name}</span>
              <span className="small">{t.description}</span>
              <span className="card__meta" style={{ marginTop: 'auto' }}>{playedLine(daysPlayedInWeek(data.progress, weekOf))}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
