const { query } = require('../config/db');

function mapCompany(row) {
  if (!row) return null;
  const c = { id: row.id, _id: row.id, symbol: row.symbol, name: row.name, exchange: row.exchange, sector: row.sector, isActive: row.is_active !== false };
  c.save = async () => {
    await query('UPDATE companies SET symbol=$1, name=$2, exchange=$3, sector=$4, is_active=$5 WHERE id=$6',
      [c.symbol, c.name, c.exchange, c.sector, c.isActive, c.id]);
    return c;
  };
  return c;
}

async function findOne(filter = {}) {
  const keys = Object.keys(filter);
  if (!keys.length) return mapCompany((await query('SELECT * FROM companies LIMIT 1')).rows[0]);
  const clauses = keys.map((k, i) => `${k === '_id' ? 'id' : k === 'isActive' ? 'is_active' : k} = $${i + 1}`);
  const res = await query(`SELECT * FROM companies WHERE ${clauses.join(' AND ')} LIMIT 1`, Object.values(filter));
  return mapCompany(res.rows[0]);
}

async function findById(id) {
  return id ? mapCompany((await query('SELECT * FROM companies WHERE id = $1', [id])).rows[0]) : null;
}

async function create(data = {}) {
  const res = await query(
    'INSERT INTO companies (symbol, name, exchange, sector, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [data.symbol?.toUpperCase() || null, data.name || null, data.exchange || null, data.sector || null, data.isActive !== false]
  );
  return mapCompany(res.rows[0]);
}

async function countDocuments() {
  return (await query('SELECT COUNT(*)::int AS count FROM companies')).rows[0].count;
}

module.exports = { findOne, findById, create, countDocuments };
