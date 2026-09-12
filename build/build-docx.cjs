/* Assembles GT-TDR-002 into a .docx */

const fs = require('fs');
const path = require('path');
const R = require('./report.cjs');
const {
  D, PAGE_W, PAGE_H, MARGIN, CONTENT_W,
  INK, INDIGO, MUTED, AMBER, UP, DOWN, WASH,
  P, RP, H1, H2, H3, BULLET, NUMLIST, EQ, WHERE, CALLOUT, TBL, FIGURE, CODE,
  SPACER, titlePage, frontMatter,
} = R;
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Header, Footer, PageNumber, NumberFormat, LevelFormat, BorderStyle,
  PageBreak, AlignmentType: AT,
} = D;

/* ======================= BODY ======================= */
const body = [];
const add = (...xs) => xs.forEach((x) => Array.isArray(x) ? body.push(...x) : body.push(x));

/* ---------------------------------------------------------- 1 */
add(H1('1', 'Introduction'));

add(H2('1.1', 'Background'));
add(P('Public equity prices respond to information. When news about a listed company reaches the market — an earnings release, a regulatory order, a contract award, a commodity shock in its input chain — the price adjusts. The speed and completeness of that adjustment has been studied extensively, and it is not uniform across the listed universe. Adjustment is close to instantaneous for heavily covered securities and measurably slower for thinly covered ones.'));
add(P('India is an unusually favourable venue for exploiting that asymmetry. The National Stock Exchange lists well over two thousand securities, but sell-side research coverage concentrates in the largest decile. Below that concentration, fewer analysts translate news into revised expectations, retail participation is proportionally higher than in developed markets, and the interval between publication and full incorporation into price widens. This report treats that interval as the system\'s entire opportunity surface.'));
add(P('The prototype that preceded this specification demonstrated the mechanical pipeline — polling Indian publisher feeds, tagging headlines with NSE symbols, and surfacing the implied movement in a dashboard. It did not attempt to establish that the signal was real. This document specifies the system required to answer that question properly, and the evidence standard it must meet.'));

add(H2('1.2', 'Motivation'));
add(P('Three observations motivate the work. First, the raw material is free: Indian publishers expose clean RSS, and the exchanges publish corporate announcements as primary documents at no cost. Second, the hard part of the problem is not sentiment classification, which is commoditised, but entity resolution and correct labelling, which are not. Third, most publicly described systems of this kind report results that are either not reproducible or not adjusted for market movement, which suggests the bar for a carefully validated implementation is lower than it appears.'));

add(H2('1.3', 'Problem Statement'));
add(RP([
  ['Given a stream of Indian financial news items, each arriving at time ', {}],
  ['t', { italics: true }],
  [', produce for every affected listed security a directional prediction of its ', {}],
  ['market-adjusted', { bold: true }],
  [' return over the window [', {}],
  ['t', { italics: true }],
  ['+1, ', {}],
  ['t', { italics: true }],
  ['+5] trading days, together with a calibrated confidence.', {}],
]));
add(P('Three properties separate this from generic document sentiment classification:'));
add(BULLET([
  'The target is abnormal, not absolute. A stock rising 0.8% on a day the index rises 1.2% has fallen in the only sense that matters. Raw-return labelling silently rewards beta and reports a false edge.',
  'The predictor is surprise, not tone. For anticipated events, price responds to the deviation from consensus rather than to the absolute favourability of the news.',
  'The unit of prediction is a security, not a document. One story maps to several securities with different magnitudes and occasionally opposite signs — a crude oil spike is positive for an upstream producer and negative for a refiner.',
]));

add(H2('1.4', 'Research Hypotheses'));
add(P('The project is framed as four falsifiable hypotheses. Each is tested by a specific metric in Section 12, and H1 is a precondition for the rest.'));
add(TBL('Table 1.1 — Research hypotheses and their tests.',
  ['ID', 'Hypothesis', 'Test'],
  [
    ['H1', 'Public Indian financial news carries information about abnormal returns over a 1–5 day horizon that is not fully priced at publication.', 'Rank IC significantly greater than zero, out-of-sample'],
    ['H2', 'The effect is stronger in securities with lower analyst coverage and lower liquidity.', 'IC monotonically increasing across descending market-cap deciles'],
    ['H3', 'Separating surprise from tone materially improves prediction on scheduled events.', 'IC of the surprise-gated model exceeds the tone-only model on the scheduled subset'],
    ['H4', 'Second-order propagation to sector peers carries incremental information beyond directly named securities.', 'Non-zero IC restricted to hop-distance ≥ 1 samples'],
  ], [8, 58, 34]));

add(H2('1.5', 'Objectives'));
add(TBL('Table 1.2 — Objectives and acceptance criteria.',
  ['ID', 'Objective', 'Acceptance criterion'],
  [
    ['O1', 'Ingest and normalise Indian market news and exchange filings', '≥ 95% source uptime; median end-to-end latency under 120 s'],
    ['O2', 'Resolve mentioned entities to NSE ticker symbols', '≥ 0.90 precision, ≥ 0.75 recall on a 500-headline labelled set'],
    ['O3', 'Score directional content per (story, security) pair', 'Calibrated 3-class output; Brier score better than majority baseline'],
    ['O4', 'Predict 5-day abnormal return direction', 'Rank IC > 0.03 out-of-sample, stable across ≥ 3 walk-forward folds'],
    ['O5', 'Quantify where the edge lives', 'IC reported by market-cap decile, liquidity bucket and event category'],
    ['O6', 'Establish reproducibility', 'Any reported result regenerable from archived inputs and a pinned commit'],
  ], [8, 42, 50]));

add(H2('1.6', 'Scope'));
add(P('In scope: Indian cash equities listed on NSE and BSE; English-language news and exchange filings; a one-to-five trading day prediction horizon; daily-frequency adjusted price data; simulated execution with an explicit cost model.'));

add(H2('1.7', 'Non-Goals'));
add(BULLET([
  'Intraday or high-frequency prediction.',
  'Live order routing, execution, or capital deployment.',
  'Derivatives pricing or options strategy construction.',
  'Markets outside India.',
  'Vernacular-language news processing in this revision.',
  'Any published investment recommendation to third parties.',
]));
add(CALLOUT('Design constraint',
  'Intraday prediction is excluded on structural grounds, not to reduce scope. At the latency of public RSS and filing feeds the system cannot compete on speed for liquid names against participants receiving the same information through commercial terminals. Moving to a multi-day horizon shifts the contest from latency to interpretation, which is the only contest this architecture can win.'));

add(H2('1.8', 'Assumptions'));
add(NUMLIST([
  'Publisher RSS feeds and exchange announcement feeds remain accessible without commercial licensing.',
  'Adjusted end-of-day price data for the full NSE universe can be obtained for at least 36 months of history.',
  'Sufficient labelled events can be accumulated — a working target of 20,000 (security, event) pairs — to support supervised learning.',
  'The single-index market model is an adequate expected-return specification at a daily frequency; Section 9.6 tests this.',
]));

add(H2('1.9', 'Constraints'));
add(BULLET([
  'Single operator, part-time; architecture must avoid operational burden that scales with data volume.',
  'Commodity hardware; no assumption of sustained GPU availability beyond intermittent fine-tuning runs.',
  'No paid market-data or news subscriptions in the base specification.',
  'All results must be reproducible from archived raw inputs.',
]));

add(H2('1.10', 'Document Structure'));
add(P('Section 2 establishes the market context that constrains the design. Section 3 reviews the literature and identifies the gap this work occupies. Section 4 gives the system architecture. Sections 5 to 8 specify the pipeline bottom-up: data, entity resolution, sentiment, and the resulting feature vector. Section 9 defines the prediction target with full event-study treatment. Sections 10 to 13 cover modelling, validation, evaluation and simulated execution. Sections 14 to 19 address interfaces, delivery, risk, governance, future work and conclusions. Appendices A to F carry references, notation, a glossary, the full feature dictionary, a code index and configuration defaults.'));

/* ---------------------------------------------------------- 2 */
add(H1('2', 'Indian Market Context'));
add(P('Design decisions throughout this report follow from specific features of the Indian equity market. This section records those features and their consequences, so that later choices can be traced to evidence rather than to preference.'));

add(H2('2.1', 'Exchange Structure'));
add(P('The NSE and BSE operate as competing venues with near-identical listings for most large securities, with NSE carrying the substantial majority of cash and derivatives turnover. Settlement operates on a T+1 cycle, shortened from T+2, which compresses the interval between signal and realisable position relative to markets still on longer cycles. Corporate announcements are filed with both exchanges and published immediately, which makes the exchange filing — not the newspaper article — the earliest available public record of a company-specific event.'));

add(H2('2.2', 'Coverage Asymmetry'));
add(P('The central structural fact for this project is the distribution of analyst attention. Coverage is dense at the index level and thins rapidly beyond it. Where many analysts translate a filing into revised estimates within minutes, the informational lag the system depends on does not exist. Where one analyst covers a company intermittently, or none does, the lag can persist for days.'));
add(FIGURE('fig-2-1.png', 'Figure 2.1 — Speed of price discovery falls with analyst coverage. The dashed region is the target universe: the system is designed to be evaluated there, not on the index heavyweights where the lag has already closed.'));
add(P('This shapes evaluation more than it shapes engineering. A model reporting a flat information coefficient over the whole universe while showing a strongly positive coefficient in the smallest three deciles has confirmed hypothesis H2 and is a success. Section 12.4 therefore makes stratified reporting mandatory rather than optional.'));

add(H2('2.3', 'Microstructure Constraints'));
add(P('Several features of Indian market microstructure bound what a signal can realise, and each has a direct consequence for the specification.'));
add(TBL('Table 2.1 — Microstructure constraints and their design impact.',
  ['Feature', 'Description', 'Design consequence'],
  [
    ['Price bands', 'Daily circuit limits of 2, 5, 10 or 20% depending on the security', 'Truncates realisable moves; feature D7 records proximity to the band'],
    ['ASM / GSM', 'Surveillance frameworks imposing higher margins or trade-to-trade settlement', 'Flagged securities are excluded from the tradable universe'],
    ['T+1 settlement', 'Trades settle one business day after execution', 'Consistent with the t+1 entry assumption used in labelling'],
    ['F&O eligibility', 'A subset of securities has listed derivatives', 'Derivative-eligible names price information faster; feature D8'],
    ['Retail concentration', 'High and rising share of retail participation', 'Sentiment-driven overreaction is more plausible, supporting drift-then-reversal'],
    ['Promoter holding', 'Concentrated promoter ownership is common', 'Pledge and stake-sale announcements are materially price-relevant event types'],
    ['Trading calendar', 'Numerous market holidays; occasional special sessions', 'Horizon arithmetic must use a trading calendar, never calendar days'],
  ], [18, 40, 42]));

add(H2('2.4', 'Information Dissemination'));
add(P('The practical ordering of public information release in India runs: exchange filing, then wire service, then publisher article, then aggregator. Each step adds latency and, for the system, adds noise — an article is an interpretation of a filing and introduces the journalist\'s framing into the text. Reading the filing directly is both faster and cleaner. Section 5.1 formalises this as a tiered source hierarchy.'));

add(H2('2.5', 'Implications for Design'));
add(BULLET([
  'Tier-1 exchange and regulator feeds are primary; publisher feeds are corroboration and novelty signal.',
  'Evaluation must be stratified by size and liquidity or the headline metric will mask the effect being sought.',
  'The tradable universe excludes surveillance-flagged and circuit-bound securities at prediction time.',
  'All horizon arithmetic uses the NSE trading calendar.',
]));

/* ---------------------------------------------------------- 3 */
add(H1('3', 'Literature Review'));
add(P('Five papers carry most of the design weight. Each is summarised with the specific decision it drives, followed by a gap analysis positioning this work.'));

add(H2('3.1', 'Domain-Specific Lexicons'));
add(RP([['Loughran & McDonald (2011) ', { bold: true }], ['establish the foundational result for financial text: general-purpose sentiment dictionaries misclassify financial language at a rate that invalidates their use. Words such as liability, cost, tax, capital and depreciation are negative in the Harvard IV-4 psychosocial dictionary and neutral in a financial filing. The authors construct a finance-specific word list from 10-K filings and demonstrate materially different, better-behaved associations with returns.', {}]]));
add(P('Design consequence: the keyword lexicon in the GeoTrade prototype is a placeholder exhibiting exactly this failure and must be retired. Any lexicon component surviving into production uses the Loughran–McDonald lists extended with an India-specific supplement covering promoter pledge, show-cause notice, qualified institutional placement, bonus issue, circuit, and the surveillance frameworks.'));

add(H2('3.2', 'Media Sentiment and Return Dynamics'));
add(RP([['Tetlock (2007) ', { bold: true }], ['constructs a daily pessimism factor from a Wall Street Journal column and shows it predicts downward pressure on prices followed by reversion to fundamentals, with unusually extreme sentiment predicting elevated trading volume. The structurally important finding is the shape of the response: initial drift in the direction of sentiment, then partial reversal.', {}]]));
add(P('Design consequence: this justifies the multi-day horizon directly and warns against a single fixed measurement window. GeoTrade labels at four horizons and reports the full term structure, because a signal positive at three days and negative at ten carries information that a single number destroys.'));

add(H2('3.3', 'Transformer Sentiment for Finance'));
add(RP([['Araci (2019) ', { bold: true }], ['adapts BERT to financial text through further pre-training on a financial corpus and fine-tuning on the Financial PhraseBank, outperforming lexicon methods and general-purpose neural baselines. Critically for this project, it handles negation, hedging and conditional constructions that bag-of-words approaches destroy — "the company denied reports of a default" is catastrophic for a lexicon and tractable for a transformer.', {}]]));
add(P('Design consequence: FinBERT is the tier-2 sentiment encoder, used both as a three-class classifier and, more valuably, as a frozen feature extractor whose pooled representation becomes an input block to the gradient-boosted model of Section 10.'));

add(H2('3.4', 'Return-Supervised Sentiment'));
add(RP([['Ke, Kelly & Xiu (2019) ', { bold: true }], ['introduce SESTM — Sentiment Extraction via Screening and Topic Modeling. Rather than assuming which words are positive, the method learns word sentiment from realised returns: screen for words predictive of returns, fit a two-topic model over the screened vocabulary, then score new documents by their positive-topic loading. The approach is transparent, computationally cheap, and imports no analyst prior about what constitutes good news.', {}]]));
add(P('Design consequence: this is the single most important methodological input. It reframes sentiment from a language-modelling problem into a supervised-learning problem whose label is the abnormal return. A SESTM-style screened vocabulary is the tier-1 scorer, implementable without a GPU, and it sets the performance bar that FinBERT must clear to justify its operational cost.'));

add(H2('3.5', 'Cross-Stock Propagation'));
add(RP([['Sawhney et al. (2020) ', { bold: true }], ['predict stock movement from social media text while explicitly modelling inter-stock relationships through a graph over company correlations, combining hierarchical attention over text with graph attention over the company network.', {}]]));
add(P('Design consequence: this is the principled treatment of what the prototype does crudely with a hand-written sector map. One story about an automobile manufacturer carries information about its suppliers, its sector peers and its lenders. Phase 4 replaces hand-coded propagation weights with a learned graph over an adjacency matrix built from rolling return correlation, sector membership and index co-membership.'));

add(H2('3.6', 'Related Work'));
add(P('Two further lines of work inform the design without being load-bearing. Ding et al. (IJCAI 2015) represent news as structured event tuples of actor, action and object rather than as bag-of-words, and show event-level representation outperforms lexical features for stock prediction; this is a candidate refinement to the feature layer. Hu et al. (WSDM 2018) apply hierarchical attention over sequences of news items to capture how a narrative accumulates across days, which is directly relevant to the tier-4 sequence model.'));

add(H2('3.7', 'Gap Analysis'));
add(P('The literature is strong on sentiment extraction and on US-market event studies, and comparatively thin at the intersection this project occupies.'));
add(TBL('Table 3.1 — Gap analysis. The intersection of Indian market structure, return-supervised sentiment and rigorous abnormal-return labelling is sparsely covered.',
  ['Dimension', 'State of the literature', 'Position of this work'],
  [
    ['Sentiment extraction', 'Mature — lexicon, transformer and return-supervised methods all well characterised', 'Adopts existing methods; contributes no novelty'],
    ['Market venue', 'Predominantly US large-cap; Indian studies are fewer and often use raw returns', 'Indian universe throughout, with market-adjusted labels'],
    ['Entity resolution', 'Frequently assumed solved or sidestepped by using single-ticker corpora', 'Treated as the primary engineering problem (§6)'],
    ['Surprise vs. tone', 'Recognised in the earnings literature, rarely integrated into news pipelines', 'Explicit gating of scheduled events (§7.1)'],
    ['Validation rigour', 'Highly variable; look-ahead and survivorship common in applied write-ups', 'Walk-forward with embargo and an explicit leakage checklist (§11)'],
  ], [20, 44, 36]));
add(CALLOUT('Verify before citing',
  'References in this report are reproduced from memory and may contain errors in title, venue, year or identifier. Confirm each against the publisher or arXiv before using them in any formal write-up.'));

/* ---------------------------------------------------------- 4 */
add(H1('4', 'System Architecture'));

add(H2('4.1', 'Design Principles'));
add(NUMLIST([
  'Replayability. Every stage writes durable output, so any stage can be re-run over history without re-executing the ones before it. Re-scoring five years of archived text with a new model must not require re-fetching it.',
  'Point-in-time correctness. No component may read data that did not exist at the timestamp it is reasoning about. This is enforced in code, not by convention.',
  'One path for live and historical. The backtester and the dashboard consume the same model output, which prevents the two from silently diverging.',
  'Cheap before expensive. Each modelling tier must beat its predecessor out-of-sample before replacing it.',
  'Measure before believe. Every component exists to feed the evaluation in Section 12.',
]));

add(H2('4.2', 'Logical Architecture'));
add(P('GeoTrade is a five-stage pipeline over a shared append-only archive.'));
add(FIGURE('fig-4-1.png', 'Figure 4.1 — Pipeline stages and the persistence layer that makes each replayable. The backtester consumes the same model output as the dashboard.'));

add(H2('4.3', 'Component Responsibilities'));
add(TBL('Table 4.1 — Stage responsibilities and technology selection.',
  ['Stage', 'Responsibility', 'Technology'],
  [
    ['Ingestion', 'Poll sources, deduplicate, normalise to a common document schema', 'Python, feedparser, httpx'],
    ['Entity link', 'Detect organisation mentions, resolve to tickers with confidence', 'spaCy NER, RapidFuzz, sentence-transformers'],
    ['Scoring', 'Sentiment, surprise proxy, novelty, salience', 'SESTM then FinBERT via HuggingFace transformers'],
    ['Feature store', 'Join text scores to market state with point-in-time guarantees', 'DuckDB over Parquet, pandas'],
    ['Model', 'Rank securities by predicted abnormal return', 'scikit-learn, LightGBM, PyTorch'],
    ['Serving', 'REST API consumed by the existing React dashboard', 'FastAPI'],
    ['Orchestration', 'Scheduling, retries, backfill', 'Prefect or cron; deliberately minimal'],
  ], [16, 46, 38]));

add(H2('4.4', 'Storage and Replay'));
add(P('Raw documents are written once and never mutated. Scores are written to a separate partition keyed by model version, so multiple scorers can coexist over the same corpus and their outputs can be compared directly. The feature store materialises joins on demand rather than caching them, which trades a little compute for the elimination of a large class of staleness bugs.'));
add(P('DuckDB over Parquet is chosen instead of a server database for a single-operator research project: the workload is entirely analytical, the data fits on one disk, Parquet files remain queryable without a running service, and there is no concurrent-writer requirement. If that last condition changes, the decision is revisited.'));

add(H2('4.5', 'Deployment View'));
add(P('The base deployment is a single machine running four processes: an ingestion daemon on a five-minute cycle, a scoring worker consuming newly ingested documents, a nightly batch that rebuilds features and retrains on schedule, and the FastAPI service. Nothing in the design requires distribution, and introducing it before the data volume demands it would be premature.'));

/* ---------------------------------------------------------- 5 */
add(H1('5', 'Data Layer'));

add(H2('5.1', 'Source Hierarchy'));
add(P('Sources are ranked by latency to the underlying fact, not by brand recognition. An exchange filing is the event; a news article is a downstream description of it. Wherever a story type is reachable by filing, the filing is primary and the article is used for corroboration and novelty counting only.'));
add(TBL('Table 5.1 — Source tiers. Tier 1 sources are primary documents; tiers 2 and 3 are derivative and arrive later.',
  ['Tier', 'Source', 'Content', 'Latency', 'Cred.'],
  [
    ['1', 'NSE / BSE corporate announcements', 'Results, orders, pledges, board changes', 'Real time', '99'],
    ['1', 'RBI press releases', 'Policy, circulars, banking regulation', 'Real time', '99'],
    ['1', 'SEBI orders and circulars', 'Enforcement, market regulation', 'Real time', '99'],
    ['1', 'PIB / MoSPI', 'CPI, IIP, GDP, policy announcements', 'Scheduled', '97'],
    ['2', 'Mint, Business Standard, ET Markets', 'Interpretation, exclusives, analysis', 'Minutes–hours', '85–88'],
    ['2', 'Moneycontrol, NDTV Profit, BusinessLine', 'Market coverage, broker notes', 'Minutes–hours', '80–85'],
    ['3', 'Aggregators and syndication', 'Largely duplicates of tier 2', 'Hours', '60–75'],
  ], [8, 28, 34, 18, 12]));
add(CALLOUT('Highest-leverage change from the prototype',
  'The current build reads only tier 2. Adding NSE and BSE corporate announcements moves the system upstream of the journalists entirely for company-specific events. This is both a latency gain and a precision gain, because a filing names the company unambiguously and eliminates the entity-resolution problem for the cleanest subset of events.'));

add(H2('5.2', 'Document Schema'));
add(P('Every source normalises to a single record type. The content hash deduplicates syndicated copies; the cluster identifier groups distinct articles describing one underlying event, which is what makes the novelty and velocity features of Section 8 computable.'));
add(CODE('geotrade/schema.py', [
  'from dataclasses import dataclass',
  'from datetime import datetime',
  '',
  '@dataclass(frozen=True)',
  'class Document:',
  '    doc_id:       str       # stable hash of the canonical URL',
  '    source_id:    str       # "nse_announce", "mint_markets", ...',
  '    tier:         int       # 1 primary, 2 press, 3 aggregator',
  '    credibility:  float     # 0-100, per Table 5.1',
  '    published_at: datetime  # UTC, as stated by the source',
  '    ingested_at:  datetime  # UTC, our clock - needed for latency audit',
  '    headline:     str',
  '    body:         str',
  '    url:          str',
  '    content_hash: str       # exact-duplicate detection',
  '    cluster_id:   str       # same-story grouping across publishers',
  '    language:     str = "en"',
]));
add(P('The ingestion timestamp is not redundant with the publication timestamp. The difference between them is the system\'s own latency, and it must be recorded, because a backtest that assumes zero ingestion lag has look-ahead bias built into its foundations.'));

add(H2('5.3', 'Ingestion'));
add(P('Sources are polled on a five-minute cycle with per-source timeouts and independent failure isolation, so one unreachable publisher cannot stall the batch. Requests present a conventional browser user agent, since several Indian publishers reject requests that identify themselves as crawlers. Failures are recorded per source and surfaced as a health metric rather than silently swallowed.'));

add(H2('5.4', 'Deduplication and Clustering'));
add(P('Exact duplicates are removed by content hash. Near-duplicates across publishers are grouped by a two-stage procedure: a cheap lexical key over the significant tokens of the headline, then cosine similarity over sentence embeddings within each key bucket. The surviving representative is the highest-credibility member. Cluster size and its first derivative become features B2 and B3.'));

add(H2('5.5', 'Market Data'));
add(P('Daily adjusted OHLCV for the full NSE universe, the NIFTY 50 as market proxy, the relevant sectoral indices, and India VIX. Adjusted prices are mandatory: an unadjusted one-for-five split reads as an eighty percent single-day collapse and will contaminate every label whose window contains it.'));

add(H2('5.6', 'Corporate Actions'));
add(P('A separate corporate-actions table records splits, bonuses, dividends, rights issues, mergers and symbol changes with effective dates. Symbol changes matter more than they appear: a ticker that refers to one company before a date and another after it will silently join the wrong price series to the wrong news unless the mapping is time-aware.'));

add(H2('5.7', 'Data Quality'));
add(P('The pipeline asserts a fixed set of invariants on every batch and refuses to publish features when one fails.'));
add(TBL('Table 5.2 — Data quality assertions enforced at ingestion and feature build.',
  ['ID', 'Assertion', 'Action on failure'],
  [
    ['Q1', 'published_at is not in the future and not older than the poll window by more than 30 days', 'Quarantine document'],
    ['Q2', 'ingested_at ≥ published_at', 'Clamp and flag'],
    ['Q3', 'Adjusted close is strictly positive and non-null for every trading day in the window', 'Drop the (security, event) pair'],
    ['Q4', 'Absolute daily return below 40% unless a corporate action is recorded that day', 'Flag for manual review'],
    ['Q5', 'Trading-day count in the label window equals the configured horizon', 'Drop the pair; never pad'],
    ['Q6', 'No feature column reads data dated on or after the event timestamp', 'Fail the build'],
  ], [8, 60, 32]));

add(H2('5.8', 'Storage Sizing'));
add(P('A rough estimate bounds the infrastructure question. At roughly 800 relevant articles per trading day across twelve sources, three years of history is approximately 600,000 documents. At an average of 4 KB of text each this is under 3 GB raw, compressing to well under 1 GB in Parquet. Sentence embeddings at 384 dimensions in float32 add about 900 MB. The entire corpus fits comfortably on a laptop, which is the assumption the technology selection rests on.'));

/* ---------------------------------------------------------- 6 */
add(H1('6', 'Entity Resolution'));

add(H2('6.1', 'Why This Is the Hard Part'));
add(P('Sentiment analysis is a solved-enough problem with off-the-shelf models. Deciding which listed security a sentence is about is not, and it is where most of the achievable accuracy lives. An entity-resolution error does not merely add noise: it attaches a correct sentiment score to the wrong price series, producing a training example that is actively misleading.'));
add(TBL('Table 6.1 — Entity resolution failure modes observed in Indian financial text.',
  ['Mode', 'Example', 'Consequence'],
  [
    ['Group ambiguity', '"Tata" maps to more than twenty listed entities; "Bajaj" to four distinct businesses', 'Sentiment attached to the wrong series'],
    ['Mention without aboutness', '"Unlike Reliance, the company has no retail arm"', 'Spurious link injects label noise'],
    ['Second-order subject', '"Crude crosses $95" names no listed company', 'True signal missed entirely'],
    ['Brand vs. issuer', '"Jio" and "JLR" are subsidiaries, not listed tickers', 'Link missed unless the gazetteer covers brands'],
    ['Former names', 'Renamed issuers appear under both names in archives', 'Historical documents fail to link'],
    ['Person vs. company', '"Mr. Bajaj said" is a person, not the issuer', 'False positive from a naive matcher'],
  ], [22, 46, 32]));

add(H2('6.2', 'Gazetteer Construction'));
add(P('The gazetteer is assembled from the exchange security master and extended with former names, brand names, common abbreviations, ISIN identifiers and frequently used journalistic shorthand. Each entry carries the ticker, a canonical name, an alias list, a sector label, and a short natural-language company card used by the disambiguation stage. Ambiguous single-token aliases such as a bare group name are marked as requiring disambiguation and never resolve on their own.'));

add(H2('6.3', 'Two-Stage Resolution'));
add(P('Candidate generation optimises recall; disambiguation restores precision. Splitting the two keeps each tractable and makes the failure mode diagnosable — a recall miss and a precision miss have different fixes.'));
add(FIGURE('fig-6-1.png', 'Figure 6.1 — High-recall candidate generation followed by precision-restoring disambiguation. The gazetteer alone returns three Tata entities; the cross-encoder reading the sentence in context rejects two. Accepted links then fan out through the propagation graph at damped weights.'));
add(CODE('geotrade/entity/resolve.py', [
  'from sentence_transformers import CrossEncoder',
  'from rapidfuzz import process, fuzz',
  'import spacy',
  '',
  'nlp    = spacy.load("en_core_web_sm")',
  'ranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")',
  '',
  'def generate_candidates(text, gazetteer, limit=8):',
  '    """High recall. Union of NER spans and fuzzy gazetteer hits."""',
  '    spans = [e.text for e in nlp(text).ents if e.label_ == "ORG"]',
  '    hits  = {}',
  '    for span in spans:',
  '        for alias, score, ticker in process.extract(',
  '                span, gazetteer, scorer=fuzz.WRatio, limit=3):',
  '            if score >= 82:',
  '                hits[ticker] = max(hits.get(ticker, 0), score)',
  '    return sorted(hits, key=hits.get, reverse=True)[:limit]',
  '',
  'def disambiguate(text, candidates, cards, tau=0.55):',
  '    """Restore precision. Score (sentence, company card) pairs."""',
  '    if not candidates:',
  '        return []',
  '    pairs  = [(text, cards[t]) for t in candidates]',
  '    scores = ranker.predict(pairs)',
  '    linked = [(t, float(s)) for t, s in zip(candidates, scores) if s >= tau]',
  '    return sorted(linked, key=lambda x: -x[1])',
  '',
  '# cards["TATAMOTORS"] = ("Tata Motors - automobiles; commercial and "',
  '#                        "passenger vehicles; Jaguar Land Rover subsidiary")',
]));

add(H2('6.4', 'Salience and Aboutness'));
add(P('A resolved link is not yet a usable signal. The system estimates how central the entity is to the story, so that a passing comparison does not carry the weight of a subject. Salience combines headline presence, mention frequency and first-mention position:'));
add(EQ('sal(d,i) = 0.5 · 1[i ∈ headline] + 0.3 · n(d,i) / N(d) + 0.2 · (1 − p(d,i))', '6.1'));
add(WHERE('n(d,i) is the mention count of entity i in document d; N(d) is total entity mentions; p(d,i) is the normalised position of the first mention, so an earlier mention scores higher.'));

add(H2('6.5', 'Propagation'));
add(P('Second-order exposure is modelled as a weighted directed graph over securities. In Phase 1 the weights are hand-set. From Phase 4 the adjacency matrix is estimated from rolling 120-day return correlation, sector co-membership and index co-membership, and the weights are learned jointly with the predictor.'));
add(EQ('ε(j) = ε(i) · w(i,j) · [ β(j) / β(i) ] · δ^(h−1)', '6.2'));
add(WHERE('ε(i) is the expected impact on the directly named security; w(i,j) the edge weight to peer j; β the market beta, so a higher-beta peer inherits a larger move; δ ≈ 0.6 the hop decay; h the hop distance. Propagation is truncated at h = 2.'));

add(H2('6.6', 'Evaluation'));
add(P('Entity resolution is evaluated independently of the downstream model against a hand-labelled set of 500 headlines stratified across event categories and market-cap deciles. Precision, recall and F1 are reported per confidence decile, which is what allows the acceptance threshold τ to be set from evidence rather than by guess. The target is precision at or above 0.90 — precision is weighted above recall because a missed link costs one training example while a wrong link corrupts one.'));

/* ---------------------------------------------------------- 7 */
add(H1('7', 'Sentiment and Surprise Modelling'));

add(H2('7.1', 'The Expectation Gap'));
add(P('The most consequential modelling decision in the system is the separation of tone from surprise. The two coincide for unscheduled events and diverge sharply for anticipated ones.'));
add(FIGURE('fig-7-1.png', 'Figure 7.1 — Identical tone, opposite outcome. The right-hand case is the failure mode every naive sentiment pipeline exhibits; gating scheduled events on a surprise feature is what prevents it.'));
add(P('Every event is therefore classified as scheduled or unscheduled at ingestion. Scheduled events — quarterly results, MPC decisions, CPI and IIP prints, GST collection releases, monthly auto sales — require a surprise feature or are excluded from the trading signal entirely. Unscheduled events use tone directly.'));
add(EQ('surprise = (actual − consensus) / σ(consensus)', '7.1'));
add(WHERE('consensus is the analyst estimate where available. For a free-data project it frequently is not, and a proxy is substituted: the trailing four-quarter growth rate, or a seasonal naive forecast. Events with neither are flagged and the model learns to discount them.'));

add(H2('7.2', 'Scoring Ladder'));
add(P('Four sentiment implementations are specified, deliberately ordered by cost. Each must beat its predecessor out-of-sample to justify replacing it. The purpose of the ordering is that the cheap model sets the bar the expensive model has to clear.'));
add(TBL('Table 7.1 — Sentiment model ladder.',
  ['Tier', 'Method', 'Output', 'Cost', 'Rationale'],
  [
    ['S0', 'Loughran–McDonald lexicon with India supplement', 'Scalar polarity', 'Trivial', 'Interpretable floor; ships immediately'],
    ['S1', 'SESTM-style screened vocabulary', 'Return-supervised score', 'Low, CPU only', 'Learns sentiment from prices, not priors'],
    ['S2', 'FinBERT fine-tuned on Indian headlines', '3-class plus embedding', 'GPU for training', 'Handles negation, hedging, conditionals'],
    ['S3', 'Aspect-based extension of S2', 'Per-entity sentiment', 'High', 'Splits opposite-signed entities in one story'],
  ], [8, 32, 22, 16, 22]));
add(P('Tier S3 matters more than it first appears. A headline such as "safeguard duty on steel imports lifts domestic mills, hits auto makers" carries opposite signs for two entity groups in a single sentence. Document-level sentiment assigns both the same score and is simply wrong for one of them.'));

add(H2('7.3', 'Tier S1 — Return-Supervised Vocabulary'));
add(P('The screening step retains words whose frequency is meaningfully associated with the sign of subsequent abnormal returns. For each candidate word, the fraction of documents containing it that precede a positive abnormal return is compared against the base rate, and words are retained when both the deviation and the raw occurrence count exceed thresholds.'));
add(EQ('f(w) = #{d : w ∈ d, y(d) = +1} / #{d : w ∈ d}', '7.2'));
add(EQ('S(w) = 1 if f(w) ≥ π + α and count(w) ≥ κ;  −1 if f(w) ≤ π − α and count(w) ≥ κ', '7.3'));
add(WHERE('π is the unconditional positive rate, α the screening margin, and κ the minimum occurrence count. A document score is the loading of its screened words on the positive topic.'));

add(H2('7.4', 'Tier S2 — FinBERT'));
add(P('FinBERT is used in two roles. As a classifier it yields a three-class distribution over positive, negative and neutral, from which a scalar polarity is derived. As a feature extractor it yields a pooled representation of the headline, reduced by PCA and supplied to the gradient-boosted model as a dense block. The second role is generally the more valuable: the tree model can then condition language on market state, which a standalone classifier cannot.'));
add(CODE('geotrade/score/finbert.py', [
  'import torch',
  'from transformers import AutoTokenizer, AutoModelForSequenceClassification',
  '',
  'MODEL = "ProsusAI/finbert"',
  'tok   = AutoTokenizer.from_pretrained(MODEL)',
  'model = AutoModelForSequenceClassification.from_pretrained(MODEL).eval()',
  '',
  '@torch.no_grad()',
  'def score_batch(texts, batch_size=32):',
  '    """Return (polarity, confidence, cls_embedding) per text.',
  '',
  '    polarity in [-1, 1] = P(positive) - P(negative)',
  '    embedding feeds the LightGBM feature block in Section 10.',
  '    """',
  '    out = []',
  '    for i in range(0, len(texts), batch_size):',
  '        enc = tok(texts[i:i + batch_size], padding=True, truncation=True,',
  '                  max_length=128, return_tensors="pt")',
  '        res  = model(**enc, output_hidden_states=True)',
  '        prob = torch.softmax(res.logits, dim=-1)',
  '        cls  = res.hidden_states[-1][:, 0, :]     # pooled [CLS]',
  '',
  '        for p, e in zip(prob, cls):',
  '            polarity   = (p[0] - p[1]).item()',
  '            confidence = p.max().item()',
  '            out.append((polarity, confidence, e.numpy()))',
  '    return out',
]));

add(H2('7.5', 'Novelty and Staleness'));
add(P('The fifth article about a story carries almost no information; the first carries most of it. Novelty is computed against a rolling embedding index of recent documents.'));
add(EQ('nov(d) = 1 − max over d′ ∈ W of cos( v(d), v(d′) )', '7.4'));
add(WHERE('W is the set of documents from the trailing 48 hours and v is a sentence-transformer embedding. A near-duplicate scores near zero and is suppressed; a genuinely new story scores near one.'));

add(H2('7.6', 'Event Aggregation'));
add(P('Multiple documents describing one event collapse into a single security-level score, weighted by credibility, salience, novelty and recency.'));
add(EQ('S(i,t) = Σ_d [ s(d,i) · c(d) · sal(d,i) · nov(d) · e^(−λ(t − t_d)) ] / Σ_d [ c(d) · sal(d,i) · nov(d) ]', '7.5'));
add(WHERE('s(d,i) is the sentiment of document d toward security i; c(d) the source credibility normalised to the unit interval; λ the decay constant, initialised at ln(2)/24h so a day-old story carries half weight.'));

/* ---------------------------------------------------------- 8 */
add(H1('8', 'Feature Engineering'));

add(H2('8.1', 'Feature Families'));
add(P('The feature vector for a (security, event) pair spans five families. Text features alone are weak; the interaction between text and market state is where predictive content concentrates. A strongly positive story about a stock already up twelve percent in five sessions is a materially different proposition from the same story on a stock that has gone nowhere, and only the interaction can express that.'));

add(H2('8.2', 'Feature Dictionary'));
add(TBL('Table 8.1 — Feature dictionary. Families A and B derive from text; C, D and E are linkage and market state, and are what make the text features conditional rather than absolute.',
  ['ID', 'Feature', 'Type', 'Definition and rationale'],
  [
    ['A1', 'sentiment_polarity', 'float', 'P(positive) − P(negative) from the active sentiment tier'],
    ['A2', 'sentiment_conf', 'float', 'Maximum class probability; low confidence should shrink the signal'],
    ['A3', 'aspect_polarity', 'float', 'Entity-specific sentiment where tier S3 is available'],
    ['A4', 'surprise_z', 'float', 'Standardised deviation from consensus; null for unscheduled events'],
    ['A5', 'is_scheduled', 'bool', 'Gates whether A1 or A4 should dominate'],
    ['A6', 'hedge_density', 'float', 'Rate of modal and conditional constructions'],
    ['A7', 'forward_looking_ratio', 'float', 'Future-tense clause share; guidance moves more than history'],
    ['A8', 'finbert_emb', 'vector', 'Frozen pooled embedding, PCA-reduced to 32 dimensions'],
    ['B1', 'novelty', 'float', 'Equation 7.4; suppresses syndicated repeats'],
    ['B2', 'cluster_size', 'int', 'Distinct publishers on the story — corroboration proxy'],
    ['B3', 'velocity', 'float', 'Mentions per hour; first derivative of B2'],
    ['B4', 'source_cred_w', 'float', 'Credibility-weighted mean across the cluster'],
    ['B5', 'tier1_present', 'bool', 'Whether a primary filing backs the story'],
    ['B6', 'hours_since_first', 'float', 'Staleness at prediction time'],
    ['B7', 'category', 'cat', 'Earnings, regulation, order win, macro, commodity, deal'],
    ['C1', 'salience', 'float', 'Equation 6.1'],
    ['C2', 'link_conf', 'float', 'Cross-encoder disambiguation confidence'],
    ['C3', 'hop_distance', 'int', '0 direct, 1 sector peer, 2 supply chain'],
    ['C4', 'is_primary_subject', 'bool', 'Headline subject versus incidental mention'],
    ['D1', 'ret_5d_pre', 'float', 'Trailing 5-day abnormal return — momentum or exhaustion'],
    ['D2', 'realised_vol_20d', 'float', 'Scales the expected magnitude of any response'],
    ['D3', 'beta_60d', 'float', 'Rolling market beta; also required for labelling'],
    ['D4', 'turnover_ratio', 'float', 'Volume over 20-day ADV; thin names drift longer'],
    ['D5', 'mcap_decile', 'int', 'The hypothesis variable for H2'],
    ['D6', 'days_to_earnings', 'int', 'Proximity to a scheduled catalyst contaminates the window'],
    ['D7', 'circuit_proximity', 'float', 'Distance to the price band; truncates realisable moves'],
    ['D8', 'in_fno', 'bool', 'Derivative-eligible names price information faster'],
    ['E1', 'india_vix', 'float', 'Regime conditioner; news matters more when volatility is high'],
    ['E2', 'nifty_ret_5d', 'float', 'Market trend context'],
    ['E3', 'fii_flow_5d', 'float', 'Institutional flow regime'],
    ['E4', 'sector_ret_5d', 'float', 'Whether the sector is already moving on this theme'],
    ['E5', 'usdinr_chg_5d', 'float', 'Currency regime; material for IT and importers'],
  ], [7, 26, 10, 57]));

add(H2('8.3', 'Transformations'));
add(P('Continuous features are winsorised at the first and ninety-ninth percentiles computed on the training fold only, then standardised using training-fold moments. Categorical features are target-encoded with smoothing, again fitted on the training fold. Both operations are fitted inside the fold and applied to the test fold, never the reverse; fitting a scaler on the full dataset is a subtle and common leak.'));

add(H2('8.4', 'Missingness'));
add(P('Missing values are informative here and are not imputed away. A null surprise value means no consensus was available, which is itself predictive of how the market will react. LightGBM handles nulls natively; an explicit indicator column accompanies each feature where missingness carries meaning.'));

add(H2('8.5', 'Point-in-Time Discipline'));
add(CALLOUT('Point-in-time discipline',
  'Every feature must be computable using only information available at the prediction timestamp. The classic leak in this design is a rolling beta or realised volatility computed over a window that includes the event day. Both terminate strictly at t−1, and the feature builder asserts this rather than trusting it — assertion Q6 in Table 5.2 fails the build if violated.'));

/* ---------------------------------------------------------- 9 */
add(H1('9', 'Label Construction'));
add(P('The label is the abnormal return over the prediction window. This section specifies it completely, because a subtle error here invalidates everything downstream and is invisible in the headline metrics.'));

add(H2('9.1', 'Returns'));
add(EQ('R(i,t) = [ P(i,t) − P(i,t−1) ] / P(i,t−1)', '9.1'));
add(WHERE('P is the split- and dividend-adjusted closing price. Log returns are an acceptable alternative and change nothing material at this horizon.'));

add(H2('9.2', 'Market Model'));
add(P('Expected return is estimated by the single-index market model over a clean estimation window preceding the event.'));
add(EQ('R(i,t) = α(i) + β(i) · R(m,t) + ε(i,t)', '9.2'));

add(H2('9.3', 'Abnormal and Cumulative Abnormal Return'));
add(P('The abnormal return is the residual — the part of the move the market cannot explain.'));
add(EQ('AR(i,t) = R(i,t) − [ α̂(i) + β̂(i) · R(m,t) ]', '9.3'));
add(EQ('CAR(i; t1, t2) = Σ from t = t1 to t2 of AR(i,t)', '9.4'));
add(FIGURE('fig-9-1.png', 'Figure 9.1 — Event-study windows. The label starts at t+1, not t, because an event published mid-session cannot be traded at that day\'s open; assuming otherwise is the most common source of illusory backtest performance.'));

add(H2('9.4', 'Multiple Horizons'));
add(P('Following the drift-then-reversal finding discussed in Section 3.2, labels are computed at four horizons and all are retained. The primary target is the five-day window; the others are diagnostic and reveal the term structure of the response.'));
add(TBL('Table 9.1 — Label horizon specifications.',
  ['Horizon', 'Window', 'Role', 'Interpretation if positive'],
  [
    ['H1', '[t+1, t+1]', 'Diagnostic', 'Immediate, likely partly priced already'],
    ['H3', '[t+1, t+3]', 'Diagnostic', 'Short drift'],
    ['H5', '[t+1, t+5]', 'Primary target', 'The tradable horizon for this system'],
    ['H10', '[t+1, t+10]', 'Diagnostic', 'Persistence; negative here with positive H5 indicates reversal'],
  ], [12, 20, 20, 48]));

add(H2('9.5', 'Volatility-Scaled Classes'));
add(P('A fixed threshold treats a utility and a small-cap identically, which is wrong: a two percent move in a large utility is a significant event and in a thinly traded small-cap is noise. Thresholds scale with each security\'s own abnormal-return volatility.'));
add(EQ('τ(i) = k · σ(AR,i) · √H', '9.5'));
add(WHERE('σ(AR,i) is the daily residual standard deviation from the estimation window; H the horizon in trading days; k ≈ 1.0, tuned so the flat class holds roughly forty percent of samples.'));
add(EQ('y(i) = +1 if CAR(i) > τ(i);  −1 if CAR(i) < −τ(i);  0 otherwise', '9.6'));
add(CODE('geotrade/labels/abnormal.py', [
  'import numpy as np',
  'import pandas as pd',
  '',
  'def market_model(stock_ret, mkt_ret, est_end, window=120, gap=10):',
  '    """OLS alpha and beta on a clean pre-event window."""',
  '    stop  = est_end - pd.Timedelta(days=gap)',
  '    start = stop - pd.Timedelta(days=window * 1.5)   # calendar slack',
  '    y = stock_ret.loc[start:stop].dropna()',
  '    x = mkt_ret.reindex(y.index).dropna()',
  '    y = y.reindex(x.index)',
  '    if len(y) < 60:',
  '        return np.nan, np.nan, np.nan',
  '    beta, alpha = np.polyfit(x.values, y.values, 1)',
  '    resid       = y.values - (alpha + beta * x.values)',
  '    return alpha, beta, resid.std(ddof=2)',
  '',
  'def car_label(stock_ret, mkt_ret, event_date, horizon=5, k=1.0):',
  '    """CAR over [t+1, t+H] with a volatility-scaled 3-class label."""',
  '    alpha, beta, sigma = market_model(stock_ret, mkt_ret, event_date)',
  '    if np.isnan(beta):',
  '        return None',
  '',
  '    fwd = stock_ret.loc[stock_ret.index > event_date].head(horizon)',
  '    if len(fwd) < horizon:',
  '        return None            # incomplete window - drop, never pad',
  '',
  '    mkt = mkt_ret.reindex(fwd.index)',
  '    ar  = fwd.values - (alpha + beta * mkt.values)',
  '    car = float(ar.sum())',
  '',
  '    tau = k * sigma * np.sqrt(horizon)',
  '    y   = 1 if car > tau else (-1 if car < -tau else 0)',
  '    return {"car": car, "tau": tau, "label": y, "beta": beta,',
  '            "sigma": sigma, "horizon": horizon}',
]));
add(P('Note the explicit rejection of incomplete forward windows. Silently padding short windows — common near listing dates, suspensions and long holiday clusters — biases labels toward the flat class and is very difficult to detect after the fact.'));

add(H2('9.6', 'Alternative Specifications'));
add(P('Three robustness variants are computed alongside the primary specification, and any headline result is reported against all four. If a finding survives only under one expected-return model it is a property of that model, not of the market. The variants are: a sector-index market model in place of the broad index; a two-factor model adding a size proxy; and a simple index-subtracted return with no beta estimation.'));

add(H2('9.7', 'Exclusions'));
add(BULLET([
  'Securities under ASM or GSM surveillance at the event date.',
  'Securities whose price band was hit on the entry day, since the position could not be established.',
  'Events within two trading days of a scheduled results announcement, unless the event is that announcement.',
  'Securities with fewer than sixty valid observations in the estimation window.',
  'Any pair failing a data quality assertion from Table 5.2.',
]));

/* ---------------------------------------------------------- 10 */
add(H1('10', 'Model Stack'));

add(H2('10.1', 'Ladder'));
add(P('Five models, in the order they should be built. Each must beat the previous on out-of-sample rank information coefficient before the next is justified. Skipping directly to the neural tiers is the standard way to spend three months producing something a logistic regression would have matched.'));
add(TBL('Table 10.1 — Model ladder with inputs and the question each answers.',
  ['ID', 'Model', 'Inputs', 'Question it answers'],
  [
    ['M0', 'Constant / majority class', 'None', 'What does zero skill look like on this data?'],
    ['M1', 'Multinomial logistic regression', 'A1–A7, B1–B7, C1–C4', 'Is there any linear signal in the text features?'],
    ['M2', 'LightGBM, multiclass', 'M1 features plus D1–D8, E1–E5', 'Does text × market-state interaction add value?'],
    ['M3', 'FinBERT embeddings with LightGBM', 'M2 features plus A8', 'Does contextual language beat engineered features?'],
    ['M4', 'Temporal and graph attention', 'Event sequence plus correlation graph', 'Do multi-day narratives and peer effects matter?'],
  ], [8, 28, 28, 36]));

add(H2('10.2', 'Why Gradient Boosting Is the Workhorse'));
add(P('LightGBM, rather than a neural network, carries the main modelling load for reasons specific to this dataset. The sample size is small by deep-learning standards — perhaps fifty to two hundred thousand labelled pairs for a few years of Indian news. The features are heterogeneous and heavily tabular, mixing continuous market state with categorical event types and boolean flags. Missingness is informative and handled natively. In that regime gradient boosting is materially more sample-efficient, and the transformer earns its place as a feature extractor rather than as the end-to-end predictor.'));

add(H2('10.3', 'Configuration'));
add(TBL('Table 10.2 — LightGBM hyperparameter search ranges. Tuned inside each training fold only.',
  ['Parameter', 'Range', 'Default', 'Note'],
  [
    ['learning_rate', '0.01 – 0.08', '0.03', 'Lower with more rounds'],
    ['num_leaves', '15 – 63', '31', 'Primary capacity control'],
    ['min_data_in_leaf', '50 – 400', '120', 'Main guard against noise memorisation'],
    ['feature_fraction', '0.5 – 0.9', '0.75', 'Decorrelates trees'],
    ['bagging_fraction', '0.6 – 0.95', '0.80', 'With bagging_freq = 5'],
    ['lambda_l2', '1 – 20', '5.0', 'Shrinkage on leaf weights'],
    ['num_boost_round', '≤ 2000', 'early stop', 'Stopped on validation log-loss'],
  ], [26, 20, 18, 36]));
add(CODE('geotrade/model/train.py', [
  'import lightgbm as lgb',
  'from sklearn.metrics import log_loss',
  '',
  'PARAMS = {',
  '    "objective":        "multiclass",',
  '    "num_class":        3,',
  '    "learning_rate":    0.03,',
  '    "num_leaves":       31,',
  '    "min_data_in_leaf": 120,     # guard against noise memorisation',
  '    "feature_fraction": 0.75,',
  '    "bagging_fraction": 0.80,',
  '    "bagging_freq":     5,',
  '    "lambda_l2":        5.0,',
  '    "verbosity":        -1,',
  '}',
  '',
  'def train_fold(X_tr, y_tr, X_va, y_va, w_tr=None):',
  '    """One walk-forward fold. Sample weights carry |CAR| / tau so that',
  '    large unambiguous moves count more than marginal ones."""',
  '    dtr = lgb.Dataset(X_tr, label=y_tr + 1, weight=w_tr)',
  '    dva = lgb.Dataset(X_va, label=y_va + 1, reference=dtr)',
  '',
  '    booster = lgb.train(',
  '        PARAMS, dtr,',
  '        num_boost_round=2000,',
  '        valid_sets=[dva],',
  '        callbacks=[lgb.early_stopping(100, verbose=False)],',
  '    )',
  '    proba = booster.predict(X_va, num_iteration=booster.best_iteration)',
  '    return booster, proba, log_loss(y_va + 1, proba, labels=[0, 1, 2])',
  '',
  'def expected_score(proba):',
  '    """Collapse 3-class probabilities to a single rankable number."""',
  '    return proba[:, 2] - proba[:, 0]          # P(up) - P(down)',
]));

add(H2('10.4', 'Calibration'));
add(P('Raw boosted-tree probabilities are poorly calibrated, and calibration matters here because the dashboard renders a confidence level to a human reader. Isotonic regression is fitted on a held-out slice of each training fold and applied before display. Reliability curves and Brier scores are reported per fold; an uncalibrated model that ranks well is still usable for ranking but must not be shown as a probability.'));

add(H2('10.5', 'Class Imbalance'));
add(P('Roughly forty percent of samples are flat by construction. Rather than resampling, which distorts the base rate the calibration depends on, training uses sample weights proportional to the ratio of absolute CAR to the threshold. This makes the model care most about the events it most needs to get right and naturally discounts borderline cases sitting near the class boundary.'));

add(H2('10.6', 'Ensembling'));
add(P('Where two tiers perform comparably, their expected scores are averaged after rank-normalisation within each prediction date. Rank-averaging rather than probability-averaging avoids one model\'s miscalibration dominating the blend.'));

/* ---------------------------------------------------------- 11 */
add(H1('11', 'Training and Validation Protocol'));

add(H2('11.1', 'Walk-Forward Only'));
add(P('Random k-fold cross-validation is invalid for this problem. Market regimes are autocorrelated, and a random split places future observations in the training set, producing optimistic results that evaporate in live use. Validation is strictly walk-forward with an embargo.'));
add(FIGURE('fig-11-1.png', 'Figure 11.1 — Expanding-window walk-forward with embargo. Reporting the spread of the information coefficient across folds matters more than its mean: a signal that works in one regime and not others is not a signal.'));

add(H2('11.2', 'Embargo'));
add(P('The embargo width equals the label horizon. Without it, a training example whose label window extends past the train/test boundary shares realised price movement with the test period, and the model is partly evaluated on data it has seen.'));

add(H2('11.3', 'Hyperparameter Protocol'));
add(P('Hyperparameters are selected inside each training fold using an inner time-series split, never on the test fold. The test fold is touched exactly once per configuration, and the number of configurations evaluated is recorded, because a metric selected as the maximum over many trials is biased upward and that bias scales with the number of trials.'));

add(H2('11.4', 'Leakage Checklist'));
add(P('Every reported result must pass this checklist. It is written as a checklist because each item has been a real source of illusory performance in published work.'));
add(BULLET([
  'Embargo of at least H days between train and test, or a training label window overlaps the test period.',
  'Entry at t+1, never at the event-day close.',
  'Point-in-time universe — backtesting today\'s index constituents over five years embeds survivorship, because the index drops losers.',
  'First-release macro vintages, not revised final prints.',
  'Split and bonus adjustment applied consistently to both price and volume.',
  'Feature windows terminating at t−1, asserted in code.',
  'Scalers and encoders fitted on the training fold only.',
  'Delisted and suspended securities retained in the historical universe.',
]));
add(CODE('geotrade/backtest/walkforward.py', [
  'import pandas as pd',
  'from scipy.stats import spearmanr',
  '',
  'def walk_forward_folds(df, date_col="event_date",',
  '                       test_months=6, embargo_days=5, min_train_months=18):',
  '    """Expanding train window, fixed test window, embargo between."""',
  '    dates  = pd.to_datetime(df[date_col]).sort_values()',
  '    cursor = dates.min() + pd.DateOffset(months=min_train_months)',
  '    while cursor < dates.max():',
  '        test_end   = cursor + pd.DateOffset(months=test_months)',
  '        train_mask = dates <= cursor - pd.Timedelta(days=embargo_days)',
  '        test_mask  = (dates > cursor) & (dates <= test_end)',
  '        if test_mask.sum() > 200:',
  '            yield train_mask.values, test_mask.values',
  '        cursor = test_end',
  '',
  'def rank_ic(scores, realised_car, by_date):',
  '    """Cross-sectional Spearman IC, averaged over prediction days.',
  '',
  '    Computed per day then averaged - a pooled correlation across all',
  '    dates would be dominated by market-wide moves rather than by the',
  '    model\'s ability to rank names against each other.',
  '    """',
  '    frame = pd.DataFrame({"s": scores, "y": realised_car, "d": by_date})',
  '    daily = []',
  '    for _, g in frame.groupby("d"):',
  '        if len(g) >= 5:',
  '            ic, _ = spearmanr(g["s"], g["y"])',
  '            if pd.notna(ic):',
  '                daily.append(ic)',
  '    s = pd.Series(daily)',
  '    return {"ic_mean": s.mean(), "ic_std": s.std(),',
  '            "ic_ir": s.mean() / s.std() if s.std() else 0.0,',
  '            "n_days": len(s)}',
]));

add(H2('11.5', 'Reproducibility'));
add(P('Every reported result records the git commit, the configuration hash, the random seeds, the data snapshot date and the fold boundaries. A result that cannot be regenerated from archived inputs is treated as not having been obtained.'));

/* ---------------------------------------------------------- 12 */
add(H1('12', 'Evaluation'));

add(H2('12.1', 'Why Accuracy Is Not the Metric'));
add(P('Classification accuracy is close to useless here: a model predicting the flat class always scores roughly forty percent and has no skill whatever. The metrics below are ordered by how much influence they should have on the decision to continue.'));

add(H2('12.2', 'Primary Metrics'));
add(EQ('IC(t) = ρ_Spearman [ ŝ(i,t) , CAR(i; t+1, t+5) ]', '12.1'));
add(EQ('IR = mean over t of IC(t) / standard deviation over t of IC(t)', '12.2'));
add(P('The information coefficient is computed cross-sectionally within each prediction date and then averaged, rather than pooled across all dates. A pooled correlation is dominated by market-wide movement and flatters a model that has merely learned the market\'s direction.'));
add(FIGURE('fig-12-1.png', 'Figure 12.1 — The shape the decile analysis should produce if the signal is real. Monotonicity across deciles matters more than the endpoint values, because a monotone gradient is much harder to produce by chance than a single extreme bucket.'));

add(H2('12.3', 'Statistical Significance'));
add(P('The information coefficient series is autocorrelated, so a naive t-statistic overstates significance. Newey–West standard errors with a lag length of roughly the label horizon are used for the mean IC. In addition, a stationary block bootstrap over prediction dates produces a confidence interval that does not assume normality, and the lower bound of that interval is the number that governs the Phase 1 gate.'));

add(H2('12.4', 'Stratified Reporting'));
add(P('The headline number is less informative than its decomposition. Objective O5 requires the information coefficient reported by market-cap decile, liquidity bucket, event category, hop distance and volatility regime. Hypothesis H2 is confirmed or refuted precisely here. A flat overall coefficient that is strongly positive in the smallest three deciles is a success, and a reporting design that cannot surface that distinction is a design fault.'));

add(H2('12.5', 'Acceptance Thresholds'));
add(TBL('Table 12.1 — Evaluation metrics and go / no-go thresholds. The information coefficient is the primary decision metric.',
  ['Metric', 'Definition', 'Baseline', 'Target'],
  [
    ['Rank IC', 'Daily cross-sectional Spearman(score, CAR)', '0.00', '> 0.03'],
    ['IC information ratio', 'mean(IC) / sd(IC)', '0.00', '> 0.30'],
    ['Directional hit rate', 'Sign accuracy on non-flat predictions', '50%', '> 54%'],
    ['Precision@10', 'Share of top-10 daily picks with positive CAR', '50%', '> 58%'],
    ['Mean CAR, top decile', 'Average 5-day abnormal return, highest-scored decile', '0 bps', '> 40 bps'],
    ['Long–short spread', 'Top decile CAR minus bottom decile CAR', '0 bps', '> 80 bps'],
    ['Decile monotonicity', 'Spearman of decile rank against mean CAR', '0.00', '> 0.70'],
    ['Brier score', 'Calibration of the 3-class output', '0.22', '< 0.20'],
  ], [24, 40, 16, 20]));
add(CALLOUT('Calibrate expectations',
  'A rank information coefficient of 0.03 sounds negligible and is in fact a respectable result for a daily equity signal; published cross-sectional signals frequently sit in the 0.02 to 0.05 band. If early results show a coefficient above 0.15, the first hypothesis should be a data leak rather than a discovery. Check the embargo and the entry timing before celebrating.'));

/* ---------------------------------------------------------- 13 */
add(H1('13', 'Simulated Execution and Costs'));
add(P('A signal that survives validation has still not been shown to be worth acting on. Indian transaction costs are material at this horizon and asymmetric between buying and selling, and a cost model is therefore part of the evaluation rather than an afterthought.'));

add(H2('13.1', 'Cost Model'));
add(TBL('Table 13.1 — Indicative round-trip cost components for delivery-based equity trades. Rates change; treat as structure, not as current values.',
  ['Component', 'Applies to', 'Indicative rate', 'Note'],
  [
    ['Securities transaction tax', 'Sell side, delivery', '≈ 0.1% of value', 'Charged on the sell leg'],
    ['Brokerage', 'Both legs', '0 – 0.05%', 'Discount brokers often flat-fee'],
    ['Exchange transaction charge', 'Both legs', '≈ 0.003%', 'Venue dependent'],
    ['SEBI turnover fee', 'Both legs', 'Negligible', 'Small per-crore levy'],
    ['Stamp duty', 'Buy side', '≈ 0.015%', 'Buy leg only'],
    ['GST', 'On brokerage and charges', '18% of those', 'Applies to fees, not to value'],
    ['Bid-ask spread', 'Both legs', 'Half-spread each way', 'Dominant cost in small caps'],
    ['Market impact', 'Both legs', 'Size dependent', 'Modelled as a function of participation'],
  ], [26, 20, 22, 32]));
add(P('The sum of the explicit components is small for large caps and is dwarfed by the spread and impact terms in exactly the small and mid-cap universe where the signal is hypothesised to live. This tension is the single most important practical finding the cost model must surface.'));

add(H2('13.2', 'Impact Model'));
add(P('Market impact is modelled with a square-root law in participation rate, which is the conventional functional form and adequate for a feasibility assessment.'));
add(EQ('impact(bps) = γ · σ_daily · √( Q / ADV )', '13.1'));
add(WHERE('Q is the order quantity, ADV the twenty-day average daily volume, σ_daily the realised daily volatility, and γ a calibration constant taken in the range 0.5 to 1.0 in the absence of execution data.'));

add(H2('13.3', 'Portfolio Construction'));
add(P('The evaluation portfolio is deliberately simple, because a complex construction layer can manufacture apparent performance that the signal does not contain. Each prediction date, the top decile by expected score is bought in equal weight and the bottom decile sold, positions are held for exactly five trading days, and no leverage, stop-loss or discretionary override is applied. Capacity is reported as the notional at which modelled impact consumes half the gross spread.'));

add(H2('13.4', 'Turnover'));
add(P('With a five-day holding period and daily rebalancing of one-fifth of the book, annual turnover is roughly fifty times. At that turnover, a round-trip cost of thirty basis points consumes fifteen percent of notional per year, which sets a hard floor on the gross spread required for the strategy to be viable. This calculation is performed and reported before any capital decision is contemplated.'));

/* ---------------------------------------------------------- 14 */
add(H1('14', 'Interfaces'));

add(H2('14.1', 'Prediction API'));
add(P('The model service exposes a small read-only REST surface consumed by the existing React dashboard. Contracts are versioned in the path so that a model change cannot silently alter the response shape.'));
add(TBL('Table 14.1 — REST endpoints exposed by the serving layer.',
  ['Method', 'Path', 'Returns'],
  [
    ['GET', '/v1/predictions?date=&limit=', 'Ranked (security, score, confidence, horizon) rows for a date'],
    ['GET', '/v1/events?since=&limit=', 'Tagged events with linked securities and impact estimates'],
    ['GET', '/v1/security/{symbol}/history', 'Past predictions and realised CAR for one security'],
    ['GET', '/v1/model/metadata', 'Active model version, training window, fold metrics'],
    ['GET', '/v1/health', 'Source uptime, ingestion lag, last successful poll'],
  ], [12, 34, 54]));

add(H2('14.2', 'Dashboard Integration'));
add(P('The dashboard already renders an event feed with per-security impact chips and a desk-view note. Integration replaces the client-side heuristic that currently generates those notes with server-side model output, leaving the presentation layer unchanged. The confidence shown to the reader is the calibrated probability from Section 10.4, not the raw score.'));

add(H2('14.3', 'Data Contracts'));
add(P('Every response carries the model version, the feature-set version and the data snapshot timestamp. Without those three fields a screenshot of the dashboard cannot be reconciled against a stored result, and reproducibility claims become unverifiable.'));

/* ---------------------------------------------------------- 15 */
add(H1('15', 'Implementation Roadmap'));

add(H2('15.1', 'Phase Sequence'));
add(P('Each phase ends in a gate. A failed gate is a reason to stop or redesign, not to proceed with additional features.'));
add(FIGURE('fig-15-1.png', 'Figure 15.1 — Phase sequence with decision gates. Phase 1 is deliberately positioned before any transformer work, because it answers the question that determines whether the rest is worth building.'));
add(TBL('Table 15.1 — Phase definitions, deliverables and gates.',
  ['Phase', 'Deliverable', 'Gate'],
  [
    ['0', 'Archive 24–36 months of news and filings with timestamps; assemble adjusted EOD prices for the full universe', '≥ 20k labelled (security, event) pairs'],
    ['1', 'Event-study labels; S0 lexicon; M1 logistic model; first walk-forward run', 'IC > 0 with a positive bootstrap lower bound'],
    ['2', 'Two-stage entity resolver with labelled eval set; full feature table; M2 LightGBM; tier-1 filings added', 'Link precision ≥ 0.90; IC improves over Phase 1'],
    ['3', 'FinBERT fine-tuned on Indian headlines; M3 embeddings; surprise feature; probability calibration', 'M3 beats M2 out-of-sample, or M2 is retained'],
    ['4', 'Learned correlation graph; temporal attention over event sequences; aspect-based sentiment', 'Incremental IC justifies the added complexity'],
    ['5', 'Live paper trading with no capital; realised versus backtest comparison', 'Live IC within 50% of backtest IC over 3 months'],
  ], [8, 52, 40]));
add(P('Phase 0 is the long pole and should be started first and allowed to run in the background. Without archived history there is nothing to validate against, and history cannot be manufactured retrospectively — a feed polled today yields no record of what was published two years ago.'));

/* ---------------------------------------------------------- 16 */
add(H1('16', 'Risks and Limitations'));

add(H2('16.1', 'Risk Register'));
add(TBL('Table 16.1 — Principal risks. R1 is the project-level risk; the remainder are manageable.',
  ['ID', 'Risk', 'Impact', 'Mitigation'],
  [
    ['R1', 'No exploitable signal survives at public-feed latency', 'Fatal', 'Phase 1 gate tests this before major investment; fall back to the explanation product'],
    ['R2', 'Backtest leakage inflating results', 'Severe', 'Leakage checklist §11.4; live paper trading in Phase 5'],
    ['R3', 'Entity resolution errors injecting label noise', 'Moderate', 'Confidence thresholds; labelled eval set; tier-1 filings bypass the problem'],
    ['R4', 'Regime dependence — signal works in one market state only', 'Moderate', 'Report IC spread across folds, not only the mean'],
    ['R5', 'Sample size insufficient for the neural tiers', 'Moderate', 'Ladder design; stop at the tier the data supports'],
    ['R6', 'Source instability — feeds change format or block access', 'Low', 'Source abstraction layer; tier-1 official feeds are stable'],
    ['R7', 'Transaction costs eliminate a real but small edge', 'Moderate', 'Cost model in §13 evaluated before any capital decision'],
    ['R8', 'Overfitting through repeated evaluation on the same test folds', 'Severe', 'Trial count recorded; final holdout reserved and touched once'],
  ], [7, 38, 13, 42]));

add(H2('16.2', 'On the Principal Risk'));
add(P('The honest prior is that this system will find little or no edge in the NIFTY 50 and may find something in the small and mid-cap tail. The architecture is designed so that this outcome is a finding rather than a failure. The stratified reporting of Section 12.4 identifies where signal exists, and the explanation-oriented product — telling a reader why a holding moved, rather than predicting that it will — remains valuable at zero predictive information coefficient.'));

add(H2('16.3', 'Known Limitations'));
add(BULLET([
  'English-language sources only; a substantial share of Indian retail-relevant commentary is vernacular.',
  'No consensus estimate data in the base specification, which weakens the surprise feature where it matters most.',
  'Daily-frequency price data cannot distinguish intraday sequencing of events occurring on the same day.',
  'Sentiment models are trained predominantly on US financial text and may transfer imperfectly to Indian usage and idiom.',
  'The propagation graph captures correlation, not causation, and will misattribute during sector-wide moves.',
]));

/* ---------------------------------------------------------- 17 */
add(H1('17', 'Regulatory, Ethical and Governance Position'));

add(H2('17.1', 'Regulatory Status'));
add(P('GeoTrade is a personal research project. Its outputs are consumed by its author and are not published, sold or otherwise distributed. Under that construction the SEBI (Research Analysts) Regulations, 2014 and the SEBI (Investment Advisers) Regulations, 2013 are not engaged, since both are triggered by providing research or advice to other persons, typically for consideration.'));
add(P('The position changes materially if any of the following occur:'));
add(BULLET([
  'Output is shown to other people as buy or sell recommendations on named securities;',
  'Access is monetised in any form, including subscription or advertising;',
  'The system is marketed as providing research or advisory value.',
]));
add(P('Any of those steps warrants advice from a practitioner in Indian securities regulation before proceeding. Labelling output as educational or for information only is not reliably sufficient where the substance reads as a recommendation.'));
add(CALLOUT('Not legal advice',
  'This section reflects a general reading and is not legal advice. Regulatory positions change. Verify current SEBI requirements directly before any distribution or monetisation decision.'));

add(H2('17.2', 'Market Conduct'));
add(P('Two obligations apply regardless of registration status. Source terms of use must be respected when polling feeds, including rate limits and robots directives. And nothing in this system may ingest or act upon material non-public information; the design deliberately restricts itself to sources that are public by construction, which makes this straightforward to demonstrate.'));

add(H2('17.3', 'Data Governance'));
add(P('Archived article text is stored for research use, retained only as long as required for reproducibility, and never redistributed. Article content is not republished in any interface; the dashboard displays headlines with attribution and links to the publisher, which is the conventional and defensible treatment.'));

add(H2('17.4', 'Research Integrity'));
add(P('Two commitments guard against self-deception, which is the dominant failure mode in personal quantitative research. Negative results are recorded with the same rigour as positive ones, in the same log. And a final holdout period is reserved at the outset and evaluated exactly once, at the end; a holdout consulted repeatedly during development has become a validation set and no longer measures what it was reserved to measure.'));

/* ---------------------------------------------------------- 18 */
add(H1('18', 'Future Work'));
add(P('The following extensions are out of scope for this revision but are recorded so the architecture does not foreclose them.'));
add(H2('18.1', 'Vernacular Language Processing'));
add(P('A meaningful share of retail-relevant Indian commentary appears in Hindi and other regional languages. Multilingual encoders such as MuRIL and IndicBERT are designed for Indian language data and would extend source coverage substantially, at the cost of a new labelled evaluation set per language.'));
add(H2('18.2', 'Large Language Models for Structured Extraction'));
add(P('Instruction-tuned language models are well suited to converting a headline into a structured event tuple — actor, action, object, magnitude, direction — which is the representation Ding et al. show outperforms lexical features. Cost and latency currently favour using them offline to build training data for a smaller distilled model, rather than in the live path.'));
add(H2('18.3', 'Alternative Data'));
add(P('Exchange bulk and block deal disclosures, shareholding pattern changes, insider transaction filings and mutual fund monthly portfolio disclosures are all free, structured, and directly price-relevant. They also arrive as filings rather than as prose, which sidesteps the entity resolution problem entirely.'));
add(H2('18.4', 'Options-Implied Expectations'));
add(P('For derivative-eligible securities, implied volatility and skew before an event provide a market-consensus estimate of expected magnitude. That is precisely the consensus benchmark the surprise feature lacks, and it is observable rather than estimated.'));

/* ---------------------------------------------------------- 19 */
add(H1('19', 'Conclusion'));
add(P('This report specifies a system to test a narrow and falsifiable claim: that public Indian financial news carries information about abnormal returns over a one-to-five day horizon that is not fully priced at publication, and that the effect concentrates in securities with thin analyst coverage.'));
add(P('The architecture is conventional by design. Nothing in the data layer, the entity resolver, the sentiment ladder or the model stack is novel, and that is deliberate — the contribution the project can realistically make is not a new method but a carefully validated answer in a market where careless validation is common. The three commitments that carry the weight are abnormal-return labelling, the separation of surprise from tone, and walk-forward validation with a real embargo. Each guards against a specific way of producing results that look good and are not.'));
add(P('The phased delivery places the existential question first. Phase 1 requires an event-study label set, a word-list sentiment score and a logistic regression, and it will indicate within weeks whether the premise holds. Everything after that is refinement, and none of it is worth building if the first gate fails.'));
add(P('Should the premise fail, the work is not wasted. The ingestion, resolution and scoring layers support an explanation product — telling a reader why a holding moved, and which story drove it — that requires no predictive power at all and retains most of the practical value for its intended user.'));

/* ---------------------------------------------------------- App A */
add(H1('Appendix A', 'References'));
const refs = [
  ['Loughran, T., & McDonald, B. (2011). ', 'When Is a Liability Not a Liability? Textual Analysis, Dictionaries, and 10-Ks. ', 'The Journal of Finance, 66(1), 35–65.',
    'Drives: retirement of the general-purpose lexicon in favour of finance-specific word lists (§3.1, §7.2).'],
  ['Tetlock, P. C. (2007). ', 'Giving Content to Investor Sentiment: The Role of Media in the Stock Market. ', 'The Journal of Finance, 62(3), 1139–1168.',
    'Drives: the multi-day horizon and multi-window labelling that captures drift-then-reversal (§3.2, §9.4).'],
  ['Araci, D. (2019). ', 'FinBERT: Financial Sentiment Analysis with Pre-trained Language Models. ', 'arXiv preprint arXiv:1908.10063.',
    'Drives: the S2 sentiment tier and the embedding feature block A8 (§3.3, §7.4, §10.1).'],
  ['Ke, Z. T., Kelly, B. T., & Xiu, D. (2019). ', 'Predicting Returns with Text Data. ', 'NBER Working Paper No. 26186.',
    'Drives: the central reframing of sentiment as return-supervised learning; the S1 tier (§3.4, §7.3).'],
  ['Sawhney, R., Agarwal, S., Wadhwa, A., & Shah, R. R. (2020). ', 'Deep Attentive Learning for Stock Movement Prediction from Social Media Text and Company Correlations. ', 'Proceedings of EMNLP 2020.',
    'Drives: the learned propagation graph replacing hand-set sector weights (§3.5, §6.5, §10.1).'],
];
refs.forEach(([authors, title, venue, why], i) => {
  add(new Paragraph({
    spacing: { before: 140, after: 40, line: 276 },
    indent: { left: 480, hanging: 480 },
    children: [
      new TextRun({ text: `[${i + 1}]  `, font: 'Calibri', size: 20, bold: true, color: INDIGO }),
      new TextRun({ text: authors, font: 'Calibri', size: 20, color: INK }),
      new TextRun({ text: title, font: 'Calibri', size: 20, bold: true, color: INK }),
      new TextRun({ text: venue, font: 'Calibri', size: 20, italics: true, color: MUTED }),
    ],
  }));
  add(new Paragraph({
    spacing: { after: 120, line: 264 },
    indent: { left: 480 },
    border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'C9D2DE', space: 8 } },
    children: [new TextRun({ text: why, font: 'Calibri', size: 19, color: MUTED })],
  }));
});
add(P('Further reading, not load-bearing: Ding, X., Zhang, Y., Liu, T., & Duan, J. (2015), Deep Learning for Event-Driven Stock Prediction, IJCAI — structured event tuples rather than bag-of-words. Hu, Z., Liu, W., Bian, J., Liu, X., & Liu, T.-Y. (2018), Listening to Chaotic Whispers, WSDM — hierarchical attention over news sequences, relevant to model tier M4.', { before: 200 }));

/* ---------------------------------------------------------- App B */
add(H1('Appendix B', 'Notation'));
add(TBL('Table B.1 — Symbols used throughout this report.',
  ['Symbol', 'Meaning', 'First use'],
  [
    ['R(i,t)', 'Simple return of security i on day t', 'Eq. 9.1'],
    ['R(m,t)', 'Market return (NIFTY 50) on day t', 'Eq. 9.2'],
    ['α(i), β(i)', 'Market-model intercept and slope for security i', 'Eq. 9.2'],
    ['AR(i,t)', 'Abnormal return — market-model residual', 'Eq. 9.3'],
    ['CAR(i)', 'Cumulative abnormal return over the event window', 'Eq. 9.4'],
    ['σ(AR,i)', 'Residual standard deviation from the estimation window', 'Eq. 9.5'],
    ['τ(i)', 'Volatility-scaled class threshold', 'Eq. 9.5'],
    ['y(i)', 'Three-class label in {−1, 0, +1}', 'Eq. 9.6'],
    ['H', 'Prediction horizon in trading days', 'Eq. 9.5'],
    ['k', 'Threshold scaling constant', 'Eq. 9.5'],
    ['s(d,i)', 'Sentiment of document d toward security i', 'Eq. 7.5'],
    ['S(i,t)', 'Aggregated security-level sentiment at time t', 'Eq. 7.5'],
    ['sal(d,i)', 'Salience of entity i within document d', 'Eq. 6.1'],
    ['nov(d)', 'Novelty of document d against the trailing window', 'Eq. 7.4'],
    ['c(d)', 'Source credibility of document d, normalised', 'Eq. 7.5'],
    ['λ', 'Time-decay constant in sentiment aggregation', 'Eq. 7.5'],
    ['w(i,j)', 'Propagation edge weight from security i to peer j', 'Eq. 6.2'],
    ['δ', 'Hop decay factor in the propagation graph', 'Eq. 6.2'],
    ['h', 'Hop distance in the propagation graph', 'Eq. 6.2'],
    ['ε(i)', 'Expected impact on security i from an event', 'Eq. 6.2'],
    ['f(w)', 'Positive-return frequency of word w', 'Eq. 7.2'],
    ['π, α, κ', 'Base rate, screening margin, minimum count in SESTM screening', 'Eq. 7.3'],
    ['IC(t)', 'Cross-sectional rank information coefficient on day t', 'Eq. 12.1'],
    ['IR', 'Information ratio of the IC series', 'Eq. 12.2'],
    ['γ', 'Market impact calibration constant', 'Eq. 13.1'],
    ['Q, ADV', 'Order quantity and 20-day average daily volume', 'Eq. 13.1'],
  ], [16, 58, 26]));

/* ---------------------------------------------------------- App C */
add(H1('Appendix C', 'Glossary of Indian Market Terms'));
add(TBL('Table C.1 — Domain terms used in this report.',
  ['Term', 'Definition'],
  [
    ['ASM', 'Additional Surveillance Measure — an NSE/BSE framework imposing higher margins on securities showing unusual price or volume behaviour.'],
    ['Bulk deal', 'A transaction exceeding 0.5% of listed shares, disclosed to the exchange the same day.'],
    ['Block deal', 'A large negotiated trade executed in a separate window, disclosed to the exchange.'],
    ['Circuit / price band', 'The maximum permitted daily price movement for a security, set at 2, 5, 10 or 20 percent.'],
    ['Crore', 'Ten million. One lakh crore is 10^12.'],
    ['DII', 'Domestic Institutional Investor — Indian mutual funds, insurers and banks.'],
    ['FII / FPI', 'Foreign Institutional Investor / Foreign Portfolio Investor.'],
    ['F&O', 'The futures and options segment; only a subset of securities is derivative-eligible.'],
    ['GSM', 'Graded Surveillance Measure — a stricter surveillance framework than ASM.'],
    ['Lakh', 'One hundred thousand.'],
    ['MPC', 'Monetary Policy Committee of the RBI, which sets the repo rate.'],
    ['NIFTY 50', 'The NSE benchmark index of fifty large-capitalisation securities.'],
    ['Promoter', 'A controlling shareholder or founding group; promoter share pledges are price-relevant disclosures.'],
    ['QIP', 'Qualified Institutional Placement — a capital raise to institutional investors.'],
    ['Repo rate', 'The RBI policy rate at which it lends to commercial banks.'],
    ['SENSEX', 'The BSE benchmark index of thirty large-capitalisation securities.'],
    ['STT', 'Securities Transaction Tax, levied on the sell leg of delivery trades.'],
    ['T+1', 'Settlement one business day after the trade date.'],
    ['Trade-to-trade', 'A settlement category requiring compulsory delivery, prohibiting intraday netting.'],
  ], [18, 82]));

/* ---------------------------------------------------------- App D */
add(H1('Appendix D', 'Code Listing Index'));
add(TBL('Table D.1 — Code listings appearing in this report.',
  ['Listing', 'File', 'Purpose', 'Section'],
  [
    ['D.1', 'geotrade/schema.py', 'Normalised document record', '5.2'],
    ['D.2', 'geotrade/entity/resolve.py', 'Two-stage entity resolution', '6.3'],
    ['D.3', 'geotrade/score/finbert.py', 'Transformer sentiment and embedding extraction', '7.4'],
    ['D.4', 'geotrade/labels/abnormal.py', 'Market model, CAR and volatility-scaled labels', '9.5'],
    ['D.5', 'geotrade/model/train.py', 'LightGBM fold training and score collapse', '10.3'],
    ['D.6', 'geotrade/backtest/walkforward.py', 'Walk-forward folds and rank IC', '11.4'],
  ], [12, 32, 42, 14]));

/* ---------------------------------------------------------- App E */
add(H1('Appendix E', 'Configuration Reference'));
add(P('Default values for the parameters that govern system behaviour. All are overridable per experiment, and every reported result records the configuration hash that produced it.'));
add(TBL('Table E.1 — Configuration defaults.',
  ['Parameter', 'Default', 'Governs', 'Section'],
  [
    ['poll_interval', '300 s', 'Source polling cadence', '5.3'],
    ['fetch_timeout', '12 s', 'Per-source request timeout', '5.3'],
    ['dedupe_similarity', '0.92', 'Near-duplicate cosine threshold', '5.4'],
    ['novelty_window', '48 h', 'Trailing window for novelty scoring', '7.5'],
    ['link_threshold_tau', '0.55', 'Entity acceptance confidence', '6.3'],
    ['propagation_decay', '0.60', 'Hop decay δ', '6.5'],
    ['propagation_max_hops', '2', 'Truncation of the propagation graph', '6.5'],
    ['sentiment_decay_lambda', 'ln(2)/24h', 'Recency weighting in aggregation', '7.6'],
    ['estimation_window', '120 days', 'Market model fitting window', '9.2'],
    ['estimation_gap', '10 days', 'Gap before the event', '9.2'],
    ['label_horizon', '5 days', 'Primary prediction horizon', '9.4'],
    ['threshold_k', '1.0', 'Volatility scaling of class boundaries', '9.5'],
    ['embargo_days', '5', 'Walk-forward embargo width', '11.2'],
    ['test_window', '6 months', 'Walk-forward test fold length', '11.1'],
    ['min_train_window', '18 months', 'Minimum training history', '11.1'],
    ['impact_gamma', '0.75', 'Market impact calibration', '13.2'],
  ], [28, 18, 40, 14]));

add(new Paragraph({
  spacing: { before: 400, after: 0 },
  border: { top: { style: BorderStyle.DOUBLE, size: 6, color: 'B6C1D0', space: 10 } },
  children: [new TextRun({
    text: 'GT-TDR-002 · Revision 2.0 · Draft for build. Prepared as the design basis for the GeoTrade research system. Signals produced by this system are research output and do not constitute investment advice. References in Appendix A should be verified against their publishers before citation in any formal work.',
    font: 'Calibri', size: 18, italics: true, color: MUTED,
  })],
}));

/* ======================= DOCUMENT ======================= */

const pageProps = (fmt, start) => ({
  page: {
    size: { width: PAGE_W, height: PAGE_H },
    margin: { top: 1440, right: MARGIN, bottom: 1440, left: MARGIN, header: 720, footer: 560 },
    pageNumbers: fmt ? { start, formatType: fmt } : undefined,
  },
});

const mkFooter = (label) => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DE', space: 6 } },
    children: [
      new TextRun({ text: `${label}          `, font: 'Calibri', size: 16, color: '93A0B1' }),
      new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: MUTED, bold: true }),
    ],
  })],
});

const mkHeader = () => new Header({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C9D2DE', space: 6 } },
    children: [new TextRun({
      text: 'GeoTrade — Technical Design Report   ·   GT-TDR-002',
      font: 'Calibri', size: 16, color: '93A0B1',
    })],
  })],
});

const doc = new Document({
  creator: 'GeoTrade',
  title: 'GeoTrade — Technical Design Report',
  description: 'News-sentiment signal architecture for Indian equities',
  numbering: {
    config: [
      {
        reference: 'gt-bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 240 } } },
        }],
      },
      {
        reference: 'gt-numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 460, hanging: 280 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 21, color: INK } },
      heading1: { run: { font: 'Cambria', size: 30, bold: true, color: INK } },
      heading2: { run: { font: 'Cambria', size: 24, bold: true, color: INK } },
      heading3: { run: { font: 'Calibri', size: 21, bold: true, color: INK } },
    },
  },
  sections: [
    { properties: pageProps(), children: titlePage },
    {
      properties: pageProps(NumberFormat.LOWER_ROMAN, 1),
      footers: { default: mkFooter('GT-TDR-002') },
      children: frontMatter,
    },
    {
      properties: pageProps(NumberFormat.DECIMAL, 1),
      headers: { default: mkHeader() },
      footers: { default: mkFooter('GT-TDR-002  ·  Rev 2.0') },
      children: body,
    },
  ],
});

const OUT = path.join(__dirname, '..', 'docs', 'GeoTrade-Technical-Design-Report.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log('WROTE', OUT, (buf.length / 1024).toFixed(0) + ' KB');
});
