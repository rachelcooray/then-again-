import type { Engine, EngineViewProps } from '../types';
import { lettersChanged, type WordChainPayload } from './logic';
import '../engines.css';

export { shortestLadder, type WordChainPayload } from './logic';

export interface WordChainState {
  steps: string[];
  typed: string;
  revealed: boolean;
  note: string;
}

export type WordChainAction = { type: 'type'; value: string } | { type: 'submit' } | { type: 'undo' } | { type: 'reveal' };

const last = (s: WordChainState) => s.steps[s.steps.length - 1];
const isDone = (s: WordChainState, p: WordChainPayload) => s.revealed || last(s) === p.end;

function reduce(s: WordChainState, a: WordChainAction, p: WordChainPayload, dictionary?: ReadonlySet<string>): WordChainState {
  if (isDone(s, p)) return s;
  const len = p.start.length;
  switch (a.type) {
    case 'type':
      return { ...s, typed: a.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, len), note: '' };
    case 'undo':
      return s.steps.length > 1 ? { ...s, steps: s.steps.slice(0, -1), note: `Back to ${s.steps[s.steps.length - 2]}.` } : s;
    case 'reveal':
      return { ...s, steps: p.route, revealed: true, typed: '', note: `One route: ${p.route.join(', ')}.` };
    case 'submit': {
      const w = s.typed;
      if (w.length !== len) return { ...s, note: `${len} letters, please.` };
      if (lettersChanged(w, last(s)) !== 1) return { ...s, note: `Change exactly one letter of ${last(s)}.` };
      if (w !== p.end && dictionary && !dictionary.has(w)) return { ...s, note: `${w} isn’t in our word list.` };
      if (s.steps.includes(w)) return { ...s, note: `You’ve already used ${w}.` };
      const steps = [...s.steps, w];
      const moves = steps.length - 1;
      return { ...s, steps, typed: '', note: w === p.end ? `Climbed in ${moves}.` : `${w}. Keep going.` };
    }
  }
}

type Props = EngineViewProps<WordChainPayload, WordChainState, WordChainAction>;

function View({ payload, state, dispatch }: Props) {
  const done = isDone(state, payload);
  return (
    <div className="eng">
      <ol className="wl-rungs" aria-label="Your ladder">
        {state.steps.map((w, i) => (
          <li key={`${w}-${i}`} className={i === 0 ? 'is-start' : w === payload.end ? 'is-end' : ''}>{w}</li>
        ))}
        {!done && <li className="is-goal" aria-label={`Goal: ${payload.end}`}>{payload.end}</li>}
      </ol>
      {!done && (
        <form
          className="wl-form"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'submit' });
          }}
        >
          <label htmlFor="wl-next" className="kicker">Next word</label>
          <div className="wl-row">
            <input
              id="wl-next"
              className="input mono"
              value={state.typed}
              onChange={(e) => dispatch({ type: 'type', value: e.target.value })}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              maxLength={payload.start.length}
              aria-describedby="wl-help"
            />
            <button type="submit" className="btn">Add</button>
          </div>
          <span id="wl-help" className="small muted">Change one letter of {state.steps[state.steps.length - 1]}. Par is {payload.par} steps.</span>
          <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'undo' })} disabled={state.steps.length < 2}>Undo last step</button>
        </form>
      )}
    </div>
  );
}

export const wordChain: Engine<WordChainPayload, WordChainState, WordChainAction> = {
  id: 'word-chain',
  needsDictionary: true,
  restartable: true,
  help: 'Type a word that changes one letter of the last word, then Add or press Enter. Every step must be a real word. Undo takes back your last step.',
  revealable: true,
  init: (p) => ({ steps: [p.start], typed: '', revealed: false, note: '' }),
  reduce: (s, a, p, ctx) => reduce(s, a, p, ctx.dictionary),
  status(s, p) {
    const moves = s.steps.length - 1;
    const solved = !s.revealed && last(s) === p.end;
    return { done: isDone(s, p), solved, score: solved ? `${moves} steps (par ${p.par})` : 'Revealed', progress: `${moves} STEPS`, message: s.note };
  },
  resultTitle: (s, p) => (s.revealed ? 'Not this time.' : s.steps.length - 1 <= p.par ? `Climbed in ${s.steps.length - 1}. Right on par!` : `Climbed in ${s.steps.length - 1} steps.`),
  shareLines: (s, p) => [s.revealed ? '⬜ Not solved' : `🪜 ${s.steps.length - 1} steps, par ${p.par}`],
  View,
};
