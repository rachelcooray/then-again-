import { useState } from 'react';
import { CATALOGUE, STATUS_TAG, catalogueStatus, type CatalogueStatus } from '../content/catalogue';
import { BackHeader } from '../components/BackHeader';
import './catalogue.css';

type Filter = 'all' | CatalogueStatus;

const FILTERS: [Filter, string][] = [
  ['all', 'Everything'],
  ['playable', 'First 22'],
  ['launch', 'Launch list'],
  ['later', 'Later'],
  ['licence', 'Needs a licence'],
];

/** Internal planning view of every planned format. Hidden in public builds (config.showCatalogue). */
export function Catalogue() {
  const [filter, setFilter] = useState<Filter>('all');
  const all = CATALOGUE.flatMap((f) => f.items);
  const count = (s: CatalogueStatus) => all.filter((n) => catalogueStatus(n) === s).length;

  const families = CATALOGUE.map((f) => ({
    ...f,
    shown: f.items.filter((n) => filter === 'all' || catalogueStatus(n) === filter),
  })).filter((f) => f.shown.length);

  const stats = [
    { n: all.length, label: 'formats planned', cls: 'stat--strong' },
    { n: count('playable'), label: 'in the first 22', cls: 'fam-word' },
    { n: count('launch'), label: 'on the launch list', cls: 'fam-search' },
    { n: count('licence'), label: 'need a licence', cls: 'fam-connect' },
  ];

  return (
    <>
      <BackHeader title="The full catalogue" fallback="/library" backLabel="Back to the library" />
      <div className="screen">
        <span className="kicker">The plan, not yet the product</span>
        <p>Every puzzle format planned for Then Again, grouped by family. Most share a handful of engines, so one well-built engine can power many formats.</p>

        <div className="stats">
          {stats.map((s) => (
            <div key={s.label} className={`stat ${s.cls}`} style={{ borderColor: 'transparent' }}>
              <span className="stat__n">{s.n}</span>
              <span className="stat__label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="chip-row" role="group" aria-label="Filter by status">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {k === 'all' ? `${label} (${all.length})` : label}
            </button>
          ))}
        </div>

        {families.map((f) => (
          <section key={f.name} className="section">
            <div className="catalogue-family">
              <span className="catalogue-swatch" style={{ background: `var(--${f.swatch})` }} aria-hidden="true" />
              <h2 className="title catalogue-family__name">{f.name}</h2>
              <span className="mono small">{f.shown.length} {filter === 'all' ? 'formats' : 'shown'}</span>
            </div>
            <ul className="catalogue-grid">
              {f.shown.map((name) => {
                const status = catalogueStatus(name);
                return (
                  <li key={name} className={`catalogue-item catalogue-item--${status}`}>
                    <span className="catalogue-item__name">{name}</span>
                    <span className="kicker">{STATUS_TAG[status]}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
