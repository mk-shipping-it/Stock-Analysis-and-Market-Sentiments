const { query } = require('../config/db');

function mapCompany(row) {
  if (!row) return null;
  const company = {
    id: row.id,
    _id: row.id,
    symbol: row.symbol,
    name: row.name,
    exchange: row.exchange,
    sector: row.sector,
    isActive: row.is_active,
    is_active: row.is_active,
    async save() {
      const res = await query(
        'UPDATE companies SET symbol=$1, name=$2, exchange=$3, sector=$4, is_active=$5 WHERE id=$6 RETURNING *',
        [company.symbol, company.name || null, company.exchange || null, company.sector || null,
         company.isActive !== undefined ? company.isActive : true, company.id]
      );
      const fresh = mapCompany(res.rows[0]);
      Object.keys(fresh).forEach((k) => { if (typeof fresh[k] !== 'function') company[k] = fresh[k]; });
      return company;
    },
  };
  return company;
}

async function findOne(filter) {
  filter = filter || {};
  const keys = Object.keys(filter);
  if (keys.length === 0) {
    const res = await query('SELECT * FROM companies LIMIT 1');
    return mapCompany(res.rows[0] || null);
  }
  const clauses = [];
  const params = [];
  keys.forEach((k) => {
    let col = k === '_id' ? 'id' : k === 'isActive' ? 'is_active' : k;
    params.push(filter[k]);
    clauses.push(`${col} = $${params.length}`);
  });
  const res = await query(`SELECT * FROM companies WHERE ${clauses.join(' AND ')} LIMIT 1`, params);
  return mapCompany(res.rows[0] || null);
}

async function findById(id) {
  if (id === null || id === undefined) return null;
  const res = await query('SELECT * FROM companies WHERE id = $1', [id]);
  return mapCompany(res.rows[0] || null);
}

async function create(data) {
  data = data || {};
  const res = await query(
    'INSERT INTO companies (symbol, name, exchange, sector, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [
      data.symbol ? String(data.symbol).toUpperCase() : null,
      data.name || null,
      data.exchange || null,
      data.sector || null,
      data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : true),
    ]
  );
  return mapCompany(res.rows[0]);
}

async function countDocuments() {
  const res = await query('SELECT COUNT(*)::int AS count FROM companies');
  return res.rows[0].count;
}

module.exports = { findOne, findById, create, countDocuments };
