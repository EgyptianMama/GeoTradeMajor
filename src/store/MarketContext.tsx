import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { marketSimulator } from '../simulation/marketSimulator';
import { useSyncExternalStore } from 'react';
import type { AssetQuote, MarketSnapshot } from '../data/types';
import { DEFAULT_WATCHLIST } from '../data/assets';
import { fetchLiveNews, refreshLiveNews, type NewsMode } from '../data/newsSource';
import { SIM_CONFIG } from '../simulation/config';

interface MarketContextValue {
  snapshot: MarketSnapshot;
  running: boolean;
  toggleRunning: () => void;
  speed: number;
  setSpeed: (n: number) => void;
  injectEvent: () => void;
  selected: string | null;
  setSelected: (symbol: string | null) => void;
  watchlist: string[];
  toggleWatch: (symbol: string) => void;
  /** Symbols currently being pushed by an active event. */
  pressured: Set<string>;
  /** Whether the feed is real RSS news or the offline mock generator. */
  newsMode: NewsMode;
  newsStatus: { feeds: number; errors: string[]; ageSeconds: number | null } | null;
  refreshNews: () => Promise<void>;
  refreshing: boolean;
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    marketSimulator.subscribe.bind(marketSimulator),
    marketSimulator.getSnapshot,
    marketSimulator.getSnapshot,
  );

  const [running, setRunning] = useState(true);
  const [speed, setSpeedState] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [newsMode, setNewsMode] = useState<NewsMode>('offline');
  const [newsStatus, setNewsStatus] =
    useState<MarketContextValue['newsStatus']>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    marketSimulator.start();
    return () => marketSimulator.stop();
  }, []);

  // Poll the local news API. If it is unreachable the simulator keeps using
  // its offline generator, so the dashboard works with the backend down.
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let warmTimer: ReturnType<typeof setTimeout> | undefined;

    const pull = async () => {
      const result = await fetchLiveNews(60);
      if (cancelled) return;

      if (!result) {
        setNewsMode('offline');
        return;
      }

      // A host that spins down when idle (Render's free tier does) serves the
      // first request from a process that has not finished its first poll.
      // Retry quickly rather than settling into the offline generator.
      if (result.status && result.status.warmed === false) {
        setNewsMode('offline');
        warmTimer = setTimeout(pull, 4000);
        return;
      }

      // An empty payload from a warmed API means every feed failed, which
      // usually means bot-filtering from a datacentre IP. Keep the offline
      // generator running rather than showing LIVE over mock rows.
      marketSimulator.ingestLiveEvents(result.events);
      setNewsMode(result.events.length > 0 ? 'live' : 'degraded');
      setNewsStatus({
        feeds: result.status?.feeds ?? 0,
        errors: result.status?.errors ?? [],
        ageSeconds: result.status?.ageSeconds ?? null,
      });
    };

    pull();
    interval = setInterval(pull, SIM_CONFIG.NEWS_POLL_INTERVAL);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (warmTimer) clearTimeout(warmTimer);
    };
  }, []);

  const refreshNews = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLiveNews();
      const result = await fetchLiveNews(60);
      if (result) {
        marketSimulator.ingestLiveEvents(result.events);
        setNewsMode(result.events.length > 0 ? 'live' : 'degraded');
        setNewsStatus({
          feeds: result.status?.feeds ?? 0,
          errors: result.status?.errors ?? [],
          ageSeconds: result.status?.ageSeconds ?? null,
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const toggleRunning = useCallback(() => {
    setRunning((prev) => {
      if (prev) marketSimulator.stop();
      else marketSimulator.start();
      return !prev;
    });
  }, []);

  const setSpeed = useCallback((n: number) => {
    setSpeedState(n);
    marketSimulator.setSpeed(n);
  }, []);

  const injectEvent = useCallback(() => {
    marketSimulator.injectEvent();
  }, []);

  const toggleWatch = useCallback((symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol],
    );
  }, []);

  const pressured = useMemo(() => {
    const out = new Set<string>();
    for (const q of Object.values(snapshot.quotes)) {
      if (Math.abs(q.eventPressure) > 0.05) out.add(q.symbol);
    }
    return out;
  }, [snapshot]);

  const value = useMemo<MarketContextValue>(
    () => ({
      snapshot,
      running,
      toggleRunning,
      speed,
      setSpeed,
      injectEvent,
      selected,
      setSelected,
      watchlist,
      toggleWatch,
      pressured,
      newsMode,
      newsStatus,
      refreshNews,
      refreshing,
    }),
    [
      snapshot,
      running,
      toggleRunning,
      speed,
      setSpeed,
      injectEvent,
      selected,
      watchlist,
      toggleWatch,
      pressured,
      newsMode,
      newsStatus,
      refreshNews,
      refreshing,
    ],
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used inside <MarketProvider>');
  return ctx;
}

/** Read one quote from the shared snapshot. Never generates its own data. */
export function useQuote(symbol: string): AssetQuote | undefined {
  const { snapshot } = useMarket();
  return snapshot.quotes[symbol];
}

/** Read many quotes at once, preserving the requested order. */
export function useQuotes(symbols: string[]): AssetQuote[] {
  const { snapshot } = useMarket();
  return useMemo(
    () => symbols.map((s) => snapshot.quotes[s]).filter(Boolean) as AssetQuote[],
    [snapshot, symbols],
  );
}
