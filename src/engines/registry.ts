import type { PuzzleFormat } from '../content/formats';
import { card } from './card';
import { crossword } from './crossword';
import { grouping } from './grouping';
import { hiddenCells } from './hidden-cells';
import { letterGridSearch } from './letter-grid-search';
import { letterGuess } from './letter-guess';
import { letterSet } from './letter-set';
import { anagrams } from './letter-set/anagrams';
import { wordHive } from './letter-set/word-hive';
import { logicGrid } from './logic-grid';
import { numberGrid } from './number-grid';
import { pictureLogic } from './picture-logic';
import { higherLower, mysteryObject, putInOrder, quiz } from './quiz';
import { sumGrid } from './sum-grid';
import { tileSlide } from './tile-slide';
import type { AnyEngine } from './types';
import { wordChain } from './word-chain';

/** Futoshiki runs on the number-grid rules with signs instead of boxes. */
const inequalityGrid: AnyEngine = {
  ...numberGrid,
  id: 'inequality-grid',
  help: 'Choose a square, then a number. Every row and column uses each number once, and every sign between squares must hold: the open side faces the bigger number. A number that breaks a rule is underlined straight away. On a keyboard, move with the arrow keys and type the numbers.',
};

/** One engine per format. Formats that share an engine family can still differ in how they play. */
const BY_FORMAT: Record<string, AnyEngine> = {
  'word-guess': letterGuess,
  'word-search': letterGridSearch,
  'circle-word': letterSet,
  'word-hive': wordHive,
  anagrams,
  'word-ladder': wordChain,
  'mini-crossword': crossword,
  rewind: grouping,
  sudoku: numberGrid,
  'mini-sudoku': numberGrid,
  'killer-sudoku': numberGrid,
  kakuro: sumGrid,
  futoshiki: inequalityGrid,
  nonogram: pictureLogic,
  'logic-grid': logicGrid,
  minesweeper: hiddenCells,
  'sliding-tile': tileSlide,
  bingo: card,
  quiz,
  'higher-lower': higherLower,
  'mystery-object': mysteryObject,
  'put-in-order': putInOrder,
};

export function engineFor(format: PuzzleFormat): AnyEngine | undefined {
  return BY_FORMAT[format.id];
}
