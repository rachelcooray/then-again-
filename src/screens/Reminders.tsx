import { useState } from 'react';
import { BackHeader } from '../components/BackHeader';
import { SwitchRow } from '../components/Switch';
import { getDailySet } from '../content/daily';
import { fullSetsCompleted } from '../state/progress';
import { isNative } from '../lib/platform';
import { useStore } from '../state/store';

const TIMES = ['07:00', '09:00', '13:00', '19:00'];

export function Reminders() {
  const { data, updateReminders } = useStore();
  const r = data.reminders;
  const [note, setNote] = useState('');
  // Ask late: only after the player finishes a first full day (section 8).
  const firstFullDayDone = fullSetsCompleted(data.progress, (d) => getDailySet(d).formats.length) > 0;
  const anyOn = r.daily || r.streak || r.rewards;

  const set = (patch: Partial<typeof r>, message = '') => {
    updateReminders(patch);
    setNote(message);
  };

  return (
    <>
      <BackHeader title="Reminders" fallback="/collection" backLabel="Back to my collection" />
      <div className="screen">
        {!r.asked && firstFullDayDone && (
          <div className="panel fam-word">
            <span className="kicker">After your first full day</span>
            <span className="panel__title">Want a nudge when tomorrow’s puzzles are ready?</span>
            <span>One reminder a day at most, at a time you choose. You can turn it off whenever you like.</span>
            <div className="grid-2">
              <button type="button" className="btn btn--outline" style={{ borderColor: 'var(--fixed-ink)', color: 'var(--fixed-ink)' }}
                onClick={() => set({ asked: true }, 'No problem. You can switch reminders on here any time.')}>
                Not now
              </button>
              <button type="button" className="btn btn--on-family"
                onClick={() => set({ asked: true, daily: true }, 'Daily reminder on.')}>
                Yes, remind me
              </button>
            </div>
          </div>
        )}
        {!r.asked && !firstFullDayDone && (
          <div className="panel card--outline">
            <span className="panel__title">Reminders are off</span>
            <span className="muted">We won’t ask about reminders until you’ve finished a full day of puzzles. You can switch them on below whenever you like.</span>
          </div>
        )}

        {!isNative && (
          <div className="panel card--outline">
            <span className="panel__title">Reminders come with the phone app</span>
            <span className="muted">A web page can’t send reminders reliably. Your choices here are saved and will apply when you play in the Then Again app.</span>
          </div>
        )}

        <div className="note" role="status" aria-live="polite">{note}</div>

        <div className="list">
          <SwitchRow label="Daily puzzles" description="When a new set is ready"
            checked={r.daily} onChange={(v) => set({ daily: v, asked: true })} />
          <SwitchRow label="Streak nudge" description="Only if your weekly goal is at risk, and never after you’ve played that day"
            checked={r.streak} onChange={(v) => set({ streak: v, asked: true })} />
          <SwitchRow label="Rewards" description="When a badge or collection piece unlocks"
            checked={r.rewards} onChange={(v) => set({ rewards: v, asked: true })} />
          <SwitchRow label="Quiet hours" description={`Nothing between ${r.quietStart} and ${r.quietEnd}`}
            checked={r.quietHours} onChange={(v) => set({ quietHours: v })} />
        </div>

        {anyOn && (
          <button type="button" className="btn btn--outline btn--block"
            onClick={() => set({ daily: false, streak: false, rewards: false }, 'All reminders are off.')}>
            Turn all reminders off
          </button>
        )}

        <section className="section">
          <h2 className="kicker" id="reminder-time">Daily reminder time</h2>
          <div className="segmented" role="radiogroup" aria-labelledby="reminder-time" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(4.5rem, 1fr))' }}>
            {TIMES.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={r.time === t} className="mono"
                onClick={() => set({ time: t }, `Daily reminder time set to ${t}.`)}>
                {t}
              </button>
            ))}
          </div>
        </section>

        <div className="panel card--strong">
          <span className="kicker" style={{ color: 'var(--chartreuse)' }}>Preview</span>
          <span style={{ fontWeight: 700 }}>Then Again</span>
          <span>Today’s puzzles are ready. Your next collection piece is waiting.</span>
        </div>

        <p className="small muted">
          Our promises: never more than one routine reminder a day; no streak reminder once you’ve already played; nothing
          during quiet hours; and if your phone blocks notifications, you’ll see the reminder inside the app instead.
        </p>
      </div>
    </>
  );
}
