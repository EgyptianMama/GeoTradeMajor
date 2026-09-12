import { XMLParser } from 'fast-xml-parser';
import { FEEDS, type FeedSource } from './feeds.js';
import { tag } from './tagger.js';

/** Mirrors src/data/types.ts MarketEvent so the frontend contract is unchanged. */
export interface MarketEvent {
  id: string;
  title: string;
  source: string;
  url: string;
  category: string;
  categoryColor: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  credibility: number;
  regions: string[];
  affectedAssets: string[];
  impact: Record<string, number>;
  timestamp: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Central Bank': '#3b82f6',
  Regulation: '#a855f7',
  Economy: '#eab308',
  Fiscal: '#eab308',
  Agriculture: '#22c55e',
  Commodities: '#f97316',
  Currency: '#06b6d4',
  Flows: '#8b5cf6',
  'Trade Policy': '#f97316',
  Deals: '#ec4899',
  Earnings: '#22c55e',
  Markets: '#3b82f6',
  Business: '#64748b',
  Corporate: '#64748b',
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const MAX_EVENTS = 120;
const FETCH_TIMEOUT_MS = 12_000;

let cache: MarketEvent[] = [];
let lastPoll = 0;
let lastErrors: string[] = [];

export function getEvents(): MarketEvent[] {
  return cache;
}

export function getStatus() {
  return {
    events: cache.length,
    lastPoll,
    ageSeconds: lastPoll ? Math.round((Date.now() - lastPoll) / 1000) : null,
    feeds: FEEDS.length,
    errors: lastErrors,
  };
}

function stripHtml(s: string): string {
  return String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Stable id from the article link, so repeated polls do not duplicate rows. */
function hashId(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** Loose key for cross-publisher dedupe: same story, different outlet. */
function dedupeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6)
    .sort()
    .join('-');
}

async function fetchFeed(feed: FeedSource): Promise<MarketEvent[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        // Moneycontrol, Business Standard and NDTV Profit sit behind bot
        // filters that 403 anything identifying itself as a crawler.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    const doc = parser.parse(xml);
    const rawItems = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    const out: MarketEvent[] = [];
    for (const item of items) {
      const title = stripHtml(item?.title?.['#text'] ?? item?.title);
      if (!title) continue;

      const link =
        typeof item?.link === 'string'
          ? item.link
          : (item?.link?.['@_href'] ?? item?.guid?.['#text'] ?? item?.guid ?? '');

      const dateStr =
        item?.pubDate ?? item?.published ?? item?.updated ?? item?.['dc:date'];
      const ts = dateStr ? Date.parse(String(dateStr)) : Date.now();

      const t = tag(title, feed.category);

      // A headline that moves nothing is not useful on this dashboard.
      if (Object.keys(t.impact).length === 0) continue;

      out.push({
        id: `ev-${hashId(String(link) || title)}`,
        title,
        source: feed.name,
        url: String(link),
        category: t.category,
        categoryColor: CATEGORY_COLORS[t.category] ?? '#64748b',
        sentiment: t.sentiment,
        credibility: feed.credibility,
        regions: t.regions,
        affectedAssets: Object.keys(t.impact),
        impact: t.impact,
        timestamp: Number.isFinite(ts) ? ts : Date.now(),
      });
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

export async function poll(): Promise<void> {
  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));

  const errors: string[] = [];
  const collected: MarketEvent[] = [];

  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') collected.push(...r.value);
    else errors.push(`${FEEDS[i].id}: ${String(r.reason?.message ?? r.reason)}`);
  });

  // Dedupe: prefer the higher-credibility source for the same story.
  const byKey = new Map<string, MarketEvent>();
  for (const ev of collected) {
    const key = dedupeKey(ev.title);
    const existing = byKey.get(key);
    if (!existing || ev.credibility > existing.credibility) byKey.set(key, ev);
  }

  cache = [...byKey.values()]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_EVENTS);

  lastPoll = Date.now();
  lastErrors = errors;

  console.log(
    `[poller] ${cache.length} tagged events from ${FEEDS.length - errors.length}/${FEEDS.length} feeds` +
      (errors.length ? ` — failed: ${errors.join('; ')}` : ''),
  );
}

export function startPolling(): void {
  poll().catch((e) => console.error('[poller] initial poll failed', e));
  setInterval(() => {
    poll().catch((e) => console.error('[poller] poll failed', e));
  }, POLL_INTERVAL_MS);
}
