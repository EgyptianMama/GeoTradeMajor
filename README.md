# GeoTrade

A market-intelligence terminal for Indian equities that links **real-time news to simulated price movement**.

Real headlines are pulled from twelve Indian publisher RSS feeds, tagged with the NSE symbols each story should move, and fed into a local market simulator. Prices are simulated; the news is real.

> **Research project.** Prices are synthetic and the positioning notes are generated, not researched. Nothing here is investment advice.

---

## What it does

**News → symbols → impact.** A headline like *"India-EU FTA: tariff quota for 1 lakh cars"* is tagged to `NIFTYAUTO`, `MARUTI` and `TATAMOTORS` with a signed expected move for each. The simulator applies those impacts gradually, so the tape visibly reacts to the story.

**Desk View.** Each story carries a positioning note on the two or three stocks it most plausibly moves — action, conviction, CMP/target/stop levels, horizon, and a one-line reason drawn from the sector's transmission channel. Derived from the tagger's impact map rather than rolled at random, so a story that pushes a stock up never produces a sell call on it.

**Single source of truth.** One simulator owns all market state. Every panel, ticker, sparkline and chart reads the same snapshot, so a symbol never shows two different prices.

## Panels

Markets · News → Markets · India Market Map · NSE Gainers & Losers · NSE Sector Heatmap · FII/DII Flows · MCX Commodities · Energy Complex · Forex & Rupee · G-Sec & Rates · Fear & Greed · Financial Stress · Market Breadth · India Macro

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, hand-written CSS |
| Backend | Node, Express, fast-xml-parser |
| News | 12 Indian publisher RSS feeds — no API key, no quota |
| Tagging | Rule engine: alias matching, sector keywords, macro rules, finance sentiment lexicon |

## Running locally

```bash
npm install
npm run dev
```

Vite serves the frontend on `:5273` and proxies `/api` to the news API on `:5274`.

Production build (one process serves both):

```bash
npm run build && npm start
```

## Architecture

```
server/
  feeds.ts     Indian publisher RSS sources
  tagger.ts    headline → NSE symbols + sentiment → impact %
  poller.ts    poll every 5 min, dedupe across publishers, cache
  index.ts     REST API + static hosting in production

src/
  simulation/  market engine — the single source of truth
  data/        instrument universe, news adapter, types
  lib/         formatting (₹, lakh/crore), desk-view generator
  components/  panels, charts, terminal shell
```

The frontend polls `/api/news` every 90 seconds. If the API is unreachable it falls back to an offline generator of plausible Indian headlines, so the demo never depends on the network.

## API

| Endpoint | Returns |
|---|---|
| `GET /api/news?limit=` | Tagged events with linked symbols and impact estimates |
| `GET /api/status` | Feed health and cache age |
| `GET /api/health` | Liveness probe — `live` or `degraded` |
| `POST /api/refresh` | Force a re-poll |

## Design notes

The UI deliberately follows a dense terminal idiom — monospace throughout, 12px base, dark ground, semantic green/red reserved for direction. Rupee values use Indian lakh/crore grouping (`₹1,43,174`, not `₹143,174`), and the header tracks the actual NSE session state.

## Documentation

`docs/GeoTrade-Technical-Design-Report.docx` — a 50-page technical design report covering the intended production architecture: entity resolution, sentiment vs. surprise modelling, abnormal-return labelling, the model ladder, and walk-forward validation. `docs/geotrade-signal-architecture.html` is a shorter web version.

## Known limitations

- Prices are simulated, not real market data.
- The tagger is a rule engine, not a trained model. It mislabels edge cases.
- Publisher feeds bot-filter datacentre IPs; feeds that work locally may return 403 from a cloud host.
- English-language sources only.

## Licence

Not yet specified.
