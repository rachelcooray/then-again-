import { loadScheduleAround } from '../content/schedule';
import { accessFor } from './access';

const remote = { monetisation_enabled: true, free_formats: [] };
const SATURDAY = '2026-10-24';

beforeAll(async () => {
  await loadScheduleAround('2026-10-26');
  await loadScheduleAround(SATURDAY);
});

describe('who can play what', () => {
  it('keeps five games free and locks the rest without Plus', () => {
    const a = accessFor(remote, undefined);
    expect(a.free).toHaveLength(5);
    for (const id of a.free) expect(a.locked(id, '2027-06-01')).toBe(false);
    expect(a.locked('kakuro', '2027-06-01')).toBe(true);
  });

  it('never locks one of today’s four', () => {
    const a = accessFor(remote, undefined);
    // 26 October is a link day whose four include Nonogram and Word Ladder.
    expect(a.locked('nonogram', '2026-10-26')).toBe(false);
    expect(a.locked('word-ladder', '2026-10-26')).toBe(false);
    expect(a.locked('kakuro', SATURDAY)).toBe(true);
  });

  it('unlocks everything with Plus, or when the switch is off', () => {
    expect(accessFor(remote, { source: 'preview', since: '' }).locked('kakuro', SATURDAY)).toBe(false);
    expect(accessFor({ ...remote, monetisation_enabled: false }, undefined).locked('kakuro', SATURDAY)).toBe(false);
  });

  it('follows the remote free list when one is set', () => {
    const a = accessFor({ ...remote, free_formats: ['kakuro'] }, undefined);
    expect(a.locked('kakuro', '2027-06-01')).toBe(false);
    expect(a.locked('sudoku', '2027-06-01')).toBe(true);
  });
});
