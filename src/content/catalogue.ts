/** Internal planning view of every format planned for Then Again (from the design canvas). */

export type CatalogueStatus = 'playable' | 'launch' | 'later' | 'licence';

export const CATALOGUE_PLAYABLE = [
  'Word Guess', 'Word Search', 'Classic Sudoku', 'Word Connections (Rewind)', 'Circle Word Finder', 'Mini Crossword', 'Nonogram',
  'Daily Bingo', 'Mystery Object', 'General Knowledge Quiz', 'Word Ladder', 'Mini Sudoku', 'Minesweeper', 'Higher or Lower',
  'Anagrams', 'Word Hive', 'Killer Sudoku', 'Kakuro', 'Futoshiki', '4×4 Logic', 'Sliding Tile', 'Put It in Order',
];

const LAUNCH = [
  'Circle Word Finder', 'Word Ladder', 'Anagrams', 'Word Hive', 'Mini Crossword', 'Mini Sudoku', 'Killer Sudoku', 'Kakuro', 'Nonogram',
  'Futoshiki', '4×4 Logic', 'Daily Bingo', 'Sliding Tile', 'Minesweeper', 'Spot the Difference', 'Hidden Object',
  'General Knowledge Quiz', 'Higher or Lower', 'Put It in Order', 'Mystery Object',
];

const LICENCE = [
  'Tune Recognition', 'Song Title Scramble', 'Movie Quote Quiz', 'Film Still Mystery', 'TV Theme Challenge', 'Album Cover Mystery',
  'Jingle Recognition', 'Vintage Advert Mystery', 'Packaging Through Time',
];

export interface CatalogueFamily {
  name: string;
  /** Token name for the family swatch. */
  swatch: 'persimmon' | 'cobalt' | 'ink' | 'chartreuse-edge' | 'lilac-edge';
  items: string[];
}

export const CATALOGUE: CatalogueFamily[] = [
  { name: 'Word games', swatch: 'persimmon', items: ['Word Guess', 'Multi-Word Guess', 'Word Search', 'Word Grid Hunt', 'Theme Path', 'Circle Word Finder', 'Word Hive', 'Anagrams', 'Word Scramble', 'Word Ladder', 'Word Chain', 'Missing Vowels', 'Hangman', 'Spelling Challenge', 'Word Connections (Rewind)', 'Word Association', 'Crossword', 'Mini Crossword', 'Cryptic Crossword', 'Cryptogram', 'Quote Decoder', 'Acrostic', 'Word Wheel', 'Word Fill', 'Double Definition', 'Rebus', 'Rhyme Match', 'Synonym Match', 'Antonym Match', 'Prefix and Suffix', 'Phrase Completion', 'Word Search Variants', 'Word Placement', 'Letter Box Challenge', 'Word Ranking'] },
  { name: 'Numbers & logic', swatch: 'cobalt', items: ['Classic Sudoku', 'Mini Sudoku', 'Killer Sudoku', 'Diagonal Sudoku', 'Irregular Sudoku', 'Arithmetic Cages', 'Kakuro', 'Futoshiki', 'Nonogram', 'Hitori', 'Hidato', 'Number Search', 'Number Sequence', 'Equation Guess', 'Cross Sums', 'Sum Grid', 'Number Balance', 'Magic Square', 'Arithmetic Maze', 'Prime Number Hunt', 'Factor Puzzle', 'Target Number', 'Missing Operator', 'Maths Crossword', 'Number Placement', '4×4 Logic', '5×5 Logic', 'Sequence Ordering', 'Estimation Challenge'] },
  { name: 'Grid & spatial', swatch: 'ink', items: ['Daily Bingo', 'Sliding Tile', 'Fifteen Puzzle', 'Lights Out', 'Minesweeper', 'Battleships Logic', 'Fleet Placement', 'Fillomino', 'Slitherlink', 'Nurikabe', 'Bridges', 'Star Battle', 'Tents and Trees', 'Parking Puzzle', 'Block Packing', 'Tangram', 'Matchstick Puzzle', 'Pattern Completion', 'Shape Rotation', 'Jigsaw Puzzle', 'Maze', 'Mirror Maze', 'Pipe Connection', 'Route Finder', 'Domino Logic', 'Match Pairs', 'Memory Cards', 'Tile Matching', 'Sequence Tiles'] },
  { name: 'Visual & observation', swatch: 'chartreuse-edge', items: ['Hidden Object', 'Picture Search', 'Spot the Difference', 'What’s Missing?', 'Zoomed-In Mystery', 'Silhouette Guess', 'Shadow Match', 'Picture Connections', 'Visual Sequence', 'Odd One Out', 'Optical Illusion Challenge', 'Perspective Puzzle', 'Image Reconstruction', 'Object Rotation', 'Pixel Reveal', 'Cropped Photograph', 'Icon Riddle', 'Visual Analogy', 'Colour Pattern', 'Find the Intruder'] },
  { name: 'Trivia & deduction', swatch: 'lilac-edge', items: ['General Knowledge Quiz', 'True or False', 'Multiple Choice', 'Higher or Lower', 'Closest Wins', 'Put It in Order', 'Timeline Challenge', 'Mystery Object', 'Twenty Questions', 'Logic Deduction', 'Who Am I?', 'Where in the World?', 'Map Challenge', 'Flag Identification', 'Landmark Guess', 'Historical Date Guess', 'Invention Match', 'Science Riddles', 'Everyday Knowledge', 'Fact or Myth', 'Category Ranking', 'Clue-by-Clue Mystery'] },
  { name: 'Brain teasers', swatch: 'cobalt', items: ['Riddles', 'Lateral Thinking', 'Short Logic Problems', 'Logic Grid', 'Truth-Teller Puzzle', 'Knights and Knaves', 'River Crossing', 'Bridge and Torch', 'Weighing Puzzle', 'Counterfeit Coin', 'Prisoner and Switches', 'Birthday Paradox', 'Monty Hall', 'Matchstick Equations', 'Impossible at First', 'What Comes Next?', 'The Missing Clue'] },
  { name: 'Music & sound', swatch: 'persimmon', items: ['Tune Recognition', 'Sound Mystery', 'Instrument Match', 'Song Title Scramble', 'Music Timeline', 'Artist Clues', 'Movie Quote Quiz', 'Film Still Mystery', 'TV Theme Challenge', 'Album Cover Mystery', 'Jingle Recognition', 'Voice or Accent Challenge', 'Sound Sequence', 'Name That Era'] },
  { name: 'Memory & culture (Then Again originals)', swatch: 'lilac-edge', items: ['Object Through the Ages', 'Then and Now', 'Old or New?', 'Forgotten Words', 'Phrase Origins', 'Name That Object', 'What Was It Used For?', 'Memory Sequence', 'Everyday Timeline', 'Vintage Advert Mystery', 'Packaging Through Time', 'Household Sound Memory', 'Generations Challenge', 'Lost and Found', 'Common Thread'] },
  { name: 'Social modes', swatch: 'ink', items: ['Daily Duel', 'Pass and Play', 'Family Challenge', 'Puzzle of the Week', 'Streak Challenge', 'Personal Best', 'Cooperative Mystery', 'Create a Challenge', 'Friend Comparison', 'Community Theme'] },
];

export function catalogueStatus(name: string): CatalogueStatus {
  if (CATALOGUE_PLAYABLE.includes(name)) return 'playable';
  if (LAUNCH.includes(name)) return 'launch';
  if (LICENCE.includes(name)) return 'licence';
  return 'later';
}

export const STATUS_TAG: Record<CatalogueStatus, string> = {
  playable: '✓ FIRST 22',
  launch: '● LAUNCH LIST',
  later: '○ LATER',
  licence: '! NEEDS A LICENCE',
};
