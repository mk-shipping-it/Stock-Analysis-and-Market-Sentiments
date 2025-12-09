const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/sams',
});

async function query(text, params) {
  return pool.query(text, params);
}

async function connectDB() {
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    console.log('Server continuing without database connection (Dashboard features will be unavailable).');
    throw err;
  }
}

module.exports = connectDB;
module.exports.pool = pool;
module.exports.query = query;
module.exports.connectDB = connectDB;
