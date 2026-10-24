import type { Engine, EngineViewProps } from '../types';
import { keepFocus, useTypingKeys } from '../useTypingKeys';
import '../engines.css';

export interface LetterSetPayload {
  letters: string[];
  /** Words needed to finish. Any other dictionary word from the letters counts as a bonus. */
  targets: string[];
  minLength: number;
  intro: string;
}

export interface LetterSetState {
  path: number[];
  found: string[];
  /** The target word the hint points at. */
  hint: string | null;
  hintsUsed: number;
  revealed: boolean;
  note: string;
}

export type LetterSetAction =
  | { type: 'tap'; index: number }
  | { type: 'typed'; letter: string }
  | { type: 'undo' }
  | { type: 'clear' }
  | { type: 'submit' }
  | { type: 'hint' }
  | { type: 'reveal' };

const FREE_HINTS = 1;
const targetsFound = (s: LetterSetState, p: LetterSetPayload) => s.found.filter((w) => p.targets.includes(w)).length;
const isOver = (s: LetterSetState, p: LetterSetPayload) => s.revealed || targetsFound(s, p) === p.targets.length;

function reduce(s: LetterSetState, a: LetterSetAction, p: LetterSetPayload, dictionary?: ReadonlySet<string>): LetterSetState {
  if (isOver(s, p)) return s;
  const word = s.path.map((i) => p.letters[i]).join('');
  switch (a.type) {
    case 'tap':
      return s.path.includes(a.index) ? s : { ...s, path: [...s.path, a.index], note: '' };
    case 'typed': {
      const i = p.letters.findIndex((l, k) => l === a.letter.toUpperCase() && !s.path.includes(k));
      return i < 0 ? { ...s, note: `No ${a.letter.toUpperCase()} left to use.` } : { ...s, path: [...s.path, i], note: '' };
    }
    case 'undo':
      return { ...s, path: s.path.slice(0, -1), note: '' };
    case 'clear':
      return { ...s, path: [], note: '' };
    case 'submit': {
      if (word.length < p.minLength) return { ...s, note: `Words need ${p.minLength} letters or more.` };
      if (s.found.includes(word)) return { ...s, path: [], note: `You’ve already found ${word}.` };
      if (p.targets.includes(word)) {
        const found = [...s.found, word];
        const left = p.targets.length - found.filter((w) => p.targets.includes(w)).length;
        return { ...s, path: [], found, hint: s.hint === word ? null : s.hint, note: left ? `Nice: ${word}. ${left} to go.` : `Nice: ${word}. That’s all of them.` };
      }
      if (dictionary?.has(word)) return { ...s, path: [], found: [...s.found, word], note: `${word} is a bonus word.` };
      return { ...s, path: [], note: `${word} isn’t in today’s word list.` };
    }
    case 'hint': {
      if (s.hintsUsed >= FREE_HINTS) return { ...s, note: 'You’ve used today’s free hint.' };
      const w = p.targets.find((t) => !s.found.includes(t))!;
      return { ...s, hint: w, hintsUsed: s.hintsUsed + 1, note: `Hint: a ${w.length}-letter word starting with ${w[0]}.` };
    }
    case 'reveal':
      return { ...s, path: [], revealed: true, note: 'Here are the words.' };
  }
}

type Props = EngineViewProps<LetterSetPayload, LetterSetState, LetterSetAction>;

function View({ payload, state, dispatch }: Props) {
  const over = isOver(state, payload);
  const word = state.path.map((i) => payload.letters[i]).join('');
  const bonus = state.found.filter((w) => !payload.targets.includes(w));

  useTypingKeys(!over, (key) => {
    if (key === 'Enter') dispatch({ type: 'submit' });
    else if (key === 'Backspace') dispatch({ type: 'undo' });
    else if (key === 'Escape') dispatch({ type: 'clear' });
    else if (/^[a-z]$/i.test(key)) dispatch({ type: 'typed', letter: key });
    else return false;
    return true;
  });

  return (
    <div className="eng">
      <div className="ls-word" aria-label={word ? `Your word: ${word}` : 'Your word is empty'} role="status">
        {word || ' '}
      </div>

      {!over && (
        <>
          <div className="ls-circle" role="group" aria-label="Letters">
            {payload.letters.map((ch, i) => {
              const angle = (i / payload.letters.length) * Math.PI * 2 - Math.PI / 2;
              const used = state.path.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  className="ls-letter"
                  aria-pressed={used}
                  aria-label={`${ch}${used ? ', used' : ''}`}
                  style={{ left: `${50 + 38 * Math.cos(angle)}%`, top: `${50 + 38 * Math.sin(angle)}%` }}
                  onClick={() => dispatch({ type: 'tap', index: i })}
                  {...keepFocus}
                >
                  {ch}
                </button>
              );
            })}
          </div>
          <div className="ls-actions">
            <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'undo' })} disabled={!state.path.length}>Undo</button>
            <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'clear' })} disabled={!state.path.length}>Clear</button>
            <button type="button" className="btn" onClick={() => dispatch({ type: 'submit' })} disabled={!state.path.length}>Submit</button>
          </div>
        </>
      )}

      <ul className="ls-slots" aria-label="Words to find">
        {payload.targets.map((t) => {
          const got = state.found.includes(t);
          const text = got || state.revealed ? t : t === state.hint ? t[0] + '·'.repeat(t.length - 1) : '·'.repeat(t.length);
          return (
            <li key={t} className={got ? 'is-found' : state.revealed ? 'is-missed' : ''} aria-label={got ? `${t}, found` : state.revealed ? `${t}, not found` : `${t.length} letters, not found yet`}>
              {got ? '✓ ' : ''}{text}
            </li>
          );
        })}
        {bonus.length > 0 && <li className="is-bonus">+{bonus.length} bonus</li>}
      </ul>
    </div>
  );
}

export const letterSet: Engine<LetterSetPayload, LetterSetState, LetterSetAction> = {
  id: 'letter-set',
  needsDictionary: true,
  restartable: true,
  help:
    'Tap letters around the circle, or type them, then Submit or press Enter. Backspace removes the last letter. Other real words you find count as bonus words.',
  hint: true,
  revealable: true,
  init: () => ({ path: [], found: [], hint: null, hintsUsed: 0, revealed: false, note: '' }),
  reduce: (s, a, p, ctx) => reduce(s, a, p, ctx.dictionary),
  status(s, p) {
    const got = targetsFound(s, p);
    const solved = !s.revealed && got === p.targets.length;
    return {
      done: isOver(s, p),
      solved,
      score: `${got}/${p.targets.length}`,
      progress: `${got}/${p.targets.length}`,
      message: s.note,
    };
  },
  resultTitle: (s, p) => (targetsFound(s, p) === p.targets.length && !s.revealed ? `All ${p.targets.length} found.` : `${targetsFound(s, p)} of ${p.targets.length} found.`),
  shareLines: (s, p) => {
    const bonus = s.found.length - targetsFound(s, p);
    return [`${'🟧'.repeat(targetsFound(s, p))}${'⬜'.repeat(p.targets.length - targetsFound(s, p))}${bonus ? ` +${bonus} bonus` : ''}`];
  },
  View,
};
