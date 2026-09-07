const express = require('express');

const router = express.Router();

// ponytail: fixed universe, add ?symbols= override when search needs arbitrary tickers
const WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];

router.get('/', async (req, res) => {
  try {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yahooFinance = new YahooFinance();
    yahooFinance.suppressNotices?.(['yahooSurvey']);
    const quotes = await Promise.all(
      WATCHLIST.map((s) => yahooFinance.quote(s).catch(() => null))
    );
    res.json(
      quotes
        .filter(Boolean)
        .map((q) => ({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          price: q.regularMarketPrice ?? '—',
          change: q.regularMarketChangePercent != null
            ? `${q.regularMarketChangePercent.toFixed(2)}%`
            : '—',
        }))
    );
  } catch (err) {
    console.error('Stocks error:', err.message);
    res.status(500).json({ error: 'Quote service error' });
  }
});

module.exports = router;
