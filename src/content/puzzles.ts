import type { CardPayload } from '../engines/card/logic';
import type { CrosswordPayload } from '../engines/crossword/logic';
import type { HiddenCellsPayload } from '../engines/hidden-cells/logic';
import type { AnagramsPayload } from '../engines/letter-set/anagrams';
import type { WordHivePayload } from '../engines/letter-set/word-hive';
import type { PictureLogicPayload } from '../engines/picture-logic/logic';
import type { HigherLowerPayload, MysteryPayload, OrderPayload, QuizPayload } from '../engines/quiz';
import type { SumGridPayload } from '../engines/sum-grid/logic';
import type { TileSlidePayload } from '../engines/tile-slide/logic';
import type { WordChainPayload } from '../engines/word-chain/logic';

import type { GroupingPayload } from '../engines/grouping';
import type { WordSearchPayload } from '../engines/letter-grid-search';
import type { LetterGuessPayload } from '../engines/letter-guess/logic';
import type { LetterSetPayload } from '../engines/letter-set';
import type { LogicGridPayload } from '../engines/logic-grid';
import type { NumberGridPayload } from '../engines/number-grid';
import type { Puzzle } from '../engines/types';
import type { DateKey } from '../lib/date';

/**
 * Bundled puzzle bank: the puzzles from the design canvas, one per format.
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
    text: 'Times tables were chanted out loud, row by row, until the whole class could say them in their sleep.', draft: true,
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
    text: 'A new pencil case at the start of term meant every pencil was the same length, for about a day.', draft: true,
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
    text: 'Half the things on this card lived in one kitchen drawer, along with string, a torch and a spare key.', draft: true,
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
    text: 'The tea shop on the high street did a pot for two, a round of toast and a slice of whatever was in the glass case.', draft: true,
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


const miniSudoku: Puzzle<NumberGridPayload> = {
  id: 'ms-4x4-1',
  formatId: 'mini-sudoku',
  memory: { title: 'Solved. Ready for the big one?', text: 'Number puzzles in the back of the paper were a tea-break ritual long before anyone carried one in their pocket.', draft: true },
  payload: { size: 4, boxRows: 2, boxCols: 2, givens: '1004041020030320', solution: '1234341221434321' },
};

const killerSudoku: Puzzle<NumberGridPayload> = {
  id: 'ks-4x4-1',
  formatId: 'killer-sudoku',
  memory: { title: 'Every cage adds up.', text: 'Mental arithmetic tests came round every Friday, and the quickest hand up got a gold star.', draft: true },
  payload: {
    size: 4,
    boxRows: 2,
    boxCols: 2,
    givens: '0000000000000000',
    solution: '1234341221434321',
    cages: [
      { cells: [0, 1], sum: 3 },
      { cells: [2, 3, 7], sum: 9 },
      { cells: [4, 8], sum: 5 },
      { cells: [5, 6], sum: 5 },
      { cells: [9, 13], sum: 4 },
      { cells: [10, 14, 15], sum: 7 },
      { cells: [11], sum: 3 },
      { cells: [12], sum: 4 },
    ],
  },
};

const kakuro: Puzzle<SumGridPayload> = {
  id: 'kk-3x3-1',
  formatId: 'kakuro',
  memory: { title: 'All the sums add up.', text: 'Long before calculators, shop assistants added up a basket of shopping in their heads, or on the back of a paper bag.', draft: true },
  payload: { cols: 4, solution: '#####721#813#947', intro: 'A small grid of sums to start.' },
};

const futoshiki: Puzzle<NumberGridPayload> = {
  id: 'fu-4x4-1',
  formatId: 'futoshiki',
  memory: { title: 'Every sign holds true.', text: 'Greater-than and less-than signs were drawn as a crocodile’s mouth in many classrooms, always ready to eat the bigger number.', draft: true },
  payload: {
    size: 4,
    boxRows: 0,
    boxCols: 0,
    givens: '1000000000000000',
    solution: '1342421334212134',
    less: [[10, 14], [5, 1], [13, 12], [10, 9], [8, 9], [14, 15], [0, 1], [0, 4], [8, 4], [13, 14], [5, 4], [5, 9], [13, 9], [11, 7]],
  },
};

const nonogram: Puzzle<PictureLogicPayload> = {
  id: 'ng-heart',
  formatId: 'nonogram',
  memory: { title: 'Picture revealed.', text: 'A heart, carved into a school desk, next to two sets of initials and a date nobody remembers.' },
  payload: { cols: 5, solution: '0101011111111110111000100', title: 'A heart', intro: 'A small picture from the school day.' },
};

const minesweeper: Puzzle<HiddenCellsPayload> = {
  id: 'mn-6x6-1',
  formatId: 'minesweeper',
  memory: { title: 'Field cleared. Not a single mine touched.', text: 'Plenty of office computers came with a little minefield game, and plenty of lunch breaks disappeared into it.', draft: true },
  payload: { rows: 6, cols: 6, mines: [5, 11, 21, 28, 30, 34], start: 32, intro: 'Six hidden mines. Some safe squares are already open.' },
};

const slidingTile: Puzzle<TileSlidePayload> = {
  id: 'st-3x3-1',
  formatId: 'sliding-tile',
  memory: { title: 'Back in order.', text: 'Plastic sliding puzzles turned up in Christmas crackers and party bags, and somehow never stayed solved for long.', draft: true },
  payload: { size: 3, start: [1, 2, 3, 4, 8, 5, 7, 6, 0], par: 4, intro: 'The gap belongs in the bottom-right corner.' },
};

const miniCrossword: Puzzle<CrosswordPayload> = {
  id: 'cw-word-square-1',
  formatId: 'mini-crossword',
  memory: { title: 'It reads the same both ways.', text: 'A word square like this one reads the same across and down. Puzzle setters have been making them for well over a century.', draft: true },
  payload: {
    cols: 4,
    solution: 'BALLAREALENDLADY',
    across: { 1: 'Kicked round the playground', 5: 'Length times width gives you this', 6: 'Let a friend borrow it', 7: 'A polite word for a woman' },
    down: { 1: 'Kicked round the playground', 2: 'Length times width gives you this', 3: 'Let a friend borrow it', 4: 'A polite word for a woman' },
    intro: 'This one reads the same across and down.',
  },
};

const wordLadder: Puzzle<WordChainPayload> = {
  id: 'wl-cold-warm',
  formatId: 'word-ladder',
  memory: { title: 'From cold to warm.', text: 'Hot water bottles, a coal fire and frost on the inside of the bedroom window: winter mornings used to start cold.', draft: true },
  payload: { start: 'COLD', end: 'WARM', par: 4, route: ['COLD', 'CORD', 'CARD', 'WARD', 'WARM'], intro: 'Turn COLD into WARM.' },
};

const anagrams: Puzzle<AnagramsPayload> = {
  id: 'an-home-1',
  formatId: 'anagrams',
  memory: { title: 'Five things from home.', text: 'Radio, kettle, bicycle, teapot, compass: things most homes had, and most still do.', draft: true },
  payload: {
    rounds: [
      { letters: 'OIDRA', answer: 'RADIO', clue: 'It played in the kitchen.' },
      { letters: 'TLEKET', answer: 'KETTLE', clue: 'It whistled on the stove.' },
      { letters: 'CLEBYCI', answer: 'BICYCLE', clue: 'It had a bell and a pump.' },
      { letters: 'POETTA', answer: 'TEAPOT', clue: 'It wore a knitted cosy.' },
      { letters: 'SPOCSAM', answer: 'COMPASS', clue: 'It always pointed north.' },
    ],
    goal: 3,
    intro: 'Unscramble five things you might find at home.',
  },
};

const wordHive: Puzzle<WordHivePayload> = {
  id: 'wh-teacups',
  formatId: 'word-hive',
  memory: { title: 'Time for a cuppa.', text: 'The good teacups came out for visitors, and went straight back in the cabinet afterwards.', draft: true },
  payload: {
    centre: 'A',
    ring: ['T', 'E', 'C', 'U', 'P', 'S'],
    words: ['TEACUP', 'TEACUPS', 'CAPE', 'CAPES', 'PACE', 'PACES', 'SPACE', 'PACT', 'PACTS', 'CAST', 'CATS', 'SCAT', 'ACTS', 'CASE', 'CAUSE', 'SAUCE', 'PASTE', 'PATE', 'PEAT', 'TAPE', 'TAPES', 'SEAT', 'EAST', 'EATS', 'SATE', 'TEAS', 'CAPS', 'PATS', 'PAST', 'SPAT', 'TAPS', 'SPATE', 'CASTE', 'APSE', 'PEAS', 'APES', 'CAUSES'],
    pangrams: ['TEACUPS'],
    goal: 10,
    minLength: 4,
    intro: 'Letters can repeat, and one word uses all seven.',
  },
};

const theQuiz: Puzzle<QuizPayload> = {
  id: 'qz-general-1',
  formatId: 'quiz',
  memory: { title: 'Five questions done.', text: 'Quiz night at the local was where a head full of odd facts finally came in handy.', draft: true },
  payload: {
    questions: [
      { q: 'How many keys does a standard modern piano have?', options: ['76', '88', '92', '100'], answer: 1, fact: '52 white keys and 36 black ones.', source: 'NEEDS SOURCE' },
      { q: 'Before streaming, which machine played VHS tapes at home?', options: ['Record player', 'Video recorder', 'Slide projector', 'Fax machine'], answer: 1, fact: 'The video recorder, often blinking 12:00 because nobody set its clock.', source: 'NEEDS SOURCE' },
      { q: 'Which planet is closest to the Sun?', options: ['Venus', 'Mars', 'Mercury', 'Earth'], answer: 2, fact: 'Mercury, which takes just 88 days to go round the Sun.', source: 'NEEDS SOURCE' },
      { q: 'On a clock face, which number sits directly opposite the 12?', options: ['3', '6', '9', '10'], answer: 1, fact: 'The 6, at the bottom of the dial.', source: 'NEEDS SOURCE' },
      { q: 'Mixing blue and yellow paint makes which colour?', options: ['Purple', 'Orange', 'Green', 'Brown'], answer: 2, fact: 'Green, as every primary school painting table proved.', source: 'NEEDS SOURCE' },
    ],
    goal: 3,
    intro: 'Today’s round of general knowledge.',
  },
};

const higherLower: Puzzle<HigherLowerPayload> = {
  id: 'hl-counts-1',
  formatId: 'higher-lower',
  memory: { title: 'Six guesses made.', text: 'Every one of these numbers was once a pub quiz answer somewhere.', draft: true },
  payload: {
    items: [
      { name: 'Squares on a chessboard', value: 64, source: 'NEEDS SOURCE' },
      { name: 'Keys on a standard piano', value: 88, source: 'NEEDS SOURCE' },
      { name: 'Cards in a standard deck', value: 52, source: 'NEEDS SOURCE' },
      { name: 'Bones in an adult human body', value: 206, source: 'NEEDS SOURCE' },
      { name: 'Days in a leap year', value: 366, source: 'NEEDS SOURCE' },
      { name: 'Weeks in a year', value: 52, source: 'NEEDS SOURCE' },
      { name: 'Minutes in a day', value: 1440, source: 'NEEDS SOURCE' },
    ],
    goal: 4,
    intro: 'Six right in a row for a perfect run.',
  },
};

const mysteryObject: Puzzle<MysteryPayload> = {
  id: 'mo-typewriter',
  formatId: 'mystery-object',
  memory: { title: 'The typewriter.', text: 'Every key struck an inked ribbon, a bell warned you the line was ending, and a slip meant reaching for the correction fluid.' },
  payload: {
    clues: [
      'It was found in offices and on many writers’ desks.',
      'It was noisy, and a little bell rang as you used it.',
      'You fed the paper into it by hand.',
      'Mistakes were fixed with a small bottle of white fluid.',
      'Each key pressed a letter onto the page through an inked ribbon.',
    ],
    options: ['Sewing machine', 'Typewriter', 'Cash register', 'Telegraph key'],
    answer: 'Typewriter',
    maxWrong: 3,
    intro: 'The fewer clues you need, the more points you keep.',
  },
};

const putInOrder: Puzzle<OrderPayload> = {
  id: 'po-letter',
  formatId: 'put-in-order',
  memory: { title: 'Signed, sealed, delivered.', text: 'A letter’s journey: from the postbox at the end of the road to the doormat, usually by the next morning.', draft: true },
  payload: {
    steps: ['You drop it in the postbox', 'The postman collects it', 'It’s sorted at the sorting office', 'It travels to the right town', 'It’s delivered through the door'],
    start: [2, 4, 0, 3, 1],
    checks: 3,
    intro: 'A letter’s journey, in five steps.',
  },
};

export const PUZZLES: Puzzle[] = [
  wordGuess, wordSearch, sudoku, rewind, circleWord, bingo, logic,
  miniSudoku, killerSudoku, kakuro, futoshiki, nonogram, minesweeper, slidingTile,
  miniCrossword, wordLadder, anagrams, wordHive, theQuiz, higherLower, mysteryObject, putInOrder,
] as Puzzle[];

/** The puzzle a format plays on a date. */
export function getPuzzle(_date: DateKey, formatId: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.formatId === formatId);
}
