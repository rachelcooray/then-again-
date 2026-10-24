import { useState } from 'react';
import { BackHeader } from '../components/BackHeader';
import { Link } from 'react-router-dom';
import { MovePhone } from '../components/MovePhone';
import { SwitchRow } from '../components/Switch';
import { setUsageSharing } from '../lib/analytics';
import { useStore, type Appearance, type TextSize } from '../state/store';

const SIZES: [TextSize, string][] = [
  ['standard', 'Standard'],
  ['large', 'Large'],
  ['larger', 'Larger'],
];

const APPEARANCES: [Appearance, string][] = [
  ['system', 'Match device'],
  ['light', 'Light'],
  ['dark', 'Dark'],
];

function Choice<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  const id = `choice-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section className="section">
      <h2 className="kicker" id={id}>{label}</h2>
      <div className="segmented" role="radiogroup" aria-labelledby={id}>
        {options.map(([k, text]) => (
          <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)}>
            {text}
          </button>
        ))}
      </div>
    </section>
  );
}

export function Settings() {
  const { data, updateSettings, resetAll } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState('');

  return (
    <>
      <BackHeader title="Settings" fallback="/collection" backLabel="Back" />
      <div className="screen">
        <Choice label="Text size" options={SIZES} value={data.settings.textSize}
          onChange={(textSize) => updateSettings({ textSize })} />
        <p className="settings-sample">The quick brown fox jumps over the lazy dog.</p>

        <Choice label="Appearance" options={APPEARANCES} value={data.settings.appearance}
          onChange={(appearance) => updateSettings({ appearance })} />

        <div className="list">
          <SwitchRow label="Sound" description="Quiet clicks and a chime when you finish"
            checked={data.settings.sound} onChange={(sound) => updateSettings({ sound })} />
          <SwitchRow label="Share anonymous usage" description="Counts like puzzles played, with nothing that identifies you"
            checked={data.settings.shareUsage} onChange={(shareUsage) => { setUsageSharing(shareUsage); updateSettings({ shareUsage }); }} />
        </div>

        <Link to="/help" className="btn btn--outline btn--block">Help and feedback</Link>

        <MovePhone />

        <section className="section">
          <h2 className="kicker">Your account</h2>
          <div className="panel card--outline">
            <span>No account needed. Your progress is saved on this device. To move it to a new phone, use “Move to a new phone” above.</span>
          </div>
        </section>

        <section className="section">
          <h2 className="kicker">Privacy</h2>
          <div className="panel card--outline">
            <span>Your puzzles, scores and private memories stay on this device. With usage sharing on, we receive anonymous counts only. We don’t sell your data.</span>
          </div>
        </section>

        <section className="section">
          <h2 className="kicker">Reset</h2>
          {!confirming ? (
            <button type="button" className="btn btn--outline btn--block" onClick={() => { setConfirming(true); setNote(''); }}>
              Reset all data on this device
            </button>
          ) : (
            <div className="panel card--outline" role="alertdialog" aria-labelledby="reset-title" aria-describedby="reset-desc">
              <span className="panel__title" id="reset-title">Reset everything?</span>
              <span id="reset-desc">This clears your scores, collection, Gems shown on this device and settings. It can’t be undone.</span>
              <div className="grid-2 grid-2--stack-narrow">
                <button type="button" className="btn btn--outline" autoFocus onClick={() => setConfirming(false)}>Keep my data</button>
                <button type="button" className="btn btn--danger" onClick={() => { resetAll(); setConfirming(false); setNote('All data on this device has been reset.'); }}>
                  Reset
                </button>
              </div>
            </div>
          )}
          <div className="note" role="status" aria-live="polite">{note}</div>
        </section>
      </div>
    </>
  );
}
