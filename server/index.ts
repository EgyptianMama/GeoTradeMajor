import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { getEvents, getStatus, poll, startPolling } from './poller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const app = express();
const PORT = Number(process.env.PORT ?? 5274);
const PRODUCTION = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true }));
app.disable('x-powered-by');

/** Tagged Indian market news, newest first. */
app.get('/api/news', (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 60) || 60, 120);
  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    events: getEvents().slice(0, limit),
    status: getStatus(),
  });
});

/** Feed health — which sources respond, how stale the cache is. */
app.get('/api/status', (_req, res) => {
  res.json(getStatus());
});

/**
 * Liveness probe for the host platform. Reports degraded rather than
 * unhealthy when feeds are blocked, since the frontend falls back to its
 * offline generator and the demo stays usable.
 */
app.get('/api/health', (_req, res) => {
  const s = getStatus();
  const feedsUp = s.feeds - s.errors.length;
  res.json({
    ok: true,
    state: s.events > 0 ? 'live' : 'degraded',
    events: s.events,
    feedsUp,
    feedsTotal: s.feeds,
    lastPollAgeSeconds: s.ageSeconds,
    failing: s.errors,
  });
});

/** Force a refresh without waiting for the interval. */
app.post('/api/refresh', async (_req, res) => {
  try {
    await poll();
    res.json({ ok: true, status: getStatus() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/**
 * In production the same process serves the built frontend, so the deployed
 * demo is a single origin with no proxy or CORS configuration.
 */
if (PRODUCTION) {
  const DIST = path.join(ROOT, 'dist');
  if (!fs.existsSync(DIST)) {
    console.error(`[server] dist/ not found at ${DIST} — run "npm run build" first`);
  } else {
    app.use(express.static(DIST, { index: false, maxAge: '1h' }));
    // SPA fallback: anything that is not an API route returns the shell.
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(DIST, 'index.html'));
    });
    console.log(`[server] serving frontend from ${DIST}`);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] GeoTrade on http://0.0.0.0:${PORT} (${PRODUCTION ? 'production' : 'development'})`);
  startPolling();
});
