import type { CardPayload } from '../engines/card';
import type { GroupingPayload } from '../engines/grouping';
import type { WordSearchPayload } from '../engines/letter-grid-search';
import type { LetterGuessPayload } from '../engines/letter-guess/logic';
import type { LetterSetPayload } from '../engines/letter-set';
import type { LogicGridPayload } from '../engines/logic-grid';
import type { NumberGridPayload } from '../engines/number-grid';
import type { Puzzle } from '../engines/types';
import type { DateKey } from '../lib/date';

/**
 * Phase 2 puzzle bank: the "School days" puzzles from the design canvas, one per format.
 * Until the content pipeline (phase 3) publishes a puzzle per format per day, every date
 * plays these.
 */

const wordGuess: Puzzle<LetterGuessPayload> = {
  id: 'wg-school-chalk',
  formatId: 'word-guess',
  memory: { text: 'Every classroom had a blackboard, a box of chalk and a duster that sent up a little cloud.' },
  payload: { answer: 'CHALK', clue: 'It squeaked on the board and left dust on the teacher’s sleeve.' },
};

const wordSearch: Puzzle<WordSearchPayload> = {
  id: 'ws-school-day',
  formatId: 'word-search',
  memory: {
    title: 'Ink on your fingers again.',
    text: 'The inkwell sat in a hole in the desk lid, and a spare nib was worth more than gold.',
  },
  payload: {
    cols: 8,
    letters: 'RRHSSOLRUOTBTEWELJRSHLDJEWYCDPEBRFTNKMSEJAPNUCKLSINKWELLEMARBLES',
    words: [
      { word: 'RULER', start: 0, end: 32 },
      { word: 'SATCHEL', start: 48, end: 6 },
      { word: 'INKWELL', start: 49, end: 55 },
      { word: 'MARBLES', start: 57, end: 63 },
      { word: 'DESK', start: 22, end: 46 },
      { word: 'BELL', start: 31, end: 55 },
    ],
    intro: 'Six things from the school day.',
  },
};

const sudoku: Puzzle<NumberGridPayload> = {
  id: 'su-school-1',
  formatId: 'sudoku',
  memory: {
    title: 'Every number in its place.',
    text: 'Times tables were chanted out loud, row by row, until the whole class could say them in their sleep.',
  },
  payload: {
    size: 9,
    boxRows: 3,
    boxCols: 3,
    givens: '067213004900056000002000006380047652009000000005108497700021030800400201210389005',
    solution: '567213984948756123132894576381947652479562318625138497754621839893475261216389745',
  },
};

const rewind: Puzzle<GroupingPayload> = {
  id: 'rw-school-day',
  formatId: 'rewind',
  memory: {
    title: 'Break time had its own seasons.',
    text: 'Suddenly everyone played marbles, then nobody did, and the skipping rhymes went round again.',
  },
  payload: {
    groups: [
      { name: 'In the pencil case', items: ['Fountain pen', 'Ink cartridges', 'Rubber eraser', 'Pencil sharpener'] },
      { name: 'On the classroom wall', items: ['Times tables chart', 'World map', 'Alphabet frieze', 'Class timetable'] },
      { name: 'Playground games', items: ['Skipping rope', 'Marbles', 'Hopscotch', 'Jacks'] },
      { name: 'On the teacher’s desk', items: ['The register', 'Chalk', 'Board duster', 'Red pen'] },
    ],
    order: ['Marbles', 'The register', 'World map', 'Fountain pen', 'Jacks', 'Chalk', 'Pencil sharpener', 'Class timetable', 'Skipping rope', 'Ink cartridges', 'Red pen', 'Alphabet frieze', 'Board duster', 'Hopscotch', 'Times tables chart', 'Rubber eraser'],
    intro: 'Sixteen things from the school day hide four groups.',
  },
};

const circleWord: Puzzle<LetterSetPayload> = {
  id: 'cw-pencils',
  formatId: 'circle-word',
  memory: {
    title: 'Sharpened to a point.',
    text: 'A new pencil case at the start of term meant every pencil was the same length, for about a day.',
  },
  payload: {
    letters: ['P', 'E', 'N', 'C', 'I', 'L', 'S'],
    targets: ['PENCILS', 'PENCIL', 'SPINE', 'SLICE', 'CLIPS', 'LINES', 'PILES', 'SNIP'],
    minLength: 4,
    intro: 'Find eight words, including the one that uses every letter.',
  },
};

const bingo: Puzzle<CardPayload> = {
  id: 'bn-everyday-1',
  formatId: 'bingo',
  memory: {
    title: 'Eyes down.',
    text: 'Half the things on this card lived in one kitchen drawer, along with string, a torch and a spare key.',
  },
  payload: {
    card: ['Kettle', 'Radio', 'Satchel', 'Marbles', 'Postcard', 'Chalk', 'Teapot', 'Bicycle', 'Atlas', 'Inkwell', 'Piggy bank', 'Toaster', 'FREE', 'Telephone', 'Cassette', 'Jigsaw', 'Stamp', 'Kite', 'Ruler', 'Biscuit tin', 'Umbrella', 'Camera', 'Wristwatch', 'Flask', 'Diary'],
    calls: ['Teapot', 'Typewriter', 'Atlas', 'Kite', 'Radio', 'Candle', 'Telephone', 'Ruler', 'Bicycle', 'Scarf', 'Inkwell', 'Diary', 'Toaster', 'Camera', 'Thimble', 'Satchel', 'Jigsaw', 'Cassette', 'Lantern', 'Stamp', 'Kettle', 'Postcard', 'Doorbell', 'Flask', 'Marbles', 'Wristwatch', 'Umbrella', 'Chalk', 'Biscuit tin', 'Piggy bank'],
    maxCalls: 24,
    intro: 'Tap a square once it’s been called. Complete any row, column or diagonal within 24 calls.',
  },
};

const logic: Puzzle<LogicGridPayload> = {
  id: 'lg-tea-shop',
  formatId: 'logic-grid',
  memory: {
    title: 'Tea for four.',
    text: 'The tea shop on the high street did a pot for two, a round of toast and a slice of whatever was in the glass case.',
  },
  payload: {
    rows: ['Ada', 'Ben', 'Cy', 'Di'],
    cols: ['Toast', 'Scone', 'Bun', 'Tart'],
    clues: [
      { text: 'Cy had the toast.', row: 2, cols: [0] },
      { text: 'Ada had neither the toast nor the tart.', row: 0, cols: [0, 3], negate: true },
      { text: 'Ben had either the tart or the bun.', row: 1, cols: [3, 2] },
      { text: 'Di didn’t have the scone or the tart.', row: 3, cols: [1, 3], negate: true },
    ],
    answer: [1, 3, 0, 2],
    intro: 'Four friends each chose a different treat at the tea shop. Work out who had what.',
  },
};

export const PUZZLES: Puzzle[] = [wordGuess, wordSearch, sudoku, rewind, circleWord, bingo, logic] as Puzzle[];

/** The puzzle a format plays on a date. */
export function getPuzzle(_date: DateKey, formatId: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.formatId === formatId);
}
