const { query } = require('../config/db');

function toISO(v) {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString();
  return v;
}

function mapItem(row) {
  if (!row) return null;
  const item = {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    companyId: row.company_id,
    user_id: row.user_id,
    company_id: row.company_id,
    quantity: row.quantity === null || row.quantity === undefined ? 0 : Number(row.quantity),
    averageBuyPrice: row.average_buy_price === null || row.average_buy_price === undefined ? 0 : Number(row.average_buy_price),
    average_buy_price: row.average_buy_price === null || row.average_buy_price === undefined ? 0 : Number(row.average_buy_price),
    createdAt: toISO(row.created_at),
    created_at: toISO(row.created_at),
    async save() {
      const res = await query(
        'UPDATE portfolio_items SET user_id=$1, company_id=$2, quantity=$3, average_buy_price=$4 WHERE id=$5 RETURNING *',
        [item.userId, item.companyId, item.quantity || 0, item.averageBuyPrice || 0, item.id]
      );
      const fresh = mapItem(res.rows[0]);
      Object.keys(fresh).forEach((k) => { if (typeof fresh[k] !== 'function') item[k] = fresh[k]; });
      return item;
    },
  };
  return item;
}

async function findOne(filter) {
  filter = filter || {};
  const userId = filter.userId !== undefined ? filter.userId : filter.user_id;
  const companyId = filter.companyId !== undefined ? filter.companyId : filter.company_id;
  if (userId !== undefined && companyId !== undefined) {
    const res = await query('SELECT * FROM portfolio_items WHERE user_id = $1 AND company_id = $2 LIMIT 1', [userId, companyId]);
    return mapItem(res.rows[0] || null);
  }
  const id = filter._id !== undefined ? filter._id : filter.id;
  if (id !== undefined) {
    const res = await query('SELECT * FROM portfolio_items WHERE id = $1', [id]);
    return mapItem(res.rows[0] || null);
  }
  const res = await query('SELECT * FROM portfolio_items LIMIT 1');
  return mapItem(res.rows[0] || null);
}

async function findByUserIdWithCompanies(userId) {
  const res = await query(
    `SELECT pi.id, pi.user_id, pi.company_id, pi.quantity, pi.average_buy_price, pi.created_at,
            c.symbol AS company_symbol, c.name AS company_name, c.exchange AS company_exchange,
            c.sector AS company_sector, c.is_active AS company_is_active
     FROM portfolio_items pi
     JOIN companies c ON c.id = pi.company_id
     WHERE pi.user_id = $1 AND pi.quantity > 0`,
    [userId]
  );
  return res.rows.map((row) => {
    const item = mapItem(row);
    item.companyId = {
      _id: row.company_id,
      id: row.company_id,
      symbol: row.company_symbol,
      name: row.company_name,
      exchange: row.company_exchange,
      sector: row.company_sector,
      isActive: row.company_is_active,
    };
    return item;
  });
}

async function create(data) {
  data = data || {};
  const userId = data.userId !== undefined ? data.userId : data.user_id;
  const companyId = data.companyId !== undefined ? data.companyId : data.company_id;
  const res = await query(
    'INSERT INTO portfolio_items (user_id, company_id, quantity, average_buy_price) VALUES ($1,$2,$3,$4) RETURNING *',
    [userId, companyId, data.quantity || 0, data.averageBuyPrice !== undefined ? data.averageBuyPrice : (data.average_buy_price || 0)]
  );
  return mapItem(res.rows[0]);
}

async function deleteOne(filter) {
  filter = filter || {};
  const id = filter._id !== undefined ? filter._id : filter.id;
  if (id !== undefined) {
    await query('DELETE FROM portfolio_items WHERE id = $1', [id]);
    return;
  }
  const userId = filter.userId !== undefined ? filter.userId : filter.user_id;
  const companyId = filter.companyId !== undefined ? filter.companyId : filter.company_id;
  if (userId !== undefined && companyId !== undefined) {
    await query('DELETE FROM portfolio_items WHERE user_id = $1 AND company_id = $2', [userId, companyId]);
  }
}

module.exports = { findOne, findByUserIdWithCompanies, create, deleteOne };
