import { config } from '../config';
import { daysBetween, weekdayIndex, type DateKey } from '../lib/date';
import { scheduledDay, type DayLink } from './schedule';
import { getTheme, themeForDate, type Theme } from './themes';

export interface DailySet {
  date: DateKey;
  issue: number;
  theme: Theme;
  /** Format ids in play order; the first is the featured puzzle. */
  formats: string[];
  /** 1 easy, 2 medium, 3 hard. Missing when the day isn't in the generated calendar. */
  level?: 1 | 2 | 3;
  /** On link days, what the four puzzles' key words have in common. */
  link?: DayLink;
}

export function issueNumber(date: DateKey): number {
  return daysBetween(config.issueEpoch, date) + 1;
}

/**
 * The daily set for a player's local date. Everyone on the same date gets the same set.
 * It comes from the generated calendar; outside it (or before its month has loaded) it falls
 * back to the seed theme rotation, with the featured puzzle moving through the theme's four formats.
 */
export function getDailySet(date: DateKey): DailySet {
  const day = scheduledDay(date);
  if (day) return { date, issue: issueNumber(date), theme: getTheme(day.themeId) ?? themeForDate(date), formats: day.formats, level: day.level, link: day.link };
  const theme = themeForDate(date);
  const shift = weekdayIndex(date) % theme.formats.length;
  const formats = [...theme.formats.slice(shift), ...theme.formats.slice(0, shift)];
  return { date, issue: issueNumber(date), theme, formats };
}
