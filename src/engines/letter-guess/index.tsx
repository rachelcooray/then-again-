import type { Engine, EngineViewProps } from '../types';
import { keepFocus, useTypingKeys } from '../useTypingKeys';
import {
  init,
  isOver,
  keyMarks,
  maxGuesses,
  reduce,
  scoreGuess,
  type LetterGuessAction,
  type LetterGuessPayload,
  type LetterGuessState,
  type Mark,
} from './logic';
import './letter-guess.css';

const MARK_WORDS: Record<Mark, string> = {
  correct: 'right place',
  present: 'in the word, wrong place',
  absent: 'not in the word',
};

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', '+ZXCVBNM-'];

type Props = EngineViewProps<LetterGuessPayload, LetterGuessState, LetterGuessAction>;

function View({ payload, state, dispatch }: Props) {
  const over = isOver(state, payload);
  const len = payload.answer.length;
  const marks = keyMarks(state.guesses, payload.answer);

  useTypingKeys(!over, (key) => {
    if (key === 'Enter') dispatch({ type: 'enter' });
    else if (key === 'Backspace') dispatch({ type: 'delete' });
    else if (/^[a-z]$/i.test(key)) dispatch({ type: 'letter', letter: key });
    else return false;
    return true;
  });

  const rows = Array.from({ length: maxGuesses(payload) }, (_, r) => {
    const guess = state.guesses[r];
    if (guess) {
      const sc = scoreGuess(guess, payload.answer);
      return guess.split('').map((ch, i) => ({ ch, mark: sc[i] as Mark | undefined }));
    }
    const live = r === state.guesses.length && !over ? state.typed : '';
    return Array.from({ length: len }, (_, i) => ({ ch: live[i] ?? '', mark: undefined }));
  });

  return (
    <div className="lg">
      <div className="lg-clue">
        <span className="kicker">Clue</span>
        <span>{payload.clue}</span>
      </div>

      <div className="lg-board" role="group" aria-label="Your guesses">
        {rows.map((cells, r) => (
          <div key={r} className="lg-row" role="group" aria-label={`Guess ${r + 1}`}>
            {cells.map((c, i) => (
              <span
                key={i}
                className={`lg-tile${c.mark ? ` lg-tile--${c.mark}` : c.ch ? ' lg-tile--typed' : ''}`}
                role="img"
                aria-label={c.ch ? `${c.ch}${c.mark ? `, ${MARK_WORDS[c.mark]}` : ''}` : 'empty'}
              >
                {c.ch}
              </span>
            ))}
          </div>
        ))}
      </div>

      {!over && (
        <div className="lg-keyboard" role="group" aria-label="Keyboard">
          {ROWS.map((row) => (
            <div key={row} className="lg-keys">
              {row.split('').map((k) => {
                if (k === '+')
                  return <button key={k} type="button" className="lg-key lg-key--wide" {...keepFocus} onClick={() => dispatch({ type: 'enter' })}>Enter</button>;
                if (k === '-')
                  return <button key={k} type="button" className="lg-key lg-key--wide" aria-label="Delete" onClick={() => dispatch({ type: 'delete' })}>⌫</button>;
                const m = marks[k];
                return (
                  <button
                    key={k}
                    type="button"
                    className={`lg-key${m ? ` lg-key--${m}` : ''}`}
                    {...keepFocus}
                    aria-label={m ? `${k}, ${MARK_WORDS[m]}` : k}
                    onClick={() => dispatch({ type: 'letter', letter: k })}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="lg-legend" aria-hidden="true">
            <span><span className="lg-swatch lg-tile--correct" />right place</span>
            <span><span className="lg-swatch lg-tile--present" />in the word</span>
            <span><span className="lg-swatch lg-tile--absent" />not in it</span>
          </div>
        </div>
      )}
    </div>
  );
}

const SYMBOL: Record<Mark, string> = { correct: '🟦', present: '🟩', absent: '⬜' };

export const letterGuess: Engine<LetterGuessPayload, LetterGuessState, LetterGuessAction> = {
  id: 'letter-guess',
  needsDictionary: true,
  restartable: false,
  help:
    'Type on your keyboard or tap the letters, then Enter. A blue tile with a line is in the right place; a green tile with a dot is in the word but somewhere else; grey letters aren’t in it.',
  init,
  reduce: (s, a, p, ctx) => reduce(s, a, p, ctx.dictionary),
  status(s, p) {
    const won = s.guesses.includes(p.answer);
    const max = maxGuesses(p);
    const done = isOver(s, p);
    let message = s.note;
    if (!message && done) message = won ? `Solved in ${s.guesses.length}.` : `The word was ${p.answer}.`;
    if (!message && s.guesses.length) {
      const left = max - s.guesses.length;
      message = `${left} ${left === 1 ? 'guess' : 'guesses'} left.`;
    }
    return {
      done,
      solved: won,
      score: won ? `${s.guesses.length}/${max}` : `X/${max}`,
      progress: `${Math.min(s.guesses.length + (done ? 0 : 1), max)}/${max}`,
      message,
    };
  },
  resultTitle: (s, p) => (s.guesses.includes(p.answer) ? `Solved in ${s.guesses.length}!` : 'So close.'),
  shareLines: (s, p) => s.guesses.map((g) => scoreGuess(g, p.answer).map((m) => SYMBOL[m]).join('')),
  View,
};
