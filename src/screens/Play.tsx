import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BackHeader } from '../components/BackHeader';
import { ConfirmButton } from '../components/ConfirmButton';
import { getDailySet } from '../content/daily';
import { loadDictionary } from '../content/dictionary';
import { FAMILIES, getFormat, type PuzzleFormat } from '../content/formats';
import { getPuzzle } from '../content/puzzles';
import { engineFor } from '../engines/registry';
import type { AnyEngine, EngineContext, Puzzle } from '../engines/types';
import { formatIssue } from '../lib/date';
import { recordKey } from '../state/progress';
import { useStore } from '../state/store';
import { useToday } from '../state/useToday';
import { NotFound } from './NotFound';
import './play.css';

export function Play() {
  const { formatId = '' } = useParams();
  const today = useToday();
  const format = getFormat(formatId);
  if (!format) return <NotFound />;
  const engine = engineFor(format);
  const puzzle = getPuzzle(today, format.id);
  if (!engine || !puzzle) return <ComingSoon format={format} />;
  // Remount when the day or format changes so nothing carries over.
  return <PuzzleScreen key={`${today}:${format.id}`} format={format} engine={engine} puzzle={puzzle} today={today} />;
}

function ComingSoon({ format }: { format: PuzzleFormat }) {
  return (
    <>
      <BackHeader title={format.name} fallback="/" backLabel="Back" />
      <div className="screen">
        <span className="kicker">{FAMILIES[format.family].kicker} · {format.minutes} min · {format.difficulty}</span>
        <p className="play-rules">{format.rules}</p>
        <div className={`panel fam-${format.family}`}>
          <span className="panel__title">This puzzle is on its way</span>
          <span>{format.name} arrives in a coming update. Today’s other puzzles are ready to play.</span>
        </div>
        <Link to="/" className="btn btn--block">Back to today’s puzzles</Link>
        <Link to="/library" className="btn btn--outline btn--block">Browse the library</Link>
      </div>
    </>
  );
}

function PuzzleScreen({ format, engine, puzzle, today }: { format: PuzzleFormat; engine: AnyEngine; puzzle: Puzzle; today: string }) {
  const { data, saveAttempt, recordResult } = useStore();
  const set = getDailySet(today);
  const key = recordKey(today, format.id);
  const record = data.progress[key];
  const payload = puzzle.payload;

  const [ctx, setCtx] = useState<EngineContext | null>(engine.needsDictionary ? null : {});
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (!engine.needsDictionary) return;
    let live = true;
    loadDictionary()
      .then((dictionary) => live && setCtx({ dictionary }))
      .catch(() => live && setLoadError(true));
    return () => {
      live = false;
    };
  }, [engine, loadError]);

  // The live board. The saved copy drops the one-off message so it doesn't come back stale.
  // Practice rounds after finishing are never saved, so the first attempt stays as it was.
  const [practice, setPractice] = useState(false);
  const [state, setState] = useState<unknown>(() => data.attempts[key] ?? engine.init(payload));
  const status = engine.status(state, payload);

  const update = (next: unknown) => {
    setState(next);
    if (!practice) saveAttempt(key, { ...(next as object), note: '' });
  };

  const dispatch = (action: unknown) => {
    if (!ctx) return;
    const next = engine.reduce(state, action, payload, ctx);
    if (next !== state) update(next);
  };

  // Record the first attempt once, when it ends.
  useEffect(() => {
    if (!practice && status.done && !record) {
      recordResult({
        date: today,
        formatId: format.id,
        themeId: set.theme.id,
        issue: set.issue,
        solved: status.solved,
        score: status.score,
        completedAt: new Date().toISOString(),
      });
    }
  }, [practice, status.done, status.solved, status.score, record, recordResult, today, format.id, set.theme.id, set.issue]);

  const restart = () => update(engine.init(payload));

  const issue = formatIssue(set.issue);
  const intro = (payload as { intro?: string }).intro;
  const View = engine.View;

  return (
    <>
      <BackHeader title={format.name} fallback="/" backLabel="Back">
        <span className={`play-progress fam-${format.family}`} aria-label={`Progress ${status.progress}`}>{status.progress}</span>
      </BackHeader>
      <div className="screen play">
        <span className="kicker">{FAMILIES[format.family].kicker} · {issue}</span>
        <p className="play-rules">{intro ? `${intro} ` : ''}{format.rules}</p>
        <details className="play-help">
          <summary>How to play</summary>
          <p>{engine.help}</p>
        </details>

        {practice && (
          <p className="play-practice small">Practice round. Your first result is kept{record ? ` (${record.solved ? '✓' : '✗'} ${record.score})` : ''}.</p>
        )}

        {loadError ? (
          <div className="panel card--outline" role="alert">
            <span className="panel__title">The word list didn’t load</span>
            <span>Check your connection and try again.</span>
            <button type="button" className="btn btn--start" onClick={() => setLoadError(false)}>Try again</button>
          </div>
        ) : !ctx ? (
          <p className="muted" role="status">Loading the word list…</p>
        ) : (
          <View payload={payload} state={state} dispatch={dispatch} status={status} />
        )}

        <div className="play-message" role="status" aria-live="polite">{status.message}</div>

        {ctx && !status.done && (engine.hint || engine.restartable || engine.revealable) && (
          <div className="play-tools">
            {engine.hint && (
              <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'hint' })}>Hint</button>
            )}
            {engine.restartable && (
              <ConfirmButton label="Restart" question="Start this puzzle again?" detail="Your board will be cleared." confirmLabel="Restart" onConfirm={restart} />
            )}
            {engine.revealable && (
              <ConfirmButton label="Show the answers" question="Show the answers?" detail="This ends the puzzle without solving it." confirmLabel="Show answers" onConfirm={() => dispatch({ type: 'reveal' })} />
            )}
          </div>
        )}

        {status.done && (
          <ResultCard
            format={format}
            puzzle={puzzle}
            title={status.solved && puzzle.memory.title ? puzzle.memory.title : engine.resultTitle(state, payload)}
            solved={status.solved}
            share={[`Then Again ${issue} · ${format.name}`, ...engine.shareLines(state, payload)].join('\n')}
            today={today}
            onPlayAgain={() => {
              setPractice(true);
              setState(engine.init(payload));
            }}
          />
        )}
      </div>
    </>
  );
}

function ResultCard({ format, puzzle, title, solved, share, today, onPlayAgain }: {
  format: PuzzleFormat;
  puzzle: Puzzle;
  title: string;
  solved: boolean;
  share: string;
  today: string;
  onPlayAgain: () => void;
}) {
  const { data } = useStore();
  const [note, setNote] = useState('');
  const next = useMemo(() => {
    const ids = getDailySet(today).formats;
    return ids
      .map((id) => getFormat(id)!)
      .find((f) => f.id !== format.id && !data.progress[recordKey(today, f.id)]);
  }, [today, format.id, data.progress]);

  const doShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: share });
        return;
      }
      await navigator.clipboard.writeText(share);
      setNote('Result copied. It doesn’t give away the answer.');
    } catch {
      setNote('Sharing isn’t available here.');
    }
  };

  return (
    <section className={`result fam-${format.family}`} aria-labelledby="result-title">
      <span className="kicker">{solved ? 'A little piece of the past' : 'Today’s answer'}</span>
      <h2 className="result__title" id="result-title">{title}</h2>
      <p>{puzzle.memory.text}</p>
      {next ? (
        <Link to={`/play/${next.id}`} className="btn btn--on-family btn--block">Next: {next.name} <span aria-hidden="true">→</span></Link>
      ) : (
        <Link to="/" className="btn btn--on-family btn--block">That’s today’s set. Back to today <span aria-hidden="true">→</span></Link>
      )}
      <div className="grid-2">
        <button type="button" className="btn btn--ghost" onClick={doShare}>Share</button>
        <button type="button" className="btn btn--ghost" onClick={onPlayAgain}>Play again</button>
      </div>
      <div className="small" role="status" aria-live="polite">{note}</div>
    </section>
  );
}
