import { useMemo } from 'react';
import { formatCrore, formatSigned } from '../../lib/format';
import { useMarket } from '../../store/MarketContext';
import { Panel } from '../Panel';

/**
 * FII / DII provisional flows — the number every Indian desk checks at 6pm.
 *
 * Derived from the same simulated state as everything else: when the broad
 * market is bid, foreign flows read positive and domestic institutions take
 * the other side, which is how the daily print usually behaves.
 */
export function FlowsPanel() {
  const { snapshot } = useMarket();

  const flows = useMemo(() => {
    const nifty = snapshot.quotes['NIFTY']?.changePct ?? 0;
    const banknifty = snapshot.quotes['BANKNIFTY']?.changePct ?? 0;
    const smallcap = snapshot.quotes['SMALLCAP250']?.changePct ?? 0;

    // FIIs lean with the large-cap tape; DIIs lean against it.
    const fiiCash = nifty * 4200 + banknifty * 1100;
    const diiCash = -fiiCash * 0.78 + smallcap * 420;
    const fiiFno = nifty * 2600 - banknifty * 700;

    // Ten evenly spaced period-over-period moves, read back from the tail.
    // Indices are clamped so a growing history never reaches before index 0.
    const history: number[] = [];
    const h = snapshot.quotes['NIFTY']?.history ?? [];
    const buckets = 10;
    const step = Math.max(1, Math.floor(h.length / (buckets + 1)));
    for (let b = buckets; b >= 1; b -= 1) {
      const end = h.length - 1 - (b - 1) * step;
      const start = end - step;
      if (start < 0 || end < 0 || !h[start] || !h[end]) continue;
      history.push(((h[end] - h[start]) / h[start]) * 100 * 4200);
    }

    return { fiiCash, diiCash, fiiFno, net: fiiCash + diiCash, history };
  }, [snapshot]);

  const max = Math.max(...flows.history.map((v) => Math.abs(v)), 1);

  return (
    <Panel
      title="FII / DII Flows"
      info=" Provisional institutional flows in the cash and F&O segments, derived from the simulated index tape. Foreign flows track the large-cap move; domestic institutions typically take the other side."
      live
    >
      <div className="stat-row">
        <span className="stat-row-label">
          <span className="stat-swatch" style={{ background: '#3b82f6' }} />
          FII Cash
        </span>
        <span
          className="stat-row-value"
          style={{ color: flows.fiiCash >= 0 ? 'var(--green)' : 'var(--red)' }}
        >
          {formatCrore(flows.fiiCash)}
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-row-label">
          <span className="stat-swatch" style={{ background: '#f59e0b' }} />
          DII Cash
        </span>
        <span
          className="stat-row-value"
          style={{ color: flows.diiCash >= 0 ? 'var(--green)' : 'var(--red)' }}
        >
          {formatCrore(flows.diiCash)}
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-row-label">
          <span className="stat-swatch" style={{ background: '#a855f7' }} />
          FII Index F&O
        </span>
        <span
          className="stat-row-value"
          style={{ color: flows.fiiFno >= 0 ? 'var(--green)' : 'var(--red)' }}
        >
          {formatCrore(flows.fiiFno)}
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-row-label">Net Institutional</span>
        <span
          className="stat-row-value"
          style={{ color: flows.net >= 0 ? 'var(--green)' : 'var(--red)' }}
        >
          {formatCrore(flows.net)}
        </span>
      </div>

      <div className="section-title" style={{ marginTop: 10 }}>
        FII cash trend
      </div>
      <svg viewBox="0 0 240 46" width="100%" height="46" style={{ display: 'block' }}>
        <line x1="0" y1="23" x2="240" y2="23" stroke="var(--border)" strokeWidth="0.5" />
        {flows.history.map((v, i) => {
          const bw = 240 / Math.max(flows.history.length, 1);
          const bh = (Math.abs(v) / max) * 20;
          return (
            <rect
              key={i}
              x={i * bw + 1.5}
              y={v >= 0 ? 23 - bh : 23}
              width={bw - 3}
              height={Math.max(bh, 0.8)}
              fill={v >= 0 ? 'var(--green)' : 'var(--red)'}
              opacity="0.85"
            />
          );
        })}
      </svg>
      <div className="indicator-date">
        Provisional · simulated · net {formatSigned(flows.net / 1000, 1)}k Cr
      </div>
    </Panel>
  );
}
