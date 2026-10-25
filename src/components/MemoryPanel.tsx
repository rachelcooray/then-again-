import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Puzzle } from '../engines/types';
import { track } from '../lib/analytics';
import { useRemoteConfig } from '../lib/remoteConfig';
import { fetchVotes, sendVote, voteSummary, type VoteCounts } from '../lib/votes';
import { useStore } from '../state/store';

const OBJECT_FORMATS = ['nonogram', 'mystery-object'];

/** The question under a result's memory, its answer, and "Save this story". */
export function MemoryPanel({ puzzle, date }: { puzzle: Puzzle; date: string }) {
  const { data, vote, saveMemory } = useStore();
  const remote = useRemoteConfig();
  const mine = data.votes[puzzle.id];
  const saved = data.memories.some((m) => m.id === puzzle.id);
  const ask = puzzle.memory.ask ?? (OBJECT_FORMATS.includes(puzzle.formatId) ? 'Did you have one?' : 'Does this bring back a memory?');

  // Counts are read once, before this visit's answer, so the player's own answer is added on top.
  const [counts, setCounts] = useState<VoteCounts | null>(null);
  const [votedNow, setVotedNow] = useState(false);
  useEffect(() => {
    let live = true;
    void fetchVotes(puzzle.id).then((c) => live && setCounts(c));
    return () => {
      live = false;
    };
  }, [puzzle.id]);

  const answer = (hadOne: boolean) => {
    vote(puzzle.id, hadOne);
    sendVote(puzzle.id, hadOne);
    setVotedNow(true);
  };
  const shown = counts && votedNow && mine !== undefined ? { yes: counts.yes + (mine ? 1 : 0), no: counts.no + (mine ? 0 : 1) } : counts;

  const save = () => {
    saveMemory({ id: puzzle.id, date, formatId: puzzle.formatId, title: puzzle.memory.title, text: puzzle.memory.text, note: '', savedAt: new Date().toISOString() });
    track('story_saved', { format: puzzle.formatId });
  };

  return (
    <div className="memory-panel">
      <p className="memory-panel__ask">{ask}</p>
      {mine === undefined ? (
        <div className="grid-2">
          <button type="button" className="btn btn--ghost" onClick={() => answer(true)}>Yes</button>
          <button type="button" className="btn btn--ghost" onClick={() => answer(false)}>No</button>
        </div>
      ) : (
        <p className="small" role="status">You said {mine ? 'yes' : 'no'}. {voteSummary(shown, remote.vote_percent_after)}</p>
      )}
      {saved ? (
        <Link to="/collection" className="memory-panel__saved small">Saved to My memories. Add your own words there <span aria-hidden="true">→</span></Link>
      ) : (
        <button type="button" className="btn btn--ghost btn--block" onClick={save}>Save this story</button>
      )}
    </div>
  );
}
