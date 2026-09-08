const express = require('express');
const User = require('../models/User');
const Company = require('../models/Company');
const PortfolioItem = require('../models/PortfolioItem');
const { getLatestClosePrice } = require('../services/stockData');
const { getForecast } = require('../services/forecast');
const { getSentiment } = require('../services/sentiment');

const router = express.Router();

router.post('/buy', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid symbol or quantity' });
    }

    const priceData = await getLatestClosePrice(symbol.toUpperCase());
    if (!priceData) {
      return res.status(400).json({ error: 'Unable to fetch latest price' });
    }

    const price = priceData[0];
    const total = price * quantity;

    if (user.walletBalance < total) {
      return res.status(400).json({ error: 'Insufficient wallet balance', code: 'balance_error' });
    }

    let company = await Company.findOne({ symbol: symbol.toUpperCase() });
    if (!company) {
      company = await Company.create({ symbol: symbol.toUpperCase(), name: symbol.toUpperCase() });
    }

    let item = await PortfolioItem.findOne({ userId: user._id, companyId: company._id });
    if (item) {
      const currentTotal = item.averageBuyPrice * item.quantity;
      const newTotal = currentTotal + total;
      const newQuantity = item.quantity + quantity;
      item.averageBuyPrice = newTotal / newQuantity;
      item.quantity = newQuantity;
      await item.save();
    } else {
      item = await PortfolioItem.create({
        userId: user._id,
        companyId: company._id,
        quantity,
        averageBuyPrice: total / quantity,
      });
    }

    user.walletBalance -= total;
    await user.save();

    res.json({ message: 'Buy order executed', walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/sell', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid symbol or quantity' });
    }

    const company = await Company.findOne({ symbol: symbol.toUpperCase() });
    if (!company) {
      return res.status(400).json({ error: 'No holdings for this symbol' });
    }

    const item = await PortfolioItem.findOne({ userId: user._id, companyId: company._id });
    if (!item || item.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough shares to sell' });
    }

    const priceData = await getLatestClosePrice(symbol.toUpperCase());
    if (!priceData) {
      return res.status(400).json({ error: 'Unable to fetch latest price' });
    }

    const price = priceData[0];
    const total = price * quantity;
    const newQuantity = item.quantity - quantity;

    if (newQuantity > 0) {
      item.quantity = newQuantity;
      await item.save();
    } else {
      await PortfolioItem.deleteOne({ _id: item._id });
    }

    user.walletBalance += total;
    await user.save();

    res.json({ message: 'Sell order executed', walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/topup', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    user.walletBalance += amount;
    await user.save();

    res.json({ message: 'Wallet balance updated', walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/preview', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const sym = (req.body.symbol || '').toUpperCase();
    const qty = parseInt(req.body.quantity);
    const isSell = req.body.side === 'sell';
    const side = isSell ? 'sell' : 'buy';
    if (!sym || !qty || qty <= 0) return res.status(400).json({ error: 'Invalid symbol or quantity' });

    const gates = [];
    const priceData = await getLatestClosePrice(sym);
    if (!priceData) return res.json({ symbol: sym, side, quantity: qty, gates: [{ level: 'block', text: 'No live price — refusing to project from bad data.' }] });
    const price = priceData[0];

    const items = await PortfolioItem.findByUserIdWithCompanies(user._id);
    let portValue = 0, heldQty = 0;
    for (const it of items) {
      const pd = await getLatestClosePrice(it.companyId.symbol);
      const p = pd ? pd[0] : it.averageBuyPrice;
      portValue += p * it.quantity;
      if (it.companyId.symbol === sym) heldQty = it.quantity;
    }
    const equity = portValue + user.walletBalance;

    let forecast = null;
    try { forecast = await getForecast(sym); } catch (e) { /* gated below */ }
    if (!forecast) return res.json({ symbol: sym, side, quantity: qty, currentPrice: price, gates: [{ level: 'block', text: 'No forecast data — refusing to project from bad data.' }] });

    const set = forecast.forecast_set || [];
    const predictedPrice = set.length ? set[set.length - 1][0] : forecast.lr_pred;
    const r2 = (v) => Math.round(v * 100) / 100;

    if (forecast.rsi == null) {
      gates.push({ level: 'block', text: 'Insufficient history for indicators — refusing to project from bad data.' });
    }

    if (!isSell && (forecast.signal === 'SELL' || forecast.idea === 'FALL')) {
      gates.push({ level: 'warn', text: `Prediction says ${forecast.signal === 'SELL' ? 'SELL' : 'FALL'} and you're buying ${sym}.` });
    }
    if (isSell && (forecast.signal === 'BUY' || forecast.idea === 'RISE')) {
      gates.push({ level: 'warn', text: `Prediction says ${forecast.signal === 'BUY' ? 'BUY' : 'RISE'} and you're selling ${sym}.` });
    }
    if (!isSell && equity > 0) {
      const pct = (((heldQty + qty) * price) / equity) * 100;
      if (pct > 25) gates.push({ level: 'warn', text: `This puts ${Math.round(pct)}% of your portfolio on ${sym}.` });
    }

    const sent = await getSentiment(sym);
    if (!sent.headlines.length) gates.push({ level: 'warn', text: 'No news headlines — sentiment is a fallback, not analysis.' });
    const agree = (forecast.signal === 'BUY' && sent.sentiment_pol === 'Positive') || (forecast.signal === 'SELL' && sent.sentiment_pol === 'Negative');
    const conviction = agree ? 'strong' : 'weak';
    if (conviction === 'weak' && forecast.signal !== 'HOLD') gates.push({ level: 'warn', text: 'Model and news disagree — low conviction.' });

    res.json({
      symbol: sym, side, quantity: qty,
      currentPrice: r2(price), predictedPrice,
      projectedPL: r2((predictedPrice - price) * qty),
      projectedPct: r2(((predictedPrice - price) / price) * 100),
      signal: forecast.signal, rsi: forecast.rsi,
      sentiment_pol: sent.sentiment_pol, conviction, gates,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
