import { useState } from 'react';
import { MCX_COMMODITIES, MCX_ENERGY } from '../../data/assets';
import type { AssetDef, AssetQuote } from '../../data/types';
import { changeClass, formatChange, formatPrice } from '../../lib/format';
import { useMarket } from '../../store/MarketContext';
import { Panel, PanelTabs } from '../Panel';
import { Sparkline } from '../Sparkline';

/** The reference's `.commodity-item` card: name / sparkline / price / change. */
function CommodityCard({
  def,
  quote,
  onSelect,
}: {
  def: AssetDef;
  quote: AssetQuote;
  onSelect: (s: string) => void;
}) {
  const dir = changeClass(quote.changePct);
  return (
    <div
      className="commodity-item"
      onClick={() => onSelect(def.symbol)}
      title={def.unit ? `${def.name} — per ${def.unit}` : def.name}
    >
      <div className="commodity-name">
        {def.name}
        {def.unit && <span style={{ opacity: 0.6 }}> /{def.unit}</span>}
      </div>
      <Sparkline data={quote.history} width={60} height={18} positive={dir !== 'down'} />
      <div className="commodity-price">{formatPrice(def.symbol, quote.price)}</div>
      <div className={`commodity-change ${dir}`}>{formatChange(quote.changePct)}</div>
    </div>
  );
}

export function McxPanel() {
  const { snapshot, setSelected } = useMarket();
  const [tab, setTab] = useState<'bullion' | 'base'>('bullion');

  const bullion = MCX_COMMODITIES.filter((c) =>
    ['MCXGOLD', 'MCXSILVER', 'MCXCOTTON'].includes(c.symbol),
  );
  const base = MCX_COMMODITIES.filter((c) => !bullion.includes(c));
  const defs = tab === 'bullion' ? bullion : base;

  return (
    <Panel
      title="MCX Commodities"
      info=" Multi Commodity Exchange contracts quoted in rupees. Bullion and base metals run on a lower volatility profile than equities."
      live
      className="panel-row-2"
    >
      <PanelTabs
        tabs={[
          { id: 'bullion' as const, label: 'Bullion' },
          { id: 'base' as const, label: 'Base Metals' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="commodities-grid">
        {defs.map((d) => {
          const q = snapshot.quotes[d.symbol];
          if (!q) return null;
          return <CommodityCard key={d.symbol} def={d} quote={q} onSelect={setSelected} />;
        })}
      </div>
    </Panel>
  );
}

export function EnergyPanel() {
  const { snapshot, setSelected } = useMarket();

  const refs = [
    { label: 'India Crude Basket', value: '$76.84 /bbl', change: '+0.62 DoD', tone: 'up' as const, date: '11 Sep 2026' },
    { label: 'Crude Import Bill (Aug)', value: '$14.2 B', change: '+8.4% YoY', tone: 'down' as const, date: 'Aug 2026' },
    { label: 'LPG Subsidy Outgo (FY27)', value: '₹12,400 Cr', change: '-6.2% vs BE', tone: 'up' as const, date: 'FY27' },
  ];

  return (
    <Panel
      title="Energy Complex"
      info=" MCX energy contracts plus the reference import figures that drive Indian oil marketing company margins."
      live
      className="panel-row-2"
    >
      {refs.map((r) => (
        <div key={r.label} style={{ marginBottom: 10 }}>
          <div className="section-title">{r.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="commodity-price">{r.value}</span>
            <span className={`commodity-change ${r.tone}`}>{r.change}</span>
          </div>
          <div className="indicator-date">{r.date}</div>
        </div>
      ))}

      <div className="section-title" style={{ marginTop: 12 }}>
        Live Tape
      </div>
      <div className="commodities-grid">
        {MCX_ENERGY.map((d) => {
          const q = snapshot.quotes[d.symbol];
          if (!q) return null;
          return <CommodityCard key={d.symbol} def={d} quote={q} onSelect={setSelected} />;
        })}
      </div>
    </Panel>
  );
}
