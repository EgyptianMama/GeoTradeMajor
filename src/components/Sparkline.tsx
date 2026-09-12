import { memo } from 'react';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  positive: boolean;
  /** How many trailing points to draw. */
  points?: number;
}

/**
 * The reference draws sparklines as a plain <polyline> in a 50x16 viewBox
 * with stroke-width 1.2 and rounded joins, coloured by var(--green)/var(--red).
 */
function SparklineImpl({ data, width = 50, height = 16, positive, points = 60 }: Props) {
  const slice = data.length > points ? data.slice(-points) : data;
  if (slice.length < 2) return <svg width={width} height={height} className="mini-sparkline" />;

  let min = Infinity;
  let max = -Infinity;
  for (const v of slice) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const pad = 1;
  const usable = height - pad * 2;
  const step = width / (slice.length - 1);

  let d = '';
  for (let i = 0; i < slice.length; i += 1) {
    const x = (i * step).toFixed(1);
    const y = (pad + (1 - (slice[i] - min) / range) * usable).toFixed(1);
    d += `${i ? ' ' : ''}${x},${y}`;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mini-sparkline"
      aria-hidden="true"
    >
      <polyline
        points={d}
        fill="none"
        stroke={positive ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const Sparkline = memo(SparklineImpl);
