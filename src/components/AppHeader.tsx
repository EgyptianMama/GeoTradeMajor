import { useEffect, useState } from 'react';
import { formatIstClock, marketPhase } from '../lib/format';
import { useMarket } from '../store/MarketContext';

const SEGMENTS = [
  { id: 'equity', icon: '📈', label: 'EQUITY' },
  { id: 'derivatives', icon: '⚖️', label: 'F&O' },
  { id: 'commodity', icon: '⛏️', label: 'MCX' },
  { id: 'currency', icon: '💱', label: 'CDS' },
];

export function AppHeader({ onSearch }: { onSearch: () => void }) {
  const { running, toggleRunning, speed, setSpeed, newsMode } = useMarket();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const phase = marketPhase(now);

  return (
    <div className="header">
      <div className="header-left">
        <div className="variant-switcher">
          {SEGMENTS.map((v, i) => (
            <span key={v.id} style={{ display: 'contents' }}>
              {i > 0 && <span className="variant-divider" />}
              <button
                type="button"
                className={`variant-option${v.id === 'equity' ? ' active' : ''}`}
                title={v.label}
                disabled={v.id !== 'equity'}
              >
                <span className="variant-icon">{v.icon}</span>
                <span className="variant-label">{v.label}</span>
              </button>
            </span>
          ))}
        </div>
        <span className="logo">GEOTRADE</span>
        <span className="version">v0.1.0</span>
        <span className={`header-live${phase.open ? '' : ' is-closed'}`}>
          NSE {phase.label}
        </span>
      </div>

      <div className="header-right">
        <span
          className="header-newsmode"
          title={
            newsMode === 'live'
              ? 'Headlines are coming from the news API'
              : newsMode === 'degraded'
                ? 'News API is up but every feed is failing — showing offline headlines'
                : 'News API unreachable — using the offline mock generator'
          }
        >
          {newsMode === 'live' ? 'RSS LIVE' : newsMode === 'degraded' ? 'RSS BLOCKED' : 'RSS OFFLINE'}
        </span>

        <span className="header-clock">{formatIstClock(now)}</span>

        <select
          className="header-select"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          title="Simulation speed"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>

        <button
          type="button"
          className={`icon-btn${running ? ' is-on' : ''}`}
          onClick={toggleRunning}
          title={running ? 'Pause simulation' : 'Resume simulation'}
        >
          {running ? '❚❚' : '▶'}
        </button>

        <button type="button" className="search-btn" onClick={onSearch}>
          <kbd>⌘K</kbd>
          Search
        </button>
      </div>
    </div>
  );
}
