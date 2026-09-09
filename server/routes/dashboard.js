const express = require('express');
const PortfolioItem = require('../models/PortfolioItem');
const Company = require('../models/Company');
const User = require('../models/User');
const { getLatestClosePrice } = require('../services/stockData');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    const items = await PortfolioItem.findByUserIdWithCompanies(userId);

    const enriched = [];
    let currentPortfolioValue = 0;
    let totalCost = 0;

    for (const item of items) {
      const priceData = await getLatestClosePrice(item.companyId.symbol);
      let currentPrice = item.averageBuyPrice;
      let diff = 0;
      let percentChange = 0;
      let changeDirection = null;

      if (priceData) {
        currentPrice = priceData[0];
        diff = currentPrice - item.averageBuyPrice;
        percentChange = item.averageBuyPrice > 0
          ? (diff / item.averageBuyPrice) * 100
          : 0;
        changeDirection = diff > 0 ? 'up' : diff < 0 ? 'down' : null;
      }

      const itemCost = (item.averageBuyPrice || 0) * item.quantity;
      const itemVal = currentPrice * item.quantity;
      const itemPL = itemVal - itemCost;
      totalCost += itemCost;
      currentPortfolioValue += itemVal;

      enriched.push({
        _id: item._id,
        symbol: item.companyId.symbol,
        name: item.companyId.name,
        quantity: item.quantity,
        averageBuyPrice: item.averageBuyPrice,
        currentPrice,
        diff,
        percentChange,
        changeDirection,
        unrealizedPL: Math.round(itemPL * 100) / 100,
      });
    }

    const totalUnrealizedPL = currentPortfolioValue - totalCost;
    const totalUnrealizedPLPct = totalCost > 0 ? (totalUnrealizedPL / totalCost) * 100 : 0;

    res.json({
      user,
      items: enriched,
      currentPortfolioValue: Math.round(currentPortfolioValue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      unrealizedPL: Math.round(totalUnrealizedPL * 100) / 100,
      unrealizedPLPct: Math.round(totalUnrealizedPLPct * 100) / 100,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
