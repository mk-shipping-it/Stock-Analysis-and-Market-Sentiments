const env = require('./config/env');

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const tradeRoutes = require('./routes/trade');
const adminRoutes = require('./routes/admin');
const predictRoutes = require('./routes/predict');
const stocksRoutes = require('./routes/stocks');
const { authRequired, adminRequired } = require('./middleware/auth');

const app = express();
const PORT = env.SERVER_PORT || 5000;

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());
// Serve vanilla static frontend from client/ (mirrors Bibliotheca express.static('..'))
app.use(express.static(path.join(__dirname, '../client')));

// Google OAuth only — same as bibliotheca/server/server.js:9
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        // if email already exists as legacy local, attach googleId
        if (email) user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          user.name = profile.displayName || user.name;
          if (!user.username) user.username = (profile.displayName || email?.split('@')[0] || 'user').replace(/\s+/g,'').toLowerCase();
          await user.save();
        } else {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            username: (profile.displayName || email?.split('@')[0] || 'user').replace(/\s+/g,'').toLowerCase(),
            email,
            walletBalance: 0,
          });
        }
      }
      done(null, user);
    } catch (e) { done(e); }
  }));
  passport.serializeUser((u, done) => done(null, u));
  passport.deserializeUser((u, done) => done(null, u));
}

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authRequired, dashboardRoutes);
app.use('/api/trade', authRequired, tradeRoutes);
app.use('/api/admin', authRequired, adminRequired, adminRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/stocks', stocksRoutes);

async function seedAdmin() {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin && process.env.GOOGLE_CLIENT_ID) {
      console.log('No admin seeded — create first admin via Google OAuth then set role=admin in DB.');
      return;
    }
    if (!admin && !process.env.GOOGLE_CLIENT_ID) {
      console.log('Skipping admin seed — Google OAuth not configured and local auth removed (set GOOGLE_CLIENT_ID to enable).');
    }
  } catch (err) {
    console.log('Skipping seedAdmin since database is unavailable.');
  }
}

async function start() {
  try {
    await connectDB();
    await seedAdmin();
  } catch (err) {
    console.log('Skipping database-dependent startup tasks.');
  }

  app.listen(PORT, () => {
    console.log(`SAMS server running on http://localhost:${PORT}`);
  });
}

start();
