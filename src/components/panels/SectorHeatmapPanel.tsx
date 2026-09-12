import { useMemo, useState } from 'react';
import { EQUITIES, SECTOR_INDICES } from '../../data/assets';
import { changeClass, formatChange, formatPrice, heatClass } from '../../lib/format';
import { useMarket } from '../../store/MarketContext';
import { Panel, PanelTabs } from '../Panel';

/** NSE sectoral indices, simulated directly rather than derived. */
export function SectorHeatmapPanel() {
  const { snapshot, setSelected } = useMarket();
  const [tab, setTab] = useState<'indices' | 'breadth'>('indices');

  const sectors = useMemo(
    () =>
      SECTOR_INDICES.map((s) => {
        const q = snapshot.quotes[s.symbol];
        const members = EQUITIES.filter((e) => e.sector === s.name);
        const advancing = members.filter(
          (m) => (snapshot.quotes[m.symbol]?.changePct ?? 0) > 0,
        ).length;
        return {
          def: s,
          change: q?.changePct ?? 0,
          price: q?.price ?? s.seed,
          advancing,
          total: members.length,
        };
      }),
    [snapshot],
  );

  return (
    <Panel
      title="NSE Sector Heatmap"
      info=" Live session change across the NSE sectoral indices. The Breadth tab shows how many constituents in each sector are advancing."
      live
      className="panel-row-2"
    >
      <PanelTabs
        tabs={[
          { id: 'indices' as const, label: 'Performance' },
          { id: 'breadth' as const, label: 'Breadth' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="heatmap">
        {sectors.map((s) => (
          <div
            key={s.def.symbol}
            className={`heatmap-cell ${heatClass(s.change)}`}
            onClick={() => setSelected(s.def.symbol)}
            style={{ cursor: 'pointer' }}
            title={`${s.def.name} — ${formatPrice(s.def.symbol, s.price)}`}
          >
            <div className="sector-ticker">{s.def.name.toUpperCase()}</div>
            {tab === 'indices' ? (
              <div className={`sector-change ${changeClass(s.change)}`}>
                {formatChange(s.change)}
              </div>
            ) : (
              <div
                className="sector-change"
                style={{
                  color: s.total === 0 ? 'var(--text-dim)' : 'var(--text)',
                }}
              >
                {s.total === 0 ? '—' : `${s.advancing}/${s.total}`}
              </div>
            )}
            <div className="sector-name">{formatPrice(s.def.symbol, s.price)}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
