import type { DailySet } from '../content/daily';
import { THEMES } from '../content/themes';
import { voteSummary } from '../lib/votes';
import { dayProgress, dayShareText, linkOutcome } from './day';
import type { ProgressMap } from './progress';

const link = { answer: 'TEA', options: ['BIRTHDAY', 'BEACH', 'TEA', 'PAPER'], explain: 'A tea party.' };
const set: DailySet = { date: '2026-10-27', issue: 27, theme: THEMES[0], formats: ['word-search', 'word-guess', 'word-ladder', 'circle-word'], level: 1, link };
const rec = (formatId: string, solved: boolean, score: string) => ({ date: set.date, formatId, themeId: 'x', issue: 27, solved, score, completedAt: '' });
const progress: ProgressMap = {
  '2026-10-27:word-search': rec('word-search', true, '6/6'),
  '2026-10-27:word-guess': rec('word-guess', true, '3/6'),
  '2026-10-27:word-ladder': rec('word-ladder', false, '2/4'),
};

describe('the hidden link', () => {
  it('gives two tries', () => {
    expect(linkOutcome(link, [])).toMatchObject({ solved: false, over: false, triesLeft: 2 });
    expect(linkOutcome(link, ['BEACH'])).toMatchObject({ solved: false, over: false, triesLeft: 1 });
    expect(linkOutcome(link, ['BEACH', 'PAPER'])).toMatchObject({ solved: false, over: true, triesLeft: 0 });
    expect(linkOutcome(link, ['BEACH', 'TEA'])).toMatchObject({ solved: true, over: true, foundOn: 2 });
  });
});

describe('the day', () => {
  it('is complete only when all four are done', () => {
    expect(dayProgress(set, progress)).toMatchObject({ done: 3, complete: false });
    expect(dayProgress(set, { ...progress, '2026-10-27:circle-word': rec('circle-word', true, '6/6') }).complete).toBe(true);
  });

  it('shares one row per puzzle and the link, without answers', () => {
    const text = dayShareText(set, { ...progress, '2026-10-27:circle-word': rec('circle-word', true, '6/6') }, ['TEA']);
    expect(text.split('\n')).toEqual([
      'Then Again Nº 027 · TUE 27 OCT',
      '🟨 Word Search 6/6',
      '🟧 Word Guess 3/6',
      '⬜ Word Ladder 2/4',
      '🟧 Circle Word Finder 6/6',
      '🔗 Link found first try',
    ]);
    expect(text).not.toContain('TEA ');
  });
});

describe('“Did you have one?” totals', () => {
  it('shows a count until there are enough answers, then a percentage', () => {
    expect(voteSummary({ yes: 12, no: 7 }, 200)).toBe('12 of 19 players said yes so far.');
    expect(voteSummary({ yes: 1, no: 0 }, 200)).toBe('1 of 1 player said yes so far.');
    expect(voteSummary({ yes: 150, no: 50 }, 200)).toBe('75% of players said yes.');
    expect(voteSummary(null, 200)).toContain('once there are enough');
  });
});
