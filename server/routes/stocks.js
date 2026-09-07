const express = require('express');
const axios = require('axios');

const router = express.Router();

// ponytail: fixed universe, add ?symbols= override when search needs arbitrary tickers
const WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];

async function chartQuote(symbol) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 10 * 24 * 3600;
  const res = await axios.get(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`, {
    params: { period1: start, period2: end, interval: '1d' },
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000,
  });
  const result = res.data?.chart?.result?.[0];
  const closes = (result?.indicators?.quote?.[0]?.close || []).filter((c) => c != null);
  if (!closes.length) return null;
  const last = closes[closes.length - 1];
  const prev = closes.length >= 2 ? closes[closes.length - 2] : last;
  const change = prev ? ((last - prev) / prev) * 100 : 0;
  return {
    symbol,
    name: result?.meta?.longName || result?.meta?.shortName || symbol,
    price: last,
    change: `${change.toFixed(2)}%`,
  };
}

router.get('/', async (req, res) => {
  try {
    const quotes = await Promise.all(
      WATCHLIST.map((s) => chartQuote(s).catch((err) => {
        console.error(`Quote failed for ${s}:`, err.message);
        return null;
      }))
    );
    const result = quotes.filter(Boolean);
    console.log(`Stocks endpoint: ${result.length}/${WATCHLIST.length} tickers loaded`);
    res.json(result);
  } catch (err) {
    console.error('Stocks error:', err.message);
    res.status(500).json({ error: 'Quote service error' });
  }
});

module.exports = router;
