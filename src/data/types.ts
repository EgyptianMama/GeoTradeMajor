export type AssetClass = 'index' | 'equity' | 'metal' | 'energy' | 'fx' | 'rate';

/** NSE sector buckets used by the heatmap and the regional map. */
export type Sector =
  | 'Bank'
  | 'PSU Bank'
  | 'IT'
  | 'Auto'
  | 'Pharma'
  | 'FMCG'
  | 'Metal'
  | 'Realty'
  | 'Energy'
  | 'Power'
  | 'Infra'
  | 'Media'
  | 'Telecom'
  | 'NBFC'
  | 'Insurance'
  | 'Retail'
  | 'Cons. Durables';

/** Static definition of a tradable instrument. Prices never live here. */
export interface AssetDef {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  /** Seed price at engine start. */
  seed: number;
  /** Per-tick volatility multiplier; higher = choppier. */
  volatility: number;
  /** Decimal places used when formatting the price. */
  decimals: number;
  /** Prefix rendered before the number, e.g. "₹". */
  prefix?: string;
  /** Suffix rendered after the number, e.g. "%". */
  suffix?: string;
  /** Contract unit for MCX commodities, e.g. "10g", "bbl". */
  unit?: string;
  /** Sector, for equities — drives the sector heatmap. */
  sector?: Sector;
  /** Beta against the broad-market factor. */
  beta?: number;
  /** Nominal average daily volume, in lakh shares. */
  avgVolume?: number;
  /** Market cap label shown in the detail modal. */
  marketCap?: string;
  /** Listing venue. */
  exchange?: 'NSE' | 'BSE' | 'MCX';
  /** True for NSE sectoral indices. */
  sectorIndex?: boolean;
}

/** Live, simulated state for one asset. Owned solely by MarketSimulator. */
export interface AssetQuote {
  symbol: string;
  price: number;
  /** Reference price the % change is measured against (session open). */
  open: number;
  prevPrice: number;
  changePct: number;
  changeAbs: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  /** Rolling price history, oldest first. Used by sparklines and charts. */
  history: number[];
  /** Last time this quote changed, ms epoch. */
  updatedAt: number;
  /** Non-zero while a news event is actively pushing this asset. */
  eventPressure: number;
}

export type Sentiment = 'positive' | 'negative' | 'neutral';

/**
 * A news item that may move the market. This is the seam where a real
 * Indian news pipeline will eventually plug in: replace the generator in
 * simulation/eventSimulator.ts and keep this shape.
 */
export interface MarketEvent {
  id: string;
  title: string;
  source: string;
  category: string;
  categoryColor: string;
  sentiment: Sentiment;
  /** Source credibility 0-100, rendered as the CRED badge. */
  credibility: number;
  /** Link to the published article, when the story came from a real feed. */
  url?: string;
  /** States/regions the story is anchored to, for the map panel. */
  regions?: string[];
  /** Symbols this event is expected to move. */
  affectedAssets: string[];
  /** symbol -> expected % move, applied gradually by the engine. */
  impact: Record<string, number>;
  /** ms epoch the event arrived. */
  timestamp: number;
}

export interface MarketSnapshot {
  quotes: Record<string, AssetQuote>;
  events: MarketEvent[];
  tick: number;
  updatedAt: number;
  /** Broad-market factor, roughly the "risk on/off" level. */
  marketFactor: number;
}
