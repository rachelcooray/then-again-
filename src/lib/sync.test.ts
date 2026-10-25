import { DEFAULT_DATA } from '../state/store';
import { mergeSaves } from './sync';

const rec = (formatId: string, completedAt: string, score: string) => ({ date: '2026-10-26', formatId, themeId: 't', issue: 26, solved: true, score, completedAt });

describe('saving progress to an account', () => {
  it('keeps results from both phones, and the earlier first attempt where both have one', () => {
    const local = {
      progress: { a: rec('word-guess', '2026-10-26T10:00:00Z', '3/6'), b: rec('sudoku', '2026-10-26T11:00:00Z', 'Done') },
      settings: { ...DEFAULT_DATA.settings, textSize: 'large' as const },
      reminders: DEFAULT_DATA.reminders,
    };
    const remote = {
      progress: { a: rec('word-guess', '2026-10-26T09:00:00Z', '5/6'), c: rec('bingo', '2026-10-25T09:00:00Z', '18') },
      settings: { ...DEFAULT_DATA.settings, textSize: 'standard' as const },
    };
    const merged = mergeSaves(local, remote);
    expect(Object.keys(merged.progress).sort()).toEqual(['a', 'b', 'c']);
    expect(merged.progress.a.score).toBe('5/6');
    expect(merged.settings.textSize).toBe('large');
  });

  it('works when the account has nothing yet', () => {
    const local = { progress: { a: rec('word-guess', '2026-10-26T10:00:00Z', '3/6') }, settings: DEFAULT_DATA.settings, reminders: DEFAULT_DATA.reminders };
    expect(mergeSaves(local, null)).toEqual(local);
  });
});
