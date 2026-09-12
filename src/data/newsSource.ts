import type { MarketEvent } from './types';

/**
 * News adapter.
 *
 * Talks to the local news API (`server/`), which polls Indian publisher RSS
 * feeds and tags each headline with the symbols it should move. If the API
 * is unreachable the app falls back to the offline mock generator, so the
 * dashboard is never dependent on the network being up.
 */

export interface NewsFetchResult {
  events: MarketEvent[];
  status: {
    events: number;
    lastPoll: number;
    ageSeconds: number | null;
    feeds: number;
    errors: string[];
  };
}

/** 'degraded' = the API is up but every feed is blocked or empty. */
export type NewsMode = 'live' | 'degraded' | 'offline';

const ENDPOINT = '/api/news';
const TIMEOUT_MS = 8000;

export async function fetchLiveNews(limit = 60): Promise<NewsFetchResult | null> {
  try {
    const res = await fetch(`${ENDPOINT}?limit=${limit}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const body = (await res.json()) as NewsFetchResult;
    if (!Array.isArray(body?.events)) return null;

    // Defensive: the engine only applies impacts for symbols it knows, but
    // make sure the shape is what the UI expects before handing it over.
    const events = body.events
      .filter((e) => e && e.id && e.title && e.impact)
      .map((e) => ({
        ...e,
        affectedAssets: e.affectedAssets ?? Object.keys(e.impact),
        regions: e.regions ?? [],
      }));

    return { events, status: body.status };
  } catch {
    return null;
  }
}

export async function refreshLiveNews(): Promise<boolean> {
  try {
    const res = await fetch('/api/refresh', {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
