const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login.html' }), (req, res) => {
  const token = generateToken(req.user);
  // client is served statically from ../client so oauth-callback.html lives there
  res.redirect('/oauth-callback.html?token=' + token);
});

// Fetch current user (used by oauth-callback.html to resolve user object)
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

module.exports = router;
