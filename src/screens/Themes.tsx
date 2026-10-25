import { Link } from 'react-router-dom';
import { getDailySet } from '../content/daily';
import { FAMILIES, getFormat } from '../content/formats';
import { earlierThemes, type Theme } from '../content/themes';
import { formatIssue } from '../lib/date';
import type { ProgressMap } from '../state/progress';
import { useStore } from '../state/store';
import { useToday } from '../state/useToday';

const CARD_STYLES = ['fam-word', 'fam-logic', 'fam-search', 'fam-connect', 'card--outline', 'card--outline'];

/** Distinct formats played while this theme ran, out of its four. */
function playedInTheme(progress: ProgressMap, theme: Theme): number {
  const ids = new Set(Object.values(progress).filter((r) => r.themeId === theme.id).map((r) => r.formatId));
  return theme.formats.filter((f) => ids.has(f)).length;
}

export function Themes() {
  const today = useToday();
  const { data } = useStore();
  const { theme, issue } = getDailySet(today);
  const played = playedInTheme(data.progress, theme);
  const past = earlierThemes(today);
  const playedLine = (n: number, total: number) => (n === 0 ? 'Not started' : `${n} of ${total} played`);

  return (
    <div className="screen">
      <div className="screen__head">
        <h1 className="display">Themes</h1>
        <p className="muted">Each theme runs through four puzzle types for a week. Play them in any order.</p>
      </div>

      <Link to="/" className="ticket ticket--strong">
        <span className="kicker">This week · {formatIssue(issue)}</span>
        <span className="ticket__name">{theme.name}</span>
        <span>{theme.description} {playedLine(played, theme.formats.length)}.</span>
        <span className="chip-row" aria-label="Puzzle types this week">
          {theme.formats.map((id) => {
            const f = getFormat(id)!;
            return (
              <span key={id} className={`theme-format fam-edge-${f.family}`}>
                {f.name}
              </span>
            );
          })}
        </span>
        <span className="card__meta">Go to today’s puzzles <span aria-hidden="true">→</span></span>
      </Link>

      <section className="section">
        <h2 className="kicker">Earlier themes</h2>
        <div className="grid-2 grid-2--stack-narrow">
          {past.map(({ theme: t, weekOf }, i) => {
            const n = playedInTheme(data.progress, t);
            return (
              <div key={weekOf} className={`card theme-card ${CARD_STYLES[i % CARD_STYLES.length]}`}>
                <span className="kicker">{formatIssue(t.issue)}</span>
                <span className="theme-card__name">{t.name}</span>
                <span className="small">{t.formats.map((id) => FAMILIES[getFormat(id)!.family].label).filter((v, j, a) => a.indexOf(v) === j).join(' · ')}</span>
                <span className="card__meta" style={{ marginTop: 'auto' }}>{playedLine(n, t.formats.length)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
