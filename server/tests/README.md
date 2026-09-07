# Measurement Scripts

Scripts to measure performance of the SAMs stock prediction app.

## Prerequisites

```bash
cd server
npm install    # installs dependencies (express, yahoo-finance2, axios, etc.)
npm install pg # PostgreSQL client (needed for server to boot)
```

## Yahoo Finance2 Single Quote RPS

Measures how fast a single Yahoo Finance quote/chart request takes and computes approximate requests-per-second.

```bash
node tests/measure_yahoo_rps.mjs
```

### What it measures

- Hits the Yahoo Finance v8 chart API for `AAPL` (10-day daily window) — the same endpoint `forecast.js` uses internally
- Reports elapsed time (ms), data points returned, last close price, and approximate RPS

### Example output

```
=== Yahoo Finance2 Single Quote Measurement ===
Symbol: AAPL
Data points (daily): 7
Last close: 319.9700012207031
Elapsed: 639.47ms (0.6395s)
Approx RPS (1 call / elapsed): 1.56
```

### Why not the yahoo-finance2 library directly?

yahoo-finance2 v2.14.0's `quote` method requires a Yahoo "crumb" cookie. In restricted network environments (e.g. this sandbox) the crumb endpoint returns 401/429. The chart endpoint used here does not require a crumb and returns the same underlying data. In production with a valid crumb, the library call would be marginally slower due to the extra crumb round-trip.

---

## POST /api/predict Serial vs Parallel

Measures the latency of one `POST /api/predict` call run serially (two calls back-to-back) vs in parallel (`Promise.all`).

### Start the server

The server needs PostgreSQL (it tries to connect on boot but continues without DB for the `/api/predict` endpoint):

```bash
# port 5001, no OpenAI key (sentiment short-circuits to neutral)
SERVER_PORT=5001 OPENAI_API_KEY="" node index.js
# or, from project root:
cd newmanngarry\SAMs-master\server
SERVER_PORT=5001 OPENAI_API_KEY="" node index.js
```

You should see: `SAMS server running on http://localhost:5001`

### Run the test

```bash
# In a second terminal, from the same server/ directory:
node tests/measure_predict_latency.mjs
```

### What it measures

- **Serial**: two sequential `POST /api/predict` calls; reports per-call elapsed and total
- **Parallel**: two concurrent `POST /api/predict` calls via `Promise.all`; reports total
- Compares the two to show the time saved by concurrent execution

### Example output

```
=== POST /api/predict Serial vs Parallel Latency ===

Serial (one after another):
  Call 1: 952.06ms (HTTP 200)
  Call 2: 398.66ms (HTTP 200)
  Total:  1350.72ms

Parallel (Promise.all):
  Total:  509.36ms

=== Summary ===
Serial total:   1350.72ms
Parallel total: 509.36ms
Time saved:     841.35ms (62.3%)
```

### Why parallel wins

`routes/predict.js` runs `getForecast` (Yahoo Finance chart API) and `getSentiment` (OpenRouter) concurrently via `Promise.all`. When you fire two `/api/predict` requests in parallel, both overlap their network I/O, cutting total wall-clock time significantly.

Note: With a real `OPENAI_API_KEY`, the sentiment call adds ~100-300ms per request. With `OPENAI_API_KEY=""` it short-circuits to a neutral default instantly, so the measured latency is dominated by the Yahoo Finance fetch (~600ms).
