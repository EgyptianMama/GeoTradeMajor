import type { AssetDef } from './types';

/**
 * India-centric mock instrument universe (NSE / BSE / MCX).
 *
 * Every price in the app derives from these seeds via the local simulator.
 * Nothing here is fetched and no market-data service is contacted.
 */

export const INDICES: AssetDef[] = [
  { symbol: 'NIFTY', name: 'NIFTY 50', assetClass: 'index', seed: 25842.3, volatility: 0.34, decimals: 2, beta: 1 },
  { symbol: 'SENSEX', name: 'BSE Sensex', assetClass: 'index', seed: 84512.6, volatility: 0.33, decimals: 2, beta: 0.98 },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank', assetClass: 'index', seed: 57418.9, volatility: 0.46, decimals: 2, beta: 1.18 },
  { symbol: 'FINNIFTY', name: 'NIFTY Fin Services', assetClass: 'index', seed: 26184.4, volatility: 0.44, decimals: 2, beta: 1.12 },
  { symbol: 'NIFTYNXT50', name: 'NIFTY Next 50', assetClass: 'index', seed: 72406.1, volatility: 0.52, decimals: 2, beta: 1.15 },
  { symbol: 'MIDCAP150', name: 'NIFTY Midcap 150', assetClass: 'index', seed: 21648.7, volatility: 0.56, decimals: 2, beta: 1.22 },
  { symbol: 'SMALLCAP250', name: 'NIFTY Smallcap 250', assetClass: 'index', seed: 17284.2, volatility: 0.68, decimals: 2, beta: 1.34 },
  { symbol: 'INDIAVIX', name: 'India VIX', assetClass: 'index', seed: 12.42, volatility: 1.7, decimals: 2, beta: -3.6 },
];

/** NSE sectoral indices — drive the sector heatmap. */
export const SECTOR_INDICES: AssetDef[] = [
  { symbol: 'NIFTYBANK', name: 'Bank', assetClass: 'index', seed: 57418.9, volatility: 0.46, decimals: 2, beta: 1.18, sectorIndex: true },
  { symbol: 'NIFTYIT', name: 'IT', assetClass: 'index', seed: 43186.4, volatility: 0.62, decimals: 2, beta: 1.05, sectorIndex: true },
  { symbol: 'NIFTYAUTO', name: 'Auto', assetClass: 'index', seed: 28412.8, volatility: 0.54, decimals: 2, beta: 1.1, sectorIndex: true },
  { symbol: 'NIFTYPHARMA', name: 'Pharma', assetClass: 'index', seed: 23684.2, volatility: 0.44, decimals: 2, beta: 0.62, sectorIndex: true },
  { symbol: 'NIFTYFMCG', name: 'FMCG', assetClass: 'index', seed: 61248.5, volatility: 0.32, decimals: 2, beta: 0.48, sectorIndex: true },
  { symbol: 'NIFTYMETAL', name: 'Metal', assetClass: 'index', seed: 10486.3, volatility: 0.78, decimals: 2, beta: 1.32, sectorIndex: true },
  { symbol: 'NIFTYREALTY', name: 'Realty', assetClass: 'index', seed: 1084.6, volatility: 0.86, decimals: 2, beta: 1.42, sectorIndex: true },
  { symbol: 'NIFTYENERGY', name: 'Energy', assetClass: 'index', seed: 38412.7, volatility: 0.52, decimals: 2, beta: 0.92, sectorIndex: true },
  { symbol: 'NIFTYPSUBANK', name: 'PSU Bank', assetClass: 'index', seed: 7284.1, volatility: 0.82, decimals: 2, beta: 1.38, sectorIndex: true },
  { symbol: 'NIFTYMEDIA', name: 'Media', assetClass: 'index', seed: 1846.2, volatility: 0.92, decimals: 2, beta: 1.28, sectorIndex: true },
  { symbol: 'NIFTYINFRA', name: 'Infra', assetClass: 'index', seed: 9412.8, volatility: 0.48, decimals: 2, beta: 1.02, sectorIndex: true },
  { symbol: 'NIFTYCONSDUR', name: 'Cons. Durables', assetClass: 'index', seed: 42184.6, volatility: 0.56, decimals: 2, beta: 0.96, sectorIndex: true },
];

/** NSE large- and mid-cap cash-market names, priced in rupees. */
export const EQUITIES: AssetDef[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', assetClass: 'equity', seed: 1412.4, volatility: 0.5, decimals: 2, prefix: '₹', sector: 'Energy', beta: 1.02, avgVolume: 112.4, marketCap: '₹19.1 L Cr', exchange: 'NSE' },
  { symbol: 'TCS', name: 'Tata Consultancy Svcs', assetClass: 'equity', seed: 3186.7, volatility: 0.52, decimals: 2, prefix: '₹', sector: 'IT', beta: 0.86, avgVolume: 28.6, marketCap: '₹11.5 L Cr', exchange: 'NSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', assetClass: 'equity', seed: 1724.3, volatility: 0.44, decimals: 2, prefix: '₹', sector: 'Bank', beta: 1.04, avgVolume: 168.2, marketCap: '₹13.2 L Cr', exchange: 'NSE' },
  { symbol: 'INFY', name: 'Infosys', assetClass: 'equity', seed: 1548.2, volatility: 0.56, decimals: 2, prefix: '₹', sector: 'IT', beta: 0.92, avgVolume: 84.7, marketCap: '₹6.4 L Cr', exchange: 'NSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', assetClass: 'equity', seed: 1342.8, volatility: 0.46, decimals: 2, prefix: '₹', sector: 'Bank', beta: 1.08, avgVolume: 142.6, marketCap: '₹9.5 L Cr', exchange: 'NSE' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', assetClass: 'equity', seed: 1678.5, volatility: 0.5, decimals: 2, prefix: '₹', sector: 'Telecom', beta: 0.88, avgVolume: 62.4, marketCap: '₹10.1 L Cr', exchange: 'NSE' },
  { symbol: 'SBIN', name: 'State Bank of India', assetClass: 'equity', seed: 842.6, volatility: 0.58, decimals: 2, prefix: '₹', sector: 'PSU Bank', beta: 1.24, avgVolume: 186.3, marketCap: '₹7.5 L Cr', exchange: 'NSE' },
  { symbol: 'ITC', name: 'ITC', assetClass: 'equity', seed: 412.7, volatility: 0.36, decimals: 2, prefix: '₹', sector: 'FMCG', beta: 0.54, avgVolume: 214.8, marketCap: '₹5.2 L Cr', exchange: 'NSE' },
  { symbol: 'LT', name: 'Larsen & Toubro', assetClass: 'equity', seed: 3684.2, volatility: 0.52, decimals: 2, prefix: '₹', sector: 'Infra', beta: 1.14, avgVolume: 24.6, marketCap: '₹5.1 L Cr', exchange: 'NSE' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', assetClass: 'equity', seed: 2486.4, volatility: 0.34, decimals: 2, prefix: '₹', sector: 'FMCG', beta: 0.46, avgVolume: 21.2, marketCap: '₹5.8 L Cr', exchange: 'NSE' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', assetClass: 'equity', seed: 1892.6, volatility: 0.48, decimals: 2, prefix: '₹', sector: 'Bank', beta: 1.02, avgVolume: 38.4, marketCap: '₹3.8 L Cr', exchange: 'NSE' },
  { symbol: 'AXISBANK', name: 'Axis Bank', assetClass: 'equity', seed: 1168.3, volatility: 0.54, decimals: 2, prefix: '₹', sector: 'Bank', beta: 1.16, avgVolume: 96.8, marketCap: '₹3.6 L Cr', exchange: 'NSE' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', assetClass: 'equity', seed: 7240.5, volatility: 0.72, decimals: 2, prefix: '₹', sector: 'NBFC', beta: 1.34, avgVolume: 12.8, marketCap: '₹4.5 L Cr', exchange: 'NSE' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', assetClass: 'equity', seed: 12860.4, volatility: 0.54, decimals: 2, prefix: '₹', sector: 'Auto', beta: 1.06, avgVolume: 6.2, marketCap: '₹4.0 L Cr', exchange: 'NSE' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', assetClass: 'equity', seed: 682.4, volatility: 0.86, decimals: 2, prefix: '₹', sector: 'Auto', beta: 1.48, avgVolume: 168.4, marketCap: '₹2.5 L Cr', exchange: 'NSE' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', assetClass: 'equity', seed: 2984.6, volatility: 0.6, decimals: 2, prefix: '₹', sector: 'Auto', beta: 1.12, avgVolume: 28.4, marketCap: '₹3.7 L Cr', exchange: 'NSE' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', assetClass: 'equity', seed: 1824.2, volatility: 0.46, decimals: 2, prefix: '₹', sector: 'Pharma', beta: 0.62, avgVolume: 32.6, marketCap: '₹4.4 L Cr', exchange: 'NSE' },
  { symbol: 'CIPLA', name: 'Cipla', assetClass: 'equity', seed: 1542.8, volatility: 0.48, decimals: 2, prefix: '₹', sector: 'Pharma', beta: 0.58, avgVolume: 18.4, marketCap: '₹1.2 L Cr', exchange: 'NSE' },
  { symbol: 'DRREDDY', name: "Dr Reddy's Labs", assetClass: 'equity', seed: 1286.4, volatility: 0.52, decimals: 2, prefix: '₹', sector: 'Pharma', beta: 0.6, avgVolume: 22.8, marketCap: '₹1.1 L Cr', exchange: 'NSE' },
  { symbol: 'TITAN', name: 'Titan Company', assetClass: 'equity', seed: 3412.6, volatility: 0.58, decimals: 2, prefix: '₹', sector: 'Cons. Durables', beta: 1.04, avgVolume: 16.2, marketCap: '₹3.0 L Cr', exchange: 'NSE' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', assetClass: 'equity', seed: 2914.3, volatility: 0.5, decimals: 2, prefix: '₹', sector: 'Cons. Durables', beta: 0.82, avgVolume: 18.6, marketCap: '₹2.8 L Cr', exchange: 'NSE' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', assetClass: 'equity', seed: 2486.7, volatility: 1.18, decimals: 2, prefix: '₹', sector: 'Infra', beta: 1.68, avgVolume: 42.6, marketCap: '₹2.8 L Cr', exchange: 'NSE' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', assetClass: 'equity', seed: 1384.2, volatility: 0.94, decimals: 2, prefix: '₹', sector: 'Infra', beta: 1.44, avgVolume: 38.2, marketCap: '₹3.0 L Cr', exchange: 'NSE' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', assetClass: 'equity', seed: 248.6, volatility: 0.62, decimals: 2, prefix: '₹', sector: 'Energy', beta: 0.94, avgVolume: 186.4, marketCap: '₹3.1 L Cr', exchange: 'NSE' },
  { symbol: 'BPCL', name: 'Bharat Petroleum', assetClass: 'equity', seed: 324.8, volatility: 0.68, decimals: 2, prefix: '₹', sector: 'Energy', beta: 0.98, avgVolume: 124.6, marketCap: '₹1.4 L Cr', exchange: 'NSE' },
  { symbol: 'IOC', name: 'Indian Oil Corp', assetClass: 'equity', seed: 142.4, volatility: 0.64, decimals: 2, prefix: '₹', sector: 'Energy', beta: 0.92, avgVolume: 218.4, marketCap: '₹2.0 L Cr', exchange: 'NSE' },
  { symbol: 'NTPC', name: 'NTPC', assetClass: 'equity', seed: 368.2, volatility: 0.42, decimals: 2, prefix: '₹', sector: 'Power', beta: 0.72, avgVolume: 142.8, marketCap: '₹3.6 L Cr', exchange: 'NSE' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', assetClass: 'equity', seed: 324.6, volatility: 0.4, decimals: 2, prefix: '₹', sector: 'Power', beta: 0.66, avgVolume: 118.4, marketCap: '₹3.0 L Cr', exchange: 'NSE' },
  { symbol: 'COALINDIA', name: 'Coal India', assetClass: 'equity', seed: 412.8, volatility: 0.56, decimals: 2, prefix: '₹', sector: 'Metal', beta: 0.88, avgVolume: 96.4, marketCap: '₹2.5 L Cr', exchange: 'NSE' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', assetClass: 'equity', seed: 158.6, volatility: 0.84, decimals: 2, prefix: '₹', sector: 'Metal', beta: 1.38, avgVolume: 428.6, marketCap: '₹2.0 L Cr', exchange: 'NSE' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', assetClass: 'equity', seed: 968.4, volatility: 0.78, decimals: 2, prefix: '₹', sector: 'Metal', beta: 1.32, avgVolume: 42.6, marketCap: '₹2.4 L Cr', exchange: 'NSE' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', assetClass: 'equity', seed: 684.2, volatility: 0.82, decimals: 2, prefix: '₹', sector: 'Metal', beta: 1.36, avgVolume: 68.4, marketCap: '₹1.5 L Cr', exchange: 'NSE' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', assetClass: 'equity', seed: 11420.6, volatility: 0.52, decimals: 2, prefix: '₹', sector: 'Infra', beta: 0.98, avgVolume: 4.2, marketCap: '₹3.3 L Cr', exchange: 'NSE' },
  { symbol: 'GRASIM', name: 'Grasim Industries', assetClass: 'equity', seed: 2684.4, volatility: 0.54, decimals: 2, prefix: '₹', sector: 'Infra', beta: 1.02, avgVolume: 12.6, marketCap: '₹1.8 L Cr', exchange: 'NSE' },
  { symbol: 'WIPRO', name: 'Wipro', assetClass: 'equity', seed: 542.6, volatility: 0.58, decimals: 2, prefix: '₹', sector: 'IT', beta: 0.9, avgVolume: 98.4, marketCap: '₹2.8 L Cr', exchange: 'NSE' },
  { symbol: 'HCLTECH', name: 'HCL Technologies', assetClass: 'equity', seed: 1782.4, volatility: 0.54, decimals: 2, prefix: '₹', sector: 'IT', beta: 0.88, avgVolume: 36.2, marketCap: '₹4.8 L Cr', exchange: 'NSE' },
  { symbol: 'TECHM', name: 'Tech Mahindra', assetClass: 'equity', seed: 1624.8, volatility: 0.62, decimals: 2, prefix: '₹', sector: 'IT', beta: 0.96, avgVolume: 28.6, marketCap: '₹1.6 L Cr', exchange: 'NSE' },
  { symbol: 'NESTLEIND', name: 'Nestle India', assetClass: 'equity', seed: 2284.6, volatility: 0.34, decimals: 2, prefix: '₹', sector: 'FMCG', beta: 0.44, avgVolume: 8.4, marketCap: '₹2.2 L Cr', exchange: 'NSE' },
  { symbol: 'DMART', name: 'Avenue Supermarts', assetClass: 'equity', seed: 4120.8, volatility: 0.64, decimals: 2, prefix: '₹', sector: 'Retail', beta: 0.94, avgVolume: 6.8, marketCap: '₹2.7 L Cr', exchange: 'NSE' },
  { symbol: 'ETERNAL', name: 'Eternal (Zomato)', assetClass: 'equity', seed: 268.4, volatility: 1.12, decimals: 2, prefix: '₹', sector: 'Retail', beta: 1.52, avgVolume: 386.4, marketCap: '₹2.6 L Cr', exchange: 'NSE' },
  { symbol: 'PAYTM', name: 'One97 Communications', assetClass: 'equity', seed: 842.6, volatility: 1.42, decimals: 2, prefix: '₹', sector: 'NBFC', beta: 1.72, avgVolume: 42.8, marketCap: '₹53,600 Cr', exchange: 'NSE' },
  { symbol: 'DLF', name: 'DLF', assetClass: 'equity', seed: 784.2, volatility: 0.88, decimals: 2, prefix: '₹', sector: 'Realty', beta: 1.42, avgVolume: 38.6, marketCap: '₹1.9 L Cr', exchange: 'NSE' },
  { symbol: 'ZEEL', name: 'Zee Entertainment', assetClass: 'equity', seed: 118.4, volatility: 1.24, decimals: 2, prefix: '₹', sector: 'Media', beta: 1.38, avgVolume: 186.2, marketCap: '₹11,400 Cr', exchange: 'NSE' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance', assetClass: 'equity', seed: 1742.6, volatility: 0.5, decimals: 2, prefix: '₹', sector: 'Insurance', beta: 0.96, avgVolume: 14.2, marketCap: '₹1.7 L Cr', exchange: 'NSE' },
];

/** MCX commodity contracts, quoted in rupees. */
export const MCX_COMMODITIES: AssetDef[] = [
  { symbol: 'MCXGOLD', name: 'Gold', assetClass: 'metal', seed: 98450, volatility: 0.24, decimals: 0, prefix: '₹', beta: -0.3, unit: '10g' },
  { symbol: 'MCXSILVER', name: 'Silver', assetClass: 'metal', seed: 142800, volatility: 0.42, decimals: 0, prefix: '₹', beta: -0.1, unit: 'kg' },
  { symbol: 'MCXCOPPER', name: 'Copper', assetClass: 'metal', seed: 892.4, volatility: 0.38, decimals: 2, prefix: '₹', beta: 0.5, unit: 'kg' },
  { symbol: 'MCXZINC', name: 'Zinc', assetClass: 'metal', seed: 286.6, volatility: 0.42, decimals: 2, prefix: '₹', beta: 0.48, unit: 'kg' },
  { symbol: 'MCXALUMINI', name: 'Aluminium', assetClass: 'metal', seed: 248.2, volatility: 0.4, decimals: 2, prefix: '₹', beta: 0.46, unit: 'kg' },
  { symbol: 'MCXLEAD', name: 'Lead', assetClass: 'metal', seed: 184.6, volatility: 0.36, decimals: 2, prefix: '₹', beta: 0.4, unit: 'kg' },
  { symbol: 'MCXNICKEL', name: 'Nickel', assetClass: 'metal', seed: 1486.4, volatility: 0.52, decimals: 2, prefix: '₹', beta: 0.54, unit: 'kg' },
  { symbol: 'MCXCOTTON', name: 'Cotton', assetClass: 'metal', seed: 58400, volatility: 0.46, decimals: 0, prefix: '₹', beta: 0.3, unit: 'candy' },
];

export const MCX_ENERGY: AssetDef[] = [
  { symbol: 'MCXCRUDE', name: 'Crude Oil', assetClass: 'energy', seed: 6428.4, volatility: 0.64, decimals: 2, prefix: '₹', beta: 0.35, unit: 'bbl' },
  { symbol: 'MCXNATGAS', name: 'Natural Gas', assetClass: 'energy', seed: 248.6, volatility: 1.12, decimals: 2, prefix: '₹', beta: 0.2, unit: 'mmBtu' },
  { symbol: 'BRENT', name: 'Brent Crude (USD)', assetClass: 'energy', seed: 78.42, volatility: 0.6, decimals: 2, prefix: '$', beta: 0.35, unit: 'bbl' },
];

/** Rupee pairs as quoted onshore. */
export const FX: AssetDef[] = [
  { symbol: 'USDINR', name: 'US Dollar / Rupee', assetClass: 'fx', seed: 88.42, volatility: 0.1, decimals: 4, prefix: '₹', beta: -0.35 },
  { symbol: 'EURINR', name: 'Euro / Rupee', assetClass: 'fx', seed: 95.86, volatility: 0.14, decimals: 4, prefix: '₹', beta: -0.2 },
  { symbol: 'GBPINR', name: 'Pound / Rupee', assetClass: 'fx', seed: 112.48, volatility: 0.16, decimals: 4, prefix: '₹', beta: -0.2 },
  { symbol: 'JPYINR', name: 'Yen (100) / Rupee', assetClass: 'fx', seed: 58.42, volatility: 0.15, decimals: 4, prefix: '₹', beta: -0.25 },
  { symbol: 'AEDINR', name: 'Dirham / Rupee', assetClass: 'fx', seed: 24.08, volatility: 0.1, decimals: 4, prefix: '₹', beta: -0.3 },
  { symbol: 'DXY', name: 'Dollar Index', assetClass: 'fx', seed: 102.86, volatility: 0.14, decimals: 2, beta: -0.35 },
];

/** Indian sovereign curve plus short-end money-market rates. */
export const RATES: AssetDef[] = [
  { symbol: 'IN91D', name: '91-Day T-Bill', assetClass: 'rate', seed: 5.62, volatility: 0.2, decimals: 3, suffix: '%', beta: -0.3 },
  { symbol: 'IN1Y', name: 'G-Sec 1-Year', assetClass: 'rate', seed: 5.94, volatility: 0.22, decimals: 3, suffix: '%', beta: -0.32 },
  { symbol: 'IN2Y', name: 'G-Sec 2-Year', assetClass: 'rate', seed: 6.18, volatility: 0.24, decimals: 3, suffix: '%', beta: -0.36 },
  { symbol: 'IN5Y', name: 'G-Sec 5-Year', assetClass: 'rate', seed: 6.32, volatility: 0.24, decimals: 3, suffix: '%', beta: -0.4 },
  { symbol: 'IN10Y', name: 'G-Sec 10-Year', assetClass: 'rate', seed: 6.48, volatility: 0.24, decimals: 3, suffix: '%', beta: -0.44 },
  { symbol: 'IN30Y', name: 'G-Sec 30-Year', assetClass: 'rate', seed: 6.94, volatility: 0.22, decimals: 3, suffix: '%', beta: -0.4 },
  { symbol: 'MIBOR', name: 'Overnight MIBOR', assetClass: 'rate', seed: 5.58, volatility: 0.18, decimals: 3, suffix: '%', beta: -0.2 },
];

export const ALL_ASSETS: AssetDef[] = [
  ...INDICES,
  ...SECTOR_INDICES,
  ...EQUITIES,
  ...MCX_COMMODITIES,
  ...MCX_ENERGY,
  ...FX,
  ...RATES,
];

export const ASSET_BY_SYMBOL: Record<string, AssetDef> = Object.fromEntries(
  ALL_ASSETS.map((a) => [a.symbol, a]),
);

/** Default watchlist on first load. */
export const DEFAULT_WATCHLIST = [
  'NIFTY',
  'SENSEX',
  'BANKNIFTY',
  'INDIAVIX',
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'SBIN',
  'TATAMOTORS',
  'ADANIENT',
];

/**
 * Exchange-region mapping for the India map panel.
 *
 * `weight` is the share of listed-company activity notionally attributed to
 * each state, used to size the map's activity dots. Regional performance is
 * computed from the simulated quotes of the companies listed here.
 */
export interface StateNode {
  code: string;
  name: string;
  /** Position on the tile grid: column, row. */
  col: number;
  row: number;
  /** Headquarters of these simulated companies. */
  members: string[];
  weight: number;
  hub?: string;
}

export const INDIA_STATES: StateNode[] = [
  { code: 'JK', name: 'Jammu & Kashmir', col: 2, row: 0, members: [], weight: 0.2 },
  { code: 'LA', name: 'Ladakh', col: 3, row: 0, members: [], weight: 0.1 },
  { code: 'HP', name: 'Himachal Pradesh', col: 3, row: 1, members: [], weight: 0.3 },
  { code: 'PB', name: 'Punjab', col: 2, row: 1, members: [], weight: 0.8 },
  { code: 'UK', name: 'Uttarakhand', col: 4, row: 1, members: [], weight: 0.4 },
  { code: 'HR', name: 'Haryana', col: 3, row: 2, members: ['MARUTI'], weight: 1.4 },
  { code: 'DL', name: 'Delhi NCR', col: 4, row: 2, members: ['BHARTIARTL', 'DLF', 'PAYTM', 'IOC', 'NTPC', 'POWERGRID'], weight: 4.2, hub: 'NCR' },
  { code: 'RJ', name: 'Rajasthan', col: 2, row: 3, members: [], weight: 1.0 },
  { code: 'UP', name: 'Uttar Pradesh', col: 4, row: 3, members: [], weight: 1.6 },
  { code: 'BR', name: 'Bihar', col: 5, row: 3, members: [], weight: 0.6 },
  { code: 'SK', name: 'Sikkim', col: 6, row: 2, members: [], weight: 0.1 },
  { code: 'AS', name: 'Assam & NE', col: 7, row: 3, members: [], weight: 0.5 },
  { code: 'AR', name: 'Arunachal Pradesh', col: 7, row: 2, members: [], weight: 0.1 },
  { code: 'WB', name: 'West Bengal', col: 6, row: 4, members: ['ITC', 'COALINDIA'], weight: 2.4, hub: 'Kolkata' },
  { code: 'JH', name: 'Jharkhand', col: 5, row: 4, members: ['TATASTEEL'], weight: 1.2 },
  { code: 'MP', name: 'Madhya Pradesh', col: 3, row: 4, members: [], weight: 0.9 },
  { code: 'GJ', name: 'Gujarat', col: 1, row: 4, members: ['RELIANCE', 'ADANIENT', 'ADANIPORTS'], weight: 3.8, hub: 'Ahmedabad' },
  { code: 'CG', name: 'Chhattisgarh', col: 4, row: 5, members: [], weight: 0.5 },
  { code: 'OD', name: 'Odisha', col: 5, row: 5, members: [], weight: 0.7 },
  { code: 'MH', name: 'Maharashtra', col: 2, row: 5, members: ['TCS', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'LT', 'HINDUNILVR', 'KOTAKBANK', 'AXISBANK', 'M&M', 'SUNPHARMA', 'ULTRACEMCO', 'GRASIM', 'ONGC', 'BPCL', 'JSWSTEEL', 'HINDALCO', 'TATAMOTORS', 'DMART', 'SBILIFE', 'ZEEL', 'CIPLA'], weight: 9.6, hub: 'Mumbai · NSE/BSE' },
  { code: 'TG', name: 'Telangana', col: 3, row: 6, members: ['DRREDDY'], weight: 2.2, hub: 'Hyderabad' },
  { code: 'AP', name: 'Andhra Pradesh', col: 4, row: 7, members: [], weight: 1.1 },
  { code: 'GA', name: 'Goa', col: 1, row: 6, members: [], weight: 0.2 },
  { code: 'KA', name: 'Karnataka', col: 2, row: 7, members: ['INFY', 'WIPRO', 'TITAN', 'ETERNAL'], weight: 4.4, hub: 'Bengaluru' },
  { code: 'TN', name: 'Tamil Nadu', col: 3, row: 8, members: ['HCLTECH', 'TECHM'], weight: 3.0, hub: 'Chennai' },
  { code: 'KL', name: 'Kerala', col: 2, row: 9, members: [], weight: 0.9 },
  { code: 'PY', name: 'Puducherry', col: 4, row: 8, members: [], weight: 0.1 },
];

/** India macro prints. Reference figures, not part of the price simulation. */
export const MACRO_INDICATORS: Record<
  string,
  { name: string; value: string; change: string; tone: 'positive' | 'negative' | 'neutral'; date: string }[]
> = {
  prices: [
    { name: 'CPI Inflation (YoY)', value: '3.4%', change: '-0.20 vs prior', tone: 'positive', date: 'Aug 2026' },
    { name: 'WPI Inflation (YoY)', value: '1.8%', change: '+0.30 vs prior', tone: 'negative', date: 'Aug 2026' },
    { name: 'Core CPI', value: '4.1%', change: '+0.0 vs prior', tone: 'neutral', date: 'Aug 2026' },
    { name: 'Repo Rate', value: '5.50%', change: '+0.00 vs prior', tone: 'neutral', date: 'Aug 2026' },
  ],
  growth: [
    { name: 'GDP Growth (YoY)', value: '7.1%', change: '+0.30 vs prior', tone: 'positive', date: 'Q1 FY27' },
    { name: 'IIP Growth', value: '4.2%', change: '-0.60 vs prior', tone: 'negative', date: 'Jul 2026' },
    { name: 'Mfg PMI', value: '58.4', change: '+0.90 vs prior', tone: 'positive', date: 'Aug 2026' },
    { name: 'Services PMI', value: '61.2', change: '+0.40 vs prior', tone: 'positive', date: 'Aug 2026' },
  ],
  external: [
    { name: 'Forex Reserves', value: '$712.4B', change: '+$4.2B WoW', tone: 'positive', date: '05 Sep 2026' },
    { name: 'Trade Deficit', value: '$22.4B', change: '+$1.8B MoM', tone: 'negative', date: 'Aug 2026' },
    { name: 'GST Collections', value: '₹1.94 L Cr', change: '+8.4% YoY', tone: 'positive', date: 'Aug 2026' },
    { name: 'Fiscal Deficit', value: '4.4% GDP', change: '-0.10 vs target', tone: 'positive', date: 'FY27 BE' },
  ],
};
