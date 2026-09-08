const express = require('express');
const { getForecast } = require('../services/forecast');
const { getSentiment } = require('../services/sentiment');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const uppercaseSymbol = symbol.toUpperCase();

    const [forecastResult, sentimentData] = await Promise.all([
      getForecast(uppercaseSymbol),
      getSentiment(uppercaseSymbol),
    ]);

    res.json({
      ...forecastResult,
      ...sentimentData,
      symbol: uppercaseSymbol,
      conviction:
        (forecastResult.signal === 'BUY' && sentimentData.sentiment_pol === 'Positive') ||
        (forecastResult.signal === 'SELL' && sentimentData.sentiment_pol === 'Negative')
          ? 'strong'
          : 'weak',
    });
  } catch (err) {
    console.error('Prediction error:', err.message);
    res.status(500).json({ error: err.message || 'Prediction service error' });
  }
});

module.exports = router;
