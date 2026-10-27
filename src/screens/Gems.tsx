import { BackHeader } from '../components/BackHeader';
import { BigGemIcon } from '../components/Icons';
import { Link } from 'react-router-dom';
import { config } from '../config';
import { useStore } from '../state/store';

const EARN = [
  ['Solve a daily puzzle, first time', '+5'],
  ['Play three puzzle families in a day', '+5'],
  ['Finish today’s full set', '+10'],
  ['Finish the weekly challenge', '+25'],
  ['Play on 7 days in a row', '+20'],
  ['Complete a theme collection', '+30'],
];

// Kept below the price of Plus, so a top-up never costs more than a month of every game.
const PACKS = [
  { gems: '100', price: '$0.29', cls: 'gem-pack' },
  { gems: '400', price: '$0.99', cls: 'gem-pack fam-search' },
  { gems: '1,000', price: '$1.99', cls: 'gem-pack fam-connect' },
];

export function Gems() {
  const { data } = useStore();

  return (
    <>
      <BackHeader title="Gems" fallback="/" backLabel="Back" />
      <div className="screen">
        <div className="card card--strong gem-balance">
          <BigGemIcon />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="gem-balance__n">{data.gems}</span>
            <span className="small" style={{ color: 'var(--on-strong-muted)' }}>Gems to spend</span>
          </div>
        </div>

        <div className="panel fam-word">
          <span className="kicker">Retries</span>
          <span className="panel__title">Missed one? Have another go.</span>
          <span>A retry costs 10 Gems and starts a fresh attempt. Your first result stays in your stats, and a retry win is shown separately from first-try wins.</span>
        </div>

        <section className="section">
          <h2 className="kicker">Earn Gems by playing</h2>
          <div className="list">
            {EARN.map(([label, n]) => (
              <div key={label} className="list__row">
                <span>{label}</span>
                <b className="mono">{n}</b>
              </div>
            ))}
          </div>
          <p className="small muted">Each reward is paid once. Replays and retries earn nothing extra.</p>
        </section>

        <section className="section">
          <h2 className="kicker">Gem packs and Plus</h2>
          <div className="gem-packs" aria-label="Gem packs, available after the free pilot">
            {PACKS.map((p) => (
              <div key={p.gems} className={p.cls}>
                <span className="gem-pack__n">{p.gems}</span>
                <span className="small" style={{ fontWeight: 600 }}>Gems</span>
                <span className="mono small">{p.price}</span>
              </div>
            ))}
          </div>
          <Link to="/plus" className="panel fam-logic" style={{ textDecoration: 'none' }}>
            <span className="panel__title">Then Again Plus · {config.plusPrice} a month</span>
            <span className="small">Every game, every day. See Plus →</span>
          </Link>
          <p className="small muted">
            Then Again is free during the pilot, so nothing is for sale yet. When purchases open they go through Apple or
            Google with a confirmation step, and today’s puzzles never need Gems to play.
          </p>
        </section>
      </div>
    </>
  );
}
