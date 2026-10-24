import { InAppReview } from '@capacitor-community/in-app-review';
import { isNative } from './platform';

/**
 * Asks for a store rating with the phone's own prompt, only after a good moment (a finished
 * daily set), only once a player has finished three sets, and at most every four months.
 * The stores themselves also limit how often the prompt can appear.
 */
const KEY = 'then-again:rating-asked';
const GAP_DAYS = 120;
const MIN_FULL_SETS = 3;

export function shouldAskForRating(fullSets: number, now = Date.now(), lastAsked: number | null = readLastAsked()): boolean {
  if (fullSets < MIN_FULL_SETS) return false;
  return lastAsked === null || now - lastAsked > GAP_DAYS * 86_400_000;
}

function readLastAsked(): number | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export async function maybeAskForRating(fullSets: number) {
  if (!isNative || !shouldAskForRating(fullSets)) return;
  try {
    localStorage.setItem(KEY, String(Date.now()));
    await InAppReview.requestReview();
  } catch {
    // The prompt is a nicety; never let it interrupt play.
  }
}
