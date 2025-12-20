const express = require('express');
const User = require('../models/User');
const Company = require('../models/Company');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const companyCount = await Company.countDocuments();
    res.json({ userCount, companyCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
