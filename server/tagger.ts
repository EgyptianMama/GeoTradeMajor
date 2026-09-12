/**
 * Headline → market impact.
 *
 * Turns a plain news headline into the symbols it likely moves and a
 * signed expected % move for each. This is deliberately a small, readable
 * rule engine rather than an ML model: it is the piece you would swap for
 * Marketaux entity tagging, or for your own model, without touching
 * anything else in the stack.
 */

export type Sentiment = 'positive' | 'negative' | 'neutral';

/** Company aliases → NSE symbol. Matched case-insensitively on word boundaries. */
const COMPANY_ALIASES: Record<string, string[]> = {
  RELIANCE: ['reliance', 'ril', 'jio', 'reliance industries'],
  TCS: ['tcs', 'tata consultancy'],
  HDFCBANK: ['hdfc bank', 'hdfcbank'],
  INFY: ['infosys', 'infy'],
  ICICIBANK: ['icici bank', 'icicibank', 'icici'],
  BHARTIARTL: ['bharti airtel', 'airtel', 'bharti'],
  SBIN: ['state bank of india', 'sbi', 'sbin'],
  ITC: ['itc'],
  LT: ['larsen', 'l&t', 'larsen & toubro', 'larsen and toubro'],
  HINDUNILVR: ['hindustan unilever', 'hul', 'hindunilvr'],
  KOTAKBANK: ['kotak mahindra', 'kotak bank', 'kotak'],
  AXISBANK: ['axis bank', 'axisbank'],
  BAJFINANCE: ['bajaj finance', 'bajfinance'],
  MARUTI: ['maruti', 'maruti suzuki'],
  TATAMOTORS: ['tata motors', 'tatamotors', 'jlr', 'jaguar land rover'],
  'M&M': ['mahindra & mahindra', 'mahindra and mahindra', 'm&m'],
  SUNPHARMA: ['sun pharma', 'sun pharmaceutical'],
  CIPLA: ['cipla'],
  DRREDDY: ['dr reddy', "dr reddy's", 'dr. reddy'],
  TITAN: ['titan company', 'titan'],
  ASIANPAINT: ['asian paints', 'asianpaint'],
  ADANIENT: ['adani enterprises', 'adani group', 'adani'],
  ADANIPORTS: ['adani ports', 'adaniports', 'mundra'],
  ONGC: ['ongc', 'oil and natural gas'],
  BPCL: ['bpcl', 'bharat petroleum'],
  IOC: ['ioc', 'indian oil', 'indianoil'],
  NTPC: ['ntpc'],
  POWERGRID: ['power grid', 'powergrid'],
  COALINDIA: ['coal india', 'coalindia'],
  TATASTEEL: ['tata steel', 'tatasteel'],
  JSWSTEEL: ['jsw steel', 'jswsteel', 'jsw'],
  HINDALCO: ['hindalco'],
  ULTRACEMCO: ['ultratech', 'ultracemco'],
  GRASIM: ['grasim'],
  WIPRO: ['wipro'],
  HCLTECH: ['hcl tech', 'hcltech', 'hcl technologies'],
  TECHM: ['tech mahindra', 'techm'],
  NESTLEIND: ['nestle india', 'nestle'],
  DMART: ['dmart', 'avenue supermarts', 'd-mart'],
  ETERNAL: ['zomato', 'eternal', 'blinkit'],
  PAYTM: ['paytm', 'one97'],
  DLF: ['dlf'],
  ZEEL: ['zee entertainment', 'zeel', 'zee'],
  SBILIFE: ['sbi life', 'sbilife'],
};

/** Sector keywords → NSE sectoral index, plus the broad names they drag along. */
const SECTOR_KEYWORDS: Record<string, { index: string; members: string[] }> = {
  bank: { index: 'NIFTYBANK', members: ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK'] },
  banking: { index: 'NIFTYBANK', members: ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK'] },
  lender: { index: 'NIFTYBANK', members: ['HDFCBANK', 'ICICIBANK', 'AXISBANK'] },
  'psu bank': { index: 'NIFTYPSUBANK', members: ['SBIN'] },
  it: { index: 'NIFTYIT', members: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'] },
  software: { index: 'NIFTYIT', members: ['TCS', 'INFY', 'HCLTECH'] },
  'tech sector': { index: 'NIFTYIT', members: ['TCS', 'INFY', 'WIPRO'] },
  auto: { index: 'NIFTYAUTO', members: ['MARUTI', 'TATAMOTORS', 'M&M'] },
  automobile: { index: 'NIFTYAUTO', members: ['MARUTI', 'TATAMOTORS', 'M&M'] },
  pharma: { index: 'NIFTYPHARMA', members: ['SUNPHARMA', 'CIPLA', 'DRREDDY'] },
  pharmaceutical: { index: 'NIFTYPHARMA', members: ['SUNPHARMA', 'CIPLA', 'DRREDDY'] },
  fmcg: { index: 'NIFTYFMCG', members: ['ITC', 'HINDUNILVR', 'NESTLEIND'] },
  metal: { index: 'NIFTYMETAL', members: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO'] },
  steel: { index: 'NIFTYMETAL', members: ['TATASTEEL', 'JSWSTEEL'] },
  realty: { index: 'NIFTYREALTY', members: ['DLF'] },
  'real estate': { index: 'NIFTYREALTY', members: ['DLF'] },
  housing: { index: 'NIFTYREALTY', members: ['DLF'] },
  energy: { index: 'NIFTYENERGY', members: ['RELIANCE', 'ONGC'] },
  power: { index: 'NIFTYINFRA', members: ['NTPC', 'POWERGRID'] },
  infra: { index: 'NIFTYINFRA', members: ['LT', 'ULTRACEMCO'] },
  infrastructure: { index: 'NIFTYINFRA', members: ['LT', 'ULTRACEMCO'] },
  cement: { index: 'NIFTYINFRA', members: ['ULTRACEMCO', 'GRASIM'] },
  media: { index: 'NIFTYMEDIA', members: ['ZEEL'] },
  telecom: { index: 'NIFTYINFRA', members: ['BHARTIARTL'] },
};

/** Macro themes with hand-written cross-asset consequences. */
interface MacroRule {
  match: RegExp;
  category: string;
  /** Direction hint; when set, overrides lexicon sentiment. */
  sentiment?: Sentiment;
  /** symbol -> relative weight. Scaled by the computed magnitude. */
  weights: Record<string, number>;
  regions?: string[];
}

const MACRO_RULES: MacroRule[] = [
  {
    match: /\b(rbi|mpc|repo rate|monetary policy|reverse repo|crr|slr)\b/i,
    category: 'Central Bank',
    weights: { NIFTYBANK: 1.2, NIFTYPSUBANK: 1.3, NIFTYREALTY: 1.1, NIFTY: 0.5, IN10Y: -0.9, IN2Y: -1.0, SBIN: 1.0, HDFCBANK: 0.9, DLF: 1.0 },
    regions: ['MH'],
  },
  {
    match: /\b(sebi|regulator|circular|f&o|derivative[s]? norm|margin norm)\b/i,
    category: 'Regulation',
    weights: { NIFTY: 0.4, PAYTM: 0.9, BAJFINANCE: 0.7, NIFTYBANK: 0.5 },
    regions: ['MH'],
  },
  {
    match: /\b(inflation|cpi|wpi|price rise|retail inflation)\b/i,
    category: 'Economy',
    weights: { NIFTY: 0.5, IN10Y: 0.8, NIFTYFMCG: 0.6, NIFTYBANK: 0.6 },
  },
  {
    match: /\b(gst|tax collection|fiscal deficit|budget|capex)\b/i,
    category: 'Fiscal',
    weights: { NIFTY: 0.6, NIFTYINFRA: 1.1, LT: 1.0, ULTRACEMCO: 0.8, NIFTYPSUBANK: 0.7 },
    regions: ['DL'],
  },
  {
    match: /\b(monsoon|rainfall|kharif|rabi|sowing|imd)\b/i,
    category: 'Agriculture',
    weights: { NIFTYFMCG: 1.0, ITC: 0.8, HINDUNILVR: 0.8, 'M&M': 1.1, NIFTYAUTO: 0.5 },
  },
  {
    match: /\b(crude|brent|opec|oil price|petrol|diesel)\b/i,
    category: 'Commodities',
    weights: { MCXCRUDE: 1.4, BRENT: 1.3, ONGC: 1.0, BPCL: -0.9, IOC: -0.9, USDINR: 0.4, NIFTY: -0.3 },
  },
  {
    match: /\b(rupee|forex reserve|usd\/inr|dollar index|currency)\b/i,
    category: 'Currency',
    weights: { USDINR: 1.0, NIFTYIT: 0.7, TCS: 0.6, INFY: 0.6, BPCL: -0.5, IOC: -0.5 },
  },
  {
    match: /\b(fii|fpi|dii|foreign (investor|inflow|outflow)|institutional flow)\b/i,
    category: 'Flows',
    weights: { NIFTY: 1.0, BANKNIFTY: 1.1, MIDCAP150: 1.2, SMALLCAP250: 1.3, NIFTYNXT50: 1.0 },
  },
  {
    match: /\b(gold|silver|bullion|mcx)\b/i,
    category: 'Commodities',
    weights: { MCXGOLD: 1.2, MCXSILVER: 1.4, TITAN: -0.4 },
  },
  {
    // Services/IT trade friction only — "tariff" alone is too broad, it fires
    // on goods stories that have nothing to do with software exporters.
    match: /\b(h-?1b|work visa|outsourcing|it export|software export|services trade)\b/i,
    category: 'Trade Policy',
    weights: { NIFTYIT: 1.1, TCS: 0.9, INFY: 1.0, WIPRO: 0.9, HCLTECH: 0.8, NIFTY: 0.3 },
  },
  {
    // Goods tariffs and trade agreements hit exporters and autos instead.
    match: /\b(tariff|customs duty|import duty|fta|free trade agreement|anti-dumping|safeguard duty)\b/i,
    category: 'Trade Policy',
    weights: { NIFTY: 0.4, NIFTYMETAL: 0.9, TATASTEEL: 0.7, JSWSTEEL: 0.7, NIFTYAUTO: 0.8, MARUTI: 0.6, TATAMOTORS: 0.6 },
  },
  {
    match: /\b(ipo|listing|block deal|stake sale|qip|offer for sale|ofs)\b/i,
    category: 'Deals',
    weights: { NIFTY: 0.3, MIDCAP150: 0.6, SMALLCAP250: 0.7 },
  },
  {
    match: /\b(earnings|results|q[1-4] (results|earnings)|profit|revenue|guidance|net interest income|nii)\b/i,
    category: 'Earnings',
    weights: { NIFTY: 0.4 },
  },
];

/** Finance-flavoured sentiment lexicon. Weights are rough magnitudes. */
const POSITIVE: Record<string, number> = {
  surge: 1.4, surges: 1.4, soar: 1.5, soars: 1.5, rally: 1.3, rallies: 1.3,
  jump: 1.2, jumps: 1.2, gain: 1.0, gains: 1.0, rise: 0.9, rises: 0.9,
  beat: 1.2, beats: 1.2, upgrade: 1.3, upgrades: 1.3, record: 1.1,
  profit: 0.9, growth: 0.9, boost: 1.1, boosts: 1.1, strong: 1.0,
  outperform: 1.2, bullish: 1.3, high: 0.7, expands: 0.9, approval: 1.0,
  wins: 1.1, win: 1.1, stimulus: 1.2, cut: 0.6, recovery: 1.0, revive: 1.0,
  inflow: 1.1, inflows: 1.1, buyback: 1.1, dividend: 0.8, hike: 0.7,
};

const NEGATIVE: Record<string, number> = {
  plunge: 1.5, plunges: 1.5, crash: 1.6, crashes: 1.6, slump: 1.3, slumps: 1.3,
  fall: 1.0, falls: 1.0, drop: 1.0, drops: 1.0, decline: 0.9, declines: 0.9,
  miss: 1.2, misses: 1.2, downgrade: 1.3, downgrades: 1.3, loss: 1.1, losses: 1.1,
  weak: 1.0, bearish: 1.3, probe: 1.2, fraud: 1.6, ban: 1.4, penalty: 1.2,
  fine: 1.0, default: 1.5, selloff: 1.4, 'sell-off': 1.4, outflow: 1.1,
  outflows: 1.1, slowdown: 1.1, cuts: 0.8, layoff: 1.2, layoffs: 1.2,
  warning: 1.1, risk: 0.7, concern: 0.8, concerns: 0.8, delay: 0.9,
  disruption: 1.2, strike: 1.0, recall: 1.2, curb: 1.0, curbs: 1.0,
  tumble: 1.4, tumbles: 1.4, drag: 0.9, drags: 0.9, pressure: 0.8,
};

export interface TagResult {
  sentiment: Sentiment;
  /** 0..1 confidence-ish strength used to scale impacts. */
  strength: number;
  category: string;
  regions: string[];
  impact: Record<string, number>;
}

function wordSet(text: string): string[] {
  return text.toLowerCase().match(/[a-z&'-]+/g) ?? [];
}

function scoreSentiment(text: string): { sentiment: Sentiment; strength: number } {
  const words = wordSet(text);
  let pos = 0;
  let neg = 0;
  for (const w of words) {
    if (POSITIVE[w]) pos += POSITIVE[w];
    if (NEGATIVE[w]) neg += NEGATIVE[w];
  }

  // "rate cut" and "tax cut" read positive; "job cuts" reads negative.
  if (/\b(rate|repo|tax|duty)\s+cut/i.test(text)) pos += 1.2;
  if (/\b(job|staff|workforce)\s+cut/i.test(text)) neg += 1.2;
  if (/\bnot\s+(beat|rise|gain)/i.test(text)) neg += 0.8;

  const net = pos - neg;
  const total = pos + neg;
  if (total === 0 || Math.abs(net) < 0.35) {
    return { sentiment: 'neutral', strength: 0.25 };
  }
  return {
    sentiment: net > 0 ? 'positive' : 'negative',
    strength: Math.min(1, Math.abs(net) / 3),
  };
}

function findCompanies(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  const hits: string[] = [];
  for (const [symbol, aliases] of Object.entries(COMPANY_ALIASES)) {
    for (const alias of aliases) {
      // Word-boundary match so "ioc" does not fire inside "associate".
      const re = new RegExp(`[^a-z0-9&]${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9&]`, 'i');
      if (re.test(lower)) {
        hits.push(symbol);
        break;
      }
    }
  }
  return hits;
}

function findSectors(text: string): { index: string; members: string[] }[] {
  const lower = ` ${text.toLowerCase()} `;
  const out: { index: string; members: string[] }[] = [];
  const seen = new Set<string>();
  for (const [kw, spec] of Object.entries(SECTOR_KEYWORDS)) {
    const re = new RegExp(`[^a-z]${kw}[^a-z]`, 'i');
    if (re.test(lower) && !seen.has(spec.index)) {
      seen.add(spec.index);
      out.push(spec);
    }
  }
  return out;
}

/**
 * Produce the expected % move per symbol for one headline.
 *
 * Magnitudes are intentionally modest — a single headline nudges the tape,
 * it does not dictate it.
 */
export function tag(title: string, fallbackCategory: string): TagResult {
  const { sentiment, strength } = scoreSentiment(title);
  const sign = sentiment === 'negative' ? -1 : sentiment === 'positive' ? 1 : 0;

  const impact: Record<string, number> = {};
  const add = (symbol: string, weight: number) => {
    const delta = weight * strength * 1.8 * (sign === 0 ? 0.2 : sign);
    impact[symbol] = Number(((impact[symbol] ?? 0) + delta).toFixed(3));
  };

  let category = fallbackCategory;
  const regions = new Set<string>();

  // 1. Macro rules carry their own cross-asset consequences.
  for (const rule of MACRO_RULES) {
    if (!rule.match.test(title)) continue;
    category = rule.category;
    for (const [symbol, weight] of Object.entries(rule.weights)) add(symbol, weight);
    rule.regions?.forEach((r) => regions.add(r));
  }

  // 2. Named companies take the largest single hit.
  const companies = findCompanies(title);
  for (const symbol of companies) add(symbol, 2.2);

  // 3. Sector mentions move the index and drag its heavyweights.
  for (const spec of findSectors(title)) {
    add(spec.index, 1.1);
    for (const m of spec.members) add(m, 0.5);
  }

  // 4. A story with named companies but no index exposure still nudges Nifty.
  if (companies.length > 0 && impact.NIFTY === undefined) add('NIFTY', 0.2);

  // Trim negligible entries so the UI is not littered with 0.00% chips.
  for (const [k, v] of Object.entries(impact)) {
    if (Math.abs(v) < 0.05) delete impact[k];
  }

  return {
    sentiment,
    strength,
    category,
    regions: [...regions],
    impact,
  };
}
