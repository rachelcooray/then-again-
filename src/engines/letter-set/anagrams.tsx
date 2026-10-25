import type { Engine, EngineViewProps } from '../types';
import { keepFocus, useTypingKeys } from '../useTypingKeys';
import '../engines.css';

export interface AnagramRound {
  letters: string;
  answer: string;
  clue: string;
}

export interface AnagramsPayload {
  rounds: AnagramRound[];
  /** Rounds needed to count as solved. */
  goal: number;
  intro: string;
}

export interface AnagramsState {
  round: number;
  used: number[];
  results: boolean[];
  hinted: boolean;
  hintsUsed: number;
  note: string;
}

export type AnagramsAction =
  | { type: 'tap'; index: number }
  | { type: 'typed'; letter: string }
  | { type: 'undo' }
  | { type: 'clear' }
  | { type: 'submit' }
  | { type: 'skip' }
  | { type: 'hint' };

const FREE_HINTS = 1;
const isOver = (s: AnagramsState, p: AnagramsPayload) => s.round >= p.rounds.length;
const right = (s: AnagramsState) => s.results.filter(Boolean).length;

function reduce(s: AnagramsState, a: AnagramsAction, p: AnagramsPayload): AnagramsState {
  if (isOver(s, p)) return s;
  const cur = p.rounds[s.round];
  const word = s.used.map((k) => cur.letters[k]).join('');
  const advance = (got: boolean, note: string): AnagramsState => ({ ...s, round: s.round + 1, used: [], results: [...s.results, got], hinted: false, note });
  switch (a.type) {
    case 'tap':
      return s.used.includes(a.index) ? s : { ...s, used: [...s.used, a.index], note: '' };
    case 'typed': {
      const k = cur.letters.split('').findIndex((ch, i) => ch === a.letter.toUpperCase() && !s.used.includes(i));
      return k < 0 ? { ...s, note: `No ${a.letter.toUpperCase()} left to use.` } : { ...s, used: [...s.used, k], note: '' };
    }
    case 'undo':
      return { ...s, used: s.used.slice(0, -1), note: '' };
    case 'clear':
      return { ...s, used: [], note: '' };
    case 'submit':
      if (word.length < cur.answer.length) return { ...s, note: `Use all ${cur.answer.length} letters.` };
      return word === cur.answer ? advance(true, `✓ ${cur.answer}!`) : { ...s, used: [], note: 'Not quite. Try another order.' };
    case 'skip':
      return advance(false, `It was ${cur.answer}.`);
    case 'hint':
      if (s.hintsUsed >= FREE_HINTS) return { ...s, note: 'You’ve used today’s free hint.' };
      return { ...s, hinted: true, hintsUsed: s.hintsUsed + 1, note: `Hint: it starts with ${cur.answer[0]}.` };
  }
}

type Props = EngineViewProps<AnagramsPayload, AnagramsState, AnagramsAction>;

function View({ payload, state, dispatch }: Props) {
  const over = isOver(state, payload);
  const cur = payload.rounds[Math.min(state.round, payload.rounds.length - 1)];
  const word = state.used.map((k) => cur.letters[k]).join('');

  useTypingKeys(!over, (key) => {
    if (key === 'Enter') dispatch({ type: 'submit' });
    else if (key === 'Backspace') dispatch({ type: 'undo' });
    else if (/^[a-z]$/i.test(key)) dispatch({ type: 'typed', letter: key });
    else return false;
    return true;
  });

  if (over) {
    return (
      <ul className="an-results" aria-label="Your answers">
        {payload.rounds.map((r, i) => (
          <li key={r.answer} className={state.results[i] ? 'is-right' : 'is-missed'}>{state.results[i] ? '✓' : '×'} {r.answer}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="eng">
      <div className="lg-clue">
        <span className="kicker">{cur.clue ? 'Clue' : 'Word'} {state.round + 1}/{payload.rounds.length}</span>
        {cur.clue && <span>{cur.clue}</span>}
      </div>
      <div className="ls-word" role="status" aria-label={word ? `Your word: ${word}` : 'Your word is empty'}>
        {word || ' '}
      </div>
      <div className="an-tiles" role="group" aria-label="Letters">
        {cur.letters.split('').map((ch, k) => {
          const used = state.used.includes(k);
          return (
            <button key={k} type="button" className="an-tile" aria-pressed={used} aria-label={`${ch}${used ? ', used' : ''}`} {...keepFocus} onClick={() => dispatch({ type: 'tap', index: k })}>
              {ch}
            </button>
          );
        })}
      </div>
      <div className="ls-actions">
        <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'clear' })} disabled={!state.used.length}>Clear</button>
        <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'skip' })}>Skip</button>
        <button type="button" className="btn" onClick={() => dispatch({ type: 'submit' })} disabled={!state.used.length}>Submit</button>
      </div>
    </div>
  );
}

export const anagrams: Engine<AnagramsPayload, AnagramsState, AnagramsAction> = {
  id: 'letter-set',
  restartable: false,
  help: 'Tap the letters in order, or type them, then Submit or press Enter. Backspace removes the last letter. Skip moves on and counts that one as missed.',
  hint: true,
  init: () => ({ round: 0, used: [], results: [], hinted: false, hintsUsed: 0, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const done = isOver(s, p);
    return {
      done,
      solved: done && right(s) >= p.goal,
      score: `${right(s)}/${p.rounds.length}`,
      progress: `${Math.min(s.round + 1, p.rounds.length)}/${p.rounds.length}`,
      message: s.note,
    };
  },
  resultTitle: (s, p) => (right(s) === p.rounds.length ? 'All unscrambled.' : `${right(s)} of ${p.rounds.length} unscrambled.`),
  shareLines: (s) => [s.results.map((r) => (r ? '🟧' : '⬜')).join('')],
  View,
};
