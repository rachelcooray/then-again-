/** Word Hive rules, free of UI. */

export interface WordHivePayload {
  centre: string;
  ring: string[];
  /** Reviewed answer list; ranks and the goal count these. */
  words: string[];
  /** Words in the list that use all seven letters. */
  pangrams: string[];
  /** Words needed to count as solved. */
  goal: number;
  minLength: number;
  intro: string;
}

const RANKS: [number, string][] = [[0.7, 'Genius'], [0.45, 'Expert'], [0.25, 'Skilled'], [0.1, 'Good'], [0, 'Starter']];
export const rankOf = (found: number, total: number) => RANKS.find(([t]) => found / total >= t)![1];

/** Rules any accepted word must follow, list or dictionary. */
export function followsHiveRules(w: string, p: WordHivePayload): string | null {
  if (w.length < p.minLength) return `Too short. ${p.minLength} letters or more.`;
  if (!w.includes(p.centre)) return `Every word needs the centre ${p.centre}.`;
  const allowed = new Set([p.centre, ...p.ring]);
  if (![...w].every((ch) => allowed.has(ch))) return 'Only the letters in the hive.';
  return null;
}
