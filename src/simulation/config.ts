/**
 * Tunables for the market simulation. Everything that shapes how the fake
 * market behaves lives here so behaviour can be adjusted without touching
 * the engine or any component.
 */
export const SIM_CONFIG = {
  /** Milliseconds between simulated ticks. */
  UPDATE_INTERVAL: 1200,

  /** Base per-tick standard deviation, as a fraction of price (0.0008 = 8bps). */
  VOLATILITY: 0.00085,

  /** Hard cap on a single tick's move, as a fraction of price. */
  MAX_PRICE_CHANGE: 0.012,

  /** How strongly the previous tick's direction carries into the next (0-1). */
  MOMENTUM: 0.34,

  /** Probability per tick that an asset gets an outsized "jump" move. */
  JUMP_PROBABILITY: 0.012,

  /** Multiplier applied to the tick size when a jump fires. */
  JUMP_MULTIPLIER: 4.5,

  /**
   * Pull back toward the session open; keeps drift from running away.
   * Together with VOLATILITY this sets how far a session change can wander:
   * the steady-state spread is roughly VOLATILITY / sqrt(2 * MEAN_REVERSION).
   */
  MEAN_REVERSION: 0.01,

  /** Probability per tick that a new mock news event is emitted. */
  EVENT_PROBABILITY: 0.022,

  /** Ticks over which an event's impact is distributed into prices. */
  EVENT_DECAY_TICKS: 26,

  /** Max events retained in the feed. */
  MAX_EVENTS: 80,

  /** How often the frontend polls the news API, in ms. */
  NEWS_POLL_INTERVAL: 90_000,

  /**
   * Only headlines published inside this window push prices. Anything older
   * is treated as already reflected in the tape.
   */
  LIVE_IMPACT_WINDOW_MS: 3 * 60 * 60 * 1000,

  /** Points of price history retained per asset. */
  HISTORY_LENGTH: 240,

  /** Points generated for the initial (pre-session) history. */
  SEED_HISTORY_LENGTH: 160,

  /** Volatility multipliers per asset class; crypto is choppier, metals slower. */
  CLASS_VOLATILITY: {
    index: 0.55,
    equity: 1.0,
    crypto: 1.9,
    metal: 0.5,
    energy: 0.85,
    fx: 0.28,
    rate: 0.45,
  } as Record<string, number>,

  /** How much of the broad-market factor each class inherits. */
  CLASS_FACTOR_LOAD: {
    index: 1.0,
    equity: 0.9,
    crypto: 0.5,
    metal: 0.25,
    energy: 0.3,
    fx: 0.2,
    rate: 0.35,
  } as Record<string, number>,

  /**
   * Half-width, in percent, of the believable session-change band used when
   * seeding each asset's opening price. Crypto opens further from flat than
   * FX does, matching how the real classes behave.
   */
  OPEN_CHANGE_BAND: {
    index: 0.85,
    equity: 1.9,
    crypto: 3.6,
    metal: 1.0,
    energy: 2.2,
    fx: 0.45,
    rate: 1.8,
  } as Record<string, number>,

  /**
   * Per-tick volatility of the broad-market factor itself.
   *
   * The factor is persistent (it reverts slowly), so its contribution to a
   * price compounds across many ticks: the resulting session-change offset is
   * about FACTOR_VOLATILITY / sqrt(2 * FACTOR_REVERSION) / MEAN_REVERSION.
   * Keep it small — a large value drags the entire tape the same way.
   */
  FACTOR_VOLATILITY: 0.000018,

  /** Mean reversion applied to the broad-market factor. */
  FACTOR_REVERSION: 0.05,
};

export type SimConfig = typeof SIM_CONFIG;
