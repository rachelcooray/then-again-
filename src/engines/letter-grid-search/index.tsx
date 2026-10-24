import type { Engine, EngineViewProps } from '../types';
import { useRovingGrid } from '../useRovingGrid';
import '../engines.css';

export interface PlacedWord {
  word: string;
  /** Cell index of the first letter. */
  start: number;
  /** Cell index of the last letter. */
  end: number;
}

export interface WordSearchPayload {
  cols: number;
  /** Grid letters, row by row. */
  letters: string;
  words: PlacedWord[];
  intro: string;
}

export interface WordSearchState {
  found: string[];
  start: number | null;
  hinted: number | null;
  hintsUsed: number;
  revealed: boolean;
  note: string;
}

export type WordSearchAction = { type: 'tap'; index: number } | { type: 'hint' } | { type: 'reveal' };

/** Cells a placed word covers; null if the start and end aren't on one straight line. */
export function wordPath(w: PlacedWord, cols: number): number[] | null {
  const n = w.word.length;
  const [r0, c0, r1, c1] = [Math.floor(w.start / cols), w.start % cols, Math.floor(w.end / cols), w.end % cols];
  const dr = (r1 - r0) / (n - 1);
  const dc = (c1 - c0) / (n - 1);
  if (![dr, dc].every((d) => d === -1 || d === 0 || d === 1) || (dr === 0 && dc === 0)) return null;
  return Array.from({ length: n }, (_, k) => (r0 + dr * k) * cols + c0 + dc * k);
}

const FREE_HINTS = 1;

function reduce(s: WordSearchState, a: WordSearchAction, p: WordSearchPayload): WordSearchState {
  if (s.revealed || s.found.length === p.words.length) return s;
  if (a.type === 'reveal') return { ...s, revealed: true, start: null, note: 'Here are all the words.' };
  if (a.type === 'hint') {
    if (s.hintsUsed >= FREE_HINTS) return { ...s, note: 'You’ve used today’s free hint.' };
    const w = p.words.find((x) => !s.found.includes(x.word))!;
    return { ...s, hinted: w.start, hintsUsed: s.hintsUsed + 1, note: `Hint: ${w.word} starts at the outlined letter.` };
  }
  const i = a.index;
  if (s.start === null) return { ...s, start: i, note: 'Now tap the last letter.' };
  if (s.start === i) return { ...s, start: null, note: '' };
  const hit = p.words.find(
    (w) => !s.found.includes(w.word) && ((w.start === s.start && w.end === i) || (w.start === i && w.end === s.start)),
  );
  if (hit) {
    const found = [...s.found, hit.word];
    const left = p.words.length - found.length;
    return {
      ...s,
      found,
      start: null,
      hinted: s.hinted !== null && s.hinted === hit.start ? null : s.hinted,
      note: left ? `Found ${hit.word}. ${left} to go.` : `Found ${hit.word}. That’s all of them.`,
    };
  }
  return { ...s, start: null, note: 'That’s not one of the words. Try another first letter.' };
}

type Props = EngineViewProps<WordSearchPayload, WordSearchState, WordSearchAction>;

function View({ payload, state, dispatch }: Props) {
  const { cols, letters, words } = payload;
  const grid = useRovingGrid(letters.length, cols);
  const over = state.revealed || state.found.length === words.length;
  const foundCells = new Set<number>();
  const missedCells = new Set<number>();
  for (const w of words) {
    const cells = wordPath(w, cols) ?? [];
    if (state.found.includes(w.word)) cells.forEach((c) => foundCells.add(c));
    else if (state.revealed) cells.forEach((c) => missedCells.add(c));
  }

  return (
    <div className="eng">
      <div
        className="ws-grid"
        role="group"
        aria-label={`Letter grid, ${cols} by ${letters.length / cols}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onKeyDown={grid.onKeyDown}
      >
        {letters.split('').map((ch, i) => {
          const found = foundCells.has(i);
          const start = state.start === i;
          const states = [found && 'found', missedCells.has(i) && 'answer', start && 'selected', state.hinted === i && 'hint'].filter(Boolean);
          return (
            <button
              key={i}
              type="button"
              className={`ws-cell${found ? ' is-found' : ''}${start ? ' is-start' : ''}${missedCells.has(i) ? ' is-missed' : ''}${state.hinted === i ? ' is-hint' : ''}`}
              aria-label={`${ch}, row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}${states.length ? `, ${states.join(', ')}` : ''}`}
              aria-pressed={start}
              disabled={over}
              onClick={() => dispatch({ type: 'tap', index: i })}
              {...grid.cellProps(i)}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <ul className="ws-words" aria-label="Words to find">
        {words.map((w) => {
          const got = state.found.includes(w.word);
          return (
            <li key={w.word} className={got ? 'is-found' : state.revealed ? 'is-missed' : ''}>
              {got ? '✓ ' : ''}
              {w.word}
              <span className="visually-hidden">{got ? ', found' : state.revealed ? ', not found' : ', not found yet'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const letterGridSearch: Engine<WordSearchPayload, WordSearchState, WordSearchAction> = {
  id: 'letter-grid-search',
  restartable: true,
  hint: true,
  revealable: true,
  init: () => ({ found: [], start: null, hinted: null, hintsUsed: 0, revealed: false, note: '' }),
  reduce: (s, a, p) => reduce(s, a, p),
  status(s, p) {
    const total = p.words.length;
    const solved = s.found.length === total;
    return {
      done: solved || s.revealed,
      solved,
      score: `${s.found.length}/${total}`,
      progress: `${s.found.length}/${total}`,
      message: s.note,
    };
  },
  resultTitle: (s, p) => (s.found.length === p.words.length ? `All ${p.words.length} found.` : `${s.found.length} of ${p.words.length} found.`),
  shareLines: (s, p) => [`${'🟩'.repeat(s.found.length)}${'⬜'.repeat(p.words.length - s.found.length)}`],
  View,
};
