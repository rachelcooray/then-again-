/**
 * Hidden daily link, prototyped on seven handwritten days (Monday 26 October to Sunday 1 November 2026)
 * before any of it is generated automatically. On these days each of the four puzzles hides one key
 * word, shown on its result card; once all four are done, the player guesses what links them.
 *
 * The keys mustn't contain the link itself, and the wrong options should each fit one or two keys
 * but never all four. Written by hand and not yet reviewed.
 */
export interface LinkPuzzle {
  formatId: 'word-guess' | 'word-search' | 'word-ladder' | 'anagrams' | 'circle-word' | 'nonogram';
  key: string;
  /** Word Guess and Anagrams show a clue for the key. */
  clue?: string;
  /** Nonogram only: the picture, drawn here so its title can be the key. */
  picture?: { title: string; rows: string[]; memory: string };
}

export interface LinkDay {
  date: string;
  answer: string;
  /** Four choices, the answer among them. */
  options: string[];
  /** Shown once the link is found or given up. */
  explain: string;
  /** The day's four, featured first. */
  puzzles: LinkPuzzle[];
}

export const LINK_DAYS: LinkDay[] = [
  {
    date: '2026-10-26', answer: 'BUTTON', options: ['POCKET', 'BUTTON', 'ZIP', 'HOOK'],
    explain: 'A belly button, a button nose, a coat button and a button mushroom.',
    puzzles: [
      { formatId: 'word-guess', key: 'BELLY', clue: 'A friendlier word for your tummy.' },
      { formatId: 'word-search', key: 'NOSE' },
      { formatId: 'nonogram', key: 'MUSHROOM', picture: { title: 'A mushroom', rows: ['01110', '11111', '10101', '00100', '01110'], memory: 'Mushrooms on toast, picked from the field on an early walk if you knew where to look.' } },
      { formatId: 'word-ladder', key: 'COAT' },
    ],
  },
  {
    date: '2026-10-27', answer: 'TEA', options: ['BIRTHDAY', 'BEACH', 'TEA', 'PAPER'],
    explain: 'A tea party, a tea towel, a teacake and tea leaves.',
    puzzles: [
      { formatId: 'word-search', key: 'TOWEL' },
      { formatId: 'word-guess', key: 'PARTY', clue: 'Balloons, jelly and pass the parcel.' },
      { formatId: 'word-ladder', key: 'CAKE' },
      { formatId: 'circle-word', key: 'LEAVES' },
    ],
  },
  {
    date: '2026-10-28', answer: 'SUN', options: ['CORN', 'SUN', 'SHOE', 'RADIO'],
    explain: 'Sunshine, a sunflower, a sundial and a sunbeam.',
    puzzles: [
      { formatId: 'nonogram', key: 'FLOWER', picture: { title: 'A flower', rows: ['0011100', '0110110', '0011100', '0001000', '1101000', '0111000', '0001000'], memory: 'Pressed flowers kept between the pages of a heavy book, found again years later.' } },
      { formatId: 'word-guess', key: 'SHINE', clue: 'What polish does for a pair of school shoes.' },
      { formatId: 'word-search', key: 'BEAM' },
      { formatId: 'word-ladder', key: 'DIAL' },
    ],
  },
  {
    date: '2026-10-29', answer: 'BOOK', options: ['NOTE', 'GLOW', 'BOOK', 'BOOT'],
    explain: 'A bookshelf, a bookcase, a bookworm and a bookmark.',
    puzzles: [
      { formatId: 'word-guess', key: 'SHELF', clue: 'Where the ornaments and photo frames sat.' },
      { formatId: 'word-search', key: 'WORM' },
      { formatId: 'anagrams', key: 'MARK', clue: 'A smudge or a spot left behind.' },
      { formatId: 'word-ladder', key: 'CASE' },
    ],
  },
  {
    date: '2026-10-30', answer: 'KEY', options: ['EAR', 'CUP', 'PASS', 'KEY'],
    explain: 'A keyboard, a key ring, a keyhole and a keyword.',
    puzzles: [
      { formatId: 'word-search', key: 'HOLE' },
      { formatId: 'word-guess', key: 'BOARD', clue: 'The teacher wrote on it in chalk.' },
      { formatId: 'word-ladder', key: 'RING' },
      { formatId: 'anagrams', key: 'WORD', clue: 'Sentences are made of these.' },
    ],
  },
  {
    date: '2026-10-31', answer: 'HAND', options: ['HAND', 'FOOT', 'MILK', 'TYPE'],
    explain: 'A handshake, handwriting, a handbrake and a handrail.',
    puzzles: [
      { formatId: 'word-guess', key: 'SHAKE', clue: 'What you do to a snow globe.' },
      { formatId: 'circle-word', key: 'WRITING' },
      { formatId: 'word-search', key: 'BRAKE' },
      { formatId: 'word-ladder', key: 'RAIL' },
    ],
  },
  {
    date: '2026-11-01', answer: 'SNOW', options: ['RAIN', 'SNOW', 'FOOT', 'DEW'],
    explain: 'A snowflake, a snowball, a snowdrop and a snowstorm.',
    puzzles: [
      { formatId: 'word-search', key: 'DROP' },
      { formatId: 'word-guess', key: 'FLAKE', clue: 'A thin, light piece that falls away.' },
      { formatId: 'word-ladder', key: 'BALL' },
      { formatId: 'anagrams', key: 'STORM', clue: 'Thunder, lightning and rain.' },
    ],
  },
];
