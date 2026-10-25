import { enqueue, rpc } from './backend';

/**
 * "Did you have one?" answers. Each answer goes to the server anonymously, keyed only by puzzle.
 * Percentages from a handful of players swing wildly, so until a puzzle has enough answers
 * (remote config `vote_percent_after`) players see the count instead.
 */

export interface VoteCounts {
  yes: number;
  no: number;
}

export function sendVote(puzzleId: string, hadOne: boolean) {
  enqueue('memory_votes', { puzzle_id: puzzleId, had_one: hadOne });
}

/** Counts from the server, or null when offline or not set up. */
export async function fetchVotes(puzzleId: string): Promise<VoteCounts | null> {
  const r = await rpc<VoteCounts>('memory_vote_counts', { p_puzzle_id: puzzleId });
  return r && typeof r.yes === 'number' ? r : null;
}

/** The line shown under the question once the player has answered. */
export function voteSummary(counts: VoteCounts | null, percentAfter: number): string {
  if (!counts) return 'Thanks. Other players’ answers will show here once there are enough of them.';
  const total = counts.yes + counts.no;
  if (total >= percentAfter) return `${Math.round((counts.yes / total) * 100)}% of players said yes.`;
  return `${counts.yes} of ${total} ${total === 1 ? 'player' : 'players'} said yes so far.`;
}
