import { countSolutions } from '../../src/engines/number-grid/solver';
import { earliestLine, type CardPayload } from '../../src/engines/card/logic';
import { solvableWithoutGuessing, type HiddenCellsPayload } from '../../src/engines/hidden-cells/logic';
import { wordPath, type WordSearchPayload } from '../../src/engines/letter-grid-search/logic';
import { solveLogicGrid, type LogicGridPayload } from '../../src/engines/logic-grid/logic';
import type { NumberGridPayload } from '../../src/engines/number-grid';
import { countNonogramSolutions, type PictureLogicPayload } from '../../src/engines/picture-logic/logic';
import { countKakuroSolutions, type SumGridPayload } from '../../src/engines/sum-grid/logic';
import { fewestMoves, type TileSlidePayload } from '../../src/engines/tile-slide/logic';
import type { WordChainPayload } from '../../src/engines/word-chain/logic';
import type { Draft } from './generators/types';
import { blockedWordsIn, hiddenWordsInGrid, personalInfoIn } from './safety';
import { accepted } from './words';

/**
 * The safety and quality gate (section 6). Every generated puzzle passes through it before it
 * can be scheduled. Failing any check rejects the puzzle; passing everything gives it a status:
 * `approved` when it is made only from dictionary words and solver-checked numbers, or
 * `needs-review` when it carries text a person wrote and nobody has checked yet.
 */
export type Status = 'approved' | 'needs-review' | 'rejected';

export interface GateResult {
  status: Status;
  checks: { name: string; passed: boolean; detail?: string }[];
}

/** Every string a player might see; field names in the payload aren't shown to anyone. */
function visibleStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(visibleStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(visibleStrings);
  return [];
}

/** Re-solves the puzzle independently of the generator: one answer, and it matches. */
function solverCheck(d: Draft): string | null {
  const p = d.payload as never;
  switch (d.formatId) {
    case 'sudoku':
    case 'mini-sudoku':
    case 'killer-sudoku':
    case 'futoshiki': {
      const g = p as NumberGridPayload;
      const n = countSolutions(g.givens.split('').map(Number), g);
      return n === 1 ? null : `${n} solutions`;
    }
    case 'kakuro':
      return countKakuroSolutions(p as SumGridPayload) === 1 ? null : 'not one solution';
    case 'nonogram':
      return countNonogramSolutions(p as PictureLogicPayload) === 1 ? null : 'not one solution';
    case 'logic-grid':
      return solveLogicGrid(p as LogicGridPayload).length === 1 ? null : 'not one solution';
    case 'minesweeper':
      return solvableWithoutGuessing(p as HiddenCellsPayload) ? null : 'needs a guess';
    case 'sliding-tile': {
      const t = p as TileSlidePayload;
      return fewestMoves(t.start, t.size) === t.par ? null : 'par is wrong';
    }
    case 'word-ladder': {
      const w = p as WordChainPayload;
      const steps = w.route.slice(1).every((x, i) => accepted.has(x) && [...x].filter((ch, k) => ch !== w.route[i][k]).length === 1);
      return steps && w.route.length === w.par + 1 && w.route[0] === w.start && w.route.at(-1) === w.end ? null : 'route is wrong';
    }
    case 'word-search': {
      const s = p as WordSearchPayload;
      const ok = s.words.every((w) => {
        const path = wordPath(w, s.cols);
        return path && path.map((i) => s.letters[i]).join('') === w.word;
      });
      return ok ? null : 'a word is misplaced';
    }
    case 'bingo': {
      const b = p as CardPayload;
      return earliestLine(b) <= b.maxCalls ? null : 'no line within the calls';
    }
    default:
      return null;
  }
}

export function gate(d: Draft): GateResult {
  const checks: GateResult['checks'] = [];
  const add = (name: string, problem: string | null | undefined) => checks.push({ name, passed: !problem, detail: problem || undefined });

  const strings = [...visibleStrings(d.payload), d.memory?.text ?? ''];
  const blocked = blockedWordsIn(strings.join(' '));
  add('blocked words', blocked.length ? blocked.join(', ') : null);
  // Grids are long runs of digits, which read like phone numbers; only sentences can carry contact details.
  const info = personalInfoIn(strings.filter((t) => /\s/.test(t) && /[a-z]/.test(t)).join('\n'));
  add('links, emails and phone numbers', info.length ? info.join(', ') : null);
  if (d.formatId === 'word-search') {
    const s = d.payload as WordSearchPayload;
    const hidden = hiddenWordsInGrid(s.letters, s.cols);
    add('words hidden by accident', hidden.length ? hidden.join(', ') : null);
  }
  add('one answer', solverCheck(d));

  const status: Status = checks.every((c) => c.passed) ? (d.needsReview ? 'needs-review' : 'approved') : 'rejected';
  return { status, checks };
}
