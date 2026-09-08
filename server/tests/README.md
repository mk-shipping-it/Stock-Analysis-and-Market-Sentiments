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

## POST /api/predict Latency

Measures the latency of one `POST /api/predict` call.

### Start the server

The server needs PostgreSQL (it tries to connect on boot but continues without DB for the `/api/predict` endpoint):

```bash
# port 5001
SERVER_PORT=5001 node index.js
# or, from project root:
cd newmanngarry\SAMs-master\server
SERVER_PORT=5001 node index.js
```

You should see: `SAMS server running on http://localhost:5001`

### Run the test

```bash
# In a second terminal, from the same server/ directory:
node tests/measure_predict_latency.mjs
```

### What it measures

- Reports elapsed time (ms) for a single `POST /api/predict` call for `NVDA`.

### Example output

```
=== POST /api/predict Latency ===
Symbol: NVDA
Elapsed: 1024.18ms (HTTP 200)
```

### Timing breakdown

A single `POST /api/predict` takes roughly **1 second** end-to-end. Almost all of that is the Yahoo Finance chart fetch — the regression itself runs in well under a millisecond on ~500 daily closes, and RSI/MACD are negligible. There is no second network call anymore, so the number is the floor for one symbol.

### Why this is the whole story now

`routes/predict.js` runs a single `getForecast` call (Yahoo Finance chart API). There is no concurrent sentiment call anymore — the LLM headline service was removed because it produced unverifiable, fabricated news that damaged user trust. Predict latency is now dominated entirely by the Yahoo Finance fetch (~600ms).
