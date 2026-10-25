import { track } from '../lib/analytics';
import { useStore, type Region } from '../state/store';

const CHOICES: [Exclude<Region, 'skipped'>, string][] = [
  ['uk', 'The UK'],
  ['us', 'The US'],
  ['other', 'Somewhere else'],
];

/** Asked once, on Today: where the player grew up, so memories can be chosen to ring true. */
export function RegionQuestion() {
  const { updateSettings } = useStore();
  const choose = (region: Region) => {
    updateSettings({ region });
    track('region_choice', { region });
  };
  return (
    <section className="panel card--outline region-question" aria-labelledby="region-title">
      <span className="kicker">One quick question</span>
      <h2 className="panel__title" id="region-title">Where did you grow up?</h2>
      <span className="small muted">It helps us pick memories that ring true. You can change it in Settings.</span>
      <div className="region-question__choices" role="group" aria-labelledby="region-title">
        {CHOICES.map(([value, label]) => (
          <button key={value} type="button" className="btn btn--outline" onClick={() => choose(value)}>{label}</button>
        ))}
      </div>
      <button type="button" className="btn btn--outline region-question__skip" onClick={() => choose('skipped')}>Skip</button>
    </section>
  );
}
