import { useMemo } from 'react';
import { FX, RATES } from '../../data/assets';
import { changeClass, formatChange, formatPrice, formatSigned } from '../../lib/format';
import { useMarket } from '../../store/MarketContext';
import { MarketRow } from '../MarketRow';
import { Panel } from '../Panel';

export function ForexPanel({ filter }: { filter: string }) {
  const { snapshot, selected, setSelected, pressured } = useMarket();

  const quotes = useMemo(() => {
    const q = FX.map((a) => snapshot.quotes[a.symbol]).filter(Boolean);
    if (!filter) return q;
    const f = filter.toLowerCase();
    return q.filter((x) => x.symbol.toLowerCase().includes(f));
  }, [snapshot, filter]);

  return (
    <Panel
      title="Forex & Rupee"
      info=" Onshore rupee pairs and the dollar index. FX is simulated at the lowest volatility of any class."
      live
      className="panel-row-2"
    >
      {quotes.length === 0 ? (
        <div className="panel-empty">No pairs match</div>
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

export function FixedIncomePanel() {
  const { snapshot, setSelected } = useMarket();

  const rows = useMemo(
    () => RATES.map((r) => snapshot.quotes[r.symbol]).filter(Boolean),
    [snapshot],
  );

  const spread = useMemo(() => {
    const two = snapshot.quotes['IN2Y']?.price ?? 0;
    const ten = snapshot.quotes['IN10Y']?.price ?? 0;
    return (ten - two) * 100;
  }, [snapshot]);

  const inverted = spread < 0;

  return (
    <Panel
      title="G-Sec & Rates"
      info=" Simulated Indian sovereign yields and money-market rates. The 2s10s spread and curve shape are computed from the same quotes the rows display."
      live
      className="panel-row-2"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            background: inverted ? 'var(--red)' : '#2ecc71',
            color: '#000',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.08em',
          }}
        >
          {inverted ? 'INVERTED' : 'NORMAL'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          2Y-10Y Spread:{' '}
          <span style={{ color: inverted ? 'var(--red)' : '#2ecc71' }}>
            {formatSigned(spread, 0)}bps
          </span>
        </span>
      </div>

      <YieldCurve />

      {rows.map((q) => (
        <div key={q.symbol} className="stat-row">
          <span className="stat-row-label">{q.symbol}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSelected(q.symbol)}
              className="stat-row-value"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 11,
              }}
            >
              {formatPrice(q.symbol, q.price)}
            </button>
            <span
              className={`market-change ${changeClass(q.changePct)}`}
              style={{ minWidth: 52 }}
            >
              {formatChange(q.changePct)}
            </span>
          </span>
        </div>
      ))}
    </Panel>
  );
}

/** US curve drawn straight from the simulated yields. */
function YieldCurve() {
  const { snapshot } = useMarket();
  const pts = ['IN2Y', 'IN5Y', 'IN10Y', 'IN30Y']
    .map((s) => snapshot.quotes[s])
    .filter(Boolean);

  if (pts.length < 2) return null;

  const w = 480;
  const h = 120;
  const left = 40;
  const right = w - 12;
  const top = 12;
  const bottom = h - 20;

  const vals = pts.map((p) => p.price);
  const min = Math.min(...vals) - 0.3;
  const max = Math.max(...vals) + 0.3;
  const span = max - min || 1;
  const step = (right - left) / (pts.length - 1);
  const toY = (v: number) => top + (1 - (v - min) / span) * (bottom - top);

  const line = pts
    .map((p, i) => `${i ? 'L' : 'M'}${(left + i * step).toFixed(1)},${toY(p.price).toFixed(1)}`)
    .join('');

  const labels = ['2Y', '5Y', '10Y', '30Y'];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', marginBottom: 8 }}>
      {[0, 0.33, 0.66, 1].map((f) => {
        const y = top + f * (bottom - top);
        return (
          <g key={f}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={left - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="8">
              {(max - f * span).toFixed(1)}%
            </text>
          </g>
        );
      })}
      <path d={line} fill="none" stroke="var(--green)" strokeWidth="1.6" />
      {pts.map((p, i) => (
        <g key={p.symbol}>
          <circle cx={left + i * step} cy={toY(p.price)} r="2.5" fill="var(--green)" />
          <text
            x={left + i * step}
            y={h - 6}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize="8"
          >
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}
