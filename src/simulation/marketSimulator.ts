import { ALL_ASSETS } from '../data/assets';
import type { AssetDef, AssetQuote, MarketEvent, MarketSnapshot } from '../data/types';
import { SIM_CONFIG } from './config';
import { nextEvent, seedEvents } from './eventSimulator';
import { clamp, gaussian, hashString, mulberry32 } from './random';

type Listener = (snapshot: MarketSnapshot) => void;

interface AssetState {
  def: AssetDef;
  quote: AssetQuote;
  /** Carried direction, drives momentum. */
  drift: number;
  /** Remaining % move still owed from active events. */
  pendingImpact: number;
  rand: () => number;
}

/**
 * The single source of truth for simulated market state.
 *
 * Every panel, ticker, sparkline and chart in the app reads from one
 * snapshot produced here, so the same symbol always shows the same price
 * everywhere. Nothing in the UI generates its own randomness.
 */
export class MarketSimulator {
  private states = new Map<string, AssetState>();
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private rand = mulberry32(0x5eed1234);
  private tick = 0;
  private marketFactor = 0;
  private events: MarketEvent[] = [];
  private snapshot: MarketSnapshot;
  private speed = 1;
  /** True once real news has been ingested; silences the mock generator. */
  private liveMode = false;
  /** True once at least one live batch has landed. */
  private liveSeeded = false;
  private seenEventIds = new Set<string>();

  constructor(defs: AssetDef[] = ALL_ASSETS) {
    const now = Date.now();
    for (const def of defs) {
      this.states.set(def.symbol, this.createState(def, now));
    }
    this.events = seedEvents(6, now);
    this.snapshot = this.buildSnapshot(now);
  }

  // ------------------------------------------------------------ lifecycle

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.step(), SIM_CONFIG.UPDATE_INTERVAL / this.speed);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  /** Change tick rate without restarting the simulation state. */
  setSpeed(multiplier: number): void {
    this.speed = multiplier;
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  getSnapshot = (): MarketSnapshot => this.snapshot;

  /** Inject an event by hand — used by the "simulate headline" control. */
  injectEvent(event?: MarketEvent): MarketEvent {
    const now = Date.now();
    const ev = event ?? nextEvent(this.rand, now);
    this.applyEvent(ev);
    this.snapshot = this.buildSnapshot(now);
    this.emit();
    return ev;
  }

  /**
   * Merge a batch of real, already-tagged news from the news API.
   *
   * Only genuinely new ids are applied to prices, so repeated polls of the
   * same RSS cache do not keep pushing the tape in one direction. Once live
   * news arrives the mock generator stops emitting.
   */
  ingestLiveEvents(events: MarketEvent[]): number {
    if (events.length === 0) return 0;
    this.liveMode = true;

    const fresh = events.filter((e) => !this.seenEventIds.has(e.id));
    for (const ev of fresh) this.seenEventIds.add(ev.id);

    // The first batch of real news replaces the mock seed entries outright;
    // later batches merge with the live stories already held.
    const existing = this.liveSeeded ? this.events : [];
    this.liveSeeded = true;

    const merged = [...events, ...existing];
    const byId = new Map(merged.map((e) => [e.id, e]));
    this.events = [...byId.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, SIM_CONFIG.MAX_EVENTS);

    // Apply price pressure only for events published recently; a three-hour
    // old headline should already be in the price.
    const cutoff = Date.now() - SIM_CONFIG.LIVE_IMPACT_WINDOW_MS;
    let applied = 0;
    for (const ev of fresh) {
      if (ev.timestamp < cutoff) continue;
      this.applyImpact(ev.impact);
      applied += 1;
    }

    this.snapshot = this.buildSnapshot(Date.now());
    this.emit();
    return applied;
  }

  isLive(): boolean {
    return this.liveMode;
  }

  // --------------------------------------------------------------- setup

  private createState(def: AssetDef, now: number): AssetState {
    const rand = mulberry32(hashString(def.symbol));
    const history = this.seedHistory(def, rand);
    const price = history[history.length - 1];
    const open = history[0];
    const changeAbs = price - open;

    return {
      def,
      drift: 0,
      pendingImpact: 0,
      rand,
      quote: {
        symbol: def.symbol,
        price,
        open,
        prevPrice: price,
        changePct: (changeAbs / open) * 100,
        changeAbs,
        dayHigh: Math.max(...history),
        dayLow: Math.min(...history),
        volume: this.seedVolume(def, rand),
        history,
        updatedAt: now,
        eventPressure: 0,
      },
    };
  }

  /**
   * Build a plausible intraday path that ends exactly on the seed price.
   *
   * The session open is chosen so the resulting day change lands in a
   * believable band for the asset class (fractions of a percent for FX,
   * a few percent for crypto) rather than being whatever a free random
   * walk happened to accumulate.
   */
  private seedHistory(def: AssetDef, rand: () => number): number[] {
    const n = SIM_CONFIG.SEED_HISTORY_LENGTH;
    const band = SIM_CONFIG.OPEN_CHANGE_BAND[def.assetClass] ?? 1.2;

    // Target session change, e.g. -1.4% .. +1.4% for equities.
    const targetPct = (rand() * 2 - 1) * band;
    const open = def.seed / (1 + targetPct / 100);

    // Noise around the open->seed line, sized relative to the day's move so
    // the path wanders but still resolves onto the seed.
    const wiggle = Math.max(Math.abs(targetPct), band * 0.35) / 100 * 0.42;

    const out: number[] = new Array(n);
    let noise = 0;
    for (let i = 0; i < n; i += 1) {
      const t = i / (n - 1);
      // Taper the noise to zero at both ends so open and close are exact.
      const envelope = Math.sin(Math.PI * t);
      noise = noise * 0.86 + gaussian(rand) * wiggle * 0.5;
      const base = open + (def.seed - open) * t;
      out[i] = base * (1 + noise * envelope);
    }
    out[0] = open;
    out[n - 1] = def.seed;
    return out;
  }

  private seedVolume(def: AssetDef, rand: () => number): number {
    const base = def.avgVolume ?? (def.assetClass === 'index' ? 0 : 140);
    return base * (0.25 + rand() * 0.5);
  }

  // ---------------------------------------------------------------- step

  private step(): void {
    const now = Date.now();
    this.tick += 1;

    // Broad-market factor: mean-reverting, shared by every correlated asset.
    this.marketFactor +=
      gaussian(this.rand) * SIM_CONFIG.FACTOR_VOLATILITY -
      this.marketFactor * SIM_CONFIG.FACTOR_REVERSION;

    // Occasionally a mock headline arrives — but only while offline. Once the
    // news API is feeding real stories, invented ones would muddy the demo.
    if (!this.liveMode && this.rand() < SIM_CONFIG.EVENT_PROBABILITY) {
      this.applyEvent(nextEvent(this.rand, now));
    }

    for (const state of this.states.values()) {
      this.stepAsset(state, now);
    }

    this.snapshot = this.buildSnapshot(now);
    this.emit();
  }

  private stepAsset(state: AssetState, now: number): void {
    const { def, quote, rand } = state;
    const classVol = SIM_CONFIG.CLASS_VOLATILITY[def.assetClass] ?? 1;
    const factorLoad = SIM_CONFIG.CLASS_FACTOR_LOAD[def.assetClass] ?? 0.5;
    const beta = def.beta ?? 1;

    // 1. Idiosyncratic shock, scaled by the asset's own volatility.
    let move = gaussian(rand) * SIM_CONFIG.VOLATILITY * def.volatility * classVol;

    // 2. Occasional larger move, so the tape is not uniformly smooth.
    if (rand() < SIM_CONFIG.JUMP_PROBABILITY) {
      move *= SIM_CONFIG.JUMP_MULTIPLIER;
    }

    // 3. Momentum: the previous direction partially carries forward.
    move += state.drift * SIM_CONFIG.MOMENTUM;

    // 4. Correlation: everything loads on the shared market factor.
    move += this.marketFactor * factorLoad * beta;

    // 5. Mean reversion toward the session open.
    move -= ((quote.price - quote.open) / quote.open) * SIM_CONFIG.MEAN_REVERSION;

    // 6. Release a slice of any outstanding news impact.
    if (Math.abs(state.pendingImpact) > 1e-6) {
      const slice = state.pendingImpact / SIM_CONFIG.EVENT_DECAY_TICKS;
      move += slice / 100;
      state.pendingImpact -= slice;
      if (Math.abs(state.pendingImpact) < 1e-4) state.pendingImpact = 0;
    }

    move = clamp(move, -SIM_CONFIG.MAX_PRICE_CHANGE, SIM_CONFIG.MAX_PRICE_CHANGE);
    state.drift = move;

    const prevPrice = quote.price;
    let price = prevPrice * (1 + move);

    // Rates and VIX are levels, not prices — keep them in a sane band.
    if (def.assetClass === 'rate') price = clamp(price, 0.05, 12);
    if (def.symbol === 'VIX') price = clamp(price, 9, 85);
    if (price <= 0) price = prevPrice;

    const changeAbs = price - quote.open;
    const history = quote.history;
    history.push(price);
    if (history.length > SIM_CONFIG.HISTORY_LENGTH) history.shift();

    // Volume accrues faster when the move is larger.
    const volumeStep =
      (def.avgVolume ?? 140) * (0.0016 + Math.abs(move) * 0.9);

    state.quote = {
      ...quote,
      price,
      prevPrice,
      changeAbs,
      changePct: (changeAbs / quote.open) * 100,
      dayHigh: Math.max(quote.dayHigh, price),
      dayLow: Math.min(quote.dayLow, price),
      volume: quote.volume + volumeStep,
      history,
      updatedAt: now,
      eventPressure: state.pendingImpact,
    };
  }

  // --------------------------------------------------------------- events

  private applyEvent(event: MarketEvent): void {
    this.events = [event, ...this.events].slice(0, SIM_CONFIG.MAX_EVENTS);
    this.seenEventIds.add(event.id);
    this.applyImpact(event.impact);
  }

  private applyImpact(impact: Record<string, number>): void {
    for (const [symbol, pct] of Object.entries(impact)) {
      const state = this.states.get(symbol);
      // The tagger can name symbols outside the simulated universe; those
      // still show on the event row but have no price to push.
      if (!state) continue;
      state.pendingImpact += pct;
    }
  }

  // ------------------------------------------------------------- snapshot

  private buildSnapshot(now: number): MarketSnapshot {
    const quotes: Record<string, AssetQuote> = {};
    for (const [symbol, state] of this.states) {
      quotes[symbol] = state.quote;
    }
    return {
      quotes,
      events: this.events,
      tick: this.tick,
      updatedAt: now,
      marketFactor: this.marketFactor,
    };
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.snapshot);
  }
}

/** App-wide singleton. */
export const marketSimulator = new MarketSimulator();
