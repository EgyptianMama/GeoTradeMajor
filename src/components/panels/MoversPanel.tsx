import { useMemo, useState } from 'react';
import { EQUITIES, INDICES, SECTOR_INDICES } from '../../data/assets';
import { ASSET_BY_SYMBOL } from '../../data/assets';
import type { AssetQuote } from '../../data/types';
import { changeClass, formatChange, formatPrice } from '../../lib/format';
import { useMarket } from '../../store/MarketContext';
import { Panel, PanelTabs } from '../Panel';

type Scope = 'equities' | 'sectors' | 'all';

const SCOPES = {
  equities: EQUITIES.map((a) => a.symbol),
  sectors: SECTOR_INDICES.map((a) => a.symbol),
  all: [...EQUITIES, ...SECTOR_INDICES, ...INDICES].map((a) => a.symbol),
};

function MoverList({
  quotes,
  direction,
  max,
  onSelect,
}: {
  quotes: AssetQuote[];
  direction: 'up' | 'down';
  max: number;
  onSelect: (s: string) => void;
}) {
  return (
    <>
      {quotes.map((q, i) => {
        const width = max > 0 ? Math.min(100, (Math.abs(q.changePct) / max) * 100) : 0;
        return (
          <div key={q.symbol} className="mover-row" onClick={() => onSelect(q.symbol)}>
            <div className="mover-left">
              <span className="mover-rank">{i + 1}</span>
              <span className="mover-symbol">{q.symbol}</span>
              <span className="mover-name">{ASSET_BY_SYMBOL[q.symbol]?.name}</span>
            </div>
            <div className="mover-right">
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                {formatPrice(q.symbol, q.price)}
              </span>
              <div className="mover-bar">
                <span className={direction} style={{ width: `${width}%` }} />
              </div>
              <span
                className={`market-change ${changeClass(q.changePct)}`}
                style={{ minWidth: 50 }}
              >
                {formatChange(q.changePct)}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function MoversPanel() {
  const { snapshot, setSelected } = useMarket();
  const [scope, setScope] = useState<Scope>('equities');

  const { gainers, losers, max } = useMemo(() => {
    const list = SCOPES[scope]
      .map((s) => snapshot.quotes[s])
      .filter(Boolean) as AssetQuote[];
    const sorted = [...list].sort((a, b) => b.changePct - a.changePct);
    const g = sorted.slice(0, 6);
    const l = sorted.slice(-6).reverse();
    const m = Math.max(
      ...[...g, ...l].map((q) => Math.abs(q.changePct)),
      0.01,
    );
    return { gainers: g, losers: l, max: m };
  }, [snapshot, scope]);

  return (
    <Panel
      title="NSE Gainers & Losers"
      info=" Top movers by session % change across the NSE universe, ranked live from the shared market state."
      live
      className="panel-span-2 panel-row-2"
    >
      <PanelTabs
        tabs={[
          { id: 'equities' as const, label: 'Equities' },
          { id: 'sectors' as const, label: 'Sectors' },
          { id: 'all' as const, label: 'All' },
        ]}
        active={scope}
        onChange={setScope}
      />

      <div className="movers-split">
        <div>
          <div className="movers-section-title">
            <span>▲ Top Gainers</span>
            <span style={{ color: 'var(--green)' }}>{formatChange(gainers[0]?.changePct ?? 0)}</span>
          </div>
          <MoverList quotes={gainers} direction="up" max={max} onSelect={setSelected} />
        </div>
        <div>
          <div className="movers-section-title">
            <span>▼ Top Losers</span>
            <span style={{ color: 'var(--red)' }}>{formatChange(losers[0]?.changePct ?? 0)}</span>
          </div>
          <MoverList quotes={losers} direction="down" max={max} onSelect={setSelected} />
        </div>
      </div>
    </Panel>
  );
}
