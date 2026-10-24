import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BackHeader } from '../components/BackHeader';
import { config } from '../config';
import { backendEnabled, enqueue } from '../lib/backend';
import { APP_VERSION, PLATFORM } from '../lib/platform';

const FAQ: [string, string][] = [
  ['When do new puzzles arrive?', 'A new set of four is ready at midnight where you are. Everyone on the same date plays the same puzzles.'],
  ['Do I need an account?', 'No. Your progress is saved on this device. To move to a new phone, use “Move to a new phone” in Settings.'],
  ['What happens if I miss a day?', 'Your streak starts again, but nothing you’ve earned is taken away. Weekly goals only need five days out of seven.'],
  ['Can I play a puzzle again?', 'Yes. After you finish, “Play again” gives you a practice round. Your first result is the one that counts.'],
  ['How do I make the text bigger?', 'Go to Settings and choose Large or Larger. Your phone’s own text size setting works too.'],
  ['Is my information shared?', 'Your puzzles and memories stay on this device. If you leave usage sharing on, we receive anonymous counts, like how many puzzles were played, with nothing that identifies you.'],
];

const KINDS: [string, string][] = [
  ['general', 'A question or comment'],
  ['bug', 'Something isn’t working'],
  ['puzzle', 'A problem with a puzzle'],
  ['idea', 'An idea'],
];

export function Help() {
  const { state } = useLocation() as { state?: { from?: string } };
  const [kind, setKind] = useState('general');
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [note, setNote] = useState('');

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) {
      setNote('Write a message first.');
      return;
    }
    enqueue('feedback', {
      message: text.slice(0, 4000),
      reply_to: replyTo.trim().slice(0, 200) || null,
      kind,
      route: state?.from ?? null,
      app_version: APP_VERSION,
      platform: PLATFORM,
    });
    setMessage('');
    setNote(navigator.onLine === false ? 'Saved. It will send when you’re back online.' : 'Thank you. Your message has been sent.');
  };

  return (
    <>
      <BackHeader title="Help" fallback="/settings" backLabel="Back" />
      <div className="screen">
        <section className="section">
          <h2 className="kicker">Common questions</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} className="help-q">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        {backendEnabled && (
          <section className="section">
            <h2 className="kicker" id="feedback-title">Send us a message</h2>
            <form className="panel card--outline help-form" onSubmit={send} aria-labelledby="feedback-title">
              <label htmlFor="fb-kind">What’s it about?</label>
              <select id="fb-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
                {KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
              <label htmlFor="fb-message">Your message</label>
              <textarea id="fb-message" className="input help-text" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={4000} />
              <label htmlFor="fb-reply">Your email, if you’d like a reply (optional)</label>
              <input id="fb-reply" className="input" type="email" autoComplete="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
              <button type="submit" className="btn">Send message</button>
              <div className="note" role="status" aria-live="polite">{note}</div>
            </form>
          </section>
        )}

        {config.supportEmail && (
          <section className="section">
            <h2 className="kicker">Email</h2>
            <p>Write to us at <strong className="help-email">{config.supportEmail}</strong> and a person will reply.</p>
          </section>
        )}

        <p className="small muted">Then Again {APP_VERSION} · {PLATFORM}</p>
      </div>
    </>
  );
}
