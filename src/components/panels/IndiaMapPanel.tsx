import { useMemo, useState } from 'react';
import { INDIA_STATES, type StateNode } from '../../data/assets';
import { changeClass, formatChange } from '../../lib/format';
import { useMarket } from '../../store/MarketContext';
import { Panel } from '../Panel';

/**
 * Regional activity map.
 *
 * States are laid out on a tile grid arranged to India's rough geography —
 * a cartogram rather than a survey map, so nothing here asserts a boundary.
 * Each tile is coloured by the live simulated performance of the listed
 * companies headquartered in that state, and flags states named by an
 * active news story.
 */

const CELL = 34;
const GAP = 3;

export function IndiaMapPanel() {
  const { snapshot, setSelected } = useMarket();
  const [hover, setHover] = useState<StateNode | null>(null);

  const regional = useMemo(() => {
    // States named by any news item published in the last 20 minutes.
    const hot = new Set<string>();
    const cutoff = snapshot.updatedAt - 20 * 60 * 1000;
    for (const ev of snapshot.events) {
      if (ev.timestamp < cutoff) continue;
      ev.regions?.forEach((r) => hot.add(r));
    }

    return INDIA_STATES.map((s) => {
      const quotes = s.members
        .map((m) => snapshot.quotes[m])
        .filter(Boolean);
      const change =
        quotes.length > 0
          ? quotes.reduce((sum, q) => sum + q.changePct, 0) / quotes.length
          : null;
      return { state: s, change, count: quotes.length, hot: hot.has(s.code) };
    });
  }, [snapshot]);

  const cols = Math.max(...INDIA_STATES.map((s) => s.col)) + 1;
  const rows = Math.max(...INDIA_STATES.map((s) => s.row)) + 1;
  const w = cols * (CELL + GAP) + GAP;
  const h = rows * (CELL + GAP) + GAP;

  const active = hover ?? null;
  const activeData = active
    ? regional.find((r) => r.state.code === active.code)
    : null;

  return (
    <Panel
      title="India Market Map"
      info=" Listed-company activity by state. Tiles are arranged geographically as a cartogram — not a survey map — and are shaded by the live performance of the simulated companies headquartered there."
      live
      className="panel-row-2"
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        style={{ display: 'block', maxHeight: 300 }}
        role="img"
        aria-label="Market activity by Indian state"
      >
        {regional.map(({ state, change, count, hot }) => {
          const x = state.col * (CELL + GAP) + GAP;
          const y = state.row * (CELL + GAP) + GAP;
          const dir = change === null ? 'flat' : changeClass(change);
          const fill =
            change === null
              ? 'var(--border)'
              : dir === 'up'
                ? 'var(--map-country)'
                : dir === 'down'
                  ? '#241414'
                  : 'var(--surface)';
          const stroke =
            hot
              ? 'var(--yellow)'
              : change === null
                ? '#333'
                : dir === 'up'
                  ? 'rgba(68,255,136,0.45)'
                  : 'rgba(255,68,68,0.45)';

          return (
            <g
              key={state.code}
              onMouseEnter={() => setHover(state)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: count > 0 ? 'pointer' : 'default' }}
              onClick={() => {
                if (state.members[0]) setSelected(state.members[0]);
              }}
            >
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx="2"
                fill={fill}
                stroke={stroke}
                strokeWidth={hot ? 1.5 : 1}
              />
              <text
                x={x + CELL / 2}
                y={y + 13}
                textAnchor="middle"
                fill="var(--text-dim)"
                fontSize="9"
                fontWeight="700"
              >
                {state.code}
              </text>
              {change !== null && (
                <text
                  x={x + CELL / 2}
                  y={y + 25}
                  textAnchor="middle"
                  fill={dir === 'up' ? 'var(--green)' : 'var(--red)'}
                  fontSize="8"
                  fontWeight="700"
                >
                  {change > 0 ? '+' : ''}
                  {change.toFixed(1)}
                </text>
              )}
              {hot && (
                <circle cx={x + CELL - 5} cy={y + 5} r="2.5" fill="var(--yellow)" />
              )}
            </g>
          );
        })}
      </svg>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          marginTop: 6,
          paddingTop: 6,
          minHeight: 54,
        }}
      >
        {activeData ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--text)' }}>
              {activeData.state.name}
              {activeData.state.hub && (
                <span style={{ color: 'var(--text-dim)', fontSize: 9 }}>
                  {' '}
                  · {activeData.state.hub}
                </span>
              )}
            </div>
            {activeData.change !== null ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginTop: 2 }}>
                <span
                  className={`market-change ${changeClass(activeData.change)}`}
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  {formatChange(activeData.change)}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                  {activeData.count} listed · wt {activeData.state.weight.toFixed(1)}%
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 9, color: 'var(--text-ghost)', marginTop: 4 }}>
                No simulated listings headquartered here
              </div>
            )}
            {activeData.state.members.length > 0 && (
              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 3 }}>
                {activeData.state.members.slice(0, 6).join(' · ')}
                {activeData.state.members.length > 6
                  ? ` +${activeData.state.members.length - 6}`
                  : ''}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 9, color: 'var(--text-ghost)' }}>
            Hover a state for regional performance. Amber outline = named in a
            recent headline.
          </div>
        )}
      </div>
    </Panel>
  );
}
