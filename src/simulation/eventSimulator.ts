import type { MarketEvent, Sentiment } from '../data/types';
import { hashString, mulberry32 } from './random';

/**
 * Offline fallback news generator.
 *
 * The live path is `server/` → `/api/news`, which polls Indian publisher RSS
 * feeds and tags each headline. This file only runs when that API is
 * unreachable, so a demo still has something plausible on screen. Both paths
 * emit the same `MarketEvent` shape.
 */

interface EventTemplate {
  title: string;
  source: string;
  category: string;
  categoryColor: string;
  sentiment: Sentiment;
  credibility: [number, number];
  regions?: string[];
  impact: Record<string, number>;
}

const TEMPLATES: EventTemplate[] = [
  {
    title: 'RBI holds repo rate at 5.50%, retains neutral stance on liquidity',
    source: 'Reserve Bank of India',
    category: 'Central Bank',
    categoryColor: '#3b82f6',
    sentiment: 'neutral',
    credibility: [92, 99],
    regions: ['MH'],
    impact: { BANKNIFTY: 0.4, NIFTYBANK: 0.4, NIFTY: 0.2, IN10Y: -0.3, HDFCBANK: 0.3, SBIN: 0.4 },
  },
  {
    title: 'RBI cuts repo rate by 25 bps, signals room for further easing',
    source: 'Reserve Bank of India',
    category: 'Central Bank',
    categoryColor: '#22c55e',
    sentiment: 'positive',
    credibility: [92, 99],
    regions: ['MH'],
    impact: { BANKNIFTY: 1.8, NIFTYBANK: 1.8, NIFTYPSUBANK: 2.2, NIFTYREALTY: 2.4, DLF: 2.6, SBIN: 1.9, NIFTY: 0.9, IN10Y: -2.1, IN2Y: -2.8 },
  },
  {
    title: 'FIIs offload ₹8,420 crore in cash market, DIIs absorb with ₹7,180 crore',
    source: 'NSE Provisional Data',
    category: 'Flows',
    categoryColor: '#8b5cf6',
    sentiment: 'negative',
    credibility: [88, 96],
    impact: { NIFTY: -0.8, BANKNIFTY: -1.0, MIDCAP150: -1.2, SMALLCAP250: -1.5, NIFTYNXT50: -0.9 },
  },
  {
    title: 'IMD forecasts monsoon 8% above long period average for the season',
    source: 'PTI',
    category: 'Agriculture',
    categoryColor: '#22c55e',
    sentiment: 'positive',
    credibility: [84, 94],
    impact: { NIFTYFMCG: 1.4, ITC: 1.1, HINDUNILVR: 1.2, 'M&M': 1.8, NESTLEIND: 0.9, NIFTYAUTO: 0.7 },
  },
  {
    title: 'GST collections hit record ₹2.08 lakh crore in August',
    source: 'Ministry of Finance',
    category: 'Fiscal',
    categoryColor: '#eab308',
    sentiment: 'positive',
    credibility: [90, 98],
    regions: ['DL'],
    impact: { NIFTY: 0.7, NIFTYINFRA: 1.2, LT: 1.1, ULTRACEMCO: 0.9, NIFTYPSUBANK: 0.8 },
  },
  {
    title: 'Crude spikes 4% on Gulf supply disruption, OMC margins under pressure',
    source: 'ET Markets',
    category: 'Commodities',
    categoryColor: '#f97316',
    sentiment: 'negative',
    credibility: [82, 92],
    impact: { MCXCRUDE: 4.2, BRENT: 4.0, ONGC: 2.6, BPCL: -3.1, IOC: -2.9, USDINR: 0.5, NIFTY: -0.6, NIFTYENERGY: -0.8 },
  },
  {
    title: 'Rupee slips to record low past 89/$ as dollar index firms',
    source: 'Mint Markets',
    category: 'Currency',
    categoryColor: '#06b6d4',
    sentiment: 'negative',
    credibility: [86, 95],
    impact: { USDINR: 0.8, NIFTYIT: 1.4, TCS: 1.1, INFY: 1.3, WIPRO: 1.0, HCLTECH: 1.0, BPCL: -1.2, IOC: -1.1, NIFTY: -0.3 },
  },
  {
    title: 'SEBI tightens index derivatives norms, raises lot-size thresholds',
    source: 'SEBI',
    category: 'Regulation',
    categoryColor: '#a855f7',
    sentiment: 'negative',
    credibility: [90, 98],
    regions: ['MH'],
    impact: { PAYTM: -2.2, BAJFINANCE: -1.4, NIFTYBANK: -0.6, NIFTY: -0.4 },
  },
  {
    title: 'Infosys raises FY guidance on large-deal momentum; TCS follows',
    source: 'Business Standard',
    category: 'Earnings',
    categoryColor: '#22c55e',
    sentiment: 'positive',
    credibility: [85, 95],
    regions: ['KA'],
    impact: { INFY: 3.4, TCS: 2.1, NIFTYIT: 2.6, WIPRO: 1.6, HCLTECH: 1.8, TECHM: 1.5, NIFTY: 0.6 },
  },
  {
    title: 'US raises H-1B filing fees sharply, Indian IT bears the brunt',
    source: 'Reuters India',
    category: 'Trade Policy',
    categoryColor: '#f97316',
    sentiment: 'negative',
    credibility: [88, 96],
    impact: { NIFTYIT: -2.4, TCS: -1.9, INFY: -2.2, WIPRO: -2.0, HCLTECH: -1.7, TECHM: -1.8, NIFTY: -0.5 },
  },
  {
    title: 'Cabinet clears semiconductor PLI tranche worth ₹76,000 crore',
    source: 'PIB',
    category: 'Fiscal',
    categoryColor: '#22c55e',
    sentiment: 'positive',
    credibility: [88, 97],
    regions: ['DL', 'GJ'],
    impact: { NIFTYINFRA: 1.1, LT: 1.4, NIFTY: 0.5, ADANIENT: 1.2, NIFTYCONSDUR: 1.0 },
  },
  {
    title: 'Adani group block deal: promoter entity sells 2.4% stake',
    source: 'Moneycontrol',
    category: 'Deals',
    categoryColor: '#ec4899',
    sentiment: 'negative',
    credibility: [78, 90],
    regions: ['GJ'],
    impact: { ADANIENT: -4.2, ADANIPORTS: -2.8, NIFTY: -0.3, NIFTYINFRA: -0.9 },
  },
  {
    title: 'HDFC Bank Q2 net interest income beats estimates, asset quality stable',
    source: 'NDTV Profit',
    category: 'Earnings',
    categoryColor: '#22c55e',
    sentiment: 'positive',
    credibility: [84, 94],
    regions: ['MH'],
    impact: { HDFCBANK: 2.8, NIFTYBANK: 1.6, BANKNIFTY: 1.6, ICICIBANK: 0.9, AXISBANK: 0.8, NIFTY: 0.6 },
  },
  {
    title: 'Government imposes safeguard duty on steel imports for 200 days',
    source: 'PIB',
    category: 'Trade Policy',
    categoryColor: '#22c55e',
    sentiment: 'positive',
    credibility: [88, 97],
    regions: ['DL', 'JH'],
    impact: { TATASTEEL: 3.6, JSWSTEEL: 3.2, NIFTYMETAL: 2.8, HINDALCO: 1.4, MARUTI: -0.8, NIFTYAUTO: -0.5 },
  },
  {
    title: 'CPI inflation eases to 3.2%, lowest print in fourteen months',
    source: 'MoSPI',
    category: 'Economy',
    categoryColor: '#22c55e',
    sentiment: 'positive',
    credibility: [92, 99],
    impact: { NIFTY: 0.9, BANKNIFTY: 1.2, NIFTYBANK: 1.2, NIFTYREALTY: 1.4, IN10Y: -1.8, IN2Y: -2.2, INDIAVIX: -5.4 },
  },
  {
    title: 'Tata Motors JLR volumes disappoint, brokerages trim targets',
    source: 'ET Markets',
    category: 'Earnings',
    categoryColor: '#ef4444',
    sentiment: 'negative',
    credibility: [82, 92],
    regions: ['MH'],
    impact: { TATAMOTORS: -3.8, NIFTYAUTO: -1.2, NIFTY: -0.3 },
  },
];

let counter = 0;

export function nextEvent(rand: () => number, now: number): MarketEvent {
  const t = TEMPLATES[Math.floor(rand() * TEMPLATES.length)];
  counter += 1;

  // Scale by a per-occurrence severity so the same headline does not always
  // move the tape by exactly the same amount.
  const severity = 0.6 + rand() * 0.9;
  const impact: Record<string, number> = {};
  for (const [symbol, pct] of Object.entries(t.impact)) {
    impact[symbol] = Number((pct * severity).toFixed(3));
  }

  const [lo, hi] = t.credibility;

  return {
    id: `mock-${String(counter).padStart(3, '0')}-${hashString(t.title + now).toString(36)}`,
    title: t.title,
    source: t.source,
    category: t.category,
    categoryColor: t.categoryColor,
    sentiment: t.sentiment,
    credibility: Math.round(lo + rand() * (hi - lo)),
    regions: t.regions ?? [],
    affectedAssets: Object.keys(impact),
    impact,
    timestamp: now,
  };
}

/** Seed the feed so the panel is not empty on first paint. */
export function seedEvents(count: number, now: number): MarketEvent[] {
  const rand = mulberry32(0xc0ffee);
  const out: MarketEvent[] = [];
  for (let i = count; i > 0; i -= 1) {
    out.push(nextEvent(rand, now - i * 1000 * 60 * (3 + Math.floor(rand() * 25))));
  }
  return out.reverse();
}
