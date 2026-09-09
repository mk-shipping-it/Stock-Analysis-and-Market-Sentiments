const { query } = require('../config/db');

function mapItem(row) {
  if (!row) return null;
  const item = {
    id: row.id, _id: row.id, userId: row.user_id, companyId: row.company_id,
    quantity: Number(row.quantity) || 0, averageBuyPrice: Number(row.average_buy_price) || 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
  item.save = async () => {
    await query('UPDATE portfolio_items SET user_id=$1, company_id=$2, quantity=$3, average_buy_price=$4 WHERE id=$5',
      [item.userId, item.companyId, item.quantity, item.averageBuyPrice, item.id]);
    return item;
  };
  return item;
}

async function findOne(filter = {}) {
  const userId = filter.userId ?? filter.user_id;
  const companyId = filter.companyId ?? filter.company_id;
  if (userId !== undefined && companyId !== undefined) {
    const res = await query('SELECT * FROM portfolio_items WHERE user_id = $1 AND company_id = $2 LIMIT 1', [userId, companyId]);
    return mapItem(res.rows[0]);
  }
  const id = filter._id ?? filter.id;
  const res = id !== undefined
    ? await query('SELECT * FROM portfolio_items WHERE id = $1', [id])
    : await query('SELECT * FROM portfolio_items LIMIT 1');
  return mapItem(res.rows[0]);
}

async function findByUserIdWithCompanies(userId) {
  const res = await query(
    `SELECT pi.*, c.symbol AS company_symbol, c.name AS company_name, c.exchange AS company_exchange,
            c.sector AS company_sector, c.is_active AS company_is_active
     FROM portfolio_items pi JOIN companies c ON c.id = pi.company_id
     WHERE pi.user_id = $1 AND pi.quantity > 0`, [userId]
  );
  return res.rows.map((row) => {
    const item = mapItem(row);
    item.companyId = {
      _id: row.company_id, id: row.company_id, symbol: row.company_symbol,
      name: row.company_name, exchange: row.company_exchange, sector: row.company_sector,
      isActive: row.company_is_active,
    };
    return item;
  });
}

async function create(data = {}) {
  const res = await query(
    'INSERT INTO portfolio_items (user_id, company_id, quantity, average_buy_price) VALUES ($1,$2,$3,$4) RETURNING *',
    [data.userId ?? data.user_id, data.companyId ?? data.company_id, data.quantity || 0, data.averageBuyPrice ?? data.average_buy_price ?? 0]
  );
  return mapItem(res.rows[0]);
}

async function deleteOne(filter = {}) {
  const id = filter._id ?? filter.id;
  if (id !== undefined) return query('DELETE FROM portfolio_items WHERE id = $1', [id]);
  const u = filter.userId ?? filter.user_id, c = filter.companyId ?? filter.company_id;
  if (u !== undefined && c !== undefined) return query('DELETE FROM portfolio_items WHERE user_id = $1 AND company_id = $2', [u, c]);
}

module.exports = { findOne, findByUserIdWithCompanies, create, deleteOne };
