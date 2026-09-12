import { useMemo, useState } from 'react';
import { EQUITIES, INDICES } from '../../data/assets';
import { useMarket } from '../../store/MarketContext';
import { MarketRow } from '../MarketRow';
import { Panel, PanelTabs } from '../Panel';

type Tab = 'watchlist' | 'indices' | 'equities';

const TABS = [
  { id: 'watchlist' as const, label: 'Watchlist' },
  { id: 'indices' as const, label: 'Indices' },
  { id: 'equities' as const, label: 'NIFTY 50' },
];

export function MarketsPanel({ filter }: { filter: string }) {
  const { snapshot, selected, setSelected, watchlist, pressured } = useMarket();
  const [tab, setTab] = useState<Tab>('watchlist');
  const [editing, setEditing] = useState(false);

  const symbols = useMemo(() => {
    if (tab === 'indices') return INDICES.map((a) => a.symbol);
    if (tab === 'equities') return EQUITIES.map((a) => a.symbol);
    return watchlist;
  }, [tab, watchlist]);

  const quotes = useMemo(() => {
    const q = symbols.map((s) => snapshot.quotes[s]).filter(Boolean);
    if (!filter) return q;
    const f = filter.toLowerCase();
    return q.filter((x) => x.symbol.toLowerCase().includes(f));
  }, [symbols, snapshot, filter]);

  return (
    <Panel
      title="Markets"
      info=" Simulated NSE/BSE indices and cash-market prices. Customize your watchlist with the Watchlist button. Sparklines show recent price trend."
      live
      className="panel-row-2"
      action={
        <button
          type="button"
          className={`panel-action-btn${editing ? ' active' : ''}`}
          title="Customize market watchlist"
          onClick={(e) => {
            e.stopPropagation();
            setEditing((v) => !v);
          }}
        >
          Watchlist
        </button>
      }
    >
      <PanelTabs tabs={TABS} active={tab} onChange={setTab} />

      {editing && <WatchlistEditor />}

      {quotes.length === 0 ? (
        <div className="panel-empty">No instruments match</div>
      ) : (
        quotes.map((q) => (
          <MarketRow
            key={q.symbol}
            quote={q}
            onSelect={setSelected}
            selected={selected === q.symbol}
            pressured={pressured.has(q.symbol)}
          />
        ))
      )}
    </Panel>
  );
}

function WatchlistEditor() {
  const { watchlist, toggleWatch } = useMarket();
  const all = [...INDICES, ...EQUITIES];

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: 8,
        marginBottom: 8,
        background: 'var(--bg)',
      }}
    >
      <div className="section-title">Toggle instruments</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {all.map((a) => (
          <button
            key={a.symbol}
            type="button"
            className={`panel-nav-chip${watchlist.includes(a.symbol) ? ' active' : ''}`}
            style={{ fontSize: 9, padding: '2px 8px' }}
            onClick={() => toggleWatch(a.symbol)}
          >
            {a.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
