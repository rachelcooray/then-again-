import { Link, useParams } from 'react-router-dom';
import { BackHeader } from '../components/BackHeader';
import { FAMILIES, getFormat } from '../content/formats';
import { NotFound } from './NotFound';

/** Full-screen puzzle view. Phase 1 shows the header and rules; the engines arrive in phases 2 and 4. */
export function Play() {
  const { formatId = '' } = useParams();
  const format = getFormat(formatId);
  if (!format) return <NotFound />;

  return (
    <>
      <BackHeader title={format.name} fallback="/" backLabel="Back" />
      <div className="screen">
        <span className="kicker">{FAMILIES[format.family].kicker} · {format.minutes} min · {format.difficulty}</span>
        <p className="play-rules">{format.rules}</p>
        <div className={`panel fam-${format.family}`}>
          <span className="panel__title">This puzzle is on its way</span>
          <span>{format.name} arrives in {format.phase === 2 ? 'the next update' : 'a coming update'}. Everything else in the app is ready to explore.</span>
        </div>
        <Link to="/" className="btn btn--block">Back to today’s puzzles</Link>
        <Link to="/library" className="btn btn--outline btn--block">Browse the library</Link>
      </div>
    </>
  );
}
