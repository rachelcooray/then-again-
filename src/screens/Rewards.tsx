import type { CSSProperties } from 'react';
import { config } from '../config';
import { BackHeader } from '../components/BackHeader';
import { GemChip } from '../components/GemChip';
import { getDailySet } from '../content/daily';
import { addDays, shortWeekday } from '../lib/date';
import {
  currentStreak,
  daysPlayedThisWeek,
  formatsTried,
  fullSetsCompleted,
  playedDates,
  solvedInFamily,
} from '../state/progress';
import { useStore } from '../state/store';
import { useToday } from '../state/useToday';
import './rewards.css';

const WEEKLY_GOAL = 5;

const CABINET = [
  ['Biscuit tin', 25],
  ['Cassette tape', 30],
  ['Rotary telephone', 40],
  ['Typewriter', 60],
] as const;

export function Rewards() {
  const today = useToday();
  const { data } = useStore();
  const p = data.progress;
  const streak = currentStreak(p, today);
  const played = playedDates(p);
  const week = daysPlayedThisWeek(p, today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  const badges = [
    { name: 'Wordsmith', goal: 25, have: solvedInFamily(p, 'word'), what: 'word puzzles solved', cls: 'fam-word' },
    { name: 'Pattern Seeker', goal: 10, have: solvedInFamily(p, 'logic'), what: 'logic puzzles solved', cls: 'fam-logic' },
    { name: 'Puzzle Explorer', goal: 8, have: formatsTried(p), what: 'formats tried', cls: 'fam-search' },
    { name: 'Daily Champion', goal: 30, have: fullSetsCompleted(p, (d) => getDailySet(d).formats.length), what: 'full sets finished', cls: 'fam-connect' },
  ];

  return (
    <>
      <BackHeader title="Rewards" fallback="/collection" backLabel="Back to my collection">
        {config.gemsEnabled && <GemChip />}
      </BackHeader>
      <div className="screen">
        <div className="card card--strong streak">
          <div className="streak__head">
            <span className="title streak__title">{streak ? `${streak}-day streak` : 'Start your streak today'}</span>
          </div>
          <ol className="streak__days" aria-label="The last seven days">
            {days.map((d) => {
              const isToday = d === today;
              const did = played.has(d);
              const state = did ? 'played' : isToday ? 'not played yet' : 'missed';
              return (
                <li key={d} aria-label={`${isToday ? 'Today' : shortWeekday(d)}: ${state}`}>
                  <span className={`streak__mark streak__mark--${did ? 'done' : isToday ? 'today' : 'missed'}`} aria-hidden="true">
                    {did ? '✓' : isToday ? '?' : '·'}
                  </span>
                  <span aria-hidden="true">{isToday ? 'Today' : shortWeekday(d)}</span>
                </li>
              );
            })}
          </ol>
          <span className="small" style={{ color: 'var(--on-strong-muted)' }}>
            {streak >= 7
              ? 'Seven days in a row. Well played.'
              : streak
                ? `${7 - streak} more day${7 - streak === 1 ? '' : 's'} in a row makes a 7-day streak.`
                : 'Finish a puzzle today to start it. Missing a day starts it again, but nothing you’ve earned is taken away.'}
          </span>
        </div>

        <section className="section">
          <h2 className="kicker">This week’s goal · {Math.min(week, WEEKLY_GOAL)} of {WEEKLY_GOAL} days</h2>
          <div className="segments" style={{ '--count': WEEKLY_GOAL } as CSSProperties} role="img" aria-label={`${Math.min(week, WEEKLY_GOAL)} of ${WEEKLY_GOAL} days played this week`}>
            {Array.from({ length: WEEKLY_GOAL }, (_, i) => (
              <span key={i} className={i < week ? 'is-done' : ''} />
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="kicker">Badges</h2>
          <ul className="grid-2 badges">
            {badges.map((b) => {
              const earned = b.have >= b.goal;
              return (
                <li key={b.name} className={earned ? `card ${b.cls}` : 'card card--dashed'}>
                  <span className="badge__name">{b.name}</span>
                  <span className="small">
                    {earned ? `✓ ${b.goal} ${b.what}` : `Locked · ${Math.min(b.have, b.goal)} of ${b.goal} ${b.what}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

{config.gemsEnabled && (
        <section className="section">
          <h2 className="kicker">The Collection Cabinet · 0 of {CABINET.length} in this set</h2>
          <ul className="grid-2 badges">
            {CABINET.map(([name, price]) => (
              <li key={name} className="card card--outline cabinet-item">
                <span className="badge__name">{name}</span>
                <span className="mono small">{price} Gems</span>
              </li>
            ))}
          </ul>
          <p className="small muted">Collectibles open with Gems in a later update. Earned Gems are never taken away, and every reward can be earned without paying.</p>
        </section>
        )}
      </div>
    </>
  );
}
