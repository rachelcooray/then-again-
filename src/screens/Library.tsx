import { useState } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';
import { FAMILIES, FAMILY_ORDER, FORMATS, type FamilyId } from '../content/formats';
import { getPuzzle } from '../content/puzzles';
import { LEVEL_NAME } from '../content/schedule';
import { recordKey } from '../state/progress';
import { useStore } from '../state/store';
import { useToday } from '../state/useToday';

type Filter = 'all' | FamilyId;

export function Library() {
  const today = useToday();
  const { data } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = (name: string, description: string, family: FamilyId) =>
    (filter === 'all' || filter === family) &&
    (!q || `${name} ${description} ${FAMILIES[family].label}`.toLowerCase().includes(q));

  const live = FORMATS.filter((f) => matches(f.name, f.description, f.family));

  return (
    <div className="screen">
      <div className="screen__head library-head">
        <h1 className="display">Library</h1>
        <span className="kicker">{FORMATS.length} puzzle types</span>
      </div>

      <div className="library-search">
        <label htmlFor="library-search" className="kicker">Search puzzles</label>
        <input
          id="library-search"
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “sudoku” or “words”"
        />
      </div>

      <div className="chip-row" role="group" aria-label="Filter by puzzle family">
        {(['all', ...FAMILY_ORDER] as Filter[]).map((k) => (
          <button
            key={k}
            type="button"
            className="chip"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
          >
            {k === 'all' ? 'All' : FAMILIES[k].label}
          </button>
        ))}
      </div>

      <p className="visually-hidden" aria-live="polite">{live.length} puzzles shown</p>

      <div className="cards-grid">
        {live.map((f) => {
          const played = data.progress[recordKey(today, f.id)];
          const level = getPuzzle(today, f.id)?.level;
          return (
            <Link key={f.id} to={`/play/${f.id}`} className={`card fam-${f.family}`}>
              <span className="kicker">{FAMILIES[f.family].kicker}</span>
              <span className="card__name">{f.name}</span>
              <span>{f.description}</span>
              <span className="card__meta" style={{ marginTop: 'auto' }}>
                {f.minutes} min · {level ? LEVEL_NAME[level] : f.difficulty}{played ? ' · Played today' : ''} <span aria-hidden="true">→</span>
              </span>
            </Link>
          );
        })}
      </div>

      {live.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', margin: '1.5rem 0' }}>No puzzles match that search.</p>
      )}

      {config.showCatalogue && (
        <Link to="/library/catalogue" className="btn btn--block library-catalogue">
          See all 190+ planned puzzles <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
