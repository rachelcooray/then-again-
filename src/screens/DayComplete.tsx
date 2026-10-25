import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { BackHeader } from '../components/BackHeader';
import { getDailySet } from '../content/daily';
import { FAMILIES, getFormat } from '../content/formats';
import { getPuzzle } from '../content/puzzles';
import { LEVEL_NAME } from '../content/schedule';
import { track } from '../lib/analytics';
import { addDays, formatIssue, longDate, longWeekday, weekdayIndex } from '../lib/date';
import { maybeAskForRating } from '../lib/rating';
import { dayProgress, dayShareText, linkOutcome } from '../state/day';
import { currentStreak, daysPlayedThisWeek, fullSetsCompleted } from '../state/progress';
import { useStore } from '../state/store';
import { useToday } from '../state/useToday';
import './day.css';

const WEEKLY_GOAL = 5;

/** The end of the day: the four results, the hidden link, a share card, the streak and a look at tomorrow. */
export function DayComplete() {
  const today = useToday();
  const { data, guessLink } = useStore();
  const set = getDailySet(today);
  const { records, done, complete } = dayProgress(set, data.progress);
  const guesses = data.links[today] ?? [];
  const link = set.link;
  const outcome = link && linkOutcome(link, guesses);
  const keys = set.formats.map((f, i) => (records[i] ? getPuzzle(today, f)?.linkKey : undefined));

  const streak = currentStreak(data.progress, today);
  const week = Math.min(daysPlayedThisWeek(data.progress, today), WEEKLY_GOAL);
  const [note, setNote] = useState('');

  // A finished day is the one good moment to ask for a rating.
  useEffect(() => {
    if (complete) void maybeAskForRating(fullSetsCompleted(data.progress, (d) => getDailySet(d).formats.length));
    // Only when the screen opens on a finished day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const guess = (option: string) => {
    if (!link || outcome?.over) return;
    guessLink(today, option);
    const after = linkOutcome(link, [...guesses, option]);
    if (after.over) track('link_result', { solved: after.solved, tries: guesses.length + 1 });
  };

  const share = dayShareText(set, data.progress, guesses);
  const doShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: share });
        return;
      }
      await navigator.clipboard.writeText(share);
      setNote('Copied. It doesn’t give away any answers.');
    } catch {
      setNote('Sharing isn’t available here.');
    }
  };

  const tomorrow = getDailySet(addDays(today, 1));
  const tomorrowFeatured = getFormat(tomorrow.formats[0]);
  const newTheme = weekdayIndex(today) === 6;

  return (
    <>
      <BackHeader title={complete ? 'Day complete' : 'Your day so far'} fallback="/" backLabel="Back to today" />
      <div className="screen day">
        <span className="kicker">{formatIssue(set.issue)} · {longDate(today)}{set.level ? ` · ${LEVEL_NAME[set.level]}` : ''}</span>

        <ul className="day-results" aria-label="Today’s four">
          {set.formats.map((id, i) => {
            const f = getFormat(id)!;
            const r = records[i];
            return (
              <li key={id} className={`day-results__row fam-edge-${f.family}`}>
                <span className="day-results__name">{f.name}</span>
                {r ? (
                  <span className="mono small">{r.solved ? '✓' : '✗'} {r.score}</span>
                ) : (
                  <Link to={`/play/${id}`} className="btn btn--outline day-results__play">Play</Link>
                )}
              </li>
            );
          })}
        </ul>

        {link && outcome && (
          <section className="panel card--strong day-link" aria-labelledby="link-title">
            <span className="kicker day-link__kicker">Today’s hidden link</span>
            <h2 className="title" id="link-title">
              {!complete ? 'Each puzzle hides a clue' : outcome.solved ? 'You found the link' : outcome.over ? 'The link was…' : 'What links them?'}
            </h2>
            <ol className="day-link__keys" aria-label="Clues found">
              {keys.map((k, i) => (
                <li key={i} className={k ? 'is-found' : ''}>{k ?? '?'}</li>
              ))}
            </ol>
            {!complete && <p className="small">Finish all four to guess what links the clues. {done} of 4 done.</p>}
            {complete && !outcome.over && (
              <>
                <p className="small">{outcome.triesLeft === 2 ? 'Two tries.' : 'One try left.'}</p>
                <div className="grid-2" role="group" aria-label="Choose the link">
                  {link.options.map((o) => (
                    <button key={o} type="button" className="btn btn--on-strong" disabled={guesses.includes(o)} onClick={() => guess(o)}>
                      {o}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="day-link__result" role="status" aria-live="polite">
              {outcome.over ? (
                <>
                  <strong>{link.answer}.</strong> {link.explain}
                </>
              ) : guesses.length ? (
                `Not ${guesses[guesses.length - 1]}. Have another look at the clues.`
              ) : (
                ''
              )}
            </p>
          </section>
        )}

        {complete && (
          <section className="section" aria-labelledby="share-title">
            <h2 className="kicker" id="share-title">Your card</h2>
            <pre className="day-share">{share}</pre>
            <button type="button" className="btn btn--block" onClick={doShare}>Share your day</button>
            <div className="small" role="status" aria-live="polite">{note}</div>
          </section>
        )}

        <section className="section day-streak" aria-labelledby="streak-title">
          <h2 className="kicker" id="streak-title">{streak ? `${streak}-day streak` : 'Your streak starts today'} · {week} of {WEEKLY_GOAL} days this week</h2>
          <div className="segments" style={{ '--count': WEEKLY_GOAL } as CSSProperties} role="img" aria-label={`${week} of ${WEEKLY_GOAL} days played this week`}>
            {Array.from({ length: WEEKLY_GOAL }, (_, i) => (
              <span key={i} className={i < week ? 'is-done' : ''} />
            ))}
          </div>
        </section>

        {tomorrowFeatured && (
          <section className={`card fam-${tomorrowFeatured.family} day-tomorrow`} aria-labelledby="tomorrow-title">
            <span className="kicker">Tomorrow · {longWeekday(tomorrow.date)}{tomorrow.level ? ` · ${LEVEL_NAME[tomorrow.level]}` : ''}</span>
            <h2 className="card__name" id="tomorrow-title">{tomorrowFeatured.name} leads the day</h2>
            <span>
              {newTheme ? `A new theme starts: ${tomorrow.theme.name}. ` : ''}
              {tomorrow.link ? 'Another hidden link to find.' : `${FAMILIES[tomorrowFeatured.family].label}, plus three more.`}
            </span>
          </section>
        )}

        <Link to="/" className="btn btn--outline btn--block">Back to today</Link>
      </div>
    </>
  );
}
