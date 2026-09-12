import { memo, useEffect, useRef, useState } from 'react';
import { ASSET_BY_SYMBOL } from '../data/assets';
import type { AssetQuote } from '../data/types';
import { changeClass, formatChange, formatPrice } from '../lib/format';
import { Sparkline } from './Sparkline';

interface Props {
  quote: AssetQuote;
  onSelect?: (symbol: string) => void;
  selected?: boolean;
  pressured?: boolean;
}

/**
 * One `.market-item` row: name/symbol on the left, sparkline + price +
 * % change on the right — the reference's core list primitive.
 */
function MarketRowImpl({ quote, onSelect, selected, pressured }: Props) {
  const def = ASSET_BY_SYMBOL[quote.symbol];
  const dir = changeClass(quote.changePct);

  // Brief green/red flash on the price when it ticks, like a real blotter.
  const [flash, setFlash] = useState<'' | 'tick-up' | 'tick-down'>('');
  const prev = useRef(quote.price);
  useEffect(() => {
    if (quote.price === prev.current) return;
    setFlash(quote.price > prev.current ? 'tick-up' : 'tick-down');
    prev.current = quote.price;
    const t = setTimeout(() => setFlash(''), 320);
    return () => clearTimeout(t);
  }, [quote.price]);

  return (
    <div
      className={`market-item market-item-clickable${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${quote.symbol} price chart`}
      onClick={() => onSelect?.(quote.symbol)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(quote.symbol);
        }
      }}
    >
      <div className="market-info">
        <span className="market-name">{def?.name ?? quote.symbol}</span>
        <span className="market-symbol">
          {quote.symbol}
          {pressured && <span className="market-impact-flag"> NEWS</span>}
        </span>
      </div>
      <div className="market-data">
        <Sparkline data={quote.history} positive={dir !== 'down'} />
        <span className={`market-price ${flash}`.trim()}>
          {formatPrice(quote.symbol, quote.price)}
        </span>
        <span className={`market-change ${dir}`}>{formatChange(quote.changePct)}</span>
      </div>
    </div>
  );
}

export const MarketRow = memo(MarketRowImpl);
