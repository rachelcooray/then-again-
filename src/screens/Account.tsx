import { useEffect, useState, type FormEvent } from 'react';
import { BackHeader } from '../components/BackHeader';
import { ConfirmButton } from '../components/ConfirmButton';
import { authPreview, forgetSession, googleSignInUrl, isValidEmail, requestCode, signOut, useSession, verifyCode } from '../lib/auth';
import { call } from '../lib/backend';
import { syncNow, useSyncStatus } from '../lib/sync';
import { useStore, type AppData } from '../state/store';
import './account.css';

const RESEND_SECONDS = 60;

/** Everything on this phone, as a file the player can keep. */
function downloadData(data: AppData) {
  const { attempts: _boards, ...rest } = data;
  const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), ...rest }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'then-again-my-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function PreviewNote() {
  if (!authPreview) return null;
  return (
    <p className="panel card--dashed account-preview" role="note">
      <span className="kicker">Preview</span>
      <span className="small">Accounts aren’t switched on yet. You can try every step, but no email is sent and nothing leaves this phone. In this preview, any six digits sign you in.</span>
    </p>
  );
}

export function Account() {
  const session = useSession();
  return (
    <>
      <BackHeader title={session ? 'Your account' : 'Save your progress'} fallback="/collection" backLabel="Back to my collection" />
      <div className="screen account">
        <PreviewNote />
        {session ? <SignedIn /> : <SignIn />}
      </div>
    </>
  );
}

function SignIn() {
  const { data } = useStore();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!wait) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!isValidEmail(email)) return setError('That email address doesn’t look right.');
    setBusy(true);
    try {
      await requestCode(email);
      setStep('code');
      setWait(RESEND_SECONDS);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyCode(email, code);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const google = googleSignInUrl();
  const results = Object.keys(data.progress).length;

  if (step === 'code') {
    return (
      <form className="account-form" onSubmit={verify} noValidate>
        <h2 className="title">Check your email</h2>
        <p className="muted">We sent a six-digit code to <strong>{email.trim()}</strong>. It works for an hour.</p>
        <label htmlFor="code" className="kicker">Your code</label>
        <input id="code" className="input account-code" inputMode="numeric" autoComplete="one-time-code" maxLength={7}
          value={code} onChange={(e) => setCode(e.target.value)} aria-describedby={error ? 'account-error' : undefined} autoFocus />
        <button type="submit" className="btn btn--block" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
        <p id="account-error" className="account-error" role="alert">{error}</p>
        <div className="grid-2">
          <button type="button" className="btn btn--outline" disabled={busy || wait > 0} onClick={() => void send()}>
            {wait ? `New code in ${wait}s` : 'Send a new code'}
          </button>
          <button type="button" className="btn btn--outline" onClick={() => { setStep('email'); setCode(''); setError(''); }}>Change email</button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="panel fam-search">
        <span className="panel__title">Keep your streak if you change phones</span>
        <span>Sign in and your results, streak and settings are saved to your account, so you can pick up on a new phone or on the web. {results ? `You have ${results} result${results === 1 ? '' : 's'} on this phone; they come with you.` : ''}</span>
      </div>

      <form className="account-form" onSubmit={send} noValidate>
        <label htmlFor="email" className="kicker">Email address</label>
        <input id="email" className="input" type="email" autoComplete="email" inputMode="email" value={email}
          onChange={(e) => setEmail(e.target.value)} aria-describedby={error ? 'account-error' : 'email-help'} />
        <span id="email-help" className="small muted">We’ll email you a code. No password to remember.</span>
        <button type="submit" className="btn btn--block" disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
        <p id="account-error" className="account-error" role="alert">{error}</p>
      </form>

      <div className="account-or" aria-hidden="true"><span>or</span></div>
      {google ? (
        <a href={google} className="btn btn--outline btn--block account-google">Continue with Google</a>
      ) : (
        <button type="button" className="btn btn--outline btn--block account-google"
          onClick={() => setError('Google sign-in starts working once accounts are switched on.')}>
          Continue with Google
        </button>
      )}

      <p className="small muted">You don’t need an account to play. We only use your email to sign you in, never for marketing.</p>
      <DataSection />
    </>
  );
}

function SignedIn() {
  const { data, importData, resetAll } = useStore();
  const session = useSession()!;
  const sync = useSyncStatus();
  const [error, setError] = useState('');

  const when = sync.at ? new Date(sync.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;

  const remove = async () => {
    setError('');
    try {
      if (!session.preview) await call('delete_my_account');
      forgetSession();
      resetAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <div className="panel card--strong">
        <span className="kicker account-kicker">Signed in</span>
        <span className="panel__title account-email">{session.user.email}</span>
        <span className="small" role="status" aria-live="polite">
          {sync.state === 'syncing' ? 'Saving…' : sync.state === 'error' ? sync.message : when ? `Progress saved ${when}.${sync.message ? ` ${sync.message}` : ''}` : 'Not saved yet.'}
        </span>
        <button type="button" className="btn btn--on-strong-plain" disabled={sync.state === 'syncing'} onClick={() => void syncNow(session, data, importData)}>
          Save now
        </button>
      </div>

      <p className="small muted">New results save on their own a few seconds after you finish. Your saved memories stay on this phone.</p>

      <DataSection />

      <section className="section" aria-labelledby="leave-title">
        <h2 className="kicker" id="leave-title">Signing out and leaving</h2>
        <button type="button" className="btn btn--outline btn--block" onClick={() => void signOut()}>Sign out</button>
        <ConfirmButton className="btn btn--outline btn--block account-danger" label="Delete my account" question="Delete your account?"
          detail="This deletes your account and the progress saved in it. It can’t be undone. This phone keeps nothing either: it starts fresh."
          confirmLabel="Delete account" onConfirm={() => void remove()} />
        <p className="account-error" role="alert">{error}</p>
      </section>
    </>
  );
}

function DataSection() {
  const { data } = useStore();
  const [done, setDone] = useState('');
  return (
    <section className="section" aria-labelledby="data-title">
      <h2 className="kicker" id="data-title">Your data</h2>
      <p className="small muted">A copy of everything Then Again keeps on this phone: results, settings and saved memories.</p>
      <button type="button" className="btn btn--outline btn--block" onClick={() => { downloadData(data); setDone('Saved as then-again-my-data.json in your downloads.'); }}>Download my data</button>
      <p className="small" role="status" aria-live="polite">{done}</p>
    </section>
  );
}
