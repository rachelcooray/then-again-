import type { Engine, EngineViewProps } from '../types';
import { useRovingGrid } from '../useRovingGrid';
import { keepFocus, useTypingKeys } from '../useTypingKeys';
import { entries, type CrosswordPayload, type Entry } from './logic';
import '../letter-guess/letter-guess.css';
import '../engines.css';

export { entries, type CrosswordPayload } from './logic';

export interface CrosswordState {
  v: string[];
  sel: number;
  across: boolean;
  wrong: number[];
  hintsUsed: number;
  revealed: boolean;
  note: string;
}

export type CrosswordAction =
  | { type: 'select'; index: number }
  | { type: 'letter'; letter: string }
  | { type: 'delete' }
  | { type: 'direction' }
  | { type: 'check' }
  | { type: 'hint' }
  | { type: 'reveal' };

const FREE_HINTS = 1;
const isWhite = (p: CrosswordPayload, i: number) => p.solution[i] !== '#';
const isSolved = (s: CrosswordState, p: CrosswordPayload) => p.solution.split('').every((ch, i) => ch === '#' || s.v[i] === ch);

/** The entry the cursor is in, preferring the current direction. */
export function currentEntry(s: Pick<CrosswordState, 'sel' | 'across'>, p: CrosswordPayload): Entry | undefined {
  const all = entries(p).entries.filter((e) => e.cells.includes(s.sel));
  return all.find((e) => e.dir === (s.across ? 'across' : 'down')) ?? all[0];
}

function reduce(s: CrosswordState, a: CrosswordAction, p: CrosswordPayload): CrosswordState {
  if (s.revealed || isSolved(s, p)) return s;
  const entry = currentEntry(s, p);
  switch (a.type) {
    case 'select': {
      if (!isWhite(p, a.index)) return s;
      // Tapping the selected square again switches between across and down.
      const across = a.index === s.sel ? !s.across : s.across;
      const next = { ...s, sel: a.index, across, note: '' };
      const e = currentEntry(next, p);
      return { ...next, across: e ? e.dir === 'across' : across };
    }
    case 'direction': {
      const flipped = { ...s, across: !s.across };
      const e = currentEntry(flipped, p);
      return { ...s, across: e ? e.dir === 'across' : s.across, note: '' };
    }
    case 'letter': {
      const v = s.v.slice();
      v[s.sel] = a.letter.toUpperCase();
      const k = entry ? entry.cells.indexOf(s.sel) : -1;
      const sel = entry && k < entry.cells.length - 1 ? entry.cells[k + 1] : s.sel;
      const next = { ...s, v, sel, wrong: s.wrong.filter((w) => w !== s.sel), note: '' };
      return isSolved(next, p) ? { ...next, note: 'Solved! Every square is right.' } : next;
    }
    case 'delete': {
      const v = s.v.slice();
      const k = entry ? entry.cells.indexOf(s.sel) : -1;
      if (!v[s.sel] && (!entry || k <= 0)) return { ...s, note: 'Nothing to delete here.' };
      if (v[s.sel] || !entry || k <= 0) {
        v[s.sel] = '';
        return { ...s, v, note: '' };
      }
      const back = entry.cells[k - 1];
      v[back] = '';
      return { ...s, v, sel: back, note: '' };
    }
    case 'check': {
      const wrong = s.v.map((x, i) => (x && x !== p.solution[i] ? i : -1)).filter((i) => i >= 0);
      return { ...s, wrong, note: wrong.length ? `${wrong.length} ${wrong.length === 1 ? 'letter is' : 'letters are'} wrong. They’re underlined.` : 'So far, so good.' };
    }
    case 'hint': {
      if (s.hintsUsed >= FREE_HINTS) return { ...s, note: 'You’ve used today’s free hint.' };
      const target = s.v[s.sel] !== p.solution[s.sel] ? s.sel : p.solution.split('').findIndex((ch, i) => ch !== '#' && s.v[i] !== ch);
      const v = s.v.slice();
      v[target] = p.solution[target];
      const next = { ...s, v, sel: target, hintsUsed: s.hintsUsed + 1, wrong: s.wrong.filter((w) => w !== target), note: 'Hint: one letter filled in.' };
      return isSolved(next, p) ? { ...next, note: 'Solved! Every square is right.' } : next;
    }
    case 'reveal':
      return { ...s, v: p.solution.split('').map((ch) => (ch === '#' ? '' : ch)), revealed: true, wrong: [], note: 'Here is the finished grid.' };
  }
}

type Props = EngineViewProps<CrosswordPayload, CrosswordState, CrosswordAction>;

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM-'];

function View({ payload, state, dispatch }: Props) {
  const { cols } = payload;
  const { entries: all, numbers } = entries(payload);
  const over = state.revealed || isSolved(state, payload);
  const entry = currentEntry(state, payload);
  const grid = useRovingGrid(payload.solution.length, cols, state.sel);

  useTypingKeys(!over, (key) => {
    if (key === 'Backspace') dispatch({ type: 'delete' });
    else if (/^[a-z]$/i.test(key)) dispatch({ type: 'letter', letter: key });
    else return false;
    return true;
  });

  return (
    <div className="eng">
      {entry && !over && (
        <button type="button" className="cw-clue card--strong" onClick={() => dispatch({ type: 'direction' })} aria-label={`${entry.num} ${entry.dir}: ${entry.clue}. Switch direction`}>
          <span className="kicker">{entry.num} {entry.dir}</span>
          <span>{entry.clue}</span>
        </button>
      )}
      <div
        className="cw-grid"
        role="group"
        aria-label={`Crossword grid, ${cols} by ${payload.solution.length / cols}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onKeyDown={(e) => {
          const moved = grid.onKeyDown(e);
          if (moved !== null && isWhite(payload, moved)) dispatch({ type: 'select', index: moved });
        }}
      >
        {payload.solution.split('').map((ch, i) => {
          if (ch === '#') return <span key={i} className="cw-black" aria-hidden="true" />;
          const inWord = !!entry?.cells.includes(i);
          const wrong = state.wrong.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`cw-cell${state.sel === i && !over ? ' is-selected' : inWord && !over ? ' is-word' : ''}${wrong ? ' is-wrong' : ''}${over ? ' is-done' : ''}`}
              aria-label={`${numbers[i] ? `${numbers[i]}, ` : ''}row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}, ${state.v[i] || 'empty'}${wrong ? ', incorrect' : ''}`}
              aria-pressed={state.sel === i}
              disabled={over}
              onClick={() => dispatch({ type: 'select', index: i })}
              {...grid.cellProps(i)}
            >
              {numbers[i] && <span className="cw-num" aria-hidden="true">{numbers[i]}</span>}
              {state.v[i]}
            </button>
          );
        })}
      </div>

      {!over && (
        <>
          <div className="lg-keyboard" role="group" aria-label="Keyboard">
            {ROWS.map((row) => (
              <div key={row} className="lg-keys">
                {row.split('').map((k) =>
                  k === '-' ? (
                    <button key={k} type="button" className="lg-key lg-key--wide" aria-label="Delete" {...keepFocus} onClick={() => dispatch({ type: 'delete' })}>⌫</button>
                  ) : (
                    <button key={k} type="button" className="lg-key" {...keepFocus} onClick={() => dispatch({ type: 'letter', letter: k })}>{k}</button>
                  ),
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--outline btn--block" onClick={() => dispatch({ type: 'check' })}>Check letters</button>
        </>
      )}

      <div className="cw-list">
        {(['across', 'down'] as const).map((dir) => (
          <section key={dir}>
            <h3 className="kicker">{dir}</h3>
            <ol>
              {all.filter((e) => e.dir === dir).map((e) => (
                <li key={e.num} value={e.num}>{e.clue}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

export const crossword: Engine<CrosswordPayload, CrosswordState, CrosswordAction> = {
  id: 'crossword',
  restartable: true,
  help: 'Tap a square and type. Tap the same square again, or the clue bar, to switch between across and down. On a keyboard, move with the arrow keys, type letters and use Backspace. “Check letters” underlines any that are wrong.',
  hint: true,
  revealable: true,
  init: (p) => {
    const first = p.solution.split('').findIndex((ch) => ch !== '#');
    return { v: Array(p.solution.length).fill(''), sel: first, across: true, wrong: [], hintsUsed: 0, revealed: false, note: '' };
  },
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const solved = !s.revealed && isSolved(s, p);
    const left = p.solution.split('').filter((ch, i) => ch !== '#' && !s.v[i]).length;
    return { done: solved || s.revealed, solved, score: solved ? (s.hintsUsed ? 'Solved, 1 hint' : 'Solved') : 'Revealed', progress: `${left} LEFT`, message: s.note };
  },
  resultTitle: (s) => (s.revealed ? 'Not this time.' : 'Every square filled.'),
  shareLines: (s, p) => [!s.revealed && isSolved(s, p) ? `🟧 Solved${s.hintsUsed ? ' with a hint' : ''}` : '⬜ Not solved'],
  View,
};
