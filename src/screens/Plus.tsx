import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackHeader } from '../components/BackHeader';
import { ConfirmButton } from '../components/ConfirmButton';
import { config } from '../config';
import { FORMATS, getFormat, type PuzzleFormat } from '../content/formats';
import { track } from '../lib/analytics';
import { isNative } from '../lib/platform';
import { useAccess } from '../state/access';
import { useStore } from '../state/store';
import './plus.css';

/**
 * Then Again Plus: every game, every day, for a small monthly price. Purchases aren't connected
 * yet (they go through the App Store, Google Play or, on the web, a card payment), so the button
 * starts a preview on this phone, clearly labelled, and no money changes hands.
 */
export function PlusOffer({ format }: { format?: PuzzleFormat }) {
  const { data, setPlus } = useStore();
  const access = useAccess();
  const [note, setNote] = useState('');
  const paid = FORMATS.length - access.free.length;

  useEffect(() => {
    if (!data.plus) track('paywall_view', { format: format?.id ?? 'none' });
    // Count each time the offer is shown, not each re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format?.id]);

  const start = () => {
    setPlus({ source: 'preview', since: new Date().toISOString() });
    track('plus_start', { source: 'preview', format: format?.id ?? 'none' });
  };

  if (data.plus) {
    return (
      <div className="panel card--strong plus-active">
        <span className="kicker plus-kicker">Then Again Plus{data.plus.source === 'preview' ? ' · Preview' : ''}</span>
        <span className="panel__title">Every game is unlocked</span>
        <span className="small">Since {new Date(data.plus.since).toLocaleDateString(undefined, { dateStyle: 'long' })}.</span>
        {format && <Link to={`/play/${format.id}`} className="btn btn--on-strong-plus">Play {format.name}</Link>}
        {data.plus.source === 'preview' ? (
          <ConfirmButton className="btn btn--outline plus-cancel" label="End the preview" question="End the Plus preview?"
            detail="The games outside the free five lock again. Your results stay." confirmLabel="End preview" onConfirm={() => setPlus(null)} />
        ) : (
          <span className="small">Manage or cancel your subscription in your {data.plus.source === 'app-store' ? 'App Store' : data.plus.source === 'play-store' ? 'Google Play' : 'account'} settings.</span>
        )}
      </div>
    );
  }

  return (
    <section className="plus" aria-labelledby="plus-title">
      <div className="panel card--strong plus-hero">
        <span className="kicker plus-kicker">Then Again Plus</span>
        <h2 className="plus-title" id="plus-title">
          {format ? `${format.name} is part of Plus` : `All ${FORMATS.length} games, every day`}
        </h2>
        <p className="plus-price"><span className="plus-price__n">{config.plusPrice}</span> a month</p>
        <ul className="plus-benefits">
          <li>Unlock {paid} more games, each with a new puzzle every day</li>
          <li>Kakuro, Nonogram, Minesweeper, Word Hive, Anagrams and more</li>
          <li>Cancel any time</li>
        </ul>
        <button type="button" className="btn btn--block btn--on-strong-plus" onClick={start}>
          Get Plus for {config.plusPrice} a month
        </button>
        <button type="button" className="btn btn--outline plus-restore" onClick={() => setNote('Nothing to restore yet. Purchases open soon.')}>
          Restore purchases
        </button>
        <span className="small plus-note" role="status" aria-live="polite">{note}</span>
      </div>

      <p className="panel card--dashed plus-preview" role="note">
        <span className="kicker">Preview</span>
        <span className="small">Payments aren’t switched on yet, so this starts a free preview of Plus on this phone. No money is taken.</span>
      </p>

      <div className="section">
        <h3 className="kicker">Always free</h3>
        <p className="small">
          {access.free.map((id) => getFormat(id)?.name).filter(Boolean).join(', ')}
          {config.dailyFourAlwaysFree ? ', and every one of today’s four puzzles, whatever they are.' : '.'}
        </p>
        <p className="small muted">
          Plus renews each month until you cancel. {isNative ? 'It’s billed through your app store account, and you can cancel there.' : 'On the web it’s billed to your card, and you can cancel from your account.'}
        </p>
      </div>
    </section>
  );
}

export function Plus() {
  return (
    <>
      <BackHeader title="Then Again Plus" fallback="/library" backLabel="Back" />
      <div className="screen plus-screen">
        <PlusOffer />
      </div>
    </>
  );
}
