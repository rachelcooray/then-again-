export type FamilyId = 'word' | 'search' | 'logic' | 'connect';

export interface Family {
  id: FamilyId;
  /** Short label for filters. */
  label: string;
  /** Mono kicker on family cards. */
  kicker: string;
  /** Short kicker used on the Today mosaic. */
  shortKicker: string;
}

export const FAMILIES: Record<FamilyId, Family> = {
  word: { id: 'word', label: 'Words', kicker: 'WORD GAMES', shortKicker: 'WORDS' },
  search: { id: 'search', label: 'Search', kicker: 'SEARCH', shortKicker: 'SEARCH' },
  logic: { id: 'logic', label: 'Logic', kicker: 'NUMBERS & LOGIC', shortKicker: 'LOGIC' },
  connect: { id: 'connect', label: 'Trivia & more', kicker: 'TRIVIA & CONNECTIONS', shortKicker: 'CONNECT' },
};

export const FAMILY_ORDER: FamilyId[] = ['word', 'search', 'logic', 'connect'];

export type EngineId =
  | 'letter-guess'
  | 'letter-grid-search'
  | 'letter-set'
  | 'word-chain'
  | 'crossword'
  | 'grouping'
  | 'number-grid'
  | 'sum-grid'
  | 'inequality-grid'
  | 'picture-logic'
  | 'logic-grid'
  | 'hidden-cells'
  | 'tile-slide'
  | 'card'
  | 'quiz';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface PuzzleFormat {
  id: string;
  name: string;
  family: FamilyId;
  engine: EngineId;
  minutes: number;
  difficulty: Difficulty;
  /** One line for cards. */
  description: string;
  /** One-line rules prompt shown above the puzzle. */
  rules: string;
  /** Build phase that delivers the playable puzzle (section 11). */
  phase: 2 | 4;
}

/** The 22 launch formats from section 4, named as in the design. */
export const FORMATS: PuzzleFormat[] = [
  { id: 'word-guess', name: 'Word Guess', family: 'word', engine: 'letter-guess', minutes: 3, difficulty: 'Easy', phase: 2,
    description: 'Find the hidden five-letter word in six tries.',
    rules: 'Guess the five-letter word in six tries. Each guess shows which letters are in the right place.' },
  { id: 'word-search', name: 'Word Search', family: 'search', engine: 'letter-grid-search', minutes: 5, difficulty: 'Easy', phase: 2,
    description: 'Find this week’s themed words hidden in the grid.',
    rules: 'Tap the first letter of a word, then the last. Words run across, down or diagonally.' },
  { id: 'sudoku', name: 'Sudoku', family: 'logic', engine: 'number-grid', minutes: 10, difficulty: 'Medium', phase: 2,
    description: 'Every row, column and box holds 1 to 9 once.',
    rules: 'Fill the grid so every row, column and box holds the numbers 1 to 9 once.' },
  { id: 'rewind', name: 'Rewind', family: 'connect', engine: 'grouping', minutes: 4, difficulty: 'Medium', phase: 2,
    description: 'Sort sixteen familiar things into four groups.',
    rules: 'Pick four things that belong together. You can make four mistakes.' },
  { id: 'circle-word', name: 'Circle Word Finder', family: 'word', engine: 'letter-set', minutes: 5, difficulty: 'Easy', phase: 2,
    description: 'Make words from the letters around a circle.',
    rules: 'Make words from the letters in the circle. Find the target words to finish.' },
  { id: 'bingo', name: 'Daily Bingo', family: 'connect', engine: 'card', minutes: 4, difficulty: 'Easy', phase: 2,
    description: 'Mark called objects and complete a line.',
    rules: 'Mark each called item on your card. Any full line wins.' },
  { id: 'logic-grid', name: '4×4 Logic', family: 'logic', engine: 'logic-grid', minutes: 3, difficulty: 'Easy', phase: 2,
    description: 'Match four people to their choices from the clues.',
    rules: 'Use the clues to match each person to one item. Mark ✓ for yes and × for no.' },
  { id: 'mini-crossword', name: 'Mini Crossword', family: 'word', engine: 'crossword', minutes: 3, difficulty: 'Easy', phase: 4,
    description: 'A four-by-four crossword that reads both ways.',
    rules: 'Fill the grid from the across and down clues.' },
  { id: 'nonogram', name: 'Nonogram', family: 'logic', engine: 'picture-logic', minutes: 5, difficulty: 'Medium', phase: 4,
    description: 'Fill squares from number clues to reveal a picture.',
    rules: 'The numbers show runs of filled squares in each row and column. Fill them to reveal a picture.' },
  { id: 'mystery-object', name: 'Mystery Object', family: 'connect', engine: 'quiz', minutes: 3, difficulty: 'Medium', phase: 4,
    description: 'Name the everyday object in as few clues as you can.',
    rules: 'Read a clue, then guess the object. Each new clue makes it easier.' },
  { id: 'quiz', name: 'The Quiz', family: 'connect', engine: 'quiz', minutes: 3, difficulty: 'Easy', phase: 4,
    description: 'Five questions, one at a time.',
    rules: 'Answer five questions, one at a time.' },
  { id: 'word-ladder', name: 'Word Ladder', family: 'word', engine: 'word-chain', minutes: 3, difficulty: 'Medium', phase: 4,
    description: 'Turn one word into another, a letter at a time.',
    rules: 'Change one letter at a time to reach the last word. Every step must be a real word.' },
  { id: 'mini-sudoku', name: 'Mini Sudoku', family: 'logic', engine: 'number-grid', minutes: 2, difficulty: 'Easy', phase: 4,
    description: 'A quick small grid for a short break.',
    rules: 'Fill the grid so every row, column and box holds each number once.' },
  { id: 'minesweeper', name: 'Minesweeper', family: 'logic', engine: 'hidden-cells', minutes: 4, difficulty: 'Medium', phase: 4,
    description: 'Uncover every safe square using the number clues.',
    rules: 'Uncover every safe square. Numbers show how many hidden mines touch that square.' },
  { id: 'higher-lower', name: 'Higher or Lower', family: 'connect', engine: 'quiz', minutes: 2, difficulty: 'Easy', phase: 4,
    description: 'Guess whether the next number goes up or down.',
    rules: 'Decide whether the next answer is higher or lower than the last.' },
  { id: 'anagrams', name: 'Anagrams', family: 'word', engine: 'letter-set', minutes: 3, difficulty: 'Easy', phase: 4,
    description: 'Unscramble five words.',
    rules: 'Rearrange the letters to make each word.' },
  { id: 'word-hive', name: 'Word Hive', family: 'word', engine: 'letter-set', minutes: 6, difficulty: 'Medium', phase: 4,
    description: 'Make words from seven letters, always using the centre.',
    rules: 'Make words of four letters or more. Every word must use the centre letter.' },
  { id: 'killer-sudoku', name: 'Killer Sudoku', family: 'logic', engine: 'number-grid', minutes: 5, difficulty: 'Medium', phase: 4,
    description: 'No starting numbers, just cages that must add up.',
    rules: 'Sudoku rules, plus the numbers in each cage add up to its total without repeating.' },
  { id: 'kakuro', name: 'Kakuro', family: 'logic', engine: 'sum-grid', minutes: 4, difficulty: 'Medium', phase: 4,
    description: 'A crossword made of sums.',
    rules: 'Each run of squares adds up to its clue, using 1 to 9 with no repeats.' },
  { id: 'futoshiki', name: 'Futoshiki', family: 'logic', engine: 'inequality-grid', minutes: 5, difficulty: 'Medium', phase: 4,
    description: 'Fill the grid so every greater-than sign holds.',
    rules: 'Each row and column holds every number once, and every sign between squares must hold.' },
  { id: 'sliding-tile', name: 'Sliding Tile', family: 'logic', engine: 'tile-slide', minutes: 3, difficulty: 'Easy', phase: 4,
    description: 'Slide the numbers back into order.',
    rules: 'Tap a tile next to the gap to slide it. Put the numbers back in order.' },
  { id: 'put-in-order', name: 'Put It in Order', family: 'connect', engine: 'quiz', minutes: 2, difficulty: 'Easy', phase: 4,
    description: 'Arrange five steps from first to last.',
    rules: 'Put the five items in order from first to last.' },
];

/** Shown in the library as "coming soon"; not playable in this version. */
export const COMING_SOON: { name: string; family: FamilyId; description: string }[] = [
  { name: 'Picture Search', family: 'search', description: 'Spot the hidden objects in a busy scene.' },
];

const BY_ID = new Map(FORMATS.map((f) => [f.id, f]));

export function getFormat(id: string): PuzzleFormat | undefined {
  return BY_ID.get(id);
}
