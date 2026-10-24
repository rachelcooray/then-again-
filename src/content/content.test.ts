import { CATALOGUE } from './catalogue';
import { getDailySet } from './daily';
import { FORMATS, getFormat } from './formats';
import { THEMES, themeForDate } from './themes';

const BANNED = /wordle|connections\b(?! \(rewind\))|strands|spelling bee|kenken|picross/i;

describe('formats', () => {
  it('has the 22 launch formats with unique ids', () => {
    expect(FORMATS).toHaveLength(22);
    expect(new Set(FORMATS.map((f) => f.id)).size).toBe(22);
  });

  it('gives every format a one-line rules prompt', () => {
    for (const f of FORMATS) expect(f.rules.length).toBeGreaterThan(10);
  });

  it('never uses other products’ names in player-facing text', () => {
    const text = [
      ...FORMATS.flatMap((f) => [f.name, f.description, f.rules]),
      ...THEMES.flatMap((t) => [t.name, t.description, t.headline]),
    ].join('\n');
    expect(text).not.toMatch(BANNED);
    expect(CATALOGUE.flatMap((c) => c.items).join('\n')).not.toMatch(/wordle|strands|spelling bee|kenken|picross/i);
  });
});

describe('daily sets', () => {
  it('matches the design for Friday 23 October 2026', () => {
    const set = getDailySet('2026-10-23');
    expect(set.issue).toBe(23);
    expect(set.theme.name).toBe('School days');
    expect(set.formats).toHaveLength(4);
  });

  it('gives everyone on the same date the same set', () => {
    expect(getDailySet('2026-11-02')).toEqual(getDailySet('2026-11-02'));
  });

  it('changes the set from one day to the next', () => {
    expect(getDailySet('2026-10-23').formats).not.toEqual(getDailySet('2026-10-24').formats);
    expect(getDailySet('2026-10-24').issue).toBe(24);
  });

  it('only uses known formats, and each theme runs for a whole week', () => {
    for (let d = 1; d <= 28; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      for (const id of getDailySet(date).formats) expect(getFormat(id)).toBeDefined();
    }
    expect(themeForDate('2026-10-19')).toBe(themeForDate('2026-10-25'));
    expect(themeForDate('2026-10-26')).not.toBe(themeForDate('2026-10-25'));
  });
});
