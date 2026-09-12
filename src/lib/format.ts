import { ASSET_BY_SYMBOL } from '../data/assets';

/**
 * Indian number grouping (lakh/crore): 12,34,567.89 rather than 1,234,567.89.
 */
function groupIndian(value: number, decimals: number): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPrice(symbol: string, value: number): string {
  const def = ASSET_BY_SYMBOL[symbol];
  if (!def) return value.toFixed(2);

  let decimals = def.decimals;
  // Large numbers shed decimals so rows stay narrow.
  if (value >= 10000) decimals = 0;
  else if (value >= 1000 && decimals > 1) decimals = 1;

  return `${def.prefix ?? ''}${groupIndian(value, decimals)}${def.suffix ?? ''}`;
}

export function formatChange(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatSigned(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

export function changeClass(pct: number): 'up' | 'down' | 'flat' {
  if (pct > 0.001) return 'up';
  if (pct < -0.001) return 'down';
  return 'flat';
}

/** Volume in lakh shares, rolling up to crore where it reads better. */
export function formatVolume(v: number): string {
  if (v >= 100) return `${(v / 100).toFixed(2)} Cr`;
  return `${v.toFixed(1)} L`;
}

/** Rupee amounts in the crore / lakh-crore convention used by Indian desks. */
export function formatCrore(croreValue: number): string {
  const abs = Math.abs(croreValue);
  const sign = croreValue < 0 ? '-' : '';
  if (abs >= 100000) return `${sign}₹${groupIndian(abs / 100000, 2)} L Cr`;
  return `${sign}₹${groupIndian(abs, 0)} Cr`;
}

export function relativeTime(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** IST clock, matching the reference header's format. */
export function formatIstClock(d: Date): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  // IST is UTC+5:30 and has no daylight saving.
  const ist = new Date(d.getTime() + (5 * 60 + 30) * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${days[ist.getUTCDay()]}, ${pad(ist.getUTCDate())} ${months[ist.getUTCMonth()]} ` +
    `${ist.getUTCFullYear()} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:` +
    `${pad(ist.getUTCSeconds())} IST`
  );
}

/** NSE cash session runs 09:15–15:30 IST, Monday to Friday. */
export function marketPhase(d: Date): { label: string; open: boolean } {
  const ist = new Date(d.getTime() + (5 * 60 + 30) * 60_000);
  const day = ist.getUTCDay();
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();

  if (day === 0 || day === 6) return { label: 'WEEKEND', open: false };
  if (mins >= 9 * 60 && mins < 9 * 60 + 15) return { label: 'PRE-OPEN', open: false };
  if (mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30) return { label: 'OPEN', open: true };
  if (mins > 15 * 60 + 30 && mins <= 16 * 60) return { label: 'POST-CLOSE', open: false };
  return { label: 'CLOSED', open: false };
}

export function credBand(score: number): 'band-high' | 'band-mid' | 'band-low' {
  if (score >= 80) return 'band-high';
  if (score >= 60) return 'band-mid';
  return 'band-low';
}

export function heatClass(pct: number): string {
  const a = Math.abs(pct);
  const level = a >= 1.5 ? 3 : a >= 0.6 ? 2 : 1;
  if (pct > 0.001) return `up-${level}`;
  if (pct < -0.001) return `down-${level}`;
  return '';
}
