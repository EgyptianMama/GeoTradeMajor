import { useEffect, useMemo, useRef, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { AssetChartModal } from './components/AssetChartModal';
import { TickerStrip } from './components/TickerStrip';
import { EnergyPanel, McxPanel } from './components/panels/CommodityPanels';
import { EventFeedPanel } from './components/panels/EventFeedPanel';
import { FlowsPanel } from './components/panels/FlowsPanel';
import { FixedIncomePanel, ForexPanel } from './components/panels/FxRatesPanels';
import { IndiaMapPanel } from './components/panels/IndiaMapPanel';
import {
  BreadthPanel,
  FearGreedPanel,
  MacroIndicatorsPanel,
  StressPanel,
} from './components/panels/MacroPanels';
import { MarketsPanel } from './components/panels/MarketsPanel';
import { MoversPanel } from './components/panels/MoversPanel';
import { SectorHeatmapPanel } from './components/panels/SectorHeatmapPanel';
import { SIM_CONFIG } from './simulation/config';
import { MarketProvider, useMarket } from './store/MarketContext';
import './styles/tokens.css';
import './styles/app.css';

type Category =
  | 'all'
  | 'markets'
  | 'sectors'
  | 'commodities'
  | 'rates'
  | 'macro'
  | 'news';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'markets', label: 'Markets' },
  { id: 'sectors', label: 'Sectors & Flows' },
  { id: 'commodities', label: 'MCX & Energy' },
  { id: 'rates', label: 'G-Sec & Rupee' },
  { id: 'macro', label: 'Macro & Sentiment' },
  { id: 'news', label: 'News Impact' },
];

const PANEL_CATEGORIES: Record<string, Category[]> = {
  markets: ['markets'],
  movers: ['markets'],
  sectors: ['sectors'],
  flows: ['sectors'],
  map: ['sectors', 'news'],
  mcx: ['commodities'],
  energy: ['commodities'],
  forex: ['rates'],
  bonds: ['rates'],
  events: ['news'],
  macro: ['macro'],
  fearGreed: ['macro'],
  stress: ['macro'],
  breadth: ['macro'],
};

function Dashboard() {
  const { snapshot, running, newsMode, newsStatus } = useMarket();
  const [category, setCategory] = useState<Category>('all');
  const [filter, setFilter] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        filterRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const show = (key: string) =>
    category === 'all' || PANEL_CATEGORIES[key]?.includes(category);

  const pressuredCount = useMemo(
    () =>
      Object.values(snapshot.quotes).filter((q) => Math.abs(q.eventPressure) > 0.05)
        .length,
    [snapshot],
  );

  return (
    <div className="app-shell">
      <AppHeader onSearch={() => filterRef.current?.focus()} />
      <TickerStrip />

      <div className="panel-nav">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`panel-nav-chip${category === c.id ? ' active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
        <div className="panel-nav-spacer" />
        <div className="panel-nav-filter">
          <input
            ref={filterRef}
            className="filter-input"
            placeholder="Filter symbols…  ⌘K"
            value={filter}
            onChange={(e) => setFilter(e.target.value.trim())}
          />
          {filter && (
            <button
              type="button"
              className="panel-nav-chip"
              onClick={() => setFilter('')}
              title="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="panels-grid">
          {show('markets') && <MarketsPanel filter={filter} />}
          {show('events') && <EventFeedPanel />}
          {show('map') && <IndiaMapPanel />}
          {show('movers') && <MoversPanel />}
          {show('sectors') && <SectorHeatmapPanel />}
          {show('flows') && <FlowsPanel />}
          {show('mcx') && <McxPanel />}
          {show('energy') && <EnergyPanel />}
          {show('forex') && <ForexPanel filter={filter} />}
          {show('bonds') && <FixedIncomePanel />}
          {show('fearGreed') && <FearGreedPanel />}
          {show('stress') && <StressPanel />}
          {show('breadth') && <BreadthPanel />}
          {show('macro') && <MacroIndicatorsPanel />}
        </div>
      </div>

      <div className="footer-bar">
        <span>
          GEOTRADE · NSE/BSE/MCX · <b>PRICES SIMULATED</b> ·{' '}
          {newsMode === 'live' ? (
            <>
              news <b>LIVE</b> from {newsStatus?.feeds ?? 0} Indian RSS feeds
              {newsStatus?.errors?.length
                ? ` (${newsStatus.errors.length} failing)`
                : ''}
            </>
          ) : (
            <>
              news <b>OFFLINE</b> — run <b>npm run dev:api</b>
            </>
          )}
        </span>
        <span>
          tick <b>{snapshot.tick}</b> · interval <b>{SIM_CONFIG.UPDATE_INTERVAL}ms</b> ·
          engine <b>{running ? 'running' : 'paused'}</b> · stories{' '}
          <b>{snapshot.events.length}</b> · under news pressure{' '}
          <b>{pressuredCount}</b>
        </span>
      </div>

      <AssetChartModal />
    </div>
  );
}

export default function App() {
  return (
    <MarketProvider>
      <Dashboard />
    </MarketProvider>
  );
}
