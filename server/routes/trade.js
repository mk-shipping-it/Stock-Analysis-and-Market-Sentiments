const express = require('express');
const User = require('../models/User');
const Company = require('../models/Company');
const PortfolioItem = require('../models/PortfolioItem');
const Dividend = require('../models/Dividend');
const { getLatestClosePrice } = require('../services/stockData');

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

router.post('/dividend', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { symbol, amountPerShare } = req.body;

    if (!symbol || !amountPerShare || amountPerShare <= 0) {
      return res.status(400).json({ error: 'Invalid dividend data' });
    }

    const company = await Company.findOne({ symbol: symbol.toUpperCase() });
    if (!company) {
      return res.status(400).json({ error: 'No holdings for this symbol' });
    }

    const item = await PortfolioItem.findOne({ userId: user._id, companyId: company._id });
    if (!item || item.quantity <= 0) {
      return res.status(400).json({ error: 'No holdings for this symbol' });
    }

    const totalAmount = amountPerShare * item.quantity;
    user.walletBalance += totalAmount;
    await user.save();

    await Dividend.create({
      portfolioItemId: item._id,
      amountPerShare,
      totalAmount,
    });

    res.json({ message: 'Dividend recorded and wallet credited', walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
