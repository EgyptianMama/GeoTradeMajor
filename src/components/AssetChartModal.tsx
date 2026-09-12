import { useEffect, useMemo, useState } from 'react';
import { ASSET_BY_SYMBOL } from '../data/assets';
import { changeClass, formatChange, formatPrice, formatVolume } from '../lib/format';
import { useMarket } from '../store/MarketContext';
import { TerminalChart } from './TerminalChart';

const RANGES = [
  { id: '1h', points: 30 },
  { id: '6h', points: 60 },
  { id: '24h', points: 120 },
  { id: '7d', points: 180 },
  { id: 'All', points: 240 },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

export function AssetChartModal() {
  const { selected, setSelected, snapshot, watchlist, toggleWatch } = useMarket();
  const [range, setRange] = useState<RangeId>('24h');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, setSelected]);

  const quote = selected ? snapshot.quotes[selected] : undefined;

  const series = useMemo(() => {
    if (!quote) return [];
    const cfg = RANGES.find((r) => r.id === range)!;
    return quote.history.slice(-cfg.points);
  }, [quote, range]);

  if (!selected || !quote) return null;

  const def = ASSET_BY_SYMBOL[selected];
  const dir = changeClass(quote.changePct);
  const watched = watchlist.includes(selected);

  return (
    <div
      className="market-chart-overlay"
      role="dialog"
      aria-modal="true"
      onClick={() => setSelected(null)}
    >
      <div className="market-chart-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="market-chart-close"
          aria-label="Close chart"
          onClick={() => setSelected(null)}
        >
          ✕
        </button>

        <div className="market-chart-head">
          <div>
            <div className="market-chart-name">{def?.name ?? selected}</div>
            <div className="market-chart-symbol">
              {selected} · {def?.assetClass.toUpperCase()}
              {def?.marketCap ? ` · MKT CAP ${def.marketCap}` : ''}
            </div>
          </div>
          <div className="market-chart-quote">
            <span className="market-chart-price">{formatPrice(selected, quote.price)}</span>
            <span className={`market-change ${dir}`}>{formatChange(quote.changePct)}</span>
          </div>
        </div>

        <div className="market-chart-ranges">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`time-btn${range === r.id ? ' active' : ''}`}
              onClick={() => setRange(r.id)}
            >
              {r.id}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className={`time-btn${watched ? ' active' : ''}`}
            onClick={() => toggleWatch(selected)}
          >
            {watched ? '★ Watching' : '☆ Watch'}
          </button>
        </div>

        <div className="market-chart-canvas">
          <TerminalChart
            symbol={selected}
            data={series}
            positive={dir !== 'down'}
            onHover={setHoverIdx}
          />
        </div>

        <div className="chart-crosshair-readout">
          {hoverIdx !== null && series[hoverIdx] !== undefined ? (
            <>
              t-{series.length - 1 - hoverIdx} ticks ·{' '}
              <b>{formatPrice(selected, series[hoverIdx])}</b>
            </>
          ) : (
            'Hover the chart to inspect a point'
          )}
        </div>

        <div className="market-chart-stats">
          <div>
            <div className="chart-stat-label">Open</div>
            <div className="chart-stat-value">{formatPrice(selected, quote.open)}</div>
          </div>
          <div>
            <div className="chart-stat-label">Day High</div>
            <div className="chart-stat-value">{formatPrice(selected, quote.dayHigh)}</div>
          </div>
          <div>
            <div className="chart-stat-label">Day Low</div>
            <div className="chart-stat-value">{formatPrice(selected, quote.dayLow)}</div>
          </div>
          <div>
            <div className="chart-stat-label">Volume</div>
            <div className="chart-stat-value">{formatVolume(quote.volume)}</div>
          </div>
        </div>

        {Math.abs(quote.eventPressure) > 0.05 && (
          <div style={{ marginTop: 10, fontSize: 10, color: 'var(--yellow)' }}>
            ● News impact still propagating: {quote.eventPressure > 0 ? '+' : ''}
            {quote.eventPressure.toFixed(2)}% remaining
          </div>
        )}
      </div>
    </div>
  );
}
