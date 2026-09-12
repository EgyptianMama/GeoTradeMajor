import { useMemo, useState } from 'react';
import { EQUITIES, MACRO_INDICATORS } from '../../data/assets';
import { clamp } from '../../simulation/random';
import { formatSigned } from '../../lib/format';
import { useMarket } from '../../store/MarketContext';
import { Panel, PanelTabs } from '../Panel';

export function MacroIndicatorsPanel() {
  const [tab, setTab] = useState<'prices' | 'growth' | 'external'>('prices');
  const rows = MACRO_INDICATORS[tab];

  return (
    <Panel
      title="India Macro"
      info=" Reference macro prints for the Indian economy — CPI, growth and the external account. These are static figures, not part of the price simulation."
    >
      <PanelTabs
        tabs={[
          { id: 'prices' as const, label: 'Prices & Rates' },
          { id: 'growth' as const, label: 'Growth' },
          { id: 'external' as const, label: 'External' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="macro-summary-grid">
        {rows.map((r) => (
          <div className="macro-summary-card" key={r.name}>
            <div className="macro-summary-head">
              <span className="indicator-name">{r.name}</span>
            </div>
            <div className="macro-summary-value">{r.value}</div>
            <div className={`macro-summary-change ${r.tone}`}>{r.change}</div>
            <div className="indicator-date">{r.date}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/**
 * Fear & Greed gauge, driven by India VIX and NSE breadth so it moves with
 * the rest of the dashboard rather than on its own randomness.
 */
export function FearGreedPanel() {
  const { snapshot } = useMarket();

  const { score, label, color, delta } = useMemo(() => {
    const vix = snapshot.quotes['INDIAVIX']?.price ?? 13;
    const advancing = EQUITIES.filter(
      (e) => (snapshot.quotes[e.symbol]?.changePct ?? 0) > 0,
    ).length;
    const breadth = advancing / EQUITIES.length;

    // India VIX typically sits lower than the US equivalent, so the scale is
    // anchored around 10-25 rather than 12-35.
    const vixScore = clamp(100 - (vix - 9) * 4.6, 0, 100);
    const s = Math.round(clamp(vixScore * 0.6 + breadth * 100 * 0.4, 0, 100));

    const spec =
      s >= 75
        ? { label: 'Extreme Greed', color: '#27ae60' }
        : s >= 58
          ? { label: 'Greed', color: '#2ecc71' }
          : s >= 43
            ? { label: 'Neutral', color: '#f1c40f' }
            : s >= 25
              ? { label: 'Fear', color: '#e67e22' }
              : { label: 'Extreme Fear', color: '#c0392b' };

    return { score: s, ...spec, delta: snapshot.marketFactor * 4000 };
  }, [snapshot]);

  const angle = Math.PI - (score / 100) * Math.PI;
  const nx = 100 + Math.cos(angle) * 73;
  const ny = 100 - Math.sin(angle) * 73;

  const bands = [
    { d: 'M12,100 A88,88 0 0,0 28.81,48.27 L51.46,64.73 A60,60 0 0,1 40,100 Z', fill: '#c0392b' },
    { d: 'M28.81,48.27 A88,88 0 0,0 72.81,16.31 L81.46,42.94 A60,60 0 0,1 51.46,64.73 Z', fill: '#e67e22' },
    { d: 'M72.81,16.31 A88,88 0 0,0 127.19,16.31 L118.54,42.94 A60,60 0 0,1 81.46,42.94 Z', fill: '#f1c40f' },
    { d: 'M127.19,16.31 A88,88 0 0,0 171.19,48.27 L148.54,64.73 A60,60 0 0,1 118.54,42.94 Z', fill: '#2ecc71' },
    { d: 'M171.19,48.27 A88,88 0 0,0 188,100 L160,100 A60,60 0 0,1 148.54,64.73 Z', fill: '#27ae60' },
  ];

  return (
    <Panel
      title="Fear & Greed"
      info=" Composite sentiment derived from India VIX and NSE market breadth."
      live
    >
      <div className="gauge-wrap">
        <svg viewBox="0 0 200 115" width="100%" style={{ maxWidth: 200 }} aria-hidden="true">
          {bands.map((b) => (
            <path key={b.d} d={b.d} fill={b.fill} opacity="0.88" />
          ))}
          <line
            x1="100"
            y1="100"
            x2={nx.toFixed(1)}
            y2={ny.toFixed(1)}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill={color} />
          <circle cx="100" cy="100" r="3" fill="rgba(8,8,8,0.9)" />
        </svg>
        <div className="gauge-score" style={{ color }}>
          {score}
        </div>
        <div className="gauge-label" style={{ color }}>
          {label}
        </div>
        <div className="gauge-delta" style={{ color: delta >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {formatSigned(delta, 1)} vs prev
        </div>
      </div>
    </Panel>
  );
}

/** Financial stress meter from India VIX plus the G-Sec curve shape. */
export function StressPanel() {
  const { snapshot } = useMarket();

  const { fsi, label, color, pct, vix, spread } = useMemo(() => {
    const v = snapshot.quotes['INDIAVIX']?.price ?? 13;
    const two = snapshot.quotes['IN2Y']?.price ?? 6.18;
    const ten = snapshot.quotes['IN10Y']?.price ?? 6.48;
    const sp = (ten - two) * 100;

    const value = clamp(4.2 - (v - 10) * 0.18 + sp / 260, -1.5, 4.2);
    const p = clamp(((value + 1.5) / 5.7) * 100, 0, 100);

    const spec =
      value > 2.2
        ? { label: 'Low Stress', color: '#27ae60' }
        : value > 0.8
          ? { label: 'Moderate Stress', color: '#f1c40f' }
          : { label: 'Elevated Stress', color: '#c0392b' };

    return { fsi: value, ...spec, pct: p, vix: v, spread: sp };
  }, [snapshot]);

  return (
    <Panel
      title="Financial Stress Indicator"
      info=" Composite of India VIX and G-Sec curve shape, scaled so higher values mean calmer conditions."
      live
    >
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
          INDIA FSI VALUE
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>
          {fsi.toFixed(4)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 4 }}>{label}</div>
      </div>

      <div className="meter-scale">
        <span>High Stress</span>
        <span>Low Stress</span>
      </div>
      <div className="meter-track">
        <div
          className="meter-fill"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg,#c0392b,#f39c12,#27ae60)',
          }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="stat-row">
          <span className="stat-row-label">
            <span className="stat-swatch" style={{ background: '#f59e0b' }} />
            India VIX
          </span>
          <span className="stat-row-value">{vix.toFixed(2)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-row-label">
            <span className="stat-swatch" style={{ background: '#3b82f6' }} />
            2s10s Spread
          </span>
          <span className="stat-row-value">{formatSigned(spread, 0)}bps</span>
        </div>
      </div>
    </Panel>
  );
}

/** Advance / decline across the simulated NSE universe. */
export function BreadthPanel() {
  const { snapshot } = useMarket();

  const { adv, dec, unch, pct } = useMemo(() => {
    let a = 0;
    let d = 0;
    let u = 0;
    for (const e of EQUITIES) {
      const c = snapshot.quotes[e.symbol]?.changePct ?? 0;
      if (c > 0.02) a += 1;
      else if (c < -0.02) d += 1;
      else u += 1;
    }
    return { adv: a, dec: d, unch: u, pct: (a / EQUITIES.length) * 100 };
  }, [snapshot]);

  const tone = pct >= 60 ? 'var(--green)' : pct >= 40 ? '#f59e0b' : 'var(--red)';

  return (
    <Panel
      title="Market Breadth"
      info=" Advance/decline across the simulated NSE cash universe."
      live
    >
      <div className="stat-row">
        <span className="stat-row-label">
          <span className="stat-swatch" style={{ background: '#22c55e' }} />% Advancing
        </span>
        <span className="stat-row-value" style={{ color: tone }}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-row-label">
          <span className="stat-swatch" style={{ background: '#22c55e' }} />
          Advancers
        </span>
        <span className="stat-row-value" style={{ color: 'var(--green)' }}>
          {adv}
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-row-label">
          <span className="stat-swatch" style={{ background: '#ef4444' }} />
          Decliners
        </span>
        <span className="stat-row-value" style={{ color: 'var(--red)' }}>
          {dec}
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-row-label">
          <span className="stat-swatch" style={{ background: '#888' }} />
          Unchanged
        </span>
        <span className="stat-row-value">{unch}</span>
      </div>

      <div className="meter-track" style={{ marginTop: 10, height: 10 }}>
        <div className="meter-fill" style={{ width: `${pct}%`, background: 'var(--green)' }} />
      </div>
      <div className="meter-scale" style={{ marginTop: 4 }}>
        <span>{adv} adv</span>
        <span>{dec} dec</span>
      </div>
    </Panel>
  );
}
