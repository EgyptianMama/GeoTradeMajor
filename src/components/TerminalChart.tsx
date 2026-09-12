import { useId, useMemo, useState } from 'react';
import { formatPrice } from '../lib/format';

interface Props {
  symbol: string;
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
  onHover?: (index: number | null) => void;
}

/**
 * The reference's modal chart: 520x240 viewBox, dashed horizontal gridlines,
 * a gradient area fill under the line, a dot on the last point and
 * HI / LAST / LO labels in the right gutter.
 */
export function TerminalChart({
  symbol,
  data,
  positive,
  width = 520,
  height = 240,
  onHover,
}: Props) {
  const gradId = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);

  const geom = useMemo(() => {
    const left = 8;
    const right = width - 54; // right gutter holds HI/LAST/LO labels
    const top = 14;
    const bottom = height - 18;

    if (data.length < 2) return null;

    let min = Infinity;
    let max = -Infinity;
    for (const v of data) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min || max * 0.001 || 1;
    const pad = range * 0.08;
    min -= pad;
    max += pad;

    const span = max - min;
    const step = (right - left) / (data.length - 1);
    const toX = (i: number) => left + i * step;
    const toY = (v: number) => top + (1 - (v - min) / span) * (bottom - top);

    let line = '';
    for (let i = 0; i < data.length; i += 1) {
      line += `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(data[i]).toFixed(1)}`;
    }
    const area = `${line}L${toX(data.length - 1).toFixed(1)},${bottom}L${left},${bottom}Z`;

    const hi = Math.max(...data);
    const lo = Math.min(...data);
    const last = data[data.length - 1];

    return {
      left, right, top, bottom, min, max, span, step, toX, toY,
      line, area, hi, lo, last,
      hiY: toY(hi), loY: toY(lo), lastY: toY(last), lastX: toX(data.length - 1),
      gridLines: [0.25, 0.5, 0.75].map((f) => top + f * (bottom - top)),
    };
  }, [data, width, height]);

  if (!geom) return null;

  const stroke = positive ? 'var(--green)' : 'var(--red)';

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round((x - geom.left) / geom.step);
    const clamped = Math.max(0, Math.min(data.length - 1, i));
    setHover(clamped);
    onHover?.(clamped);
  };

  const handleLeave = () => {
    setHover(null);
    onHover?.(null);
  };

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="terminal-chart"
      role="img"
      aria-label={`${symbol} price chart`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ display: 'block', cursor: 'crosshair' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {geom.gridLines.map((y) => (
        <line
          key={y}
          x1={geom.left}
          y1={y}
          x2={geom.right}
          y2={y}
          stroke="var(--border)"
          strokeWidth="0.5"
          strokeDasharray="2 3"
          opacity="0.6"
        />
      ))}

      <path d={geom.area} fill={`url(#${gradId})`} />
      <path d={geom.line} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />

      {hover !== null && (
        <>
          <line
            x1={geom.toX(hover)}
            y1={geom.top}
            x2={geom.toX(hover)}
            y2={geom.bottom}
            stroke="var(--border-strong)"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
          <circle cx={geom.toX(hover)} cy={geom.toY(data[hover])} r="3" fill={stroke} />
        </>
      )}

      <circle cx={geom.lastX} cy={geom.lastY} r="2.5" fill={stroke} />

      <text x={geom.right + 6} y={geom.hiY - 4} fill="var(--text-dim)" fontSize="9">
        HI {formatPrice(symbol, geom.hi)}
      </text>
      <text
        x={geom.right + 6}
        y={geom.lastY + 3}
        fill={stroke}
        fontSize="9"
        fontWeight="600"
      >
        LAST {formatPrice(symbol, geom.last)}
      </text>
      <text x={geom.right + 6} y={geom.loY + 10} fill="var(--text-dim)" fontSize="9">
        LO {formatPrice(symbol, geom.lo)}
      </text>
    </svg>
  );
}
