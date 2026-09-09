require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const PLACEHOLDERS = ['change_me', 'your-', 'your_google', 'example', '...', 'your_api'];

const isBad = (v) => !v || !v.trim() || PLACEHOLDERS.some((p) => v.toLowerCase().includes(p));
const missing = REQUIRED.filter((k) => isBad(process.env[k]));

if (missing.length > 0) {
  console.error(`Missing/invalid env: ${missing.join(', ')}. Check root .env vs .env.example.`);
  process.exit(1);
}
if ((process.env.JWT_SECRET || '').length < 32) {
  console.error('Missing/invalid env: JWT_SECRET must be >= 32 chars.');
  process.exit(1);
}

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  SERVER_PORT: process.env.SERVER_PORT || process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5000',
};
