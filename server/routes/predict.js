const express = require('express');
const { getForecast } = require('../services/forecast');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const uppercaseSymbol = symbol.toUpperCase();
    const forecastResult = await getForecast(uppercaseSymbol);

    res.json({
      ...forecastResult,
      symbol: uppercaseSymbol,
      conviction: forecastResult.signal !== 'HOLD' && forecastResult.macdConfirm ? 'strong'
        : forecastResult.signal !== 'HOLD' ? 'medium'
        : 'weak',
    });
  } catch (err) {
    console.error('Prediction error:', err.message);
    res.status(500).json({ error: err.message || 'Prediction service error' });
  }
});

module.exports = router;