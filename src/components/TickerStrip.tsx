import { useMemo } from 'react';
import { INDICES, MCX_COMMODITIES, MCX_ENERGY, SECTOR_INDICES } from '../data/assets';
import { changeClass, formatChange, formatPrice } from '../lib/format';
import { useMarket } from '../store/MarketContext';

const TAPE = [
  ...INDICES,
  ...SECTOR_INDICES.slice(0, 6),
  ...MCX_COMMODITIES.slice(0, 3),
  ...MCX_ENERGY.slice(0, 2),
].map((a) => a.symbol);

/** Scrolling tape across the top, reading from the shared snapshot. */
export function TickerStrip() {
  const { snapshot, setSelected } = useMarket();

  const cells = useMemo(
    () =>
      TAPE.map((s) => snapshot.quotes[s]).filter(Boolean).map((q) => ({
        symbol: q.symbol,
        price: formatPrice(q.symbol, q.price),
        change: formatChange(q.changePct),
        dir: changeClass(q.changePct),
      })),
    [snapshot],
  );

  // Duplicated once so the CSS translateX(-50%) loop is seamless.
  const doubled = [...cells, ...cells];

  return (
    <div className="ticker-strip">
      <div className="ticker-strip-label">TAPE</div>
      <div className="ticker-strip-viewport">
        <div className="ticker-strip-track">
          {doubled.map((c, i) => (
            <span
              key={`${c.symbol}-${i}`}
              className="ticker-cell"
              onClick={() => setSelected(c.symbol)}
            >
              <span className="ticker-cell-symbol">{c.symbol}</span>
              <span className="ticker-cell-price">{c.price}</span>
              <span className={`ticker-cell-change ${c.dir}`}>{c.change}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
