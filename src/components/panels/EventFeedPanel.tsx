import { useMemo, useState } from 'react';
import { credBand, formatPrice, formatSigned, relativeTime } from '../../lib/format';
import { actionTone, deriveSuggestions } from '../../lib/suggestions';
import type { MarketEvent } from '../../data/types';
import { useMarket } from '../../store/MarketContext';
import { Panel, PanelTabs } from '../Panel';

type Tab = 'all' | 'positive' | 'negative';

/**
 * News → market impact feed.
 *
 * Each row is a `MarketEvent`, and the chips underneath are the symbols the
 * event is pushing, with the % move still owed. Clicking a chip opens that
 * asset's chart so the movement can be watched as it propagates.
 */
export function EventFeedPanel() {
  const { snapshot, setSelected, injectEvent, newsMode, newsStatus, refreshNews, refreshing } =
    useMarket();
  const [tab, setTab] = useState<Tab>('all');
  const [deskView, setDeskView] = useState(true);

  const events = useMemo(() => {
    if (tab === 'all') return snapshot.events;
    return snapshot.events.filter((e) => e.sentiment === tab);
  }, [snapshot.events, tab]);

  const now = snapshot.updatedAt;

  return (
    <Panel
      title="News → Markets"
      info={
        newsMode === 'live'
          ? ` Live headlines from ${newsStatus?.feeds ?? 0} Indian publisher RSS feeds, tagged with the NSE symbols each story should move. The engine applies those impacts gradually so you can watch the tape react.`
          : ' News API unreachable — showing the offline mock generator. Start it with `npm run dev:api`.'
      }
      live={newsMode === 'live'}
      className="panel-span-2 panel-row-2"
      action={
        <>
        <button
          type="button"
          className={`panel-action-btn${deskView ? ' active' : ''}`}
          title="Show or hide the per-story positioning note"
          onClick={(e) => {
            e.stopPropagation();
            setDeskView((v) => !v);
          }}
        >
          Desk View
        </button>
        <button
          type="button"
          className="panel-action-btn"
          disabled={refreshing}
          title={
            newsMode === 'live'
              ? 'Re-poll the RSS feeds now'
              : 'Emit a mock headline (news API offline)'
          }
          onClick={(e) => {
            e.stopPropagation();
            if (newsMode === 'live') void refreshNews();
            else injectEvent();
          }}
        >
          {refreshing ? '…' : newsMode === 'live' ? '↻ Refresh' : '+ Simulate'}
        </button>
        </>
      }
    >
      <PanelTabs
        tabs={[
          { id: 'all' as const, label: 'All' },
          { id: 'negative' as const, label: 'Risk-Off' },
          { id: 'positive' as const, label: 'Risk-On' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {events.length === 0 ? (
        <div className="panel-empty">No events</div>
      ) : (
        events.map((ev) => {
          const active = now - ev.timestamp < 40_000;
          return (
            <div className="item" key={ev.id}>
              <div className="item-source">
                {active && <span className="event-live-dot" />}
                {ev.source}
                <span className={`credibility-score-badge ${credBand(ev.credibility)}`}>
                  CRED {ev.credibility}
                </span>
                <span className={`sentiment-badge ${ev.sentiment}`}>
                  {ev.sentiment === 'positive'
                    ? 'BULLISH'
                    : ev.sentiment === 'negative'
                      ? 'BEARISH'
                      : 'NEUTRAL'}
                </span>
                <span
                  className="category-tag"
                  style={
                    {
                      '--category-color': ev.categoryColor,
                      '--category-background': `${ev.categoryColor}20`,
                    } as React.CSSProperties
                  }
                >
                  {ev.category}
                </span>
              </div>

              {ev.url ? (
                <a
                  className="item-title"
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ev.title}
                </a>
              ) : (
                <span className="item-title">{ev.title}</span>
              )}

              <div className="impact-row">
                {Object.entries(ev.impact)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .slice(0, 7)
                  .map(([symbol, pct]) => {
                    // Sector-ETF proxies appear in impact maps but are derived
                    // rather than simulated, so they have no chart to open.
                    const tradable = symbol in snapshot.quotes;
                    return (
                      <button
                        type="button"
                        key={symbol}
                        className="impact-chip"
                        disabled={!tradable}
                        style={tradable ? undefined : { cursor: 'default', opacity: 0.6 }}
                        onClick={() => tradable && setSelected(symbol)}
                        title={
                          tradable
                            ? `Expected impact on ${symbol} — open chart`
                            : `${symbol} is a derived sector proxy`
                        }
                      >
                        {symbol}
                        <span className={`impact-chip-val ${pct > 0 ? 'up' : 'down'}`}>
                          {formatSigned(pct)}%
                        </span>
                      </button>
                    );
                  })}
              </div>

              {deskView && <DeskView event={ev} onSelect={setSelected} />}

              <div className="item-time">{relativeTime(ev.timestamp, now)}</div>
            </div>
          );
        })
      )}
    </Panel>
  );
}

/**
 * Positioning note for one story: the two or three stocks it most plausibly
 * moves, with a call, levels and a one-line reason. Demo output — labelled
 * as such, because these are real tickers.
 */
function DeskView({
  event,
  onSelect,
}: {
  event: MarketEvent;
  onSelect: (s: string) => void;
}) {
  const { snapshot } = useMarket();
  const suggestions = useMemo(
    () => deriveSuggestions(event, snapshot.quotes),
    [event, snapshot.quotes],
  );

  if (suggestions.length === 0) return null;

  return (
    <div className="desk-view">
      <div className="desk-view-head">
        <span>Desk View</span>
        <span className="desk-view-disclaimer">Simulated · not investment advice</span>
      </div>

      {suggestions.map((s) => {
        const tone = actionTone(s.action);
        return (
          <div className="desk-row" key={s.symbol} onClick={() => onSelect(s.symbol)}>
            <div className="desk-row-top">
              <span className={`desk-action ${tone}`}>{s.action}</span>
              <span className="desk-symbol">{s.symbol}</span>
              <span className="desk-name">{s.name}</span>
              <span className={`desk-conviction ${s.conviction.toLowerCase()}`}>
                {s.conviction}
              </span>
            </div>

            <div className="desk-row-levels">
              <span>
                CMP <b>{formatPrice(s.symbol, s.cmp)}</b>
              </span>
              <span>
                TGT{' '}
                <b className={tone}>{formatPrice(s.symbol, s.target)}</b>
              </span>
              <span>
                SL <b>{formatPrice(s.symbol, s.stop)}</b>
              </span>
              <span className={`desk-move ${tone}`}>{formatSigned(s.expectedMove)}%</span>
              <span className="desk-horizon">{s.horizon}</span>
            </div>

            <div className="desk-rationale">{s.rationale}</div>
          </div>
        );
      })}
    </div>
  );
}
