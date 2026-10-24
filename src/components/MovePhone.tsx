import { useState } from 'react';
import { makeTransferCode, readTransferCode } from '../lib/transfer';
import { useStore } from '../state/store';

/** Copy progress as a code on the old phone; paste it on the new one. */
export function MovePhone() {
  const { data, importData } = useStore();
  const [code, setCode] = useState('');
  const [incoming, setIncoming] = useState('');
  const [note, setNote] = useState('');

  const make = async () => {
    const c = await makeTransferCode(data);
    setCode(c);
    try {
      await navigator.clipboard.writeText(c);
      setNote('Your code is copied. Paste it into Then Again on your new phone.');
    } catch {
      setNote('Your code is below. Select it all and copy it.');
    }
  };

  const restore = async () => {
    try {
      const parsed = await readTransferCode(incoming);
      importData(parsed);
      setIncoming('');
      setNote(`Done. ${Object.keys(parsed.progress).length} results moved to this phone.`);
    } catch (e) {
      setNote((e as Error).message);
    }
  };

  return (
    <section className="section">
      <h2 className="kicker">Move to a new phone</h2>
      <div className="panel card--outline">
        <span>On your old phone, make a code. On your new phone, paste it here. Your results, streak and settings come with you.</span>
        <button type="button" className="btn btn--outline" onClick={make}>Make my progress code</button>
        {code && (
          <textarea className="input move-code" readOnly value={code} aria-label="Your progress code" rows={3} onFocus={(e) => e.currentTarget.select()} />
        )}
        <label htmlFor="move-paste" className="small" style={{ fontWeight: 700 }}>Paste a code from your old phone</label>
        <textarea id="move-paste" className="input move-code" value={incoming} onChange={(e) => setIncoming(e.target.value)} rows={3} />
        <button type="button" className="btn" onClick={restore} disabled={!incoming.trim()}>Bring my progress here</button>
        <div className="note" role="status" aria-live="polite">{note}</div>
      </div>
    </section>
  );
}
