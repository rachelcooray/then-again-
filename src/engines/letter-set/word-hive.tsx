import type { Engine, EngineViewProps } from '../types';
import { keepFocus, useTypingKeys } from '../useTypingKeys';
import '../engines.css';

export interface WordHivePayload {
  centre: string;
  ring: string[];
  /** Reviewed answer list; ranks and the goal count these. */
  words: string[];
  /** Words in the list that use all seven letters. */
  pangrams: string[];
  /** Words needed to count as solved. */
  goal: number;
  minLength: number;
  intro: string;
}

export interface WordHiveState {
  word: string;
  found: string[];
  bonus: string[];
  ring: string[];
  finished: boolean;
  note: string;
}

export type WordHiveAction =
  | { type: 'letter'; letter: string }
  | { type: 'delete' }
  | { type: 'shuffle' }
  | { type: 'enter' }
  | { type: 'finish' };

const RANKS: [number, string][] = [[0.7, 'Genius'], [0.45, 'Expert'], [0.25, 'Skilled'], [0.1, 'Good'], [0, 'Starter']];
export const rankOf = (found: number, total: number) => RANKS.find(([t]) => found / total >= t)![1];

const isOver = (s: WordHiveState, p: WordHivePayload) => s.finished || s.found.length === p.words.length;

/** Rules any accepted word must follow, list or dictionary. */
export function followsHiveRules(w: string, p: WordHivePayload): string | null {
  if (w.length < p.minLength) return `Too short. ${p.minLength} letters or more.`;
  if (!w.includes(p.centre)) return `Every word needs the centre ${p.centre}.`;
  const allowed = new Set([p.centre, ...p.ring]);
  if (![...w].every((ch) => allowed.has(ch))) return 'Only the letters in the hive.';
  return null;
}

function reduce(s: WordHiveState, a: WordHiveAction, p: WordHivePayload, dictionary?: ReadonlySet<string>): WordHiveState {
  if (isOver(s, p)) return s;
  switch (a.type) {
    case 'letter': {
      const ch = a.letter.toUpperCase();
      if (ch !== p.centre && !p.ring.includes(ch)) return { ...s, note: `${ch} isn’t in the hive.` };
      return { ...s, word: s.word + ch, note: '' };
    }
    case 'delete':
      return { ...s, word: s.word.slice(0, -1), note: '' };
    case 'shuffle': {
      const ring = s.ring.slice();
      ring.push(ring.shift()!);
      ring.reverse();
      return { ...s, ring, note: '' };
    }
    case 'finish':
      return { ...s, finished: true, word: '', note: '' };
    case 'enter': {
      const w = s.word;
      const broken = followsHiveRules(w, p);
      if (broken) return { ...s, word: '', note: broken };
      if (s.found.includes(w) || s.bonus.includes(w)) return { ...s, word: '', note: 'Already found.' };
      if (p.words.includes(w)) {
        const found = [...s.found, w];
        const note = p.pangrams.includes(w) ? `${w} uses every letter!` : `Nice: ${w}.`;
        return { ...s, word: '', found, note: found.length === p.words.length ? `${note} That’s every word.` : note };
      }
      if (dictionary?.has(w)) return { ...s, word: '', bonus: [...s.bonus, w], note: `${w} is a bonus word.` };
      return { ...s, word: '', note: 'Not in today’s word list.' };
    }
  }
}

type Props = EngineViewProps<WordHivePayload, WordHiveState, WordHiveAction>;

function View({ payload, state, dispatch }: Props) {
  const over = isOver(state, payload);
  const total = payload.words.length;

  useTypingKeys(!over, (key) => {
    if (key === 'Enter') dispatch({ type: 'enter' });
    else if (key === 'Backspace') dispatch({ type: 'delete' });
    else if (/^[a-z]$/i.test(key)) dispatch({ type: 'letter', letter: key });
    else return false;
    return true;
  });

  const letters = [payload.centre, ...state.ring];
  return (
    <div className="eng">
      <div className="wh-meter" role="img" aria-label={`${rankOf(state.found.length, total)}: ${state.found.length} of ${total} words, goal ${payload.goal}`}>
        <span className="kicker">{rankOf(state.found.length, total)}</span>
        <span className="wh-bar"><span style={{ width: `${Math.round((state.found.length / total) * 100)}%` }} /></span>
        <span className="mono small">{state.found.length}/{total}</span>
      </div>
      {!over && (
        <>
          <div className="ls-word" role="status" aria-label={state.word ? `Your word: ${state.word}` : 'Your word is empty'}>{state.word || ' '}</div>
          <div className="wh-hive" role="group" aria-label="Hive letters">
            {letters.map((ch, k) => {
              const angle = ((k - 1) / 6) * Math.PI * 2 - Math.PI / 2;
              const style = k === 0 ? { left: '50%', top: '50%' } : { left: `${50 + 33 * Math.cos(angle)}%`, top: `${50 + 33 * Math.sin(angle)}%` };
              return (
                <button key={`${ch}-${k}`} type="button" className={`wh-cell${k === 0 ? ' is-centre' : ''}`} style={style}
                  aria-label={k === 0 ? `${ch}, centre letter, needed in every word` : ch} {...keepFocus} onClick={() => dispatch({ type: 'letter', letter: ch })}>
                  {ch}
                </button>
              );
            })}
          </div>
          <div className="ls-actions">
            <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'delete' })} disabled={!state.word}>Delete</button>
            <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'shuffle' })}>Shuffle</button>
            <button type="button" className="btn" onClick={() => dispatch({ type: 'enter' })} disabled={!state.word}>Enter</button>
          </div>
          <button type="button" className="btn btn--outline btn--block" onClick={() => dispatch({ type: 'finish' })}>
            I’m finished ({state.found.length >= payload.goal ? 'goal reached' : `goal is ${payload.goal}`})
          </button>
        </>
      )}
      <ul className="ls-slots" aria-label="Words found">
        {state.found.map((w) => <li key={w} className={payload.pangrams.includes(w) ? 'is-bonus' : 'is-found'}>{w}</li>)}
        {state.bonus.length > 0 && <li className="is-bonus">+{state.bonus.length} bonus</li>}
      </ul>
    </div>
  );
}

export const wordHive: Engine<WordHivePayload, WordHiveState, WordHiveAction> = {
  id: 'letter-set',
  needsDictionary: true,
  restartable: false,
  help: 'Tap letters or type them, then Enter. Every word uses the centre letter, letters can repeat, and words need four letters or more. Reach the goal, then press I’m finished whenever you like.',
  init: (p) => ({ word: '', found: [], bonus: [], ring: p.ring.slice(), finished: false, note: '' }),
  reduce: (s, a, p, ctx) => reduce(s, a, p, ctx.dictionary),
  status(s, p) {
    return {
      done: isOver(s, p),
      solved: isOver(s, p) && s.found.length >= p.goal,
      score: `${s.found.length}/${p.words.length}`,
      progress: `${s.found.length}/${p.words.length}`,
      message: s.note,
    };
  },
  resultTitle: (s, p) => `${rankOf(s.found.length, p.words.length)}: ${s.found.length} words.`,
  shareLines: (s, p) => [`🐝 ${rankOf(s.found.length, p.words.length)}, ${s.found.length}/${p.words.length}${s.found.some((w) => p.pangrams.includes(w)) ? ' with the all-letter word' : ''}`],
  View,
};
