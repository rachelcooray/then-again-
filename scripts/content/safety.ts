import { blocklist } from './words';

/** Blocklisted words found anywhere in a piece of text, as whole words. */
export function blockedWordsIn(text: string): string[] {
  return (text.toUpperCase().match(/[A-Z]+/g) ?? []).filter((w) => blocklist.has(w));
}

/** Text a player might see must not carry links, emails or phone numbers. */
export function personalInfoIn(text: string): string[] {
  const found: string[] = [];
  if (/https?:\/\/|www\./i.test(text)) found.push('link');
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)) found.push('email address');
  if (/\+?\d[\d\s-]{8,}\d/.test(text)) found.push('phone number');
  return found;
}

/**
 * Blocklisted words hiding in a letter grid, read in all eight directions. A word search
 * can spell something by accident; this is how the gate catches it.
 */
export function hiddenWordsInGrid(letters: string, cols: number, minLength = 3): string[] {
  const rows = letters.length / cols;
  const found = new Set<string>();
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      for (const [dr, dc] of dirs) {
        let word = '';
        for (let rr = r, cc = c; rr >= 0 && cc >= 0 && rr < rows && cc < cols; rr += dr, cc += dc) {
          word += letters[rr * cols + cc];
          if (word.length >= minLength && blocklist.has(word)) found.add(word);
        }
      }
  return [...found];
}
