import { ASSET_BY_SYMBOL, EQUITIES, SECTOR_INDICES } from '../data/assets';
import type { AssetQuote, MarketEvent } from '../data/types';
import { hashString } from '../simulation/random';

/**
 * Desk-view generator.
 *
 * Turns a tagged headline into a short positioning note on the two or three
 * stocks it most plausibly moves. Everything is derived from the event's own
 * impact map, so a story that pushes a name up never produces a sell call on
 * it. Variant selection is seeded from the event id, which keeps the note
 * stable across re-renders instead of reshuffling on every price tick.
 *
 * This is demo output. It is not investment advice and the UI says so.
 */

export type Action = 'BUY' | 'ACCUMULATE' | 'HOLD' | 'REDUCE' | 'SELL';
export type Conviction = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Suggestion {
  symbol: string;
  name: string;
  action: Action;
  conviction: Conviction;
  /** Expected move in %, carried over from the event impact. */
  expectedMove: number;
  cmp: number;
  target: number;
  stop: number;
  horizon: string;
  rationale: string;
}

/** Bias the note toward names a reader recognises. */
const MAJOR = new Set([
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL',
  'ITC', 'LT', 'HINDUNILVR', 'KOTAKBANK', 'AXISBANK', 'MARUTI', 'TATAMOTORS',
  'M&M', 'SUNPHARMA', 'TITAN', 'ADANIENT', 'ONGC', 'BPCL', 'TATASTEEL',
  'JSWSTEEL', 'WIPRO', 'HCLTECH', 'NTPC', 'COALINDIA', 'BAJFINANCE',
]);

function actionFor(move: number): Action {
  if (move >= 1.2) return 'BUY';
  if (move >= 0.3) return 'ACCUMULATE';
  if (move > -0.3) return 'HOLD';
  if (move > -1.2) return 'REDUCE';
  return 'SELL';
}

function convictionFor(move: number, credibility: number): Conviction {
  const score = Math.abs(move) * (credibility / 85);
  if (score >= 1.8) return 'HIGH';
  if (score >= 0.7) return 'MEDIUM';
  return 'LOW';
}

function horizonFor(category: string, seed: number): string {
  switch (category) {
    case 'Central Bank':
    case 'Fiscal':
    case 'Economy':
      return seed % 2 === 0 ? 'Positional · 2-4 weeks' : 'Positional · 1 month';
    case 'Earnings':
      return seed % 2 === 0 ? 'Swing · 3-5 sessions' : 'Swing · 1 week';
    case 'Flows':
    case 'Markets':
      return 'Intraday · 1-2 sessions';
    case 'Commodities':
    case 'Currency':
      return 'Swing · 1-2 weeks';
    default:
      return seed % 2 === 0 ? 'Swing · 3-5 sessions' : 'Positional · 2-4 weeks';
  }
}

/** category -> [bullish variants, bearish variants]. */
const RATIONALE: Record<string, [string[], string[]]> = {
  'Central Bank': [
    [
      'Lower funding costs support NIM and credit growth.',
      'Easier policy is directly supportive for rate-sensitive names.',
    ],
    [
      'Higher-for-longer rates keep pressure on rate-sensitive valuations.',
      'No easing in sight; cost of funds stays elevated.',
    ],
  ],
  Regulation: [
    ['Regulatory clarity removes a standing overhang.', 'Compliance certainty reduces the risk discount.'],
    ['Tighter norms compress volumes and fee income.', 'Rule change narrows the addressable book near term.'],
  ],
  Economy: [
    ['Softer prints improve the easing path and domestic demand.', 'Macro momentum supports earnings visibility.'],
    ['Sticky data delays easing; multiples at risk.', 'Slowing activity threatens volume assumptions.'],
  ],
  Fiscal: [
    ['Capex push feeds directly into the order book.', 'Government spend supports execution pipelines.'],
    ['Fiscal slippage risks crowding out private capex.', 'Spending cuts hit the order inflow outlook.'],
  ],
  Agriculture: [
    ['Better rural cash flows lift staples and tractor volumes.', 'Monsoon strength underpins rural demand recovery.'],
    ['Weak rural incomes hit discretionary and staples volumes.', 'Poor season pressures rural-facing demand.'],
  ],
  Commodities: [
    ['Higher realisations expand upstream margins.', 'Commodity strength flows through to producer spreads.'],
    ['Input cost inflation compresses downstream margins.', 'Raw material spike squeezes conversion spreads.'],
  ],
  Currency: [
    ['A weaker rupee adds directly to export realisations.', 'Currency move is accretive to dollar-linked revenue.'],
    ['Rupee weakness raises the import bill and working capital.', 'Currency pressure hits import-dependent cost lines.'],
  ],
  Flows: [
    ['Sustained institutional buying supports the large-cap tape.', 'Flow reversal is constructive for index heavyweights.'],
    ['Persistent FII selling keeps pressure on index heavyweights.', 'Outflows weigh most on high-ownership large caps.'],
  ],
  'Trade Policy': [
    ['Protection improves domestic pricing power.', 'Policy shift favours domestic capacity over imports.'],
    ['Tariff action threatens export volumes and realisations.', 'Trade friction clouds the export outlook.'],
  ],
  Deals: [
    ['Deal flow signals improving risk appetite for the name.', 'Transaction validates the valuation floor.'],
    ['Supply overhang from the block weighs near term.', 'Stake sale caps upside until absorbed.'],
  ],
  Earnings: [
    ['Beat on guidance supports consensus earnings upgrades.', 'Delivery on margins justifies a re-rating.'],
    ['Miss raises the risk of estimate cuts.', 'Guidance cut resets the earnings trajectory lower.'],
  ],
};

const FALLBACK: [string[], string[]] = [
  ['Newsflow is constructive for the name.', 'Development is a near-term positive.'],
  ['Newsflow is a near-term negative.', 'Development weighs on sentiment for the name.'],
];

/**
 * Sector overrides. A bank and a staples name should not be handed the same
 * sentence off the same headline, so where the sector has a specific
 * transmission channel, say that instead of the generic category line.
 */
const SECTOR_RATIONALE: Record<string, [string, string]> = {
  Bank: [
    'Lower cost of funds supports NIM and loan growth.',
    'Funding cost pressure and slower credit offtake weigh on NIM.',
  ],
  'PSU Bank': [
    'Rate relief and treasury gains aid PSU bank earnings.',
    'Treasury mark-to-market losses hit book value.',
  ],
  IT: [
    'Dollar revenue and deal wins support margin delivery.',
    'Discretionary spend weakness clouds the growth outlook.',
  ],
  Auto: [
    'Demand recovery and easing input costs aid volumes.',
    'Demand softness and cost pressure hit realisations.',
  ],
  Pharma: [
    'Defensive earnings and US pricing stability support the name.',
    'Pricing pressure and regulatory risk cap upside.',
  ],
  FMCG: [
    'Rural recovery and benign input costs lift volume growth.',
    'Input inflation and weak rural demand squeeze volumes.',
  ],
  Metal: [
    'Firmer commodity prices expand realisations and spreads.',
    'Falling prices compress spreads on high fixed costs.',
  ],
  Realty: [
    'Lower mortgage rates revive housing absorption.',
    'Higher rates and affordability strain slow pre-sales.',
  ],
  Energy: [
    'Higher crude realisations expand upstream margins.',
    'Marketing margin compression weighs on the refining complex.',
  ],
  Infra: [
    'Order inflow visibility supports the execution pipeline.',
    'Order deferrals cloud the execution runway.',
  ],
  NBFC: [
    'Cheaper wholesale funding aids spread expansion.',
    'Tighter funding and asset-quality risk pressure spreads.',
  ],
  Telecom: [
    'ARPU momentum supports the cash flow trajectory.',
    'Tariff and capex pressure weigh on free cash flow.',
  ],
};

function rationaleFor(
  category: string,
  sector: string | undefined,
  bullish: boolean,
  seed: number,
  used: Set<string>,
): string {
  const candidates: string[] = [];

  // Prefer the sector-specific transmission channel when there is one.
  const sectorLine = sector ? SECTOR_RATIONALE[sector] : undefined;
  if (sectorLine) candidates.push(sectorLine[bullish ? 0 : 1]);

  const pair = RATIONALE[category] ?? FALLBACK;
  const pool = bullish ? pair[0] : pair[1];
  for (let i = 0; i < pool.length; i += 1) {
    candidates.push(pool[(seed + i) % pool.length]);
  }
  candidates.push(...(bullish ? FALLBACK[0] : FALLBACK[1]));

  // Two stocks in one note should never read identically, even when they
  // share a sector — step to the next distinct line instead.
  const fresh = candidates.find((c) => !used.has(c));
  const chosen = fresh ?? candidates[0];
  used.add(chosen);
  return chosen;
}

/** Sector index -> its constituent equities, via the shared sector label. */
function equitiesForSectorIndex(symbol: string): string[] {
  const idx = SECTOR_INDICES.find((s) => s.symbol === symbol);
  if (!idx) return [];
  return EQUITIES.filter((e) => e.sector === idx.name)
    .sort((a, b) => (MAJOR.has(b.symbol) ? 1 : 0) - (MAJOR.has(a.symbol) ? 1 : 0))
    .map((e) => e.symbol);
}

export function deriveSuggestions(
  event: MarketEvent,
  quotes: Record<string, AssetQuote>,
  max = 3,
): Suggestion[] {
  const seed = hashString(event.id);

  // 1. Direct equity hits, strongest first.
  const direct = Object.entries(event.impact)
    .filter(([sym]) => ASSET_BY_SYMBOL[sym]?.assetClass === 'equity')
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const picked = new Map<string, number>(direct);

  // 2. If the story only touched indices, read through to the heavyweights of
  //    each sector index it moved. An index move implies a *larger* move in a
  //    high-beta constituent and a smaller one in a defensive name, so scale
  //    by beta rather than handing every stock the same number.
  const readThrough = (indexMove: number, symbol: string) => {
    const beta = ASSET_BY_SYMBOL[symbol]?.beta ?? 1;
    return Number((indexMove * 1.35 * beta).toFixed(3));
  };

  if (picked.size < 2) {
    for (const [sym, move] of Object.entries(event.impact)) {
      if (!SECTOR_INDICES.some((s) => s.symbol === sym)) continue;
      for (const eq of equitiesForSectorIndex(sym).slice(0, 2)) {
        if (!picked.has(eq)) picked.set(eq, readThrough(move, eq));
      }
      if (picked.size >= max) break;
    }
  }

  // 3. Still thin: let a broad-index move stand in for its largest names.
  if (picked.size < 2 && event.impact.NIFTY !== undefined) {
    for (const eq of ['RELIANCE', 'HDFCBANK', 'ICICIBANK']) {
      if (!picked.has(eq)) picked.set(eq, readThrough(event.impact.NIFTY, eq));
      if (picked.size >= max) break;
    }
  }

  const ranked = [...picked.entries()]
    .sort((a, b) => {
      // Recognisable names first when magnitudes are comparable.
      const weight = (s: string, v: number) => Math.abs(v) + (MAJOR.has(s) ? 0.35 : 0);
      return weight(b[0], b[1]) - weight(a[0], a[1]);
    })
    .slice(0, max);

  const usedRationales = new Set<string>();

  return ranked.map(([symbol, move], i) => {
    const def = ASSET_BY_SYMBOL[symbol];
    const cmp = quotes[symbol]?.price ?? def?.seed ?? 0;
    const bullish = move > 0;

    // Target tracks the expected move; the stop sits on the other side at
    // roughly half the distance, so the note carries a sane risk/reward.
    const target = cmp * (1 + move / 100);
    const stop = cmp * (1 - (Math.abs(move) / 100) * 0.55 * (bullish ? 1 : -1));

    return {
      symbol,
      name: def?.name ?? symbol,
      action: actionFor(move),
      conviction: convictionFor(move, event.credibility),
      expectedMove: move,
      cmp,
      target,
      stop,
      horizon: horizonFor(event.category, seed + i),
      // Mix the symbol into the seed so two stocks on the same story never
      // land on the same sentence.
      rationale: rationaleFor(
        event.category,
        def?.sector,
        bullish,
        seed + hashString(symbol) + i,
        usedRationales,
      ),
    };
  });
}

export function actionTone(action: Action): 'up' | 'down' | 'flat' {
  if (action === 'BUY' || action === 'ACCUMULATE') return 'up';
  if (action === 'SELL' || action === 'REDUCE') return 'down';
  return 'flat';
}
