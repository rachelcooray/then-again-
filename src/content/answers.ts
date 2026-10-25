import type { Puzzle } from '../engines/types';

/** A short, readable account of a puzzle's answer and wording, for reviewers in the admin pages. */
export interface AnswerSummary {
  /** The answer, or what the player has to find. */
  answer: string;
  /** Text players read that a reviewer should check: clues and intros. */
  wording: string[];
}

type Any = Record<string, unknown>;
const list = (xs: unknown[] | undefined) => (xs ?? []).join(', ');

export function answerSummary(p: Puzzle): AnswerSummary {
  const x = p.payload as Any;
  const intro = typeof x.intro === 'string' && x.intro ? [x.intro] : [];
  switch (p.formatId) {
    case 'word-guess':
      return { answer: String(x.answer), wording: x.clue ? [`Clue: ${x.clue}`] : ['No clue (hard day)'] };
    case 'word-search':
      return { answer: list((x.words as { word: string }[]).map((w) => w.word)), wording: intro };
    case 'anagrams':
      return {
        answer: list((x.rounds as { answer: string }[]).map((r) => r.answer)),
        wording: [...intro, ...(x.rounds as { answer: string; clue: string }[]).filter((r) => r.clue).map((r) => `${r.answer}: ${r.clue}`)],
      };
    case 'circle-word':
      return { answer: list(x.targets as string[]), wording: intro };
    case 'word-hive':
      return { answer: `${(x.words as string[]).length} words; uses all seven: ${list(x.pangrams as string[])}`, wording: intro };
    case 'word-ladder':
      return { answer: (x.route as string[]).join(' → '), wording: intro };
    case 'bingo':
      return { answer: `${(x.card as string[]).length - 1} items on the card, ${(x.calls as string[]).length} calls`, wording: [list((x.card as string[]).filter((c) => c !== 'FREE'))] };
    case 'nonogram':
      return { answer: String(x.title), wording: intro };
    case 'logic-grid': {
      const rows = x.rows as string[];
      const cols = x.cols as string[];
      const answer = (x.answer as number[]).map((c, r) => `${rows[r]}: ${cols[c]}`).join(', ');
      return { answer, wording: [...intro, ...(x.clues as { text: string }[]).map((c) => c.text)] };
    }
    case 'sudoku':
    case 'mini-sudoku':
    case 'killer-sudoku':
    case 'futoshiki':
      return { answer: `${x.size}×${x.size}, one answer (checked by the solver)`, wording: [] };
    case 'kakuro':
      return { answer: `${x.cols}×${String(x.solution).length / Number(x.cols)}, one answer (checked by the solver)`, wording: intro };
    case 'minesweeper':
      return { answer: `${x.rows}×${x.cols}, ${(x.mines as number[]).length} mines, no guessing needed`, wording: intro };
    case 'sliding-tile':
      return { answer: `Solvable in ${x.par} moves`, wording: intro };
    default:
      return { answer: 'See the puzzle', wording: intro };
  }
}
