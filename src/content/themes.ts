import { config } from '../config';
import { daysBetween, type DateKey, weekStart, addDays } from '../lib/date';

export interface Theme {
  id: string;
  issue: number;
  name: string;
  description: string;
  /** Headline on the Today screen while this theme runs. */
  headline: string;
  /** The four puzzle formats this theme runs through, in daily order. */
  formats: [string, string, string, string];
}

/**
 * Seed rotation used until the content pipeline (phase 3) publishes real daily sets.
 * Each theme runs for one week, Monday to Sunday.
 */
export const THEMES: Theme[] = [
  { id: 'things-we-used-to-keep', issue: 17, name: 'Things we used to keep', description: 'Biscuit tins, button jars and the drawer everyone had.',
    headline: 'Four puzzles from the back of the drawer.', formats: ['word-guess', 'word-search', 'sudoku', 'rewind'] },
  { id: 'things-that-made-us-wait', issue: 18, name: 'Things that made us wait', description: 'Kettles, dial-up tones and the queue at the post office.',
    headline: 'Four puzzles worth the wait.', formats: ['word-search', 'word-guess', 'logic-grid', 'rewind'] },
  { id: 'in-the-kitchen', issue: 19, name: 'In the kitchen', description: 'Recipe cards, the pressure cooker and Sunday lunch.',
    headline: 'Four puzzles, one kitchen table.', formats: ['circle-word', 'word-search', 'sudoku', 'bingo'] },
  { id: 'getting-around', issue: 20, name: 'Getting around', description: 'Road atlases, bus tickets and the family car.',
    headline: 'Four puzzles for the journey.', formats: ['word-guess', 'word-search', 'logic-grid', 'rewind'] },
  { id: 'an-evening-at-home', issue: 21, name: 'An evening at home', description: 'Board games, the radio and the good biscuits.',
    headline: 'Four puzzles for a quiet evening.', formats: ['circle-word', 'word-search', 'sudoku', 'bingo'] },
  { id: 'keeping-in-touch', issue: 22, name: 'Keeping in touch', description: 'Postcards, phone boxes and letters by the door.',
    headline: 'Four puzzles, first class.', formats: ['word-guess', 'word-search', 'logic-grid', 'rewind'] },
  { id: 'school-days', issue: 23, name: 'School days', description: 'Chalk dust, inkwells and the register.',
    headline: 'Four puzzles, one school day.', formats: ['word-guess', 'word-search', 'sudoku', 'rewind'] },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function getTheme(id: string): Theme | undefined {
  return BY_ID.get(id);
}

function rotationIndex(date: DateKey): number {
  const weeks = Math.floor(daysBetween(config.themeScheduleStart, weekStart(date)) / 7);
  return ((weeks % THEMES.length) + THEMES.length) % THEMES.length;
}

export function themeForDate(date: DateKey): Theme {
  return THEMES[rotationIndex(date)];
}

/** Themes from earlier weeks, most recent first. */
export function earlierThemes(date: DateKey, count = THEMES.length - 1): { theme: Theme; weekOf: DateKey }[] {
  const out: { theme: Theme; weekOf: DateKey }[] = [];
  let week = weekStart(date);
  for (let i = 0; i < count; i++) {
    week = addDays(week, -7);
    out.push({ theme: themeForDate(week), weekOf: week });
  }
  return out;
}
